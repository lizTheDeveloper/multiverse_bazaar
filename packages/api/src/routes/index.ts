/**
 * Centralized route registration for the Multiverse Bazaar API.
 * Exports a function to mount all routes with proper middleware and organization.
 */

import { Hono } from 'hono';
import type { Container } from '../infra/container.js';
import type { Logger } from '../infra/logger.js';

// Import route factories
import { createAuthRoutes } from '../modules/auth/routes.js';
import { createUserRoutes } from '../modules/users/routes.js';
import { createProjectRoutes } from '../modules/projects/routes.js';
import { createUpvoteRoutes } from '../modules/upvotes/routes.js';
import { createIdeaRoutes } from '../modules/ideas/routes.js';
import { createCollaboratorRoutes } from '../modules/collaborators/routes.js';
import { createNotificationRoutes } from '../modules/notifications/routes.js';
import { createSearchRoutes } from '../modules/search/routes.js';
import { createUploadRoutes } from '../modules/uploads/routes.js';
import { createPrivacyRoutes } from '../modules/privacy/routes.js';

// Import services
import { AuthService } from '../modules/auth/service.js';
import { UserService } from '../modules/users/service.js';
import { ProjectService } from '../modules/projects/service.js';
import { CollaboratorService } from '../modules/collaborators/service.js';
import { UpvoteService } from '../modules/upvotes/service.js';
import { IdeaService } from '../modules/ideas/service.js';
import { NotificationService } from '../modules/notifications/service.js';
import { SearchService } from '../modules/search/service.js';
import { UploadService } from '../modules/uploads/service.js';
import { PrivacyService } from '../modules/privacy/service.js';

// Import middleware
import { authMiddleware } from '../modules/auth/middleware.js';
import {
  loginRateLimiter,
  searchRateLimiter,
} from '../middleware/rate-limit.js';

/**
 * Variables available in the Hono context.
 */
interface Variables {
  requestId: string;
  logger: Logger;
  container: Container;
}

/**
 * Registers all API routes under /api/v1.
 * Organizes routes by module and applies appropriate middleware.
 *
 * @param container - Dependency injection container with registered dependencies
 * @returns Configured Hono router with all API routes
 *
 * @example
 * ```typescript
 * const container = setupContainer();
 * const apiRouter = registerRoutes(container);
 * app.route('/api/v1', apiRouter);
 * ```
 */
export function registerRoutes(container: Container): Hono<{ Variables: Variables }> {
  const router = new Hono<{ Variables: Variables }>();

  // Resolve services from container
  const authService = container.resolve<AuthService>('authService');
  const userService = container.resolve<UserService>('userService');
  const projectService = container.resolve<ProjectService>('projectService');
  const collaboratorService = container.resolve<CollaboratorService>('collaboratorService');
  const upvoteService = container.resolve<UpvoteService>('upvoteService');
  const ideaService = container.resolve<IdeaService>('ideaService');
  const notificationService = container.resolve<NotificationService>('notificationService');
  const searchService = container.resolve<SearchService>('searchService');
  const uploadService = container.resolve<UploadService>('uploadService');
  const privacyService = container.resolve<PrivacyService>('privacyService');

  // API v1 root endpoint
  router.get('/', (c) => {
    return c.json({
      message: 'Multiverse Bazaar API v1',
      version: '1.0.0',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        projects: '/api/v1/projects',
        ideas: '/api/v1/ideas',
        collaborators: '/api/v1/collaborators',
        invitations: '/api/v1/invitations',
        notifications: '/api/v1/notifications',
        search: '/api/v1/search',
        uploads: '/api/v1/uploads',
        privacy: '/api/v1/me/privacy',
      },
    });
  });

  // Authentication routes (public)
  // Apply login rate limiter to auth routes
  const authRoutes = createAuthRoutes(authService);
  authRoutes.use('/login', loginRateLimiter());
  router.route('/auth', authRoutes);

  // User routes (mostly authenticated)
  const userRoutes = createUserRoutes(userService, authMiddleware);
  router.route('/users', userRoutes);

  // Project routes (authenticated)
  const projectRoutes = createProjectRoutes(projectService, authService);

  // Mount upvote routes - these are standalone routes at /projects/:id/upvote
  const upvoteRoutes = createUpvoteRoutes(upvoteService, authService);
  router.route('/', upvoteRoutes);

  router.route('/projects', projectRoutes);

  // Idea routes (authenticated)
  const ideaRoutes = createIdeaRoutes(ideaService, authService);
  router.route('/ideas', ideaRoutes);

  // Collaborator routes (authenticated)
  // These can be accessed both as standalone routes and nested under projects
  const collaboratorRoutes = createCollaboratorRoutes(collaboratorService, authService);
  router.route('/collaborators', collaboratorRoutes);

  // Also mount invitation routes at top level for convenience
  router.route('/invitations', collaboratorRoutes);

  // Notification routes (authenticated)
  const notificationRoutes = createNotificationRoutes(notificationService, authService);
  router.route('/notifications', notificationRoutes);

  // Search routes (optional auth for personalization)
  const searchRoutes = createSearchRoutes(searchService, authService);
  searchRoutes.use('*', searchRateLimiter());
  router.route('/search', searchRoutes);

  // Upload routes (authenticated)
  const uploadRoutes = createUploadRoutes(uploadService, authService);
  router.route('/uploads', uploadRoutes);

  // Privacy routes (authenticated) - nested under /me
  const privacyRoutes = createPrivacyRoutes(privacyService, authService);
  router.route('/me/privacy', privacyRoutes);

  return router;
}

/**
 * Creates a 404 handler for unmatched routes.
 * Returns a JSON error response with helpful information.
 *
 * @returns Hono middleware handler
 */
export function notFoundHandler() {
  return (c: any) => {
    const requestId = c.get('requestId') || 'unknown';
    const logger = c.get('logger');

    if (logger) {
      logger.warn('Route not found', {
        method: c.req.method,
        path: c.req.path,
      });
    }

    return c.json(
      {
        error: {
          message: 'Route not found',
          path: c.req.path,
          method: c.req.method,
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      404
    );
  };
}
