/**
 * Main entry point for the Multiverse Bazaar API.
 * Bootstraps the application by loading config, setting up the container,
 * creating the Hono app, and starting the HTTP server.
 */

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { setupContainer } from './infra/container.js';
import { configureApp } from './app.js';
import { Config } from './infra/config.js';
import { Logger } from './infra/logger.js';

/**
 * Main application bootstrap function.
 * Sets up dependencies and starts the server.
 */
async function main(): Promise<void> {
  try {
    // Set up the dependency injection container
    const container = setupContainer();

    // Resolve core dependencies
    const config = container.resolve<Config>('config');
    const logger = container.resolve<Logger>('logger');

    logger.info('Starting Multiverse Bazaar API', {
      nodeEnv: config.nodeEnv,
      port: config.port,
    });

    // Create and configure the Hono app
    const app = configureApp(container);

    // Start the HTTP server
    const server = serve({
      fetch: app.fetch,
      port: config.port,
    });

    logger.info(`Server is running on http://localhost:${config.port}`, {
      environment: config.nodeEnv,
      corsOrigins: config.corsOrigins,
    });

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Close the server
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('Unhandled error during startup:', error);
  process.exit(1);
});
