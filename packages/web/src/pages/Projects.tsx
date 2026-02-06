import { Link, useSearchParams } from 'react-router-dom';
import { Page } from '@/components/layout/Page';
import { Button, Spinner } from '@/components/ui';
import { ProjectCard, ProjectFilters } from '@/components/projects';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import type { ProjectFilters as ProjectFiltersType } from '@/types';

export function Projects() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Build filters from URL params
  const filters: ProjectFiltersType = {
    status: searchParams.get('status') as 'building' | 'launched' | undefined,
    is_featured: searchParams.get('featured') === 'true' ? true : undefined,
    sort: (searchParams.get('sort') as 'recent' | 'popular') || 'recent',
  };

  const { data: projects, isLoading, error } = useProjects(filters);

  return (
    <Page title="Projects">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Discover amazing projects built by the community
        </p>
        {isAuthenticated && (
          <Link to="/projects/new">
            <Button>Create Project</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ProjectFilters />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load projects. Please try again.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && projects && projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 mb-4">
            {Object.keys(filters).some((key) => filters[key as keyof typeof filters])
              ? 'Try adjusting your filters'
              : 'Be the first to create a project!'}
          </p>
          {isAuthenticated && (
            <Link to="/projects/new">
              <Button>Create Project</Button>
            </Link>
          )}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </Page>
  );
}
