/**
 * Type definitions for the Users module.
 * Defines user profile types, update requests, and privacy settings.
 */

/**
 * Full user profile with all fields
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
 * Public user profile respecting privacy settings
 * Email only shown if showEmailOnProfile is true
 */
export interface PublicUserProfile {
  id: string;
  email?: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  karma: number;
  createdAt: Date;
}

/**
 * Request payload for updating user profile
 */
export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string;
  bio?: string;
}

/**
 * User privacy settings
 */
export interface PrivacySettings {
  showEmailOnProfile: boolean;
  includeInSearch: boolean;
  showActivityPublicly: boolean;
}

/**
 * Request payload for inviting external user to collaborate
 */
export interface InviteExternalUserRequest {
  email: string;
  projectId: string;
  role: 'CONTRIBUTOR' | 'ADVISOR';
}

/**
 * Project information for user's collaborations
 */
export interface UserProject {
  id: string;
  title: string;
  description: string;
  url: string | null;
  imageUrl: string | null;
  status: string;
  role: string;
  createdAt: Date;
}
