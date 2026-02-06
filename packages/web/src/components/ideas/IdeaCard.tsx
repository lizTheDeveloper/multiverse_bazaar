import { Link } from 'react-router-dom';
import type { Idea } from '../../types';
import { truncate, formatRelativeTime } from '../../lib/utils';

interface IdeaCardProps {
  idea: Idea;
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

export function IdeaCard({ idea }: IdeaCardProps) {
  const status = statusConfig[idea.status];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Link
          to={`/ideas/${idea.id}`}
          className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          {idea.title}
        </Link>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">
        {truncate(idea.description, 150)}
      </p>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-1">Looking for:</div>
        <p className="text-sm text-gray-600">{truncate(idea.looking_for, 100)}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link
          to={`/users/${idea.creator_id}`}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
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
          <span className="font-medium">{idea.creator.name}</span>
        </Link>

        <div className="flex items-center gap-4 text-gray-500">
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
          <span>{formatRelativeTime(idea.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
