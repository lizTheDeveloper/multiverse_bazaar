import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import sgMail from '@sendgrid/mail';
import { logger } from '../../infra/logger';

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'aethrix@themultiverse.school';

let initialized = false;

/**
 * Initialize the email service by fetching the SendGrid API key from
 * Google Secret Manager (in production) or environment variable (in development)
 */
export async function initEmailService(): Promise<void> {
  if (initialized) return;

  try {
    let apiKey: string | undefined;

    if (process.env.NODE_ENV === 'production' && !process.env.SENDGRID_API_KEY) {
      // Fetch from Google Secret Manager
      const client = new SecretManagerServiceClient();
      const projectId = process.env.GCP_PROJECT_ID || await getProjectId();

      const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/SENDGRID_API_KEY/versions/latest`,
      });

      apiKey = version.payload?.data?.toString();
    } else {
      // Use environment variable
      apiKey = process.env.SENDGRID_API_KEY;
    }

    if (!apiKey) {
      logger.warn('SendGrid API key not configured - email sending disabled');
      return;
    }

    sgMail.setApiKey(apiKey);
    initialized = true;
    logger.info('Email service initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize email service');
    throw error;
  }
}

/**
 * Get GCP project ID from metadata server
 */
async function getProjectId(): Promise<string> {
  const response = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/project/project-id',
    { headers: { 'Metadata-Flavor': 'Google' } }
  );
  return response.text();
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> {
  if (!initialized) {
    logger.warn('Email service not initialized, skipping send');
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: FROM_EMAIL,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info({ to: options.to, subject: options.subject }, 'Email sent');
    return true;
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email');
    return false;
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Welcome to Multiverse Bazaar!',
    html: `
      <h1>Welcome to Multiverse Bazaar, ${username}!</h1>
      <p>We're excited to have you join our creative collaboration marketplace.</p>
      <p>Start exploring projects, share your ideas, and connect with fellow creators.</p>
      <br>
      <p>Happy creating!</p>
      <p>The Multiverse Bazaar Team</p>
    `,
  });
}

/**
 * Send a collaboration invitation email
 */
export async function sendCollaborationInvite(
  to: string,
  inviterName: string,
  projectName: string,
  projectUrl: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `${inviterName} invited you to collaborate on ${projectName}`,
    html: `
      <h1>You've been invited to collaborate!</h1>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${projectName}</strong> on Multiverse Bazaar.</p>
      <p><a href="${projectUrl}">View the project and accept the invitation</a></p>
      <br>
      <p>The Multiverse Bazaar Team</p>
    `,
  });
}

/**
 * Send a notification digest email
 */
export async function sendNotificationDigest(
  to: string,
  username: string,
  notifications: Array<{ title: string; message: string }>
): Promise<boolean> {
  const notificationList = notifications
    .map((n) => `<li><strong>${n.title}</strong>: ${n.message}</li>`)
    .join('');

  return sendEmail({
    to,
    subject: `${notifications.length} new notifications on Multiverse Bazaar`,
    html: `
      <h1>Hey ${username}, you have new notifications!</h1>
      <ul>${notificationList}</ul>
      <br>
      <p>The Multiverse Bazaar Team</p>
    `,
  });
}
