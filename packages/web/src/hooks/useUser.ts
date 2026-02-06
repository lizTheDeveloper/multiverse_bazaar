import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { users } from '../lib/api';
import type { User, Project } from '../types';

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: () => users.get(id),
    enabled: !!id,
  });
}

export function useUserProjects(id: string) {
  return useQuery<Project[]>({
    queryKey: ['users', id, 'projects'],
    queryFn: () => users.getProjects(id),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => users.update(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => users.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
