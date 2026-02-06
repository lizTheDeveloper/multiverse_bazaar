/**
 * Main entry point for the Multiverse Bazaar API.
 * Bootstraps the application by loading config, setting up the container,
 * creating the Hono app, and starting the HTTP server.
 */

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { setupContainer } from './infra/container.js';
import { configureApp } from './app.js';
import { connect, disconnect } from './infra/database.js';
import { Config } from './infra/config.js';
import { Logger } from './infra/logger.js';

/**
 * Main application bootstrap function.
 * Sets up dependencies and starts the server.
 */
async function main(): Promise<void> {
  let server: any = null;
  let container: any = null;

  try {
    // Set up the dependency injection container
    container = setupContainer();

    // Resolve core dependencies
    const config = container.resolve<Config>('config');
    const logger = container.resolve<Logger>('logger');

    logger.info('Starting Multiverse Bazaar API', {
      nodeEnv: config.nodeEnv,
      port: config.port,
      version: '1.0.0',
    });

    // Initialize database connection
    logger.info('Connecting to database...');
    await connect();
    logger.info('Database connection established');

    // Create and configure the Hono app
    logger.info('Configuring application routes and middleware...');
    const app = configureApp(container);

    // Start the HTTP server
    logger.info(`Starting HTTP server on port ${config.port}...`);
    server = serve({
      fetch: app.fetch,
      port: config.port,
    });

    logger.info(`Server is running on http://localhost:${config.port}`, {
      environment: config.nodeEnv,
      corsOrigins: config.corsOrigins,
      endpoints: {
        health: `http://localhost:${config.port}/health`,
        api: `http://localhost:${config.port}/api/v1`,
      },
    });

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        // Stop accepting new connections
        if (server) {
          logger.info('Closing HTTP server...');
          server.close(() => {
            logger.info('HTTP server closed');
          });
        }

        // Close database connections
        logger.info('Closing database connections...');
        await disconnect();
        logger.info('Database connections closed');

        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger?.error('Uncaught exception', { error, stack: error.stack });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason,
        promise: String(promise),
      });
      shutdown('unhandledRejection');
    });

  } catch (error) {
    // Use logger if available, otherwise fall back to console
    try {
      const errorLogger = container?.resolve<Logger>('logger');
      if (errorLogger) {
        errorLogger.error('Failed to start application', { error });
      } else {
        console.error('Failed to start application:', error);
      }
    } catch {
      console.error('Failed to start application:', error);
    }

    // Clean up on startup failure
    try {
      if (server) {
        server.close();
      }
      await disconnect();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('Unhandled error during startup:', error);
  process.exit(1);
});
