/**
 * Data access layer for Search module.
 * Implements PostgreSQL full-text search for projects and ideas.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Result, Ok, Err, isOk, InternalError } from '@multiverse-bazaar/shared';
import { ProjectSearchResult, IdeaSearchResult, SearchResult } from './types.js';

/**
 * Repository for search-related database operations
 * Uses PostgreSQL full-text search with to_tsvector and to_tsquery
 */
export class SearchRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Sanitize search query to prevent SQL injection
   * Escapes special characters and removes potentially dangerous input
   *
   * @param query - Raw search query
   * @returns Sanitized query
   */
  private sanitizeQuery(query: string): string {
    // Remove special PostgreSQL characters that could break tsquery
    // Keep alphanumeric, spaces, and basic punctuation
    return query.replace(/[^\w\s-]/g, ' ').trim();
  }

  /**
   * Search projects using PostgreSQL full-text search
   *
   * @param query - Search query string
   * @param filters - Additional filters (status, featured)
   * @param page - Page number
   * @param limit - Results per page
   * @param userId - Optional user ID for upvote status
   * @returns Result with array of project search results
   */
  async searchProjects(
    query: string,
    filters: { status?: string; featured?: boolean },
    page: number,
    limit: number,
    userId?: string
  ): Promise<Result<{ results: ProjectSearchResult[]; total: number }, InternalError>> {
    try {
      // Handle empty query
      if (!query || query.trim().length === 0) {
        return Ok({ results: [], total: 0 });
      }

      const sanitizedQuery = this.sanitizeQuery(query);
      if (!sanitizedQuery) {
        return Ok({ results: [], total: 0 });
      }

      const offset = (page - 1) * limit;

      // Build WHERE clause for filters
      const whereConditions: string[] = [
        "to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', $1)",
      ];
      const params: any[] = [sanitizedQuery];
      let paramIndex = 2;

      if (filters.status !== undefined) {
        whereConditions.push(`status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.featured !== undefined) {
        whereConditions.push(`"isFeatured" = $${paramIndex}`);
        params.push(filters.featured);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Query for results with full-text search ranking
      const projectsQuery = `
        SELECT
          p.id,
          p.title,
          p.description,
          p.url,
          p."repoUrl",
          p."imageUrl",
          p.status,
          p."isFeatured",
          p."createdAt",
          p."updatedAt",
          ts_rank(to_tsvector('english', p.title || ' ' || p.description), plainto_tsquery('english', $1)) as score,
          COALESCE(upvote_count.count, 0)::int as "upvoteCount"
        FROM "Project" p
        LEFT JOIN (
          SELECT "projectId", COUNT(*)::int as count
          FROM "Upvote"
          GROUP BY "projectId"
        ) upvote_count ON upvote_count."projectId" = p.id
        WHERE ${whereClause}
        ORDER BY score DESC, p."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const projects = await this.db.$queryRaw<any[]>(Prisma.sql([projectsQuery], ...params));

      // Count total matching results
      const countQuery = `
        SELECT COUNT(*)::int as count
        FROM "Project" p
        WHERE ${whereClause}
      `;

      const countParams = params.slice(0, paramIndex - 1); // Remove limit and offset
      const countResult = await this.db.$queryRaw<[{ count: number }]>(
        Prisma.sql([countQuery], ...countParams)
      );
      const total = countResult[0]?.count || 0;

      // Check upvote status for each project if userId provided
      const results: ProjectSearchResult[] = await Promise.all(
        projects.map(async (project) => {
          let hasUpvoted = false;
          if (userId) {
            const upvote = await this.db.upvote.findUnique({
              where: {
                userId_projectId: {
                  userId,
                  projectId: project.id,
                },
              },
            });
            hasUpvoted = upvote !== null;
          }

          return {
            type: 'project' as const,
            id: project.id,
            title: project.title,
            description: project.description,
            url: project.url,
            repoUrl: project.repoUrl,
            imageUrl: project.imageUrl,
            status: project.status,
            isFeatured: project.isFeatured,
            score: parseFloat(project.score),
            upvoteCount: project.upvoteCount,
            hasUpvoted,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          };
        })
      );

      return Ok({ results, total });
    } catch (error) {
      return Err(
        new InternalError('Failed to search projects', {
          query,
          filters,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Search ideas using PostgreSQL full-text search
   *
   * @param query - Search query string
   * @param filters - Additional filters (status)
   * @param page - Page number
   * @param limit - Results per page
   * @param userId - Optional user ID for interest status
   * @returns Result with array of idea search results
   */
  async searchIdeas(
    query: string,
    filters: { status?: string },
    page: number,
    limit: number,
    userId?: string
  ): Promise<Result<{ results: IdeaSearchResult[]; total: number }, InternalError>> {
    try {
      // Handle empty query
      if (!query || query.trim().length === 0) {
        return Ok({ results: [], total: 0 });
      }

      const sanitizedQuery = this.sanitizeQuery(query);
      if (!sanitizedQuery) {
        return Ok({ results: [], total: 0 });
      }

      const offset = (page - 1) * limit;

      // Build WHERE clause for filters
      const whereConditions: string[] = [
        "to_tsvector('english', title || ' ' || description || ' ' || \"lookingFor\") @@ plainto_tsquery('english', $1)",
      ];
      const params: any[] = [sanitizedQuery];
      let paramIndex = 2;

      if (filters.status !== undefined) {
        whereConditions.push(`status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Query for results with full-text search ranking
      const ideasQuery = `
        SELECT
          i.id,
          i.title,
          i.description,
          i."lookingFor",
          i.status,
          i."creatorId",
          i."createdAt",
          i."updatedAt",
          u.name as "creatorName",
          ts_rank(to_tsvector('english', i.title || ' ' || i.description || ' ' || i."lookingFor"), plainto_tsquery('english', $1)) as score,
          COALESCE(interest_count.count, 0)::int as "interestCount"
        FROM "Idea" i
        LEFT JOIN "User" u ON u.id = i."creatorId"
        LEFT JOIN (
          SELECT "ideaId", COUNT(*)::int as count
          FROM "IdeaInterest"
          GROUP BY "ideaId"
        ) interest_count ON interest_count."ideaId" = i.id
        WHERE ${whereClause}
        ORDER BY score DESC, i."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const ideas = await this.db.$queryRaw<any[]>(Prisma.sql([ideasQuery], ...params));

      // Count total matching results
      const countQuery = `
        SELECT COUNT(*)::int as count
        FROM "Idea" i
        WHERE ${whereClause}
      `;

      const countParams = params.slice(0, paramIndex - 1); // Remove limit and offset
      const countResult = await this.db.$queryRaw<[{ count: number }]>(
        Prisma.sql([countQuery], ...countParams)
      );
      const total = countResult[0]?.count || 0;

      // Check interest status for each idea if userId provided
      const results: IdeaSearchResult[] = await Promise.all(
        ideas.map(async (idea) => {
          let hasInterest = false;
          if (userId) {
            const interest = await this.db.ideaInterest.findUnique({
              where: {
                userId_ideaId: {
                  userId,
                  ideaId: idea.id,
                },
              },
            });
            hasInterest = interest !== null;
          }

          return {
            type: 'idea' as const,
            id: idea.id,
            title: idea.title,
            description: idea.description,
            lookingFor: idea.lookingFor,
            status: idea.status,
            score: parseFloat(idea.score),
            creatorId: idea.creatorId,
            creatorName: idea.creatorName,
            interestCount: idea.interestCount,
            hasInterest,
            createdAt: idea.createdAt,
            updatedAt: idea.updatedAt,
          };
        })
      );

      return Ok({ results, total });
    } catch (error) {
      return Err(
        new InternalError('Failed to search ideas', {
          query,
          filters,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Search across both projects and ideas
   * Combines results with unified scoring and ranking
   *
   * @param query - Search query string
   * @param filters - Additional filters
   * @param page - Page number
   * @param limit - Results per page
   * @param userId - Optional user ID for upvote/interest status
   * @returns Result with combined array of search results
   */
  async searchAll(
    query: string,
    filters: { status?: string; featured?: boolean },
    page: number,
    limit: number,
    userId?: string
  ): Promise<Result<{ results: SearchResult[]; total: number }, InternalError>> {
    try {
      // Handle empty query
      if (!query || query.trim().length === 0) {
        return Ok({ results: [], total: 0 });
      }

      // Search both projects and ideas
      // For 'all' search, we ignore status filter since it's ambiguous
      const projectsResult = await this.searchProjects(
        query,
        { featured: filters.featured },
        1,
        1000, // Get a large set to combine and re-paginate
        userId
      );

      const ideasResult = await this.searchIdeas(query, {}, 1, 1000, userId);

      if (!isOk(projectsResult) || !isOk(ideasResult)) {
        return Err(
          new InternalError('Failed to search all', {
            query,
            projectError: !isOk(projectsResult) ? projectsResult.error.message : undefined,
            ideaError: !isOk(ideasResult) ? ideasResult.error.message : undefined,
          })
        );
      }

      // Combine and sort by score
      const allResults: SearchResult[] = [
        ...projectsResult.value.results,
        ...ideasResult.value.results,
      ].sort((a, b) => b.score - a.score);

      const total = allResults.length;

      // Apply pagination to combined results
      const offset = (page - 1) * limit;
      const paginatedResults = allResults.slice(offset, offset + limit);

      return Ok({ results: paginatedResults, total });
    } catch (error) {
      return Err(
        new InternalError('Failed to search all', {
          query,
          filters,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
