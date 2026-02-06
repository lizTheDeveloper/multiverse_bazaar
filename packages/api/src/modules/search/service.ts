/**
 * Business logic layer for Search module.
 * Handles search operations with validation and routing.
 */

import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  ValidationError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { ProjectStatus, IdeaStatus } from '@prisma/client';
import { SearchRepository } from './repository.js';
import { SearchQuery, SearchResponse } from './types.js';
import { Logger } from '../../infra/logger.js';

/**
 * Service for search operations
 * Handles business logic, validation, and routing for search queries
 */
export class SearchService {
  constructor(
    private readonly repository: SearchRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Validate status filter based on search type
   *
   * @param status - Status string to validate
   * @param type - Search type (projects, ideas, or all)
   * @returns true if valid, false otherwise
   */
  private validateStatus(status: string, type: 'projects' | 'ideas' | 'all'): boolean {
    if (type === 'projects' || type === 'all') {
      return Object.values(ProjectStatus).includes(status as ProjectStatus);
    }
    if (type === 'ideas' || type === 'all') {
      return Object.values(IdeaStatus).includes(status as IdeaStatus);
    }
    return false;
  }

  /**
   * Search across projects and/or ideas
   *
   * @param query - Search query parameters
   * @param userId - Optional user ID for personalized results (upvote/interest status)
   * @returns Result with paginated search response
   */
  async search(
    query: SearchQuery,
    userId?: string
  ): Promise<Result<SearchResponse, BaseError>> {
    try {
      this.logger.info({ query, userId }, 'Executing search');

      // Validate and sanitize query
      const searchQuery = query.q.trim();
      if (!searchQuery) {
        this.logger.warn({ query }, 'Empty search query');
        return Ok({
          results: [],
          total: 0,
          page: query.page || 1,
          limit: query.limit || 20,
          totalPages: 0,
          query: searchQuery,
        });
      }

      // Determine search type (default to 'all')
      const type = query.type || 'all';

      // Validate status filter if provided
      if (query.status !== undefined) {
        if (!this.validateStatus(query.status, type)) {
          return Err(
            new ValidationError(
              'Invalid status filter for the specified search type',
              undefined,
              {
                status: query.status,
                type,
                validProjectStatuses: Object.values(ProjectStatus),
                validIdeaStatuses: Object.values(IdeaStatus),
              }
            )
          );
        }
      }

      // Set pagination defaults
      const page = query.page || 1;
      const limit = query.limit || 20;

      // Build filters
      const filters: { status?: string; featured?: boolean } = {};
      if (query.status !== undefined) {
        filters.status = query.status;
      }
      if (query.featured !== undefined) {
        filters.featured = query.featured;
      }

      // Route to appropriate repository method based on type
      let searchResult: Result<
        { results: any[]; total: number },
        BaseError
      >;

      if (type === 'projects') {
        this.logger.info({ query: searchQuery, filters, page, limit }, 'Searching projects');
        searchResult = await this.repository.searchProjects(
          searchQuery,
          filters,
          page,
          limit,
          userId
        );
      } else if (type === 'ideas') {
        this.logger.info({ query: searchQuery, filters, page, limit }, 'Searching ideas');
        searchResult = await this.repository.searchIdeas(
          searchQuery,
          { status: filters.status },
          page,
          limit,
          userId
        );
      } else {
        // type === 'all'
        this.logger.info({ query: searchQuery, filters, page, limit }, 'Searching all');
        searchResult = await this.repository.searchAll(
          searchQuery,
          filters,
          page,
          limit,
          userId
        );
      }

      if (!isOk(searchResult)) {
        this.logger.error(
          { query, error: searchResult.error.message },
          'Failed to execute search'
        );
        return Err(searchResult.error);
      }

      const { results, total } = searchResult.value;
      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { query: searchQuery, type, total, page, limit, totalPages },
        'Search completed successfully'
      );

      return Ok({
        results,
        total,
        page,
        limit,
        totalPages,
        query: searchQuery,
      });
    } catch (error) {
      this.logger.error({ error, query }, 'Unexpected error during search');
      return Err(
        new InternalError('An unexpected error occurred while searching', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
