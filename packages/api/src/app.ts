/**
 * Hono application configuration for the Multiverse Bazaar API.
 * Sets up middleware, routing, and error handling.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Context, Next } from 'hono';
import { Container } from './infra/container.js';
import { Config } from './infra/config.js';
import { Logger } from './infra/logger.js';
import { randomUUID } from 'crypto';

/**
 * Variables available in the Hono context.
 */
interface Variables {
  requestId: string;
  logger: Logger;
  container: Container;
}

/**
 * Middleware that generates and attaches a unique request ID to each request.
 * The request ID is added to the X-Request-ID response header.
 */
function requestIdMiddleware() {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    // Get request ID from header or generate a new one
    const requestId = c.req.header('X-Request-ID') || randomUUID();

    // Store in context
    c.set('requestId', requestId);

    // Add to response header
    c.header('X-Request-ID', requestId);

    await next();
  };
}

/**
 * Middleware that creates a request-scoped logger and logs HTTP requests.
 */
function loggingMiddleware(logger: Logger) {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const requestId = c.get('requestId');
    const start = Date.now();

    // Create request-scoped logger
    const requestLogger = logger.child({
      requestId,
      method: c.req.method,
      path: c.req.path,
    });

    // Store logger in context
    c.set('logger', requestLogger);

    requestLogger.info('Request received');

    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      const status = c.res.status;

      requestLogger.info('Request completed', {
        status,
        duration,
      });
    }
  };
}

/**
 * Middleware that catches errors and returns proper JSON responses.
 */
function errorHandlerMiddleware(logger: Logger) {
  return async (c: Context<{ Variables: Variables }>, next: Next): Promise<Response | void> => {
    try {
      await next();
    } catch (error) {
      const requestLogger = c.get('logger') || logger;
      const requestId = c.get('requestId') || 'unknown';

      // Log the error
      if (error instanceof Error) {
        requestLogger.error(error, 'Unhandled error in request', {
          stack: error.stack,
        });
      } else {
        requestLogger.error('Unknown error type', {
          error: String(error),
        });
      }

      // Return error response
      const status: 500 | 400 | 401 | 403 | 404 = error instanceof Error && 'status' in error
        ? (error as { status: 500 | 400 | 401 | 403 | 404 }).status
        : 500;

      const message = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      return c.json(
        {
          error: {
            message,
            requestId,
            timestamp: new Date().toISOString(),
          },
        },
        status
      );
    }
  };
}

/**
 * Creates and configures the Hono application.
 *
 * @param container - Dependency injection container with registered dependencies
 * @returns Configured Hono application instance
 *
 * @example
 * ```typescript
 * const container = setupContainer();
 * const app = configureApp(container);
 * ```
 */
export function configureApp(container: Container) {
  const app = new Hono<{ Variables: Variables }>();

  const config = container.resolve<Config>('config');
  const logger = container.resolve<Logger>('logger');

  // Store container in context for route handlers
  app.use('*', async (c, next) => {
    c.set('container', container);
    await next();
  });

  // Set up CORS middleware
  app.use('*', cors({
    origin: config.corsOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: ['X-Request-ID'],
    credentials: true,
  }));

  // Set up request ID middleware
  app.use('*', requestIdMiddleware());

  // Set up logging middleware
  app.use('*', loggingMiddleware(logger));

  // Set up error handling middleware
  app.use('*', errorHandlerMiddleware(logger));

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // API versioning - v1 routes will be added here
  const apiV1 = new Hono<{ Variables: Variables }>();

  // Placeholder route for API v1
  apiV1.get('/', (c) => {
    return c.json({
      message: 'Multiverse Bazaar API v1',
      version: '1.0.0',
    });
  });

  // Mount API v1 routes
  app.route('/api/v1', apiV1);

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      message: 'Welcome to Multiverse Bazaar API',
      version: '1.0.0',
      docs: '/api/v1',
    });
  });

  return app;
}
