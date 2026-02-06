/**
 * Type definitions for the Projects module.
 * Defines request/response types and internal types for project operations.
 */

import { CollaboratorRole, ProjectStatus } from '@prisma/client';

/**
 * Collaborator information
 */
export interface Collaborator {
  id: string;
  userId: string;
  role: CollaboratorRole;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

/**
 * Base project entity
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  url: string | null;
  repoUrl: string | null;
  imageUrl: string | null;
  status: ProjectStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project with collaborators included
 */
export interface ProjectWithCollaborators extends Project {
  collaborators: Collaborator[];
}

/**
 * Project with upvote information for a specific user
 */
export interface ProjectWithUpvotes extends Project {
  upvoteCount: number;
  hasUpvoted: boolean;
}

/**
 * Project with both collaborators and upvote information
 */
export interface ProjectDetailed extends Project {
  collaborators: Collaborator[];
  upvoteCount: number;
  hasUpvoted: boolean;
}

/**
 * Create project request payload
 */
export interface CreateProjectRequest {
  title: string;
  description: string;
  url?: string;
  repoUrl?: string;
  imageUrl?: string;
  status?: ProjectStatus;
}

/**
 * Update project request payload
 * All fields are optional
 */
export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  url?: string | null;
  repoUrl?: string | null;
  imageUrl?: string | null;
  status?: ProjectStatus;
}

/**
 * Query parameters for listing projects
 */
export interface ProjectListQuery {
  cursor?: string;
  limit?: number;
  status?: ProjectStatus;
  featured?: boolean;
  creatorId?: string;
}

/**
 * Cursor-based paginated project list response
 */
export interface ProjectListResponse {
  projects: ProjectWithUpvotes[];
  nextCursor: string | null;
  hasMore: boolean;
}
