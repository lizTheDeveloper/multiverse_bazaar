export interface ProjectResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  url?: string;
  repoUrl?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaResponse {
  id: string;
  title: string;
  description: string;
  lookingFor: string;
  status: string;
  creatorId: string;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface SearchResultItem {
  type: 'project' | 'idea';
  id: string;
  title: string;
  description?: string;
  status?: string;
}
