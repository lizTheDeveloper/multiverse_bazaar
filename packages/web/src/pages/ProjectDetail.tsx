import { Link, useParams, useNavigate } from 'react-router-dom';
import { Page } from '@/components/layout/Page';
import { Button, Badge, Avatar, Spinner, Card } from '@/components/ui';
import { useProject, useDeleteProject, useUpvoteProject, useRemoveUpvote } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { data: project, isLoading, error } = useProject(id!);
  const deleteMutation = useDeleteProject();
  const upvoteMutation = useUpvoteProject(id!);
  const removeUpvoteMutation = useRemoveUpvote(id!);

  const isCreator = user && project && project.creator_id === user.id;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id!);
      navigate('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      return;
    }

    if (project?.has_upvoted) {
      await removeUpvoteMutation.mutateAsync();
    } else {
      await upvoteMutation.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <Page>
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      </Page>
    );
  }

  if (error || !project) {
    return (
      <Page>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load project. Please try again.
        </div>
      </Page>
    );
  }

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
    <Page>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/projects" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {project.title}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant={project.status === 'launched' ? 'success' : 'info'}>
                  {project.status === 'launched' ? 'Launched' : 'Building'}
                </Badge>
                {project.is_featured && <Badge variant="warning">Featured</Badge>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant={project.has_upvoted ? 'primary' : 'secondary'}
                onClick={handleUpvote}
                disabled={!isAuthenticated || upvoteMutation.isPending || removeUpvoteMutation.isPending}
                className="flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
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

              {isCreator && (
                <>
                  <Link to={`/projects/${project.id}/edit`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image */}
        {project.image_url ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`aspect-video w-full rounded-lg bg-gradient-to-br ${gradient} mb-8`} />
        )}

        {/* Description */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
        </Card>

        {/* Links */}
        {(project.url || project.repo_url) && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Links</h2>
            <div className="space-y-2">
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Visit Project Website
                </a>
              )}
              {project.repo_url && (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View Source Code
                </a>
              )}
            </div>
          </Card>
        )}

        {/* Collaborators */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Collaborators</h2>
          <div className="space-y-3">
            {project.collaborators.map((collab) => (
              <Link
                key={collab.id}
                to={`/users/${collab.user.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar
                  src={collab.user.avatar_url}
                  name={collab.user.name}
                  size="md"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{collab.user.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{collab.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Metadata */}
        <div className="mt-8 text-sm text-gray-500 text-center">
          Created {formatDate(project.created_at)}
          {project.updated_at !== project.created_at && (
            <> • Updated {formatDate(project.updated_at)}</>
          )}
        </div>
      </div>
    </Page>
  );
}
