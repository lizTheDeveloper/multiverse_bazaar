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

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  url?: string;
  repo_url?: string;
  image_url?: string;
  status?: ProjectStatus;
}

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
  role: CollaboratorRole;
}

export type InviteCollaboratorData = InviteCollaboratorInput;

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

export interface UpdateIdeaInput {
  title?: string;
  description?: string;
  looking_for?: string;
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

export type ExpressInterestData = ExpressInterestInput;
export type Interest = IdeaInterest;

// Search types
export type SearchResultType = 'project' | 'idea';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  description: string;
  creator: User;
  created_at: string;
  project?: Project;
  idea?: Idea;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface SearchParams {
  q: string;
  type?: SearchResultType;
  limit?: number;
  offset?: number;
}

export type SearchResults = SearchResponse;

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ProjectFilters extends PaginationParams {
  status?: ProjectStatus;
  is_featured?: boolean;
  creator_id?: string;
  sort?: 'recent' | 'popular';
}

export interface IdeaFilters extends PaginationParams {
  status?: IdeaStatus;
  creator_id?: string;
  sort?: 'recent' | 'popular';
}
