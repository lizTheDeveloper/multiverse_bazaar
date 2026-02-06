/**
 * Data access layer for Collaborators module.
 * Handles all database operations related to collaborators and invitations.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError, ConflictError } from '@multiverse-bazaar/shared';
import { Collaborator, PendingInvitation, CollaboratorRole, InvitationDetails } from './types.js';
import { UserProfile } from '../auth/types.js';

/**
 * Repository for collaborator-related database operations
 */
export class CollaboratorRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Find all collaborators for a project
   * @param projectId - Project ID
   * @returns Result with array of collaborators or InternalError
   */
  async findByProjectId(projectId: string): Promise<Result<Collaborator[], InternalError>> {
    try {
      const collaborators = await this.db.collaborator.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              bio: true,
              karma: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // CREATOR first, then CONTRIBUTOR, then ADVISOR
          { createdAt: 'asc' },
        ],
      });

      const mapped: Collaborator[] = collaborators.map((c) => ({
        id: c.id,
        userId: c.userId,
        projectId: c.projectId,
        role: c.role as CollaboratorRole,
        createdAt: c.createdAt,
        user: c.user as UserProfile,
      }));

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to find collaborators by project ID', {
          projectId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find all collaborations for a user
   * @param userId - User ID
   * @returns Result with array of collaborators or InternalError
   */
  async findByUserId(userId: string): Promise<Result<Collaborator[], InternalError>> {
    try {
      const collaborators = await this.db.collaborator.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              bio: true,
              karma: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      const mapped: Collaborator[] = collaborators.map((c) => ({
        id: c.id,
        userId: c.userId,
        projectId: c.projectId,
        role: c.role as CollaboratorRole,
        createdAt: c.createdAt,
        user: c.user as UserProfile,
      }));

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to find collaborators by user ID', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Add a collaborator to a project
   * @param projectId - Project ID
   * @param userId - User ID
   * @param role - Collaborator role
   * @returns Result with created collaborator or error
   */
  async add(
    projectId: string,
    userId: string,
    role: CollaboratorRole
  ): Promise<Result<Collaborator, ConflictError | InternalError>> {
    try {
      const collaborator = await this.db.collaborator.create({
        data: {
          projectId,
          userId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              bio: true,
              karma: true,
              createdAt: true,
            },
          },
        },
      });

      const mapped: Collaborator = {
        id: collaborator.id,
        userId: collaborator.userId,
        projectId: collaborator.projectId,
        role: collaborator.role as CollaboratorRole,
        createdAt: collaborator.createdAt,
        user: collaborator.user as UserProfile,
      };

      return Ok(mapped);
    } catch (error: any) {
      // Check for unique constraint violation (user already a collaborator)
      if (error.code === 'P2002') {
        return Err(new ConflictError('User is already a collaborator on this project'));
      }

      return Err(
        new InternalError('Failed to add collaborator', {
          projectId,
          userId,
          role,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Remove a collaborator from a project
   * @param projectId - Project ID
   * @param userId - User ID
   * @returns Result with void or error
   */
  async remove(
    projectId: string,
    userId: string
  ): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.collaborator.delete({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      return Ok(undefined);
    } catch (error: any) {
      // Check for record not found
      if (error.code === 'P2025') {
        return Err(new NotFoundError('Collaborator'));
      }

      return Err(
        new InternalError('Failed to remove collaborator', {
          projectId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a user's role on a project
   * @param projectId - Project ID
   * @param userId - User ID
   * @returns Result with role or NotFoundError if not a collaborator
   */
  async findRole(
    projectId: string,
    userId: string
  ): Promise<Result<CollaboratorRole, NotFoundError | InternalError>> {
    try {
      const collaborator = await this.db.collaborator.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!collaborator) {
        return Err(new NotFoundError('Collaborator'));
      }

      return Ok(collaborator.role as CollaboratorRole);
    } catch (error) {
      return Err(
        new InternalError('Failed to find collaborator role', {
          projectId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Create a pending invitation for an external user
   * @param data - Invitation data
   * @returns Result with created invitation or InternalError
   */
  async createPendingInvitation(data: {
    email: string;
    invitedById: string;
    projectId: string;
    role: CollaboratorRole;
    token: string;
  }): Promise<Result<PendingInvitation, InternalError>> {
    try {
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const invitation = await this.db.pendingInvitation.create({
        data: {
          email: data.email,
          invitedById: data.invitedById,
          projectId: data.projectId,
          role: data.role,
          token: data.token,
          expiresAt,
        },
      });

      const mapped: PendingInvitation = {
        id: invitation.id,
        email: invitation.email,
        projectId: invitation.projectId,
        role: invitation.role as CollaboratorRole,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        acceptedAt: invitation.acceptedAt,
        declinedAt: invitation.declinedAt,
      };

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to create pending invitation', {
          email: data.email,
          projectId: data.projectId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a pending invitation by token
   * @param token - Invitation token
   * @returns Result with invitation details or NotFoundError
   */
  async findPendingInvitationByToken(
    token: string
  ): Promise<Result<InvitationDetails, NotFoundError | InternalError>> {
    try {
      const invitation = await this.db.pendingInvitation.findUnique({
        where: { token },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!invitation) {
        return Err(new NotFoundError('Invitation'));
      }

      const mapped: InvitationDetails = {
        id: invitation.id,
        email: invitation.email,
        projectId: invitation.projectId,
        projectTitle: invitation.project.title,
        role: invitation.role as CollaboratorRole,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        inviterName: invitation.invitedBy.name,
        inviterEmail: invitation.invitedBy.email,
      };

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to find pending invitation by token', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a pending invitation by email and project
   * Used to check if an invitation already exists
   * @param email - Email address
   * @param projectId - Project ID
   * @returns Result with invitation or NotFoundError
   */
  async findPendingInvitationByEmail(
    email: string,
    projectId: string
  ): Promise<Result<PendingInvitation, NotFoundError | InternalError>> {
    try {
      const invitation = await this.db.pendingInvitation.findFirst({
        where: {
          email,
          projectId,
          acceptedAt: null,
          declinedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!invitation) {
        return Err(new NotFoundError('Invitation'));
      }

      const mapped: PendingInvitation = {
        id: invitation.id,
        email: invitation.email,
        projectId: invitation.projectId,
        role: invitation.role as CollaboratorRole,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        acceptedAt: invitation.acceptedAt,
        declinedAt: invitation.declinedAt,
      };

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to find pending invitation by email', {
          email,
          projectId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Mark an invitation as accepted
   * @param token - Invitation token
   * @returns Result with void or error
   */
  async acceptInvitation(token: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.pendingInvitation.update({
        where: { token },
        data: { acceptedAt: new Date() },
      });

      return Ok(undefined);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return Err(new NotFoundError('Invitation'));
      }

      return Err(
        new InternalError('Failed to accept invitation', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Mark an invitation as declined
   * @param token - Invitation token
   * @returns Result with void or error
   */
  async declineInvitation(token: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.pendingInvitation.update({
        where: { token },
        data: { declinedAt: new Date() },
      });

      return Ok(undefined);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return Err(new NotFoundError('Invitation'));
      }

      return Err(
        new InternalError('Failed to decline invitation', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete expired invitations
   * Cleanup job to remove old invitations
   * @returns Result with count of deleted invitations or InternalError
   */
  async cleanupExpiredInvitations(): Promise<Result<number, InternalError>> {
    try {
      const result = await this.db.pendingInvitation.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          acceptedAt: null,
          declinedAt: null,
        },
      });

      return Ok(result.count);
    } catch (error) {
      return Err(
        new InternalError('Failed to cleanup expired invitations', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
