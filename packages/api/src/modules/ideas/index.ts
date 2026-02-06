/**
 * Ideas module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  Idea,
  IdeaWithCreator,
  IdeaWithInterests,
  IdeaInterest,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  ExpressInterestRequest,
  GraduateIdeaRequest,
  IdeaListQuery,
  IdeaListResponse,
  UserProfile,
} from './types.js';

// Export schemas
export {
  createIdeaSchema,
  updateIdeaSchema,
  expressInterestSchema,
  graduateIdeaSchema,
  ideaListQuerySchema,
} from './schemas.js';
export type {
  ValidatedCreateIdeaRequest,
  ValidatedUpdateIdeaRequest,
  ValidatedExpressInterestRequest,
  ValidatedGraduateIdeaRequest,
  ValidatedIdeaListQuery,
} from './schemas.js';

// Export service
export { IdeaService } from './service.js';

// Export repository
export { IdeaRepository } from './repository.js';

// Export routes factory
export { createIdeaRoutes } from './routes.js';
