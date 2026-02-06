/**
 * Type definitions for the Authentication module.
 * Defines request/response types and internal types for auth operations.
 */

/**
 * User profile returned in authentication responses
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  karma: number;
  createdAt: Date;
}

/**
 * Login request payload
 * Password-based authentication
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request payload
 * Creates a new user account with password
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

/**
 * Login response with access token and user profile
 */
export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

/**
 * Refresh token request payload
 * Token is extracted from HTTP-only cookie, so request body is empty
 */
export interface RefreshRequest {
  // Empty - refresh token comes from cookie
}

/**
 * Refresh token response with new access token
 */
export interface RefreshResponse {
  accessToken: string;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Authenticated user information attached to request context
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}
