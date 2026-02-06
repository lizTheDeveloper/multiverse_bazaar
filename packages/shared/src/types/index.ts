// Result and Error types
export * from './result.js';
export * from './errors.js';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  karma: number;
  is_external: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Project types
export type ProjectStatus = 'building' | 'launched';

export interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  repo_url?: string;
  image_url?: string;
  status: ProjectStatus;
  is_featured: boolean;
  upvote_count: number;
  has_upvoted?: boolean;
  creator_id: string;
  creator: User;
  collaborators: Collaborator[];
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  url?: string;
  repo_url?: string;
  image_url?: string;
  status: ProjectStatus;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

// Collaborator types
export type CollaboratorRole = 'creator' | 'contributor' | 'advisor';

export interface Collaborator {
  id: string;
  user_id: string;
  project_id: string;
  role: CollaboratorRole;
  user: User;
  created_at: string;
}

export interface InviteCollaboratorInput {
  email: string;
  role: Exclude<CollaboratorRole, 'creator'>;
}

// Idea types
export type IdeaStatus = 'open' | 'closed' | 'graduated';

export interface Idea {
  id: string;
  title: string;
  description: string;
  looking_for: string;
  status: IdeaStatus;
  interest_count: number;
  has_expressed_interest?: boolean;
  creator_id: string;
  creator: User;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeaInput {
  title: string;
  description: string;
  looking_for: string;
}

export interface UpdateIdeaInput extends Partial<CreateIdeaInput> {
  status?: IdeaStatus;
}

export interface IdeaInterest {
  id: string;
  idea_id: string;
  user_id: string;
  message?: string;
  user: User;
  created_at: string;
}

export interface ExpressInterestInput {
  message?: string;
}

// Upvote types
export interface Upvote {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

// Search types
export type SearchResultType = 'project' | 'idea';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  description: string;
  highlights: string[];
  created_at: string;
  upvote_count?: number;
  status?: ProjectStatus | IdeaStatus;
  looking_for?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  per_page: number;
}

export interface SearchParams {
  query: string;
  type?: 'all' | 'projects' | 'ideas';
  status?: string;
  page?: number;
  per_page?: number;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

// Filter types
export interface ProjectFilters extends PaginationParams {
  status?: ProjectStatus;
  featured?: boolean;
}

export interface IdeaFilters extends PaginationParams {
  status?: IdeaStatus;
}
