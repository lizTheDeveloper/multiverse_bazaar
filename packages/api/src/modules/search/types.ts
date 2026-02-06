/**
 * Type definitions for the Search module.
 * Defines search query types and result types for projects and ideas.
 */

import { ProjectStatus, IdeaStatus } from '@prisma/client';

/**
 * Search query parameters
 */
export interface SearchQuery {
  q: string; // search query string
  type?: 'projects' | 'ideas' | 'all'; // what to search
  status?: string; // project status or idea status
  featured?: boolean; // for projects only - filter by featured status
  page?: number; // page number for pagination
  limit?: number; // items per page
}

/**
 * Base search result
 */
export interface SearchResult {
  type: 'project' | 'idea';
  id: string;
  title: string;
  description: string;
  score: number; // relevance score from full-text search
  highlights?: { field: string; snippet: string }[]; // highlighted snippets
}

/**
 * Project-specific search result
 * Extends base result with project-specific fields
 */
export interface ProjectSearchResult extends SearchResult {
  type: 'project';
  url: string | null;
  repoUrl: string | null;
  imageUrl: string | null;
  status: ProjectStatus;
  isFeatured: boolean;
  upvoteCount: number;
  hasUpvoted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Idea-specific search result
 * Extends base result with idea-specific fields
 */
export interface IdeaSearchResult extends SearchResult {
  type: 'idea';
  lookingFor: string;
  status: IdeaStatus;
  creatorId: string;
  creatorName: string | null;
  interestCount: number;
  hasInterest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated search response
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
}
