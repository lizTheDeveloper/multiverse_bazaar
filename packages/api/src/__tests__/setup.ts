/**
 * Test setup utilities for integration tests.
 * Provides test database setup, app instance creation, and helper functions.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { setupContainer } from '../infra/container.js';
import { configureApp } from '../app.js';
import type { Container } from '../infra/container.js';

/**
 * Test database client instance
 */
let testDb: PrismaClient;

/**
 * Test app instance
 */
let testApp: Hono;

/**
 * Test container instance
 */
let testContainer: Container;

/**
 * Get the test database client
 */
export function getTestDb(): PrismaClient {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestEnvironment() first.');
  }
  return testDb;
}

/**
 * Get the test app instance
 */
export function getTestApp(): Hono {
  if (!testApp) {
    throw new Error('Test app not initialized. Call setupTestEnvironment() first.');
  }
  return testApp;
}

/**
 * Get the test container instance
 */
export function getTestContainer(): Container {
  if (!testContainer) {
    throw new Error('Test container not initialized. Call setupTestEnvironment() first.');
  }
  return testContainer;
}

/**
 * Setup test environment before all tests
 * Creates test database connection and app instance
 */
export async function setupTestEnvironment(): Promise<void> {
  // Create test database client
  testDb = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Connect to database
  await testDb.$connect();

  // Create test container and app
  testContainer = setupContainer();
  testApp = configureApp(testContainer);
}

/**
 * Teardown test environment after all tests
 * Disconnects from database and cleans up resources
 */
export async function teardownTestEnvironment(): Promise<void> {
  if (testDb) {
    await testDb.$disconnect();
  }
}

/**
 * Clean up all test data from database
 * Truncates all tables in reverse order of dependencies
 */
export async function cleanDatabase(): Promise<void> {
  const db = getTestDb();

  // Disable foreign key checks for cleanup
  await db.$executeRawUnsafe('SET session_replication_role = replica;');

  // Delete data from all tables in reverse dependency order
  await db.upload.deleteMany();
  await db.loginAttempt.deleteMany();
  await db.refreshToken.deleteMany();
  await db.auditLog.deleteMany();
  await db.dataRequest.deleteMany();
  await db.consentRecord.deleteMany();
  await db.pendingInvitation.deleteMany();
  await db.pushToken.deleteMany();
  await db.notification.deleteMany();
  await db.upvote.deleteMany();
  await db.ideaInterest.deleteMany();
  await db.idea.deleteMany();
  await db.collaborator.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();

  // Re-enable foreign key checks
  await db.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
}

/**
 * Create a test user in the database
 *
 * @param email - User email (optional, defaults to unique test email)
 * @param name - User name (optional)
 * @returns Created user object
 */
export async function createTestUser(
  email?: string,
  name?: string
): Promise<{
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  karma: number;
  createdAt: Date;
  updatedAt: Date;
}> {
  const db = getTestDb();

  const userEmail = email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

  return db.user.create({
    data: {
      email: userEmail,
      name: name || 'Test User',
    },
  });
}

/**
 * Get an authentication token for a test user
 * Creates the user if they don't exist and returns a valid JWT token
 *
 * @param email - User email (optional, creates new user if not provided)
 * @returns Object containing the token and user details
 */
export async function getTestToken(email?: string): Promise<{
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}> {
  const app = getTestApp();

  // Create or get user
  const userEmail = email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const user = await createTestUser(userEmail);

  // Login to get token
  const response = await app.request('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: userEmail }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get test token: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();

  return {
    token: data.accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

/**
 * Create a test project
 *
 * @param userId - User ID of the project creator
 * @param data - Project data (optional)
 * @returns Created project object
 */
export async function createTestProject(
  userId: string,
  data?: {
    title?: string;
    description?: string;
    url?: string;
    repoUrl?: string;
    imageUrl?: string;
    status?: 'BUILDING' | 'LAUNCHED';
  }
): Promise<any> {
  const db = getTestDb();

  const project = await db.project.create({
    data: {
      title: data?.title || 'Test Project',
      description: data?.description || 'A test project',
      url: data?.url,
      repoUrl: data?.repoUrl,
      imageUrl: data?.imageUrl,
      status: data?.status || 'BUILDING',
    },
  });

  // Create creator collaborator
  await db.collaborator.create({
    data: {
      userId,
      projectId: project.id,
      role: 'CREATOR',
    },
  });

  return project;
}

/**
 * Create a test idea
 *
 * @param userId - User ID of the idea creator
 * @param data - Idea data (optional)
 * @returns Created idea object
 */
export async function createTestIdea(
  userId: string,
  data?: {
    title?: string;
    description?: string;
    lookingFor?: string;
    status?: 'OPEN' | 'CLOSED' | 'GRADUATED';
  }
): Promise<any> {
  const db = getTestDb();

  return db.idea.create({
    data: {
      title: data?.title || 'Test Idea',
      description: data?.description || 'A test idea',
      lookingFor: data?.lookingFor || 'Co-founder',
      creatorId: userId,
      status: data?.status || 'OPEN',
    },
  });
}

/**
 * Wait for a specified amount of time
 * Useful for testing rate limiting and time-based features
 *
 * @param ms - Milliseconds to wait
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Global test setup
 * Run before all tests in the suite
 */
beforeAll(async () => {
  await setupTestEnvironment();
});

/**
 * Global test teardown
 * Run after all tests in the suite
 */
afterAll(async () => {
  await teardownTestEnvironment();
});

/**
 * Clean database before each test
 * Ensures tests start with a clean slate
 */
beforeEach(async () => {
  await cleanDatabase();
});
