/**
 * Users module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  UserProfile,
  PublicUserProfile,
  UpdateUserRequest,
  PrivacySettings,
  InviteExternalUserRequest,
  UserProject,
} from './types.js';

// Export schemas
export {
  updateUserSchema,
  privacySettingsSchema,
  inviteExternalUserSchema,
} from './schemas.js';
export type {
  ValidatedUpdateUserRequest,
  ValidatedPrivacySettings,
  ValidatedInviteExternalUserRequest,
} from './schemas.js';

// Export service
export { UserService } from './service.js';

// Export repository
export { UserRepository } from './repository.js';

// Export routes factory
export { createUserRoutes } from './routes.js';
