/**
 * Upvotes module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  Upvote,
  UpvoteResponse,
  ProjectUpvoteStats,
} from './types.js';

// Export schemas
export { projectIdParamSchema } from './schemas.js';
export type { ValidatedProjectIdParam } from './schemas.js';

// Export service
export { UpvoteService } from './service.js';

// Export repository
export { UpvoteRepository } from './repository.js';

// Export routes factory
export { createUpvoteRoutes } from './routes.js';
