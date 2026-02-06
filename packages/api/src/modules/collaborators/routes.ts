/**
 * Collaborator routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for managing project collaborators and invitations.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { CollaboratorService } from './service.js';
import {
  inviteCollaboratorSchema,
  uuidParamSchema,
} from './schemas.js';
import { authMiddleware, optionalAuthMiddleware } from '../auth/middleware.js';
import { AuthService } from '../auth/service.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in collaborator routes
 */
interface CollaboratorContext {
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
 * Creates collaborator routes
 *
 * @param collaboratorService - CollaboratorService instance
 * @param authService - AuthService instance for authentication
 * @returns Hono app with collaborator routes configured
 */
export function createCollaboratorRoutes(
  collaboratorService: CollaboratorService,
  authService: AuthService
): Hono<CollaboratorContext> {
  const router = new Hono<CollaboratorContext>();

  /**
   * GET /projects/:id/collaborators
   * List all collaborators for a project
   *
   * Response:
   * {
   *   "collaborators": [
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "projectId": "uuid",
   *       "role": "CREATOR",
   *       "createdAt": "2024-01-01T00:00:00Z",
   *       "user": { ... }
   *     }
   *   ]
   * }
   */
  router.get('/projects/:id/collaborators', async (c) => {
    const logger = c.get('logger');

    // Validate project ID parameter
    const projectIdValidation = uuidParamSchema.safeParse(c.req.param('id'));

    if (!projectIdValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project ID format',
          },
        },
        400
      );
    }

    const projectId = projectIdValidation.data;

    logger.info({ projectId }, 'Fetching project collaborators');

    const result = await collaboratorService.getProjectCollaborators(projectId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ projectId, error: error.message }, 'Failed to fetch collaborators');

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

    logger.info({ projectId, count: result.value.length }, 'Successfully fetched collaborators');

    return c.json({
      collaborators: result.value,
    });
  });

  /**
   * POST /projects/:id/collaborators
   * Invite a collaborator to a project
   * Requires authentication - only project creator can invite
   *
   * Request body:
   * {
   *   "email": "user@example.com",
   *   "role": "CONTRIBUTOR"
   * }
   *
   * Response (immediate - internal user):
   * {
   *   "immediate": true,
   *   "collaborator": { ... }
   * }
   *
   * Response (pending - external user):
   * {
   *   "immediate": false,
   *   "invitationToken": "uuid",
   *   "expiresAt": "2024-01-31T00:00:00Z"
   * }
   */
  router.post('/projects/:id/collaborators', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Validate project ID parameter
    const projectIdValidation = uuidParamSchema.safeParse(c.req.param('id'));

    if (!projectIdValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project ID format',
          },
        },
        400
      );
    }

    const projectId = projectIdValidation.data;

    // Parse and validate request body
    const body = await c.req.json();
    const validation = inviteCollaboratorSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fieldErrors: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { email, role } = validation.data;

    logger.info({ projectId, email, role, inviterId: user.id }, 'Inviting collaborator');

    const result = await collaboratorService.invite(user.id, projectId, email, role);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ projectId, email, error: error.message }, 'Failed to invite collaborator');

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

    const response = result.value;

    logger.info(
      { projectId, email, immediate: response.immediate },
      'Successfully invited collaborator'
    );

    return c.json(response, 201);
  });

  /**
   * DELETE /projects/:id/collaborators/:userId
   * Remove a collaborator from a project
   * Requires authentication - only project creator can remove collaborators
   *
   * Response:
   * {
   *   "message": "Collaborator removed successfully"
   * }
   */
  router.delete('/projects/:id/collaborators/:userId', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Validate project ID parameter
    const projectIdValidation = uuidParamSchema.safeParse(c.req.param('id'));

    if (!projectIdValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project ID format',
          },
        },
        400
      );
    }

    const projectId = projectIdValidation.data;

    // Validate user ID parameter
    const userIdValidation = uuidParamSchema.safeParse(c.req.param('userId'));

    if (!userIdValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user ID format',
          },
        },
        400
      );
    }

    const targetUserId = userIdValidation.data;

    logger.info({ projectId, targetUserId, requesterId: user.id }, 'Removing collaborator');

    const result = await collaboratorService.remove(user.id, projectId, targetUserId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ projectId, targetUserId, error: error.message }, 'Failed to remove collaborator');

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

    logger.info({ projectId, targetUserId }, 'Successfully removed collaborator');

    return c.json({
      message: 'Collaborator removed successfully',
    });
  });

  /**
   * GET /invitations/:token
   * View invitation details
   * Public endpoint - no authentication required
   *
   * Response:
   * {
   *   "invitation": {
   *     "id": "uuid",
   *     "email": "user@example.com",
   *     "projectId": "uuid",
   *     "projectTitle": "My Project",
   *     "role": "CONTRIBUTOR",
   *     "expiresAt": "2024-01-31T00:00:00Z",
   *     "createdAt": "2024-01-01T00:00:00Z",
   *     "inviterName": "John Doe",
   *     "inviterEmail": "john@example.com"
   *   }
   * }
   */
  router.get('/invitations/:token', async (c) => {
    const logger = c.get('logger');

    // Validate token parameter
    const tokenValidation = uuidParamSchema.safeParse(c.req.param('token'));

    if (!tokenValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid invitation token format',
          },
        },
        400
      );
    }

    const token = tokenValidation.data;

    logger.info({ token }, 'Fetching invitation details');

    const result = await collaboratorService.getInvitation(token);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ token, error: error.message }, 'Failed to fetch invitation');

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

    logger.info({ token, projectId: result.value.projectId }, 'Successfully fetched invitation');

    return c.json({
      invitation: result.value,
    });
  });

  /**
   * POST /invitations/:token/accept
   * Accept a collaboration invitation
   * Optional authentication - if authenticated, user will be added immediately
   * If not authenticated, returns error asking user to log in
   *
   * Response (authenticated):
   * {
   *   "collaborator": { ... },
   *   "project": {
   *     "id": "uuid",
   *     "title": "My Project"
   *   }
   * }
   */
  router.post('/invitations/:token/accept', optionalAuthMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    // Validate token parameter
    const tokenValidation = uuidParamSchema.safeParse(c.req.param('token'));

    if (!tokenValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid invitation token format',
          },
        },
        400
      );
    }

    const token = tokenValidation.data;

    logger.info({ token, userId: user?.id }, 'Accepting invitation');

    const result = await collaboratorService.acceptInvitation(token, user?.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ token, error: error.message }, 'Failed to accept invitation');

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

    logger.info({ token, userId: user?.id, projectId: result.value.project.id }, 'Successfully accepted invitation');

    return c.json(result.value);
  });

  /**
   * POST /invitations/:token/decline
   * Decline a collaboration invitation
   * No authentication required
   *
   * Response:
   * {
   *   "message": "Invitation declined successfully"
   * }
   */
  router.post('/invitations/:token/decline', async (c) => {
    const logger = c.get('logger');

    // Validate token parameter
    const tokenValidation = uuidParamSchema.safeParse(c.req.param('token'));

    if (!tokenValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid invitation token format',
          },
        },
        400
      );
    }

    const token = tokenValidation.data;

    logger.info({ token }, 'Declining invitation');

    const result = await collaboratorService.declineInvitation(token);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ token, error: error.message }, 'Failed to decline invitation');

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

    logger.info({ token }, 'Successfully declined invitation');

    return c.json({
      message: 'Invitation declined successfully',
    });
  });

  return router;
}
