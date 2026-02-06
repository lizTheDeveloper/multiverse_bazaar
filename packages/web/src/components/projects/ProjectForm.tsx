import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { useUploadProjectImage } from '@/hooks/useProjects';
import type { Project } from '@/types';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description is too long'),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  repo_url: z.string().url('Invalid repository URL').optional().or(z.literal('')),
  status: z.enum(['building', 'launched'] as const),
  image_url: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => void;
  isSubmitting?: boolean;
}

export function ProjectForm({ project, onSubmit, isSubmitting }: ProjectFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    project?.image_url || null
  );
  const uploadImageMutation = useUploadProjectImage();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      url: project?.url || '',
      repo_url: project?.repo_url || '',
      status: project?.status || 'building',
      image_url: project?.image_url || '',
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      setValue('image_url', result.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setValue('image_url', '');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <Input
          id="title"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Enter project title"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <Textarea
          id="description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Describe your project"
          rows={6}
        />
      </div>

      {/* URL */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          Project URL
        </label>
        <Input
          id="url"
          type="url"
          {...register('url')}
          error={errors.url?.message}
          placeholder="https://example.com"
        />
      </div>

      {/* Repository URL */}
      <div>
        <label htmlFor="repo_url" className="block text-sm font-medium text-gray-700 mb-1">
          Repository URL
        </label>
        <Input
          id="repo_url"
          type="url"
          {...register('repo_url')}
          error={errors.repo_url?.message}
          placeholder="https://github.com/username/repo"
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status *
        </label>
        <Select
          id="status"
          {...register('status')}
          error={errors.status?.message}
          options={[
            { value: 'building', label: 'Building' },
            { value: 'launched', label: 'Launched' },
          ]}
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Image
        </label>
        {imagePreview ? (
          <div className="space-y-2">
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-gray-300">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRemoveImage}
            >
              Remove Image
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full max-w-md">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadImageMutation.isPending}
              />
            </label>
          </div>
        )}
        {uploadImageMutation.isPending && (
          <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
        )}
        {uploadImageMutation.isError && (
          <p className="text-sm text-red-600 mt-2">Failed to upload image</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || uploadImageMutation.isPending}>
          {isSubmitting ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
