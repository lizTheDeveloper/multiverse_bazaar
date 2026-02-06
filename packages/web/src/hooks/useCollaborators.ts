import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborators as collaboratorsApi } from '@/lib/api';
import type { InviteCollaboratorInput } from '@/types';
import { projectKeys } from './useProjects';

// Invite collaborator mutation
export function useInviteCollaborator(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteCollaboratorInput) =>
      collaboratorsApi.invite(projectId, data),
    onSuccess: () => {
      // Invalidate project details to refetch with new collaborator
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Remove collaborator mutation
export function useRemoveCollaborator(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collaboratorId: string) =>
      collaboratorsApi.remove(projectId, collaboratorId),
    onSuccess: () => {
      // Invalidate project details to refetch without removed collaborator
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Leave project mutation
export function useLeaveProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => collaboratorsApi.leave(projectId),
    onSuccess: () => {
      // Invalidate all project queries since user left
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
