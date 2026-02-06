import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useExpressInterest } from '../../hooks/useIdeas';
import type { Idea } from '../../types';

const interestSchema = z.object({
  message: z.string().max(1000, 'Message must be less than 1000 characters').optional(),
});

type InterestFormData = z.infer<typeof interestSchema>;

interface InterestButtonProps {
  idea: Idea;
  currentUserId?: string;
}

export function InterestButton({ idea, currentUserId }: InterestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const expressInterest = useExpressInterest(idea.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InterestFormData>({
    resolver: zodResolver(interestSchema),
  });

  const isCreator = currentUserId === idea.creator_id;
  const hasExpressedInterest = idea.has_expressed_interest;

  const onSubmit = async (data: InterestFormData) => {
    try {
      await expressInterest.mutateAsync(data);
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to express interest:', error);
    }
  };

  if (isCreator) {
    return null;
  }

  if (hasExpressedInterest) {
    return (
      <button
        disabled
        className="px-6 py-2 bg-green-100 text-green-800 rounded-md font-medium cursor-not-allowed"
      >
        Interest Sent
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        I'm Interested
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Express Interest
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Let {idea.creator.name} know you're interested in "{idea.title}".
              Optionally, include a message about why you'd be a good fit.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  {...register('message')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell them about your background, skills, or why you're interested..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expressInterest.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {expressInterest.isPending ? 'Sending...' : 'Send Interest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
