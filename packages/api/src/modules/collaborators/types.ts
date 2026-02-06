/**
 * Type definitions for the Collaborators module.
 * Defines request/response types and internal types for collaboration operations.
 */

import { UserProfile } from '../auth/types.js';

/**
 * Collaborator role enum
 * Matches the database CollaboratorRole enum
 */
export enum CollaboratorRole {
  CREATOR = 'CREATOR',
  CONTRIBUTOR = 'CONTRIBUTOR',
  ADVISOR = 'ADVISOR',
}

/**
 * Collaborator on a project with user profile information
 */
export interface Collaborator {
  id: string;
  userId: string;
  projectId: string;
  role: CollaboratorRole;
  createdAt: Date;
  user: UserProfile;
}

/**
 * Request to invite a collaborator to a project
 */
export interface InviteCollaboratorRequest {
  email: string;
  role: CollaboratorRole;
}

/**
 * Response when inviting a collaborator
 * For internal users, collaborator is added immediately
 * For external users, an invitation is created
 */
export interface InviteCollaboratorResponse {
  /**
   * True if user was added immediately (internal user)
   * False if invitation was sent (external user)
   */
  immediate: boolean;

  /**
   * Collaborator data if added immediately
   */
  collaborator?: Collaborator;

  /**
   * Invitation token for external users
   */
  invitationToken?: string;

  /**
   * Expiration date for the invitation
   */
  expiresAt?: Date;
}

/**
 * Pending invitation for an external collaborator
 */
export interface PendingInvitation {
  id: string;
  email: string;
  projectId: string;
  role: CollaboratorRole;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  declinedAt: Date | null;
}

/**
 * Public view of a pending invitation (without sensitive data)
 */
export interface InvitationDetails {
  id: string;
  email: string;
  projectId: string;
  projectTitle: string;
  role: CollaboratorRole;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string | null;
  inviterEmail: string;
}

/**
 * Request to accept an invitation
 */
export interface AcceptInvitationRequest {
  token: string;
}

/**
 * Response after accepting an invitation
 */
export interface AcceptInvitationResponse {
  collaborator: Collaborator;
  project: {
    id: string;
    title: string;
  };
}

/**
 * Request to decline an invitation
 */
export interface DeclineInvitationRequest {
  token: string;
}
