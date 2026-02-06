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
  data: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProjectsParams {
  limit?: number;
  status?: string;
  featured?: boolean;
}

const PROJECTS_KEY = 'projects';
const PROJECT_KEY = 'project';

export function useProjects(params: ProjectsParams = {}) {
  return useInfiniteQuery({
    queryKey: [PROJECTS_KEY, params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams: Record<string, string> = {
        page: String(pageParam),
        limit: String(params.limit || 10),
      };
      if (params.status) queryParams.status = params.status;
      if (params.featured !== undefined) queryParams.featured = String(params.featured);

      return api.get<ProjectsResponse>('/projects', queryParams);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
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
              data: page.data.map((project) =>
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

export function useRemoveUpvoteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => api.delete(`/projects/${projectId}/upvote`),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROJECT_KEY, projectId] });
    },
  });
}
