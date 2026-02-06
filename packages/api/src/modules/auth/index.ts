/**
 * Authentication module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  TokenPayload,
  AuthenticatedUser,
  UserProfile,
} from './types.js';

// Export schemas
export { loginSchema, refreshSchema } from './schemas.js';
export type { ValidatedLoginRequest, ValidatedRefreshRequest } from './schemas.js';

// Export service
export { AuthService } from './service.js';

// Export repository
export { AuthRepository } from './repository.js';

// Export middleware
export { authMiddleware, optionalAuthMiddleware } from './middleware.js';
export type { AuthVariables } from './middleware.js';

// Export routes factory
export { createAuthRoutes } from './routes.js';
