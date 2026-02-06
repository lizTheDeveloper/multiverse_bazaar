import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/layout/Page';
import { Card } from '@/components/ui';
import { ProjectForm } from '@/components/projects';
import { useCreateProject } from '@/hooks/useProjects';
import type { ProjectFormData } from '@/components/projects/ProjectForm';

export function ProjectNew() {
  const navigate = useNavigate();
  const createMutation = useCreateProject();

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const project = await createMutation.mutateAsync({
        title: data.title,
        description: data.description,
        url: data.url || undefined,
        repo_url: data.repo_url || undefined,
        image_url: data.image_url || undefined,
        status: data.status,
      });
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <Page title="Create Project">
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600 mb-8">
          Share your project with the community. Whether you're just starting to
          build or have already launched, we'd love to see what you're working on!
        </p>

        <Card className="p-6">
          <ProjectForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
          />
        </Card>

        {createMutation.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Failed to create project. Please try again.
          </div>
        )}
      </div>
    </Page>
  );
}
