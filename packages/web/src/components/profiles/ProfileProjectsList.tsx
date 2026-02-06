import { Link } from 'react-router-dom';
import type { Project, CollaboratorRole } from '../../types';
import { cn } from '../../lib/utils';

interface ProfileProjectsListProps {
  projects: Project[];
  userId: string;
}

function getRoleBadge(role: CollaboratorRole) {
  const styles = {
    creator: 'bg-purple-100 text-purple-800',
    contributor: 'bg-green-100 text-green-800',
    advisor: 'bg-blue-100 text-blue-800',
  };

  const labels = {
    creator: 'Creator',
    contributor: 'Contributor',
    advisor: 'Advisor',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        styles[role]
      )}
    >
      {labels[role]}
    </span>
  );
}

function getStatusBadge(status: 'building' | 'launched') {
  const styles = {
    building: 'bg-yellow-100 text-yellow-800',
    launched: 'bg-green-100 text-green-800',
  };

  const labels = {
    building: 'Building',
    launched: 'Launched',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

export function ProfileProjectsList({
  projects,
  userId,
}: ProfileProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Projects</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {projects.map((project) => {
          // Determine user's role in the project
          let userRole: CollaboratorRole = 'contributor';
          if (project.creator_id === userId) {
            userRole = 'creator';
          } else {
            const collaborator = project.collaborators.find(
              (c) => c.user_id === userId
            );
            if (collaborator) {
              userRole = collaborator.role;
            }
          }

          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600">
                      {project.title}
                    </h3>
                    {getRoleBadge(userRole)}
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      {project.upvote_count}
                    </span>
                    {project.collaborators.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        {project.collaborators.length + 1}
                      </span>
                    )}
                  </div>
                </div>

                {project.image_url && (
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
