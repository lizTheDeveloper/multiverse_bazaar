import type {
  User,
  Project,
  Idea,
  IdeaInterest,
  Collaborator,
  InviteCollaboratorInput,
  ExpressInterestInput,
  ProjectFilters,
  IdeaFilters,
  SearchParams,
  SearchResponse,
  CreateProjectInput,
  UpdateProjectInput,
  CreateIdeaInput,
  UpdateIdeaInput,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: any;

  constructor(status: number, statusText: string, data?: any) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers[key] = value as string;
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}

async function uploadFile<T>(
  endpoint: string,
  file: File,
  fieldName: string = 'file'
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append(fieldName, file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return response.json();
}

// Auth API
export const auth = {
  async login(email: string): Promise<{ user: User; token: string }> {
    const result = await request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    localStorage.setItem('auth_token', result.accessToken);
    return { user: result.user, token: result.accessToken };
  },

  async me(): Promise<User> {
    return request<User>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('auth_token');
    }
  },
};

// Projects API
export const projects = {
  async list(filters?: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return request<Project[]>(`/projects${query ? `?${query}` : ''}`);
  },

  async get(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  async create(data: CreateProjectInput): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async upvote(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}/upvote`, {
      method: 'POST',
    });
  },

  async removeUpvote(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}/upvote`, {
      method: 'DELETE',
    });
  },

  async uploadImage(file: File): Promise<{ url: string }> {
    return uploadFile<{ url: string }>('/uploads/image', file, 'image');
  },
};

// Collaborators API
export const collaborators = {
  async invite(
    projectId: string,
    data: InviteCollaboratorInput
  ): Promise<Collaborator> {
    return request<Collaborator>(`/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async remove(projectId: string, collaboratorId: string): Promise<void> {
    return request<void>(
      `/projects/${projectId}/collaborators/${collaboratorId}`,
      {
        method: 'DELETE',
      }
    );
  },

  async leave(projectId: string): Promise<void> {
    return request<void>(`/projects/${projectId}/collaborators/leave`, {
      method: 'POST',
    });
  },
};

// Ideas API
export const ideas = {
  async list(filters?: IdeaFilters): Promise<Idea[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return request<Idea[]>(`/ideas${query ? `?${query}` : ''}`);
  },

  async get(id: string): Promise<Idea> {
    return request<Idea>(`/ideas/${id}`);
  },

  async create(data: CreateIdeaInput): Promise<Idea> {
    return request<Idea>('/ideas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateIdeaInput): Promise<Idea> {
    return request<Idea>(`/ideas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/ideas/${id}`, {
      method: 'DELETE',
    });
  },

  async getInterests(id: string): Promise<IdeaInterest[]> {
    return request<IdeaInterest[]>(`/ideas/${id}/interest`);
  },

  async expressInterest(
    id: string,
    data: ExpressInterestInput
  ): Promise<IdeaInterest> {
    return request<IdeaInterest>(`/ideas/${id}/interest`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async graduate(id: string, projectData: CreateProjectInput): Promise<Project> {
    return request<Project>(`/ideas/${id}/graduate`, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },
};

// Users API
export const users = {
  async get(id: string): Promise<User> {
    return request<User>(`/users/${id}`);
  },

  async getProjects(id: string): Promise<Project[]> {
    return request<Project[]>(`/users/${id}/projects`);
  },

  async update(data: Partial<User>): Promise<User> {
    return request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    return uploadFile<{ url: string }>('/uploads/avatar', file, 'avatar');
  },
};

// Search API
export const search = {
  async search(params: SearchParams): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    return request<SearchResponse>(`/search?${queryParams.toString()}`);
  },
};

// Export search as searchApi for backward compatibility
export const searchApi = search;
