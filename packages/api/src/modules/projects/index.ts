/**
 * Projects module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  Project,
  ProjectWithCollaborators,
  ProjectWithUpvotes,
  ProjectDetailed,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListQuery,
  ProjectListResponse,
  Collaborator,
} from './types.js';

// Export schemas
export {
  createProjectSchema,
  updateProjectSchema,
  projectListQuerySchema,
} from './schemas.js';
export type {
  ValidatedCreateProjectRequest,
  ValidatedUpdateProjectRequest,
  ValidatedProjectListQuery,
} from './schemas.js';

// Export service
export { ProjectService } from './service.js';

// Export repository
export { ProjectRepository } from './repository.js';

// Export routes factory
export { createProjectRoutes } from './routes.js';
