/**
 * Search module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  SearchQuery,
  SearchResult,
  ProjectSearchResult,
  IdeaSearchResult,
  SearchResponse,
} from './types.js';

// Export schemas
export { searchQuerySchema } from './schemas.js';
export type { ValidatedSearchQuery } from './schemas.js';

// Export service
export { SearchService } from './service.js';

// Export repository
export { SearchRepository } from './repository.js';

// Export routes factory
export { createSearchRoutes } from './routes.js';
