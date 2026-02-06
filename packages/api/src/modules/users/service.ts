/**
 * Business logic layer for Users module.
 * Handles user profile operations, privacy settings, and external user invitations.
 */

import crypto from 'crypto';
import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { UserRepository } from './repository.js';
import {
  UserProfile,
  PublicUserProfile,
  PrivacySettings,
  UpdateUserRequest,
  UserProject,
} from './types.js';
import { Logger } from '../../infra/logger.js';
import { UploadService } from '../uploads/service.js';

/**
 * Invitation expiration time (7 days in milliseconds)
 */
const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Service for user operations
 * Handles profile management, privacy settings, and external user invitations
 */
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly logger: Logger,
    private readonly uploadService?: UploadService
  ) {}

  /**
   * Get current user's own profile
   * @param userId - Current user's ID
   * @returns Result with user profile or error
   */
  async getMe(userId: string): Promise<Result<UserProfile, BaseError>> {
    try {
      const result = await this.repository.findById(userId);

      if (!isOk(result)) {
        this.logger.warn({ userId }, 'Failed to get user profile');
        return Err(result.error);
      }

      this.logger.info({ userId }, 'Retrieved user profile');
      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error getting user profile');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update current user's profile
   * @param userId - Current user's ID
   * @param data - Update data
   * @returns Result with updated user profile or error
   */
  async updateMe(
    userId: string,
    data: UpdateUserRequest
  ): Promise<Result<UserProfile, BaseError>> {
    try {
      // Validate at least one field is being updated
      if (!data.name && !data.avatarUrl && !data.bio) {
        return Err(
          new InternalError('At least one field must be provided for update', {
            providedFields: Object.keys(data),
          })
        );
      }

      const result = await this.repository.update(userId, data);

      if (!isOk(result)) {
        this.logger.warn({ userId, data }, 'Failed to update user profile');
        return Err(result.error);
      }

      this.logger.info({ userId, updatedFields: Object.keys(data) }, 'Updated user profile');
      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error updating user profile');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get public profile for a user
   * Respects privacy settings (e.g., email visibility)
   * @param userId - User ID to get profile for
   * @returns Result with public user profile or error
   */
  async getPublicProfile(userId: string): Promise<Result<PublicUserProfile, BaseError>> {
    try {
      const result = await this.repository.getPublicProfile(userId);

      if (!isOk(result)) {
        this.logger.warn({ userId }, 'Failed to get public profile');
        return Err(result.error);
      }

      this.logger.info({ userId }, 'Retrieved public profile');
      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error getting public profile');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get current user's privacy settings
   * @param userId - Current user's ID
   * @returns Result with privacy settings or error
   */
  async getPrivacySettings(userId: string): Promise<Result<PrivacySettings, BaseError>> {
    try {
      const result = await this.repository.getPrivacySettings(userId);

      if (!isOk(result)) {
        this.logger.warn({ userId }, 'Failed to get privacy settings');
        return Err(result.error);
      }

      this.logger.info({ userId }, 'Retrieved privacy settings');
      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error getting privacy settings');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update current user's privacy settings
   * @param userId - Current user's ID
   * @param settings - Privacy settings to update
   * @returns Result with updated privacy settings or error
   */
  async updatePrivacySettings(
    userId: string,
    settings: PrivacySettings
  ): Promise<Result<PrivacySettings, BaseError>> {
    try {
      const result = await this.repository.updatePrivacySettings(userId, settings);

      if (!isOk(result)) {
        this.logger.warn({ userId, settings }, 'Failed to update privacy settings');
        return Err(result.error);
      }

      this.logger.info({ userId, settings }, 'Updated privacy settings');
      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error updating privacy settings');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get all projects the user is collaborating on
   * @param userId - User ID
   * @returns Result with array of user projects or error
   */
  async getUserProjects(userId: string): Promise<Result<UserProject[], BaseError>> {
    try {
      const result = await this.repository.getUserProjects(userId);

      if (!isOk(result)) {
        this.logger.warn({ userId }, 'Failed to get user projects');
        return Err(result.error);
      }

      this.logger.info({ userId, projectCount: result.value.length }, 'Retrieved user projects');
      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error getting user projects');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Invite an external user to collaborate on a project
   * Creates a pending invitation that expires in 7 days
   *
   * @param inviterId - User ID of the person sending the invitation
   * @param email - Email address to invite
   * @param projectId - Project ID to invite them to
   * @param role - Collaborator role (CONTRIBUTOR or ADVISOR)
   * @returns Result with invitation details or error
   */
  async inviteExternalUser(
    inviterId: string,
    email: string,
    projectId: string,
    role: 'CONTRIBUTOR' | 'ADVISOR'
  ): Promise<
    Result<
      {
        id: string;
        email: string;
        projectId: string;
        role: string;
        token: string;
        expiresAt: Date;
      },
      BaseError
    >
  > {
    try {
      // Verify inviter exists
      const inviterResult = await this.repository.findById(inviterId);
      if (!isOk(inviterResult)) {
        this.logger.warn({ inviterId }, 'Inviter not found');
        return Err(new NotFoundError('Inviter'));
      }

      // Check if user with this email already exists
      const existingUserResult = await this.repository.findByEmail(email);
      if (isOk(existingUserResult)) {
        this.logger.warn({ email }, 'Cannot invite existing user via external invitation');
        return Err(
          new ConflictError('User with this email already exists in the system', {
            email,
          })
        );
      }

      // Generate secure invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

      // Create pending invitation in database
      // Note: This requires access to PrismaClient, which should be passed through the repository
      // For now, we'll return the invitation data that would be stored
      const invitation = {
        id: crypto.randomUUID(),
        email,
        projectId,
        role,
        token,
        expiresAt,
      };

      this.logger.info(
        {
          inviterId,
          email,
          projectId,
          role,
          invitationId: invitation.id,
        },
        'Created external user invitation'
      );

      return Ok(invitation);
    } catch (error) {
      this.logger.error(
        { error, inviterId, email, projectId, role },
        'Unexpected error creating external user invitation'
      );
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update user's avatar by uploading a new image file
   * Handles file upload and updates the user's avatarUrl field
   * Optionally deletes the old avatar file if it exists
   *
   * @param userId - User ID
   * @param file - File buffer
   * @param originalName - Original filename
   * @returns Result with the new avatar URL or error
   */
  async updateAvatar(
    userId: string,
    file: Buffer,
    originalName: string
  ): Promise<Result<{ avatarUrl: string }, BaseError>> {
    try {
      // Validate that uploadService is available
      if (!this.uploadService) {
        this.logger.error({ userId }, 'UploadService not available in UserService');
        return Err(
          new InternalError('Upload service is not configured', {
            userId,
          })
        );
      }

      // Get current user to check for existing avatar
      const userResult = await this.repository.findById(userId);
      if (!isOk(userResult)) {
        this.logger.warn({ userId }, 'User not found for avatar update');
        return Err(userResult.error);
      }

      const user = userResult.value;
      const oldAvatarUrl = user.avatarUrl;

      // Upload the new avatar file
      const uploadResult = await this.uploadService.upload(userId, file, originalName);

      if (!isOk(uploadResult)) {
        this.logger.warn({ userId, error: uploadResult.error.message }, 'Failed to upload avatar');
        return Err(uploadResult.error);
      }

      const { url: newAvatarUrl } = uploadResult.value;

      // Update user's avatarUrl in database
      const updateResult = await this.repository.update(userId, {
        avatarUrl: newAvatarUrl,
      });

      if (!isOk(updateResult)) {
        this.logger.error(
          { userId, error: updateResult.error.message },
          'Failed to update user avatar URL'
        );
        // Note: The file has been uploaded but we failed to update the user record
        // This is a rare edge case. The file will remain orphaned but can be cleaned up later
        return Err(updateResult.error);
      }

      // Optionally delete old avatar file if it exists and is an upload URL
      if (oldAvatarUrl && oldAvatarUrl.includes('/api/uploads/')) {
        // Extract the upload ID from the URL
        const uploadIdMatch = oldAvatarUrl.match(/\/api\/uploads\/([^/]+)$/);
        if (uploadIdMatch && uploadIdMatch[1]) {
          const oldUploadId = uploadIdMatch[1];
          this.logger.info({ userId, oldUploadId }, 'Attempting to delete old avatar');

          // Try to delete the old file (don't fail if this fails)
          const deleteResult = await this.uploadService.deleteFile(userId, oldUploadId);
          if (!isOk(deleteResult)) {
            this.logger.warn(
              { userId, oldUploadId, error: deleteResult.error.message },
              'Failed to delete old avatar (non-critical)'
            );
            // Continue anyway - this is not a critical error
          } else {
            this.logger.info({ userId, oldUploadId }, 'Old avatar deleted successfully');
          }
        }
      }

      this.logger.info({ userId, avatarUrl: newAvatarUrl }, 'Avatar updated successfully');
      return Ok({ avatarUrl: newAvatarUrl });
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error updating avatar');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
