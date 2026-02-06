/**
 * Hono application configuration for the Multiverse Bazaar API.
 * Sets up middleware, routing, and error handling.
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { Container } from './infra/container.js';
import { Config } from './infra/config.js';
import { Logger } from './infra/logger.js';
import { randomUUID } from 'crypto';

// Import security middleware
import { securityHeaders } from './middleware/security-headers.js';
import { cors } from './middleware/cors.js';
import { generalRateLimiter } from './middleware/rate-limit.js';
import { auditMiddleware } from './modules/audit/middleware.js';

// Import route registration
import { registerRoutes, notFoundHandler } from './routes/index.js';

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

  // 1. Store container in context (must be first)
  app.use('*', async (c, next) => {
    c.set('container', container);
    await next();
  });

  // 2. Set up security headers (apply to all responses)
  app.use('*', securityHeaders());

  // 3. Set up CORS middleware
  app.use('*', cors({
    allowedOrigins: config.corsOrigins,
    allowCredentials: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
    allowNoOrigin: config.nodeEnv === 'development',
  }));

  // 4. Set up request ID middleware
  app.use('*', requestIdMiddleware());

  // 5. Set up logging middleware
  app.use('*', loggingMiddleware(logger));

  // 6. Set up error handling middleware (must be before routes)
  app.use('*', errorHandlerMiddleware(logger));

  // 7. Set up general rate limiting (for all API routes)
  app.use('/api/*', generalRateLimiter());

  // 8. Set up audit middleware (capture request context)
  app.use('/api/*', auditMiddleware());

  // Health check endpoint (no auth required)
  app.get('/health', async (c) => {
    const { PrismaClient } = await import('@prisma/client');
    const db = container.resolve('db') as InstanceType<typeof PrismaClient>;

    // Check database connectivity
    let dbStatus = 'unknown';
    try {
      await db.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'disconnected';
      logger.error('Database health check failed', { error });
    }

    const isHealthy = dbStatus === 'connected';
    const status = isHealthy ? 200 : 503;

    return c.json(
      {
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        services: {
          database: dbStatus,
        },
      },
      status
    );
  });

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      message: 'Welcome to Multiverse Bazaar API',
      version: '1.0.0',
      docs: '/api/v1',
      health: '/health',
    });
  });

  // Mount API v1 routes
  const apiV1Routes = registerRoutes(container);
  app.route('/api/v1', apiV1Routes);

  // 404 handler for unmatched routes (must be last)
  app.notFound(notFoundHandler());

  return app;
}
