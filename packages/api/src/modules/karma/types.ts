/**
 * Type definitions for the Karma module.
 * Defines karma calculation types, role multipliers, and constants.
 */

import { CollaboratorRole } from '@prisma/client';

/**
 * Role multipliers for karma calculation
 * Each role contributes differently to a user's karma
 */
export const ROLE_MULTIPLIERS: Record<CollaboratorRole, number> = {
  CREATOR: 1.0,
  CONTRIBUTOR: 0.5,
  ADVISOR: 0.25,
} as const;

/**
 * Featured project bonus for creators
 * Added to karma for each featured project created
 */
export const FEATURED_BONUS = 10;

/**
 * Project contribution details for karma calculation
 * Shows how much karma a user earned from a specific project
 */
export interface ProjectContribution {
  /** Project ID */
  projectId: string;

  /** Project title */
  projectTitle: string;

  /** Number of upvotes the project has received */
  upvotes: number;

  /** User's role on this project */
  role: CollaboratorRole;

  /** Calculated karma contribution from this project (upvotes × role_multiplier) */
  contribution: number;
}

/**
 * Detailed breakdown of a user's karma calculation
 * Shows total karma and how it was calculated
 */
export interface KarmaBreakdown {
  /** Total karma for the user */
  total: number;

  /** Total karma earned from project upvotes (sum of all contributions) */
  fromUpvotes: number;

  /** Bonus karma earned from featured projects created */
  fromFeatured: number;

  /** Detailed breakdown by project */
  byProject: ProjectContribution[];
}

/**
 * User collaboration with project details
 * Used internally for karma calculation
 */
export interface UserCollaboration {
  /** Collaboration ID */
  id: string;

  /** User ID */
  userId: string;

  /** Project ID */
  projectId: string;

  /** User's role on the project */
  role: CollaboratorRole;

  /** Project details */
  project: {
    id: string;
    title: string;
    isFeatured: boolean;
  };
}

/**
 * Project upvote count
 * Used for batch fetching upvote counts
 */
export interface ProjectUpvoteCount {
  /** Project ID */
  projectId: string;

  /** Number of upvotes */
  count: number;
}

/**
 * Result of recalculating karma for multiple users
 * Maps user IDs to their new karma values
 */
export type KarmaRecalculationResult = Record<string, number>;
