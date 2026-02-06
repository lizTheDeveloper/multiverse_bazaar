/**
 * Data access layer for Users module.
 * Handles all database operations related to user profiles and privacy.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError } from '@multiverse-bazaar/shared';
import { UserProfile, PublicUserProfile, PrivacySettings, UpdateUserRequest, UserProject } from './types.js';

/**
 * Repository for user-related database operations
 */
export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns Result with user profile or NotFoundError
   */
  async findById(id: string): Promise<Result<UserProfile, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          karma: true,
          createdAt: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      return Ok(user);
    } catch (error) {
      return Err(new InternalError('Failed to find user by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Find a user by email address
   * @param email - User's email address
   * @returns Result with user profile or NotFoundError
   */
  async findByEmail(email: string): Promise<Result<UserProfile, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.findUnique({
        where: { email, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          karma: true,
          createdAt: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      return Ok(user);
    } catch (error) {
      return Err(new InternalError('Failed to find user by email', {
        email,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Update a user's profile
   * @param id - User ID
   * @param data - Update data
   * @returns Result with updated user profile or error
   */
  async update(
    id: string,
    data: UpdateUserRequest
  ): Promise<Result<UserProfile, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.update({
        where: { id, deletedAt: null },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          karma: true,
          createdAt: true,
        },
      });

      return Ok(user);
    } catch (error) {
      // Check if it's a "record not found" error
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return Err(new NotFoundError('User'));
      }

      return Err(new InternalError('Failed to update user', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get user's privacy settings
   * @param id - User ID
   * @returns Result with privacy settings or error
   */
  async getPrivacySettings(
    id: string
  ): Promise<Result<PrivacySettings, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.findUnique({
        where: { id, deletedAt: null },
        select: {
          showEmailOnProfile: true,
          includeInSearch: true,
          showActivityPublicly: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      return Ok(user);
    } catch (error) {
      return Err(new InternalError('Failed to get privacy settings', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Update user's privacy settings
   * @param id - User ID
   * @param settings - Privacy settings to update
   * @returns Result with updated privacy settings or error
   */
  async updatePrivacySettings(
    id: string,
    settings: PrivacySettings
  ): Promise<Result<PrivacySettings, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.update({
        where: { id, deletedAt: null },
        data: settings,
        select: {
          showEmailOnProfile: true,
          includeInSearch: true,
          showActivityPublicly: true,
        },
      });

      return Ok(user);
    } catch (error) {
      // Check if it's a "record not found" error
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return Err(new NotFoundError('User'));
      }

      return Err(new InternalError('Failed to update privacy settings', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get public profile for a user, respecting privacy settings
   * @param id - User ID
   * @returns Result with public user profile or error
   */
  async getPublicProfile(
    id: string
  ): Promise<Result<PublicUserProfile, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          karma: true,
          createdAt: true,
          showEmailOnProfile: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      // Build public profile respecting privacy settings
      const publicProfile: PublicUserProfile = {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        karma: user.karma,
        createdAt: user.createdAt,
      };

      // Only include email if user has opted to show it
      if (user.showEmailOnProfile) {
        publicProfile.email = user.email;
      }

      return Ok(publicProfile);
    } catch (error) {
      return Err(new InternalError('Failed to get public profile', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get all projects a user is collaborating on
   * @param id - User ID
   * @returns Result with array of user projects or error
   */
  async getUserProjects(id: string): Promise<Result<UserProject[], InternalError>> {
    try {
      const collaborations = await this.db.collaborator.findMany({
        where: {
          userId: id,
          project: {
            // Only include non-deleted projects (if we add soft delete to projects)
          },
        },
        select: {
          role: true,
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              imageUrl: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const projects: UserProject[] = collaborations.map((collab) => ({
        id: collab.project.id,
        title: collab.project.title,
        description: collab.project.description,
        url: collab.project.url,
        imageUrl: collab.project.imageUrl,
        status: collab.project.status,
        role: collab.role,
        createdAt: collab.project.createdAt,
      }));

      return Ok(projects);
    } catch (error) {
      return Err(new InternalError('Failed to get user projects', {
        userId: id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Soft delete a user (set deletedAt timestamp)
   * @param id - User ID
   * @returns Result with void or error
   */
  async softDelete(id: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.user.update({
        where: { id, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletionRequestedAt: new Date(),
        },
      });

      return Ok(undefined);
    } catch (error) {
      // Check if it's a "record not found" error
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return Err(new NotFoundError('User'));
      }

      return Err(new InternalError('Failed to soft delete user', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Anonymize user data for GDPR compliance
   * Removes all PII while keeping the user record for referential integrity
   * @param id - User ID
   * @returns Result with void or error
   */
  async anonymize(id: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      const anonymizedEmail = `deleted-${id}@anonymized.local`;

      await this.db.user.update({
        where: { id },
        data: {
          email: anonymizedEmail,
          name: null,
          avatarUrl: null,
          bio: null,
          anonymizedAt: new Date(),
          deletedAt: new Date(),
        },
      });

      return Ok(undefined);
    } catch (error) {
      // Check if it's a "record not found" error
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return Err(new NotFoundError('User'));
      }

      return Err(new InternalError('Failed to anonymize user', {
        id,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}
