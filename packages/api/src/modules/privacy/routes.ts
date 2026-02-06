/**
 * Privacy/GDPR routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for data exports, account deletion, and consent management.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { PrivacyService } from './service.js';
import { AuthService } from '../auth/service.js';
import { authMiddleware } from '../auth/middleware.js';
import { Logger } from '../../infra/logger.js';
import { ConsentType, DeletionOptions } from './types.js';

/**
 * Context variables available in privacy routes
 */
interface PrivacyContext {
  Variables: {
    requestId: string;
    logger: Logger;
    user?: {
      id: string;
      email: string;
      name: string | null;
    };
  };
}

/**
 * Creates privacy routes
 *
 * @param privacyService - PrivacyService instance
 * @param authService - AuthService instance for authentication
 * @returns Hono app with privacy routes configured
 */
export function createPrivacyRoutes(
  privacyService: PrivacyService,
  authService: AuthService
): Hono<PrivacyContext> {
  const router = new Hono<PrivacyContext>();

  // All routes require authentication
  const auth = authMiddleware(authService);

  /**
   * GET /me/data-export
   * Request a data export for the current user
   *
   * Response:
   * {
   *   "id": "request-id",
   *   "userId": "user-id",
   *   "status": "COMPLETED",
   *   "requestedAt": "2024-01-01T00:00:00Z",
   *   "completedAt": "2024-01-01T00:00:10Z",
   *   "downloadUrl": "https://..."
   * }
   */
  router.get('/me/data-export', auth, async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'User requesting data export');

    const result = await privacyService.requestDataExport(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.error({ userId: user.id, error: error.message }, 'Data export request failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id, requestId: result.value.id }, 'Data export request created');

    return c.json(result.value);
  });

  /**
   * GET /me/data-export/:id
   * Get the status of a data export request or download it if completed
   *
   * Response:
   * {
   *   "id": "request-id",
   *   "userId": "user-id",
   *   "status": "COMPLETED",
   *   "requestedAt": "2024-01-01T00:00:00Z",
   *   "completedAt": "2024-01-01T00:00:10Z",
   *   "downloadUrl": "https://..."
   * }
   */
  router.get('/me/data-export/:id', auth, async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const requestId = c.req.param('id');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id, requestId }, 'User checking data export status');

    const result = await privacyService.getExportStatus(user.id, requestId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn(
        { userId: user.id, requestId, error: error.message },
        'Failed to get export status'
      );

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    return c.json(result.value);
  });

  /**
   * DELETE /me
   * Request account deletion with 30-day grace period
   *
   * Request body:
   * {
   *   "options": {
   *     "anonymizeContributions": true
   *   }
   * }
   *
   * Response:
   * {
   *   "id": "request-id",
   *   "userId": "user-id",
   *   "status": "PENDING",
   *   "requestedAt": "2024-01-01T00:00:00Z",
   *   "scheduledFor": "2024-01-31T00:00:00Z",
   *   "options": {
   *     "anonymizeContributions": true
   *   }
   * }
   */
  router.delete('/me', auth, async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Parse request body
    const body = await c.req.json().catch(() => ({}));

    // Default to anonymizing contributions if not specified
    const options: DeletionOptions = {
      anonymizeContributions: body.options?.anonymizeContributions ?? true,
    };

    logger.info({ userId: user.id, options }, 'User requesting account deletion');

    const result = await privacyService.requestAccountDeletion(user.id, options);

    if (!isOk(result)) {
      const error = result.error;
      logger.error(
        { userId: user.id, error: error.message },
        'Account deletion request failed'
      );

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info(
      { userId: user.id, requestId: result.value.id, scheduledFor: result.value.scheduledFor },
      'Account deletion scheduled'
    );

    return c.json(result.value);
  });

  /**
   * POST /me/cancel-deletion
   * Cancel a pending account deletion during the grace period
   *
   * Response:
   * {
   *   "message": "Account deletion cancelled successfully"
   * }
   */
  router.post('/me/cancel-deletion', auth, async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'User cancelling account deletion');

    const result = await privacyService.cancelDeletion(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.error({ userId: user.id, error: error.message }, 'Failed to cancel deletion');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id }, 'Account deletion cancelled successfully');

    return c.json({
      message: 'Account deletion cancelled successfully',
    });
  });

  /**
   * GET /me/deletion-status
   * Get the deletion status for the current user
   *
   * Response:
   * {
   *   "hasPendingDeletion": true,
   *   "deletionRequest": {
   *     "requestedAt": "2024-01-01T00:00:00Z",
   *     "scheduledFor": "2024-01-31T00:00:00Z",
   *     "daysRemaining": 30,
   *     "options": {
   *       "anonymizeContributions": true
   *     }
   *   }
   * }
   */
  router.get('/me/deletion-status', auth, async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'User checking deletion status');

    const result = await privacyService.getDeletionStatus(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.error({ userId: user.id, error: error.message }, 'Failed to get deletion status');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    return c.json(result.value);
  });

  /**
   * GET /privacy-policy
   * Get the privacy policy (static content)
   *
   * Response:
   * {
   *   "content": "Privacy policy content...",
   *   "lastUpdated": "2024-01-01T00:00:00Z",
   *   "version": "1.0"
   * }
   */
  router.get('/privacy-policy', async (c) => {
    const logger = c.get('logger');

    logger.info('Privacy policy requested');

    // In production, this would be loaded from a database or CMS
    return c.json({
      content: `# Privacy Policy

Last updated: January 1, 2024

## Introduction
Welcome to Multiverse Bazaar. We respect your privacy and are committed to protecting your personal data.

## Data Collection
We collect the following information:
- Email address (for authentication)
- Profile information (name, bio, avatar)
- Usage data (projects, ideas, upvotes, collaborations)
- Login history (IP addresses, timestamps)

## Data Usage
We use your data to:
- Provide and improve our services
- Communicate with you about your account
- Analyze usage patterns and trends
- Comply with legal obligations

## Your Rights (GDPR)
You have the right to:
- Access your personal data
- Rectify inaccurate data
- Request erasure of your data
- Object to processing
- Data portability
- Withdraw consent

## Data Export
You can request a complete export of your data at any time through your account settings.

## Account Deletion
You can request account deletion with a 30-day grace period. You can choose to:
- Anonymize your contributions (keep content, remove personal information)
- Delete all your data (remove everything)

## Contact
For privacy concerns, contact us at privacy@multiverse-bazaar.com`,
      lastUpdated: new Date('2024-01-01'),
      version: '1.0',
    });
  });

  /**
   * POST /consent
   * Record user consent for GDPR compliance
   *
   * Request body:
   * {
   *   "consentType": "PRIVACY_POLICY",
   *   "granted": true
   * }
   *
   * Response:
   * {
   *   "id": "consent-id",
   *   "userId": "user-id",
   *   "consentType": "PRIVACY_POLICY",
   *   "granted": true,
   *   "timestamp": "2024-01-01T00:00:00Z"
   * }
   */
  router.post('/consent', auth, async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Parse request body
    const body = await c.req.json().catch(() => ({}));

    if (!body.consentType || typeof body.granted !== 'boolean') {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'consentType and granted are required',
          },
        },
        400
      );
    }

    // Validate consent type
    if (!Object.values(ConsentType).includes(body.consentType)) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid consent type',
            details: {
              validTypes: Object.values(ConsentType),
            },
          },
        },
        400
      );
    }

    const consentType = body.consentType as ConsentType;
    const granted = body.granted as boolean;

    // Get IP and user agent for audit trail
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    const userAgent = c.req.header('user-agent');

    logger.info({ userId: user.id, consentType, granted }, 'Recording user consent');

    const result = await privacyService.recordConsent(user.id, consentType, granted, {
      ipAddress,
      userAgent,
    });

    if (!isOk(result)) {
      const error = result.error;
      logger.error({ userId: user.id, error: error.message }, 'Failed to record consent');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info(
      { userId: user.id, consentType, granted, recordId: result.value.id },
      'Consent recorded successfully'
    );

    return c.json(result.value);
  });

  /**
   * GET /consent
   * Get all consent records for the current user
   *
   * Response:
   * [
   *   {
   *     "id": "consent-id",
   *     "userId": "user-id",
   *     "consentType": "PRIVACY_POLICY",
   *     "granted": true,
   *     "timestamp": "2024-01-01T00:00:00Z"
   *   }
   * ]
   */
  router.get('/consent', auth, async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'User requesting consent records');

    const result = await privacyService.getConsentStatus(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.error({ userId: user.id, error: error.message }, 'Failed to get consent records');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    return c.json(result.value);
  });

  return router;
}
