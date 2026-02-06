import { Link } from 'react-router-dom';
import { Card, Badge, Avatar, Button } from '@/components/ui';
import { useUpvoteProject, useRemoveUpvote } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { truncate } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { isAuthenticated } = useAuth();
  const upvoteMutation = useUpvoteProject(project.id);
  const removeUpvoteMutation = useRemoveUpvote(project.id);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      return;
    }

    if (project.has_upvoted) {
      await removeUpvoteMutation.mutateAsync();
    } else {
      await upvoteMutation.mutateAsync();
    }
  };

  const visibleCollaborators = project.collaborators.slice(0, 3);
  const remainingCount = project.collaborators.length - 3;

  // Generate a gradient for projects without images
  const gradients = [
    'from-blue-400 to-purple-500',
    'from-green-400 to-cyan-500',
    'from-orange-400 to-pink-500',
    'from-purple-400 to-indigo-500',
    'from-pink-400 to-rose-500',
  ];
  const gradientIndex = parseInt(project.id.slice(0, 8), 16) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        {/* Image or Gradient Placeholder */}
        <div className="aspect-video w-full overflow-hidden">
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title and Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-1">
              {project.title}
            </h3>
            <Badge
              variant={project.status === 'launched' ? 'success' : 'info'}
            >
              {project.status === 'launched' ? 'Launched' : 'Building'}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
            {truncate(project.description, 120)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Collaborators */}
            <div className="flex items-center -space-x-2">
              {visibleCollaborators.map((collab: typeof project.collaborators[0]) => (
                <Avatar
                  key={collab.id}
                  src={collab.user.avatar_url}
                  fallback={collab.user.name}
                  size="sm"
                  className="ring-2 ring-white"
                />
              ))}
              {remainingCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>

            {/* Upvote Button */}
            <Button
              variant={project.has_upvoted ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleUpvote}
              disabled={!isAuthenticated || upvoteMutation.isPending || removeUpvoteMutation.isPending}
              className="flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill={project.has_upvoted ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span>{project.upvote_count}</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
