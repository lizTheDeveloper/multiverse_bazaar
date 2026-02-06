/**
 * Collaborators module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  Collaborator,
  InviteCollaboratorRequest,
  InviteCollaboratorResponse,
  PendingInvitation,
  InvitationDetails,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  DeclineInvitationRequest,
} from './types.js';

export { CollaboratorRole } from './types.js';

// Export schemas
export {
  inviteCollaboratorSchema,
  acceptInvitationSchema,
  declineInvitationSchema,
  collaboratorRoleSchema,
  uuidParamSchema,
} from './schemas.js';

export type {
  ValidatedInviteCollaboratorRequest,
  ValidatedAcceptInvitationRequest,
  ValidatedDeclineInvitationRequest,
} from './schemas.js';

// Export service
export { CollaboratorService } from './service.js';

// Export repository
export { CollaboratorRepository } from './repository.js';

// Export routes factory
export { createCollaboratorRoutes } from './routes.js';
