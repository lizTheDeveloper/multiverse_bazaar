/**
 * Business logic layer for Collaborators module.
 * Handles invitation workflows, authorization, and collaboration management.
 */

import crypto from 'crypto';
import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { CollaboratorRepository } from './repository.js';
import { AuthRepository } from '../auth/repository.js';
import {
  Collaborator,
  CollaboratorRole,
  InviteCollaboratorResponse,
  AcceptInvitationResponse,
  InvitationDetails,
} from './types.js';
import { Logger } from '../../infra/logger.js';

/**
 * Service for collaborator operations
 * Handles invitation workflows and collaboration management
 */
export class CollaboratorService {
  constructor(
    private readonly repository: CollaboratorRepository,
    private readonly authRepository: AuthRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Get all collaborators for a project
   *
   * @param projectId - Project ID
   * @returns Result with array of collaborators or BaseError
   */
  async getProjectCollaborators(projectId: string): Promise<Result<Collaborator[], BaseError>> {
    try {
      const result = await this.repository.findByProjectId(projectId);

      if (!isOk(result)) {
        return Err(result.error);
      }

      return Ok(result.value);
    } catch (error) {
      this.logger.error({ error, projectId }, 'Unexpected error getting project collaborators');
      return Err(
        new InternalError('An unexpected error occurred while fetching collaborators', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Invite a collaborator to a project
   * If user exists internally, add them directly
   * If user is external, create a pending invitation
   *
   * @param inviterId - ID of user sending the invitation (must be project creator)
   * @param projectId - Project ID
   * @param email - Email of user to invite
   * @param role - Role for the new collaborator
   * @returns Result with invitation response or BaseError
   */
  async invite(
    inviterId: string,
    projectId: string,
    email: string,
    role: CollaboratorRole
  ): Promise<Result<InviteCollaboratorResponse, BaseError>> {
    try {
      // Check that inviter is the project creator
      const inviterRoleResult = await this.repository.findRole(projectId, inviterId);

      if (!isOk(inviterRoleResult)) {
        this.logger.warn({ inviterId, projectId }, 'User is not a collaborator on project');
        return Err(new ForbiddenError('You are not a collaborator on this project'));
      }

      if (inviterRoleResult.value !== CollaboratorRole.CREATOR) {
        this.logger.warn({ inviterId, projectId, role: inviterRoleResult.value }, 'Only creator can invite collaborators');
        return Err(new ForbiddenError('Only the project creator can invite collaborators'));
      }

      // Prevent inviting a CREATOR (only one creator per project)
      if (role === CollaboratorRole.CREATOR) {
        this.logger.warn({ projectId, role }, 'Cannot invite another creator');
        return Err(new ValidationError('Cannot invite another creator. A project can only have one creator.'));
      }

      // Check if user exists internally
      const userResult = await this.authRepository.findUserByEmail(email);

      if (isOk(userResult)) {
        // User exists internally - add them directly
        const user = userResult.value;

        // Check if user is already a collaborator
        const existingCollaboratorResult = await this.repository.findRole(projectId, user.id);
        if (isOk(existingCollaboratorResult)) {
          return Err(new ConflictError('User is already a collaborator on this project'));
        }

        // Add collaborator
        const addResult = await this.repository.add(projectId, user.id, role);

        if (!isOk(addResult)) {
          return Err(addResult.error);
        }

        this.logger.info({ projectId, userId: user.id, role }, 'Internal user added as collaborator');

        return Ok({
          immediate: true,
          collaborator: addResult.value,
        });
      }

      // User doesn't exist internally - create pending invitation
      // First check if there's already a pending invitation
      const existingInviteResult = await this.repository.findPendingInvitationByEmail(email, projectId);

      if (isOk(existingInviteResult)) {
        const existing = existingInviteResult.value;
        this.logger.warn({ email, projectId }, 'Invitation already exists');
        return Err(
          new ConflictError(
            'An invitation for this email already exists for this project',
            { expiresAt: existing.expiresAt }
          )
        );
      }

      // Generate secure random token
      const token = crypto.randomUUID();

      // Create pending invitation
      const inviteResult = await this.repository.createPendingInvitation({
        email,
        invitedById: inviterId,
        projectId,
        role,
        token,
      });

      if (!isOk(inviteResult)) {
        return Err(inviteResult.error);
      }

      const invitation = inviteResult.value;

      this.logger.info(
        { email, projectId, role, token, expiresAt: invitation.expiresAt },
        'Pending invitation created for external user'
      );

      return Ok({
        immediate: false,
        invitationToken: invitation.token,
        expiresAt: invitation.expiresAt,
      });
    } catch (error) {
      this.logger.error({ error, inviterId, projectId, email }, 'Unexpected error inviting collaborator');
      return Err(
        new InternalError('An unexpected error occurred while inviting collaborator', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Remove a collaborator from a project
   * Only the creator can remove collaborators
   * Creator cannot remove themselves
   *
   * @param userId - ID of user performing the removal (must be creator)
   * @param projectId - Project ID
   * @param targetUserId - ID of user to remove
   * @returns Result with void or BaseError
   */
  async remove(
    userId: string,
    projectId: string,
    targetUserId: string
  ): Promise<Result<void, BaseError>> {
    try {
      // Check that user is the project creator
      const userRoleResult = await this.repository.findRole(projectId, userId);

      if (!isOk(userRoleResult)) {
        this.logger.warn({ userId, projectId }, 'User is not a collaborator on project');
        return Err(new ForbiddenError('You are not a collaborator on this project'));
      }

      if (userRoleResult.value !== CollaboratorRole.CREATOR) {
        this.logger.warn({ userId, projectId, role: userRoleResult.value }, 'Only creator can remove collaborators');
        return Err(new ForbiddenError('Only the project creator can remove collaborators'));
      }

      // Creator cannot remove themselves
      if (userId === targetUserId) {
        this.logger.warn({ userId, projectId }, 'Creator cannot remove themselves');
        return Err(new ForbiddenError('Creator cannot remove themselves from the project'));
      }

      // Remove the collaborator
      const removeResult = await this.repository.remove(projectId, targetUserId);

      if (!isOk(removeResult)) {
        return Err(removeResult.error);
      }

      this.logger.info({ projectId, targetUserId, removedBy: userId }, 'Collaborator removed from project');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId, projectId, targetUserId }, 'Unexpected error removing collaborator');
      return Err(
        new InternalError('An unexpected error occurred while removing collaborator', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Accept a collaboration invitation
   * Validates the token, checks expiration, and adds user as collaborator
   * For external users who don't have an account yet, this may need to be
   * called after account creation
   *
   * @param token - Invitation token
   * @param userId - Optional user ID (for users who already have accounts)
   * @returns Result with acceptance response or BaseError
   */
  async acceptInvitation(
    token: string,
    userId?: string
  ): Promise<Result<AcceptInvitationResponse, BaseError>> {
    try {
      // Get invitation details
      const invitationResult = await this.repository.findPendingInvitationByToken(token);

      if (!isOk(invitationResult)) {
        this.logger.warn({ token }, 'Invitation not found');
        return Err(new NotFoundError('Invitation'));
      }

      const invitation = invitationResult.value;

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        this.logger.warn({ token, expiresAt: invitation.expiresAt }, 'Invitation has expired');
        return Err(new ValidationError('This invitation has expired'));
      }

      // If userId is provided, verify the email matches
      if (userId) {
        const userResult = await this.authRepository.findUserById(userId);

        if (!isOk(userResult)) {
          return Err(new NotFoundError('User'));
        }

        const user = userResult.value;

        // Verify email matches invitation
        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
          this.logger.warn(
            { userId, userEmail: user.email, invitationEmail: invitation.email },
            'User email does not match invitation email'
          );
          return Err(new ForbiddenError('This invitation is for a different email address'));
        }

        // Add user as collaborator
        const addResult = await this.repository.add(invitation.projectId, userId, invitation.role);

        if (!isOk(addResult)) {
          // If already a collaborator, that's ok - just mark invitation as accepted
          if (addResult.error instanceof ConflictError) {
            this.logger.info({ userId, projectId: invitation.projectId }, 'User already a collaborator');
          } else {
            return Err(addResult.error);
          }
        }

        // Mark invitation as accepted
        const acceptResult = await this.repository.acceptInvitation(token);

        if (!isOk(acceptResult)) {
          this.logger.error({ token, error: acceptResult.error }, 'Failed to mark invitation as accepted');
          // Don't fail the whole operation if we can't mark it accepted
        }

        // Get the collaborator record with user details
        const collaboratorsResult = await this.repository.findByProjectId(invitation.projectId);

        if (!isOk(collaboratorsResult)) {
          return Err(collaboratorsResult.error);
        }

        const collaborator = collaboratorsResult.value.find((c) => c.userId === userId);

        if (!collaborator) {
          return Err(new InternalError('Failed to fetch collaborator after acceptance'));
        }

        this.logger.info(
          { userId, projectId: invitation.projectId, role: invitation.role },
          'Invitation accepted and user added as collaborator'
        );

        return Ok({
          collaborator,
          project: {
            id: invitation.projectId,
            title: invitation.projectTitle,
          },
        });
      }

      // No userId provided - external user needs to create account first
      this.logger.info({ token, email: invitation.email }, 'Valid invitation - user needs to create account');
      return Err(
        new ValidationError(
          'Please create an account or log in to accept this invitation',
          undefined,
          { requiresAuth: true, email: invitation.email }
        )
      );
    } catch (error) {
      this.logger.error({ error, token }, 'Unexpected error accepting invitation');
      return Err(
        new InternalError('An unexpected error occurred while accepting invitation', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Decline a collaboration invitation
   *
   * @param token - Invitation token
   * @returns Result with void or BaseError
   */
  async declineInvitation(token: string): Promise<Result<void, BaseError>> {
    try {
      // Verify invitation exists and is not expired
      const invitationResult = await this.repository.findPendingInvitationByToken(token);

      if (!isOk(invitationResult)) {
        this.logger.warn({ token }, 'Invitation not found');
        return Err(new NotFoundError('Invitation'));
      }

      const invitation = invitationResult.value;

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        this.logger.warn({ token, expiresAt: invitation.expiresAt }, 'Invitation has expired');
        return Err(new ValidationError('This invitation has expired'));
      }

      // Mark invitation as declined
      const declineResult = await this.repository.declineInvitation(token);

      if (!isOk(declineResult)) {
        return Err(declineResult.error);
      }

      this.logger.info({ token, email: invitation.email, projectId: invitation.projectId }, 'Invitation declined');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, token }, 'Unexpected error declining invitation');
      return Err(
        new InternalError('An unexpected error occurred while declining invitation', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get invitation details by token
   * Public method for viewing invitation before accepting/declining
   *
   * @param token - Invitation token
   * @returns Result with invitation details or BaseError
   */
  async getInvitation(token: string): Promise<Result<InvitationDetails, BaseError>> {
    try {
      const result = await this.repository.findPendingInvitationByToken(token);

      if (!isOk(result)) {
        this.logger.warn({ token }, 'Invitation not found');
        return Err(new NotFoundError('Invitation'));
      }

      const invitation = result.value;

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        this.logger.warn({ token, expiresAt: invitation.expiresAt }, 'Invitation has expired');
        return Err(new ValidationError('This invitation has expired'));
      }

      return Ok(invitation);
    } catch (error) {
      this.logger.error({ error, token }, 'Unexpected error getting invitation');
      return Err(
        new InternalError('An unexpected error occurred while fetching invitation', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
