import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ideas as ideasApi } from '../lib/api';
import type {
  Idea,
  IdeaFilters,
  CreateIdeaInput,
  UpdateIdeaInput,
  IdeaInterest,
  ExpressInterestInput,
  Project,
  CreateProjectInput,
} from '../types';

// Query keys
export const ideaKeys = {
  all: ['ideas'] as const,
  lists: () => [...ideaKeys.all, 'list'] as const,
  list: (filters?: IdeaFilters) => [...ideaKeys.lists(), filters] as const,
  details: () => [...ideaKeys.all, 'detail'] as const,
  detail: (id: string) => [...ideaKeys.details(), id] as const,
  interests: (id: string) => [...ideaKeys.detail(id), 'interests'] as const,
};

// List ideas with filters
export function useIdeas(filters?: IdeaFilters) {
  return useQuery({
    queryKey: ideaKeys.list(filters),
    queryFn: () => ideasApi.list(filters),
  });
}

// Get single idea
export function useIdea(id: string) {
  return useQuery({
    queryKey: ideaKeys.detail(id),
    queryFn: () => ideasApi.get(id),
    enabled: !!id,
  });
}

// Get idea interests (for creators)
export function useIdeaInterests(id: string) {
  return useQuery({
    queryKey: ideaKeys.interests(id),
    queryFn: () => ideasApi.getInterests(id),
    enabled: !!id,
  });
}

// Create idea mutation
export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIdeaInput) => ideasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.lists() });
    },
  });
}

// Update idea mutation
export function useUpdateIdea(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateIdeaInput) => ideasApi.update(id, data),
    onSuccess: (updatedIdea) => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.lists() });
      queryClient.setQueryData(ideaKeys.detail(id), updatedIdea);
    },
  });
}

// Delete idea mutation
export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ideasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.lists() });
    },
  });
}

// Express interest mutation
export function useExpressInterest(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpressInterestInput) => ideasApi.expressInterest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ideaKeys.interests(id) });
    },
  });
}

// Graduate idea to project mutation
export function useGraduateIdea(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: CreateProjectInput) => ideasApi.graduate(id, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ideaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
