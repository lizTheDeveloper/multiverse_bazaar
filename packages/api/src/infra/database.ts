import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

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
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e: any) => {
        logger.debug({
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        }, 'Prisma Query');
      });
    }

    // Log errors
    prisma.$on('error', (e: any) => {
      logger.error({ error: e }, 'Prisma Error');
    });

    // Log warnings
    prisma.$on('warn', (e: any) => {
      logger.warn({ warning: e }, 'Prisma Warning');
    });
  }

  return prisma;
}

/**
 * Connect to the database
 * Establishes connection pool and verifies connectivity
 */
export async function connect(): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Database connection established');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

/**
 * Disconnect from the database
 * Closes all connections in the pool
 */
export async function disconnect(): Promise<void> {
  try {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect from database');
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
    logger.error({ error }, 'Database health check failed');
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
