import { PrismaClient } from '@prisma/client';
import { getLogger } from './logger.js';

/**
 * PrismaClient singleton instance
 * Ensures only one connection pool is created across the application
 */
let prisma: PrismaClient | null = null;

/**
 * Get or create the PrismaClient singleton instance
 * @returns PrismaClient instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });

    // Note: Prisma event-based logging requires specific configuration in PrismaClient options
    // For now, we rely on the log levels above
  }

  return prisma;
}

/**
 * Connect to the database
 * Establishes connection pool and verifies connectivity
 */
export async function connect(): Promise<void> {
  try {
    const logger = getLogger();
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Database connection established');
  } catch (error) {
    const logger = getLogger();
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

/**
 * Disconnect from the database
 * Closes all connections in the pool
 */
export async function disconnect(): Promise<void> {
  try {
    const logger = getLogger();
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
      logger.info('Database connection closed');
    }
  } catch (error) {
    const logger = getLogger();
    logger.error('Failed to disconnect from database', { error });
    throw error;
  }
}

/**
 * Health check for database connectivity
 * @returns true if database is reachable, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    const logger = getLogger();
    logger.error('Database health check failed', { error });
    return false;
  }
}

// Export the database client for use in the container
export const db = {
  client: getPrismaClient,
  connect,
  disconnect,
  healthCheck,
};

// Default export for convenience
export default db;
