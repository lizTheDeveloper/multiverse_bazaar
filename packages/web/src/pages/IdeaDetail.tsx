import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useIdea, useIdeaInterests, useDeleteIdea } from '../hooks/useIdeas';
import { InterestButton } from '../components/ideas/InterestButton';
import { InterestsList } from '../components/ideas/InterestsList';
import { GraduateModal } from '../components/ideas/GraduateModal';
import { formatRelativeTime } from '../lib/utils';

interface IdeaDetailProps {
  currentUserId?: string;
}

const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-800',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800',
  },
  graduated: {
    label: 'Graduated',
    className: 'bg-purple-100 text-purple-800',
  },
};

export function IdeaDetail({ currentUserId }: IdeaDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isGraduateModalOpen, setIsGraduateModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: idea, isLoading, error } = useIdea(id!);
  const { data: interests, isLoading: interestsLoading } = useIdeaInterests(id!);
  const deleteIdea = useDeleteIdea();

  const isCreator = currentUserId && idea?.creator_id === currentUserId;

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteIdea.mutateAsync(id);
      navigate('/ideas');
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          Failed to load idea. Please try again.
        </div>
      </div>
    );
  }

  const status = statusConfig[idea.status];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          to="/ideas"
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Ideas
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{idea.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link
                to={`/users/${idea.creator_id}`}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                {idea.creator.avatar_url && (
                  <img
                    src={idea.creator.avatar_url}
                    alt={idea.creator.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                {!idea.creator.avatar_url && (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                    {idea.creator.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-gray-700">{idea.creator.name}</span>
              </Link>
              <span>Posted {formatRelativeTime(idea.created_at)}</span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {idea.interest_count} interested
              </span>
            </div>
          </div>

          {isCreator && (
            <div className="flex gap-2">
              <Link
                to={`/ideas/${id}/edit`}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-700 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="prose max-w-none mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
          <div className="text-gray-700 whitespace-pre-wrap">{idea.description}</div>
        </div>

        <div className="border-t pt-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Looking For</h2>
          <div className="text-gray-700 whitespace-pre-wrap">{idea.looking_for}</div>
        </div>

        {!isCreator && idea.status === 'open' && (
          <div className="border-t pt-6">
            <InterestButton idea={idea} currentUserId={currentUserId} />
          </div>
        )}

        {isCreator && idea.status === 'open' && (
          <div className="border-t pt-6">
            <button
              onClick={() => setIsGraduateModalOpen(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Graduate to Project
            </button>
          </div>
        )}
      </div>

      {isCreator && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Interested Users ({idea.interest_count})
          </h2>
          {interestsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : interests ? (
            <InterestsList interests={interests} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load interests.
            </div>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Idea</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this idea? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteIdea.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteIdea.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <GraduateModal
        idea={idea}
        isOpen={isGraduateModalOpen}
        onClose={() => setIsGraduateModalOpen(false)}
      />
    </div>
  );
}
