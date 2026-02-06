/**
 * Data access layer for Projects module.
 * Handles all database operations related to projects.
 */

import { PrismaClient, ProjectStatus, CollaboratorRole } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError } from '@multiverse-bazaar/shared';
import {
  Project,
  ProjectWithCollaborators,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListQuery,
} from './types.js';
import { decodeCursor } from '../../shared/pagination.js';

/**
 * Repository for project-related database operations
 */
export class ProjectRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new project and add the creator as a collaborator with CREATOR role
   * Uses a transaction to ensure atomicity
   *
   * @param data - Project creation data
   * @param creatorId - ID of the user creating the project
   * @returns Result with created project or InternalError
   */
  async create(
    data: CreateProjectRequest,
    creatorId: string
  ): Promise<Result<Project, InternalError>> {
    try {
      const project = await this.db.$transaction(async (tx) => {
        // Create the project
        const newProject = await tx.project.create({
          data: {
            title: data.title,
            description: data.description,
            url: data.url || null,
            repoUrl: data.repoUrl || null,
            imageUrl: data.imageUrl || null,
            status: data.status || ProjectStatus.BUILDING,
          },
        });

        // Add creator as a collaborator with CREATOR role
        await tx.collaborator.create({
          data: {
            userId: creatorId,
            projectId: newProject.id,
            role: CollaboratorRole.CREATOR,
          },
        });

        return newProject;
      });

      return Ok(project);
    } catch (error) {
      return Err(
        new InternalError('Failed to create project', {
          data,
          creatorId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a project by ID
   *
   * @param id - Project ID
   * @returns Result with project or NotFoundError
   */
  async findById(id: string): Promise<Result<Project, NotFoundError | InternalError>> {
    try {
      const project = await this.db.project.findUnique({
        where: { id },
      });

      if (!project) {
        return Err(new NotFoundError('Project'));
      }

      return Ok(project);
    } catch (error) {
      return Err(
        new InternalError('Failed to find project by ID', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a project by ID with collaborators included
   *
   * @param id - Project ID
   * @returns Result with project and collaborators or NotFoundError
   */
  async findByIdWithCollaborators(
    id: string
  ): Promise<Result<ProjectWithCollaborators, NotFoundError | InternalError>> {
    try {
      const project = await this.db.project.findUnique({
        where: { id },
        include: {
          collaborators: {
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
            orderBy: [
              { role: 'asc' }, // CREATOR first
              { createdAt: 'asc' },
            ],
          },
        },
      });

      if (!project) {
        return Err(new NotFoundError('Project'));
      }

      return Ok(project as ProjectWithCollaborators);
    } catch (error) {
      return Err(
        new InternalError('Failed to find project with collaborators', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update a project
   *
   * @param id - Project ID
   * @param data - Update data
   * @returns Result with updated project or NotFoundError
   */
  async update(
    id: string,
    data: UpdateProjectRequest
  ): Promise<Result<Project, NotFoundError | InternalError>> {
    try {
      const project = await this.db.project.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.url !== undefined && { url: data.url }),
          ...(data.repoUrl !== undefined && { repoUrl: data.repoUrl }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });

      return Ok(project);
    } catch (error) {
      // Check if error is due to project not found
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return Err(new NotFoundError('Project'));
      }

      return Err(
        new InternalError('Failed to update project', {
          id,
          data,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete a project and all related data (collaborators, upvotes, etc.)
   * Cascade deletion is handled by database constraints
   *
   * @param id - Project ID
   * @returns Result with void or NotFoundError
   */
  async delete(id: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.project.delete({
        where: { id },
      });

      return Ok(undefined);
    } catch (error) {
      // Check if error is due to project not found
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return Err(new NotFoundError('Project'));
      }

      return Err(
        new InternalError('Failed to delete project', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * List projects with cursor-based pagination and filters
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Result with array of projects (limit + 1 for hasMore detection) or InternalError
   */
  async list(
    query: ProjectListQuery
  ): Promise<Result<{ projects: Project[] }, InternalError>> {
    try {
      const limit = query.limit || 20;

      // Build where clause based on filters
      const where: any = {};

      if (query.status !== undefined) {
        where.status = query.status;
      }

      if (query.featured !== undefined) {
        where.isFeatured = query.featured;
      }

      if (query.creatorId !== undefined) {
        where.collaborators = {
          some: {
            userId: query.creatorId,
            role: CollaboratorRole.CREATOR,
          },
        };
      }

      // Add cursor-based filtering if cursor is provided
      if (query.cursor) {
        try {
          const cursorData = decodeCursor(query.cursor);
          // Use compound cursor: (createdAt, id) < (cursorDate, cursorId)
          // This ensures stable ordering even when createdAt values are the same
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
      // Order by featured first, then by createdAt DESC, then by id DESC for stable sorting
      const projects = await this.db.project.findMany({
        where,
        take: limit + 1,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      });

      return Ok({ projects });
    } catch (error) {
      return Err(
        new InternalError('Failed to list projects', {
          query,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get the upvote count for a project
   *
   * @param projectId - Project ID
   * @returns Result with upvote count or InternalError
   */
  async getUpvoteCount(projectId: string): Promise<Result<number, InternalError>> {
    try {
      const count = await this.db.upvote.count({
        where: { projectId },
      });

      return Ok(count);
    } catch (error) {
      return Err(
        new InternalError('Failed to get upvote count', {
          projectId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Check if a user has upvoted a project
   *
   * @param projectId - Project ID
   * @param userId - User ID
   * @returns Result with boolean indicating if user upvoted
   */
  async hasUserUpvoted(projectId: string, userId: string): Promise<Result<boolean, InternalError>> {
    try {
      const upvote = await this.db.upvote.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      return Ok(upvote !== null);
    } catch (error) {
      return Err(
        new InternalError('Failed to check user upvote status', {
          projectId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Check if a user is the creator of a project
   *
   * @param projectId - Project ID
   * @param userId - User ID
   * @returns Result with boolean indicating if user is creator
   */
  async isUserCreator(projectId: string, userId: string): Promise<Result<boolean, InternalError>> {
    try {
      const collaborator = await this.db.collaborator.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      return Ok(collaborator !== null && collaborator.role === CollaboratorRole.CREATOR);
    } catch (error) {
      return Err(
        new InternalError('Failed to check if user is creator', {
          projectId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
