import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projects as projectsApi } from '@/lib/api';
import { projectKeys } from './useProjects';
import type { Project } from '@/types';

interface UpvoteContext {
  previousProject?: Project;
  previousProjects?: Project[];
}

export function useUpvote(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, void, UpvoteContext>({
    mutationFn: async () => {
      // Get the current project state to determine action
      const currentProject = queryClient.getQueryData<Project>(
        projectKeys.detail(projectId)
      );

      if (currentProject?.has_upvoted) {
        return projectsApi.removeUpvote(projectId);
      } else {
        return projectsApi.upvote(projectId);
      }
    },

    // Optimistic update before mutation
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) });
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot the previous values
      const previousProject = queryClient.getQueryData<Project>(
        projectKeys.detail(projectId)
      );
      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      // Optimistically update the single project
      if (previousProject) {
        const isCurrentlyUpvoted = previousProject.has_upvoted;
        queryClient.setQueryData<Project>(projectKeys.detail(projectId), {
          ...previousProject,
          has_upvoted: !isCurrentlyUpvoted,
          upvote_count: isCurrentlyUpvoted
            ? previousProject.upvote_count - 1
            : previousProject.upvote_count + 1,
        });
      }

      // Optimistically update the project in all lists
      queryClient.setQueriesData<Project[]>(
        { queryKey: projectKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((project) => {
            if (project.id === projectId) {
              const isCurrentlyUpvoted = project.has_upvoted;
              return {
                ...project,
                has_upvoted: !isCurrentlyUpvoted,
                upvote_count: isCurrentlyUpvoted
                  ? project.upvote_count - 1
                  : project.upvote_count + 1,
              };
            }
            return project;
          });
        }
      );

      return { previousProject, previousProjects };
    },

    // On error, rollback to previous state
    onError: (_error, _variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(projectId),
          context.previousProject
        );
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectKeys.lists(),
          context.previousProjects
        );
      }
    },

    // Always refetch after error or success to ensure sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
