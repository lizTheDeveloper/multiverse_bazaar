/**
 * Type definitions for the Upvotes module.
 * Defines request/response types and internal types for upvote operations.
 */

/**
 * Upvote entity representing a user's upvote on a project
 */
export interface Upvote {
  id: string;
  userId: string;
  projectId: string;
  createdAt: Date;
}

/**
 * Response for upvote/remove upvote operations
 * Indicates current upvote status and total count
 */
export interface UpvoteResponse {
  upvoted: boolean;
  count: number;
}

/**
 * Project upvote statistics
 * Includes total count and whether the current user has upvoted
 */
export interface ProjectUpvoteStats {
  projectId: string;
  count: number;
  hasUpvoted: boolean;
}
