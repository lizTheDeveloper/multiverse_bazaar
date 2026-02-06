import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface InterestedUser {
  id: string;
  name: string;
  avatarUrl?: string;
  message?: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  author: Author;
  upvoteCount: number;
  isUpvoted: boolean;
  interestedCount: number;
  interestedUsers?: InterestedUser[];
  isInterested: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IdeasResponse {
  ideas: Idea[];
  nextCursor?: string;
  hasMore: boolean;
}

interface IdeasParams {
  limit?: number;
  cursor?: string;
  sort?: 'recent' | 'popular';
}

const IDEAS_KEY = 'ideas';
const IDEA_KEY = 'idea';

export function useIdeas(params: Omit<IdeasParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [IDEAS_KEY, params],
    queryFn: async ({ pageParam }) => {
      const queryParams: Record<string, string> = {};
      if (params.limit) queryParams.limit = String(params.limit);
      if (params.sort) queryParams.sort = params.sort;
      if (pageParam) queryParams.cursor = pageParam;

      return api.get<IdeasResponse>('/ideas', queryParams);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
}

export function useIdea(ideaId: string) {
  return useQuery({
    queryKey: [IDEA_KEY, ideaId],
    queryFn: () => api.get<Idea>(`/ideas/${ideaId}`),
    enabled: !!ideaId,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      api.post<Idea>('/ideas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string }) =>
      api.patch<Idea>(`/ideas/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.setQueryData([IDEA_KEY, data.id], data);
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: string) => api.delete(`/ideas/${ideaId}`),
    onSuccess: (_, ideaId) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.removeQueries({ queryKey: [IDEA_KEY, ideaId] });
    },
  });
}

export function useUpvoteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: string) => api.post(`/ideas/${ideaId}/upvote`),
    onMutate: async (ideaId) => {
      await queryClient.cancelQueries({ queryKey: [IDEA_KEY, ideaId] });
      await queryClient.cancelQueries({ queryKey: [IDEAS_KEY] });

      const previousIdea = queryClient.getQueryData<Idea>([IDEA_KEY, ideaId]);

      if (previousIdea) {
        queryClient.setQueryData<Idea>([IDEA_KEY, ideaId], {
          ...previousIdea,
          isUpvoted: !previousIdea.isUpvoted,
          upvoteCount: previousIdea.isUpvoted
            ? previousIdea.upvoteCount - 1
            : previousIdea.upvoteCount + 1,
        });
      }

      queryClient.setQueriesData<{ pages: IdeasResponse[] }>(
        { queryKey: [IDEAS_KEY] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              ideas: page.ideas.map((idea) =>
                idea.id === ideaId
                  ? {
                      ...idea,
                      isUpvoted: !idea.isUpvoted,
                      upvoteCount: idea.isUpvoted
                        ? idea.upvoteCount - 1
                        : idea.upvoteCount + 1,
                    }
                  : idea
              ),
            })),
          };
        }
      );

      return { previousIdea };
    },
    onError: (_, ideaId, context) => {
      if (context?.previousIdea) {
        queryClient.setQueryData([IDEA_KEY, ideaId], context.previousIdea);
      }
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
    },
    onSettled: (_, __, ideaId) => {
      queryClient.invalidateQueries({ queryKey: [IDEA_KEY, ideaId] });
    },
  });
}

export function useExpressInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, message }: { ideaId: string; message?: string }) =>
      api.post(`/ideas/${ideaId}/interest`, { message }),
    onSuccess: (_, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [IDEA_KEY, ideaId] });
    },
  });
}

export function useWithdrawInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: string) => api.delete(`/ideas/${ideaId}/interest`),
    onSuccess: (_, ideaId) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [IDEA_KEY, ideaId] });
    },
  });
}
