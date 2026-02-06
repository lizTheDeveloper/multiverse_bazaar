import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdeas } from '../hooks/useIdeas';
import { IdeaCard } from '../components/ideas/IdeaCard';
import type { IdeaStatus } from '../types';

const ITEMS_PER_PAGE = 20;

export function Ideas() {
  const [status, setStatus] = useState<IdeaStatus>('open');
  const [page, setPage] = useState(0);

  const { data: ideas, isLoading, error } = useIdeas({
    status,
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
    sort: 'recent',
  });

  const handleStatusChange = (newStatus: IdeaStatus) => {
    setStatus(newStatus);
    setPage(0);
  };

  const hasMore = ideas && ideas.length === ITEMS_PER_PAGE;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ideas</h1>
          <p className="text-gray-600 mt-1">
            Share your ideas and find collaborators to bring them to life
          </p>
        </div>
        <Link
          to="/ideas/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Post an Idea
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('open')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              status === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => handleStatusChange('closed')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              status === 'closed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Closed
          </button>
          <button
            onClick={() => handleStatusChange('graduated')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              status === 'graduated'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Graduated
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading ideas...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          Failed to load ideas. Please try again.
        </div>
      )}

      {!isLoading && !error && ideas && ideas.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No ideas found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {status === 'open'
              ? 'Be the first to post an idea!'
              : `No ${status} ideas at the moment.`}
          </p>
          {status === 'open' && (
            <div className="mt-6">
              <Link
                to="/ideas/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Post an Idea
              </Link>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && ideas && ideas.length > 0 && (
        <>
          <div className="grid gap-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>

          {(page > 0 || hasMore) && (
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page + 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
