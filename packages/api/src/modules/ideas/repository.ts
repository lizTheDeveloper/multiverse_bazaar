/**
 * Data access layer for Ideas module.
 * Handles all database operations related to ideas.
 */

import { PrismaClient, IdeaStatus } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError } from '@multiverse-bazaar/shared';
import {
  Idea,
  IdeaWithCreator,
  IdeaWithInterests,
  IdeaInterest,
  IdeaUpvote,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  IdeaListQuery,
} from './types.js';
import { decodeCursor } from '../../shared/pagination.js';

/**
 * Repository for idea-related database operations
 */
export class IdeaRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new idea
   *
   * @param data - Idea creation data
   * @param creatorId - ID of the user creating the idea
   * @returns Result with created idea or InternalError
   */
  async create(data: CreateIdeaRequest, creatorId: string): Promise<Result<Idea, InternalError>> {
    try {
      const idea = await this.db.idea.create({
        data: {
          title: data.title,
          description: data.description,
          lookingFor: data.lookingFor,
          creatorId,
          status: IdeaStatus.OPEN,
        },
      });

      return Ok(idea);
    } catch (error) {
      return Err(
        new InternalError('Failed to create idea', {
          data,
          creatorId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find an idea by ID
   *
   * @param id - Idea ID
   * @returns Result with idea or NotFoundError
   */
  async findById(id: string): Promise<Result<Idea, NotFoundError | InternalError>> {
    try {
      const idea = await this.db.idea.findUnique({
        where: { id },
      });

      if (!idea) {
        return Err(new NotFoundError('Idea'));
      }

      return Ok(idea);
    } catch (error) {
      return Err(
        new InternalError('Failed to find idea by ID', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find an idea by ID with creator profile included
   *
   * @param id - Idea ID
   * @returns Result with idea and creator or NotFoundError
   */
  async findByIdWithCreator(
    id: string
  ): Promise<Result<IdeaWithCreator, NotFoundError | InternalError>> {
    try {
      const idea = await this.db.idea.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!idea) {
        return Err(new NotFoundError('Idea'));
      }

      return Ok(idea as IdeaWithCreator);
    } catch (error) {
      return Err(
        new InternalError('Failed to find idea with creator', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find an idea by ID with interests and user profiles included
   *
   * @param id - Idea ID
   * @returns Result with idea, creator, and interests or NotFoundError
   */
  async findByIdWithInterests(
    id: string
  ): Promise<Result<IdeaWithInterests, NotFoundError | InternalError>> {
    try {
      const idea = await this.db.idea.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          interests: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!idea) {
        return Err(new NotFoundError('Idea'));
      }

      return Ok(idea as IdeaWithInterests);
    } catch (error) {
      return Err(
        new InternalError('Failed to find idea with interests', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update an idea
   *
   * @param id - Idea ID
   * @param data - Update data
   * @returns Result with updated idea or NotFoundError
   */
  async update(
    id: string,
    data: UpdateIdeaRequest
  ): Promise<Result<Idea, NotFoundError | InternalError>> {
    try {
      const idea = await this.db.idea.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.lookingFor !== undefined && { lookingFor: data.lookingFor }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });

      return Ok(idea);
    } catch (error) {
      // Check if error is due to idea not found
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return Err(new NotFoundError('Idea'));
      }

      return Err(
        new InternalError('Failed to update idea', {
          id,
          data,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete an idea and all related data (interests, etc.)
   * Cascade deletion is handled by database constraints
   *
   * @param id - Idea ID
   * @returns Result with void or NotFoundError
   */
  async delete(id: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.idea.delete({
        where: { id },
      });

      return Ok(undefined);
    } catch (error) {
      // Check if error is due to idea not found
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return Err(new NotFoundError('Idea'));
      }

      return Err(
        new InternalError('Failed to delete idea', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * List ideas with cursor-based pagination and filters
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Result with array of ideas with creators (limit + 1 for hasMore detection) or InternalError
   */
  async list(
    query: IdeaListQuery
  ): Promise<Result<{ ideas: IdeaWithCreator[] }, InternalError>> {
    try {
      const limit = query.limit || 20;

      // Build where clause based on filters
      const where: any = {};

      if (query.status !== undefined) {
        where.status = query.status;
      }

      if (query.creatorId !== undefined) {
        where.creatorId = query.creatorId;
      }

      // Add cursor-based filtering if cursor is provided
      if (query.cursor) {
        try {
          const cursorData = decodeCursor(query.cursor);
          // Use compound cursor: (createdAt, id) < (cursorDate, cursorId)
          where.OR = [
            {
              createdAt: {
                lt: cursorData.createdAt,
              },
            },
            {
              createdAt: cursorData.createdAt,
              id: {
                lt: cursorData.id,
              },
            },
          ];
        } catch (error) {
          return Err(
            new InternalError('Invalid cursor', {
              cursor: query.cursor,
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      }

      // Fetch limit + 1 to determine if there are more results
      // Order by createdAt DESC, then by id DESC for stable sorting
      const ideas = await this.db.idea.findMany({
        where,
        take: limit + 1,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      return Ok({ ideas: ideas as IdeaWithCreator[] });
    } catch (error) {
      return Err(
        new InternalError('Failed to list ideas', {
          query,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Add interest to an idea
   *
   * @param ideaId - Idea ID
   * @param userId - User ID expressing interest
   * @param message - Optional message
   * @returns Result with created interest or InternalError
   */
  async addInterest(
    ideaId: string,
    userId: string,
    message?: string
  ): Promise<Result<IdeaInterest, InternalError>> {
    try {
      const interest = await this.db.ideaInterest.create({
        data: {
          ideaId,
          userId,
          message: message || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      return Ok(interest as IdeaInterest);
    } catch (error) {
      return Err(
        new InternalError('Failed to add interest', {
          ideaId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Remove interest from an idea
   *
   * @param ideaId - Idea ID
   * @param userId - User ID removing interest
   * @returns Result with void or NotFoundError
   */
  async removeInterest(
    ideaId: string,
    userId: string
  ): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.ideaInterest.delete({
        where: {
          userId_ideaId: {
            userId,
            ideaId,
          },
        },
      });

      return Ok(undefined);
    } catch (error) {
      // Check if error is due to interest not found
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return Err(new NotFoundError('Interest'));
      }

      return Err(
        new InternalError('Failed to remove interest', {
          ideaId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Check if a user has expressed interest in an idea
   *
   * @param ideaId - Idea ID
   * @param userId - User ID
   * @returns Result with boolean indicating if user has expressed interest
   */
  async hasExpressedInterest(
    ideaId: string,
    userId: string
  ): Promise<Result<boolean, InternalError>> {
    try {
      const interest = await this.db.ideaInterest.findUnique({
        where: {
          userId_ideaId: {
            userId,
            ideaId,
          },
        },
      });

      return Ok(interest !== null);
    } catch (error) {
      return Err(
        new InternalError('Failed to check interest status', {
          ideaId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get all interests for an idea
   *
   * @param ideaId - Idea ID
   * @returns Result with array of interests or InternalError
   */
  async getInterests(ideaId: string): Promise<Result<IdeaInterest[], InternalError>> {
    try {
      const interests = await this.db.ideaInterest.findMany({
        where: { ideaId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return Ok(interests as IdeaInterest[]);
    } catch (error) {
      return Err(
        new InternalError('Failed to get interests', {
          ideaId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Graduate an idea by setting its status to GRADUATED and linking to a project
   *
   * @param ideaId - Idea ID to graduate
   * @param projectId - Project ID to link to
   * @returns Result with updated idea or NotFoundError
   */
  async graduate(
    ideaId: string,
    projectId: string
  ): Promise<Result<Idea, NotFoundError | InternalError>> {
    try {
      const idea = await this.db.idea.update({
        where: { id: ideaId },
        data: {
          status: IdeaStatus.GRADUATED,
          graduatedToProjectId: projectId,
        },
      });

      return Ok(idea);
    } catch (error) {
      // Check if error is due to idea not found
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return Err(new NotFoundError('Idea'));
      }

      return Err(
        new InternalError('Failed to graduate idea', {
          ideaId,
          projectId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Check if a user is the creator of an idea
   *
   * @param ideaId - Idea ID
   * @param userId - User ID
   * @returns Result with boolean indicating if user is creator
   */
  async isUserCreator(ideaId: string, userId: string): Promise<Result<boolean, InternalError>> {
    try {
      const idea = await this.db.idea.findUnique({
        where: { id: ideaId },
        select: { creatorId: true },
      });

      return Ok(idea !== null && idea.creatorId === userId);
    } catch (error) {
      return Err(
        new InternalError('Failed to check if user is creator', {
          ideaId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Create an upvote for an idea
   * @param userId - User ID creating the upvote
   * @param ideaId - Idea ID being upvoted
   * @returns Result with created upvote or InternalError
   */
  async createUpvote(userId: string, ideaId: string): Promise<Result<IdeaUpvote, InternalError>> {
    try {
      const upvote = await this.db.ideaUpvote.create({
        data: {
          userId,
          ideaId,
        },
        select: {
          id: true,
          userId: true,
          ideaId: true,
          createdAt: true,
        },
      });

      return Ok(upvote as IdeaUpvote);
    } catch (error) {
      return Err(new InternalError('Failed to create idea upvote', {
        userId,
        ideaId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Delete an upvote from an idea
   * @param userId - User ID who created the upvote
   * @param ideaId - Idea ID that was upvoted
   * @returns Result with void or InternalError
   */
  async deleteUpvote(userId: string, ideaId: string): Promise<Result<void, InternalError>> {
    try {
      await this.db.ideaUpvote.delete({
        where: {
          userId_ideaId: {
            userId,
            ideaId,
          },
        },
      });

      return Ok(undefined);
    } catch (error) {
      return Err(new InternalError('Failed to delete idea upvote', {
        userId,
        ideaId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Check if a user has upvoted an idea
   * @param userId - User ID to check
   * @param ideaId - Idea ID to check
   * @returns Result with boolean indicating if upvote exists
   */
  async hasUpvoted(userId: string, ideaId: string): Promise<Result<boolean, InternalError>> {
    try {
      const upvote = await this.db.ideaUpvote.findUnique({
        where: {
          userId_ideaId: {
            userId,
            ideaId,
          },
        },
      });

      return Ok(upvote !== null);
    } catch (error) {
      return Err(new InternalError('Failed to check idea upvote existence', {
        userId,
        ideaId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get total upvote count for an idea
   * @param ideaId - Idea ID to count upvotes for
   * @returns Result with upvote count or InternalError
   */
  async getUpvoteCount(ideaId: string): Promise<Result<number, InternalError>> {
    try {
      const count = await this.db.ideaUpvote.count({
        where: { ideaId },
      });

      return Ok(count);
    } catch (error) {
      return Err(new InternalError('Failed to get upvote count for idea', {
        ideaId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}
