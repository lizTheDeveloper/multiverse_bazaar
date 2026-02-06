import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { IdeaStatus } from '../../types';

const ideaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters'),
  looking_for: z.string().min(1, 'Please specify what you are looking for').max(500, 'Must be less than 500 characters'),
  status: z.enum(['open', 'closed', 'graduated']).optional(),
});

export type IdeaFormData = z.infer<typeof ideaSchema>;

interface IdeaFormProps {
  defaultValues?: Partial<IdeaFormData>;
  onSubmit: (data: IdeaFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showStatusField?: boolean;
}

export function IdeaForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit',
  showStatusField = false,
}: IdeaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="What's your idea?"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your idea in detail..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="looking_for" className="block text-sm font-medium text-gray-700 mb-1">
          Looking For
        </label>
        <textarea
          id="looking_for"
          {...register('looking_for')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Co-founder with technical background, Designer for UI/UX, Feedback on business model..."
        />
        {errors.looking_for && (
          <p className="mt-1 text-sm text-red-600">{errors.looking_for.message}</p>
        )}
      </div>

      {showStatusField && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="graduated">Graduated</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
