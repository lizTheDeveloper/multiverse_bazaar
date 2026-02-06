/**
 * Business logic layer for Projects module.
 * Handles project operations with authorization checks.
 */

import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  ForbiddenError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { ProjectRepository } from './repository.js';
import {
  ProjectDetailed,
  ProjectWithUpvotes,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListQuery,
  ProjectListResponse,
} from './types.js';
import { Logger } from '../../infra/logger.js';

/**
 * Service for project operations
 * Handles business logic and authorization for projects
 */
export class ProjectService {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Create a new project
   * The creating user automatically becomes the project creator
   *
   * @param userId - ID of user creating the project
   * @param data - Project creation data
   * @returns Result with created project or BaseError
   */
  async create(
    userId: string,
    data: CreateProjectRequest
  ): Promise<Result<ProjectWithUpvotes, BaseError>> {
    try {
      this.logger.info({ userId, title: data.title }, 'Creating new project');

      const result = await this.repository.create(data, userId);

      if (!isOk(result)) {
        this.logger.error({ userId, error: result.error.message }, 'Failed to create project');
        return Err(result.error);
      }

      const project = result.value;

      this.logger.info({ userId, projectId: project.id }, 'Project created successfully');

      // Return project with upvote info (new projects have no upvotes)
      return Ok({
        ...project,
        upvoteCount: 0,
        hasUpvoted: false,
      });
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error during project creation');
      return Err(
        new InternalError('An unexpected error occurred while creating project', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get a project by ID with upvote information
   * If currentUserId is provided, includes whether that user has upvoted
   *
   * @param id - Project ID
   * @param currentUserId - Optional ID of current user (for upvote status)
   * @returns Result with project details or BaseError
   */
  async getById(
    id: string,
    currentUserId?: string
  ): Promise<Result<ProjectDetailed, BaseError>> {
    try {
      this.logger.info({ projectId: id, currentUserId }, 'Fetching project by ID');

      // Get project with collaborators
      const projectResult = await this.repository.findByIdWithCollaborators(id);

      if (!isOk(projectResult)) {
        this.logger.warn({ projectId: id }, 'Project not found');
        return Err(projectResult.error);
      }

      const project = projectResult.value;

      // Get upvote count
      const upvoteCountResult = await this.repository.getUpvoteCount(id);
      const upvoteCount = isOk(upvoteCountResult) ? upvoteCountResult.value : 0;

      // Check if current user has upvoted
      let hasUpvoted = false;
      if (currentUserId) {
        const upvotedResult = await this.repository.hasUserUpvoted(id, currentUserId);
        hasUpvoted = isOk(upvotedResult) ? upvotedResult.value : false;
      }

      this.logger.info({ projectId: id, upvoteCount }, 'Project fetched successfully');

      return Ok({
        ...project,
        upvoteCount,
        hasUpvoted,
      });
    } catch (error) {
      this.logger.error({ error, projectId: id }, 'Unexpected error fetching project');
      return Err(
        new InternalError('An unexpected error occurred while fetching project', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update a project
   * Only the project creator can update the project
   *
   * @param userId - ID of user attempting to update
   * @param projectId - Project ID to update
   * @param data - Update data
   * @returns Result with updated project or BaseError
   */
  async update(
    userId: string,
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<Result<ProjectWithUpvotes, BaseError>> {
    try {
      this.logger.info({ userId, projectId }, 'Attempting to update project');

      // Check if user is the creator
      const isCreatorResult = await this.repository.isUserCreator(projectId, userId);

      if (!isOk(isCreatorResult)) {
        this.logger.error(
          { userId, projectId, error: isCreatorResult.error.message },
          'Failed to check creator status'
        );
        return Err(isCreatorResult.error);
      }

      if (!isCreatorResult.value) {
        this.logger.warn({ userId, projectId }, 'User is not the project creator');
        return Err(new ForbiddenError('Only the project creator can update the project'));
      }

      // Update the project
      const updateResult = await this.repository.update(projectId, data);

      if (!isOk(updateResult)) {
        this.logger.error(
          { userId, projectId, error: updateResult.error.message },
          'Failed to update project'
        );
        return Err(updateResult.error);
      }

      const project = updateResult.value;

      // Get upvote information
      const upvoteCountResult = await this.repository.getUpvoteCount(projectId);
      const upvoteCount = isOk(upvoteCountResult) ? upvoteCountResult.value : 0;

      const hasUpvotedResult = await this.repository.hasUserUpvoted(projectId, userId);
      const hasUpvoted = isOk(hasUpvotedResult) ? hasUpvotedResult.value : false;

      this.logger.info({ userId, projectId }, 'Project updated successfully');

      return Ok({
        ...project,
        upvoteCount,
        hasUpvoted,
      });
    } catch (error) {
      this.logger.error({ error, userId, projectId }, 'Unexpected error updating project');
      return Err(
        new InternalError('An unexpected error occurred while updating project', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete a project
   * Only the project creator can delete the project
   *
   * @param userId - ID of user attempting to delete
   * @param projectId - Project ID to delete
   * @returns Result with void or BaseError
   */
  async delete(userId: string, projectId: string): Promise<Result<void, BaseError>> {
    try {
      this.logger.info({ userId, projectId }, 'Attempting to delete project');

      // Check if user is the creator
      const isCreatorResult = await this.repository.isUserCreator(projectId, userId);

      if (!isOk(isCreatorResult)) {
        this.logger.error(
          { userId, projectId, error: isCreatorResult.error.message },
          'Failed to check creator status'
        );
        return Err(isCreatorResult.error);
      }

      if (!isCreatorResult.value) {
        this.logger.warn({ userId, projectId }, 'User is not the project creator');
        return Err(new ForbiddenError('Only the project creator can delete the project'));
      }

      // Delete the project
      const deleteResult = await this.repository.delete(projectId);

      if (!isOk(deleteResult)) {
        this.logger.error(
          { userId, projectId, error: deleteResult.error.message },
          'Failed to delete project'
        );
        return Err(deleteResult.error);
      }

      this.logger.info({ userId, projectId }, 'Project deleted successfully');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId, projectId }, 'Unexpected error deleting project');
      return Err(
        new InternalError('An unexpected error occurred while deleting project', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * List projects with pagination and filters
   * If currentUserId is provided, includes upvote status for each project
   *
   * @param query - Query parameters for filtering and pagination
   * @param currentUserId - Optional ID of current user (for upvote status)
   * @returns Result with paginated project list or BaseError
   */
  async list(
    query: ProjectListQuery,
    currentUserId?: string
  ): Promise<Result<ProjectListResponse, BaseError>> {
    try {
      this.logger.info({ query, currentUserId }, 'Listing projects');

      const page = query.page || 1;
      const limit = query.limit || 20;

      // Get projects from repository
      const listResult = await this.repository.list(query);

      if (!isOk(listResult)) {
        this.logger.error({ query, error: listResult.error.message }, 'Failed to list projects');
        return Err(listResult.error);
      }

      const { projects, total } = listResult.value;

      // Enrich each project with upvote information
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          // Get upvote count
          const upvoteCountResult = await this.repository.getUpvoteCount(project.id);
          const upvoteCount = isOk(upvoteCountResult) ? upvoteCountResult.value : 0;

          // Check if current user has upvoted
          let hasUpvoted = false;
          if (currentUserId) {
            const upvotedResult = await this.repository.hasUserUpvoted(project.id, currentUserId);
            hasUpvoted = isOk(upvotedResult) ? upvotedResult.value : false;
          }

          return {
            ...project,
            upvoteCount,
            hasUpvoted,
          };
        })
      );

      const totalPages = Math.ceil(total / limit);

      this.logger.info({ total, page, limit, totalPages }, 'Projects listed successfully');

      return Ok({
        projects: enrichedProjects,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      this.logger.error({ error, query }, 'Unexpected error listing projects');
      return Err(
        new InternalError('An unexpected error occurred while listing projects', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
