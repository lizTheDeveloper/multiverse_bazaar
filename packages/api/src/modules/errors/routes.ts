/**
 * Error reporting routes for frontend error submission
 * Receives client-side errors and submits them to the Autonomous Error Resolver
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getErrorResolver } from '../../infra/error-resolver.js';

const errorRoutes = new Hono();

// Schema for frontend error submission
const frontendErrorSchema = z.object({
  message: z.string().min(1),
  name: z.string().optional().default('Error'),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

/**
 * POST /api/v1/errors/report
 * Receives error reports from the frontend
 */
errorRoutes.post(
  '/report',
  zValidator('json', frontendErrorSchema),
  async (c) => {
    const errorData = c.req.valid('json');
    const errorResolver = getErrorResolver();

    // Create an Error object from the frontend data
    const error = new Error(errorData.message);
    error.name = errorData.name || 'FrontendError';
    error.stack = errorData.stack || `${error.name}: ${error.message}\n    at ${errorData.url}`;

    // Submit to error resolver with frontend context
    const errorId = errorResolver.submit(error, {
      source: 'frontend',
      url: errorData.url,
      userAgent: errorData.userAgent,
      componentStack: errorData.componentStack,
      timestamp: errorData.timestamp,
      ...errorData.context,
    });

    if (errorId) {
      return c.json({ success: true, errorId }, 201);
    }

    return c.json({ success: false, message: 'Error not submitted (filtered or disabled)' }, 200);
  }
);

/**
 * POST /api/v1/errors/batch
 * Receives multiple error reports at once (for offline/batch scenarios)
 */
errorRoutes.post(
  '/batch',
  zValidator('json', z.object({ errors: z.array(frontendErrorSchema) })),
  async (c) => {
    const { errors } = c.req.valid('json');
    const errorResolver = getErrorResolver();
    const results: { message: string; errorId: string | null }[] = [];

    for (const errorData of errors) {
      const error = new Error(errorData.message);
      error.name = errorData.name || 'FrontendError';
      error.stack = errorData.stack || `${error.name}: ${error.message}\n    at ${errorData.url}`;

      const errorId = errorResolver.submit(error, {
        source: 'frontend',
        url: errorData.url,
        userAgent: errorData.userAgent,
        componentStack: errorData.componentStack,
        timestamp: errorData.timestamp,
        ...errorData.context,
      });

      results.push({ message: errorData.message, errorId });
    }

    const submitted = results.filter(r => r.errorId).length;
    return c.json({ success: true, submitted, total: errors.length, results }, 201);
  }
);

export { errorRoutes };
