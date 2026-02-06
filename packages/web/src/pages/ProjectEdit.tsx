import { useParams, useNavigate } from 'react-router-dom';
import { Page } from '@/components/layout/Page';
import { Card, Spinner } from '@/components/ui';
import { ProjectForm } from '@/components/projects';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import type { ProjectFormData } from '@/components/projects/ProjectForm';

export function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: project, isLoading, error } = useProject(id!);
  const updateMutation = useUpdateProject(id!);

  const isCreator = user && project && project.creator_id === user.id;

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await updateMutation.mutateAsync({
        title: data.title,
        description: data.description,
        url: data.url || undefined,
        repo_url: data.repo_url || undefined,
        image_url: data.image_url || undefined,
        status: data.status,
      });
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  if (isLoading) {
    return (
      <Page title="Edit Project">
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      </Page>
    );
  }

  if (error || !project) {
    return (
      <Page title="Edit Project">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load project. Please try again.
        </div>
      </Page>
    );
  }

  if (!isCreator) {
    return (
      <Page title="Edit Project">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          You don't have permission to edit this project.
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Project">
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600 mb-8">
          Update your project details to keep the community informed.
        </p>

        <Card className="p-6">
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
          />
        </Card>

        {updateMutation.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Failed to update project. Please try again.
          </div>
        )}
      </div>
    </Page>
  );
}
