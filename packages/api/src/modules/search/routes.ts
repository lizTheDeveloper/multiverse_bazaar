/**
 * Search routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for search operations.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { SearchService } from './service.js';
import { SearchQuery } from './types.js';
import { searchQuerySchema } from './schemas.js';
import { optionalAuthMiddleware } from '../auth/middleware.js';
import { AuthService } from '../auth/service.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in search routes
 */
interface SearchContext {
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
 * Creates search routes
 *
 * @param searchService - SearchService instance for handling search operations
 * @param authService - AuthService instance for authentication
 * @returns Hono app with search routes configured
 */
export function createSearchRoutes(
  searchService: SearchService,
  authService: AuthService
): Hono<SearchContext> {
  const router = new Hono<SearchContext>();

  /**
   * GET /search
   * Search across projects and ideas
   * Public endpoint - optional authentication for personalized results
   *
   * Query parameters:
   * - q: Search query string (required, min 1 char, max 200 chars)
   * - type: Search type - 'projects', 'ideas', or 'all' (default: 'all')
   * - status: Filter by status (ProjectStatus for projects, IdeaStatus for ideas)
   * - featured: Filter by featured status (boolean, for projects only)
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   *
   * Response:
   * {
   *   "results": [
   *     {
   *       "type": "project" | "idea",
   *       "id": "uuid",
   *       "title": "Result title",
   *       "description": "Result description",
   *       "score": 0.5,
   *       ... // type-specific fields
   *     }
   *   ],
   *   "total": 42,
   *   "page": 1,
   *   "limit": 20,
   *   "totalPages": 3,
   *   "query": "search term"
   * }
   */
  router.get('/', optionalAuthMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    // Parse and validate query parameters
    const queryParams = c.req.query();
    const validation = searchQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      logger.warn({ queryParams, errors: validation.error.errors }, 'Invalid search query');

      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fieldErrors: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    // Cast to SearchQuery since validation ensures 'q' is always present
    const query = validation.data as SearchQuery;

    logger.info({ query, userId: user?.id }, 'Processing search request');

    const result = await searchService.search(query, user?.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ query, error: error.message }, 'Search failed');

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
      { query: query.q, type: query.type, total: result.value.total, page: result.value.page },
      'Search completed successfully'
    );

    return c.json(result.value);
  });

  return router;
}
