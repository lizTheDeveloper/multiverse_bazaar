import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Collaborator {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'owner' | 'collaborator';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  upvoteCount: number;
  isUpvoted: boolean;
  collaborators: Collaborator[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  projects: Project[];
  nextCursor?: string;
  hasMore: boolean;
}

interface ProjectsParams {
  limit?: number;
  cursor?: string;
  sort?: 'recent' | 'popular';
}

const PROJECTS_KEY = 'projects';
const PROJECT_KEY = 'project';

export function useProjects(params: Omit<ProjectsParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [PROJECTS_KEY, params],
    queryFn: async ({ pageParam }) => {
      const queryParams: Record<string, string> = {};
      if (params.limit) queryParams.limit = String(params.limit);
      if (params.sort) queryParams.sort = params.sort;
      if (pageParam) queryParams.cursor = pageParam;

      return api.get<ProjectsResponse>('/projects', queryParams);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: [PROJECT_KEY, projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; description: string; imageUrl?: string }) =>
      api.post<Project>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; imageUrl?: string }) =>
      api.patch<Project>(`/projects/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      queryClient.setQueryData([PROJECT_KEY, data.id], data);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => api.delete(`/projects/${projectId}`),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      queryClient.removeQueries({ queryKey: [PROJECT_KEY, projectId] });
    },
  });
}

export function useUpvoteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => api.post(`/projects/${projectId}/upvote`),
    onMutate: async (projectId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [PROJECT_KEY, projectId] });
      await queryClient.cancelQueries({ queryKey: [PROJECTS_KEY] });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<Project>([PROJECT_KEY, projectId]);

      // Optimistically update project detail
      if (previousProject) {
        queryClient.setQueryData<Project>([PROJECT_KEY, projectId], {
          ...previousProject,
          isUpvoted: !previousProject.isUpvoted,
          upvoteCount: previousProject.isUpvoted
            ? previousProject.upvoteCount - 1
            : previousProject.upvoteCount + 1,
        });
      }

      // Optimistically update projects list
      queryClient.setQueriesData<{ pages: ProjectsResponse[] }>(
        { queryKey: [PROJECTS_KEY] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              projects: page.projects.map((project) =>
                project.id === projectId
                  ? {
                      ...project,
                      isUpvoted: !project.isUpvoted,
                      upvoteCount: project.isUpvoted
                        ? project.upvoteCount - 1
                        : project.upvoteCount + 1,
                    }
                  : project
              ),
            })),
          };
        }
      );

      return { previousProject };
    },
    onError: (_, projectId, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData([PROJECT_KEY, projectId], context.previousProject);
      }
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
    },
    onSettled: (_, __, projectId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: [PROJECT_KEY, projectId] });
    },
  });
}
