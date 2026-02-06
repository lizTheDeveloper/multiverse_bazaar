/**
 * Type definitions for the Ideas module.
 * Defines request/response types and internal types for idea operations.
 */

import { IdeaStatus } from '@prisma/client';

/**
 * User profile information embedded in idea responses
 */
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

/**
 * Base idea entity
 */
export interface Idea {
  id: string;
  title: string;
  description: string;
  lookingFor: string;
  creatorId: string;
  status: IdeaStatus;
  graduatedToProjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Idea upvote entity representing a user's upvote on an idea
 */
export interface IdeaUpvote {
  id: string;
  userId: string;
  ideaId: string;
  createdAt: Date;
}

/**
 * Idea with creator profile included
 */
export interface IdeaWithCreator extends Idea {
  creator: UserProfile;
  upvoteCount?: number;
  hasUpvoted?: boolean;
}

/**
 * Interest information on an idea
 */
export interface IdeaInterest {
  id: string;
  userId: string;
  ideaId: string;
  message: string | null;
  createdAt: Date;
  user: UserProfile;
}

/**
 * Idea with interests array and user profiles
 */
export interface IdeaWithInterests extends IdeaWithCreator {
  interests: IdeaInterest[];
}

/**
 * Create idea request payload
 */
export interface CreateIdeaRequest {
  title: string;
  description: string;
  lookingFor: string;
}

/**
 * Update idea request payload
 * All fields are optional
 */
export interface UpdateIdeaRequest {
  title?: string;
  description?: string;
  lookingFor?: string;
  status?: IdeaStatus;
}

/**
 * Express interest request payload
 */
export interface ExpressInterestRequest {
  message?: string;
}

/**
 * Graduate idea request payload
 * Either provide projectId to link existing project, or it will auto-create
 */
export interface GraduateIdeaRequest {
  projectId?: string;
}

/**
 * Response for upvote/remove upvote operations on ideas
 * Indicates current upvote status and total count
 */
export interface IdeaUpvoteResponse {
  upvoted: boolean;
  count: number;
}

/**
 * Query parameters for listing ideas
 */
export interface IdeaListQuery {
  cursor?: string;
  limit?: number;
  status?: IdeaStatus;
  creatorId?: string;
}

/**
 * Cursor-based paginated idea list response
 */
export interface IdeaListResponse {
  ideas: IdeaWithCreator[];
  nextCursor: string | null;
  hasMore: boolean;
}
