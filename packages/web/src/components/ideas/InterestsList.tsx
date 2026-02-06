import { Link } from 'react-router-dom';
import type { IdeaInterest } from '../../types';
import { formatRelativeTime } from '../../lib/utils';

interface InterestsListProps {
  interests: IdeaInterest[];
}

export function InterestsList({ interests }: InterestsListProps) {
  if (interests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No one has expressed interest yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interests.map((interest) => (
        <div
          key={interest.id}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Link
              to={`/users/${interest.user_id}`}
              className="flex-shrink-0"
            >
              {interest.user.avatar_url ? (
                <img
                  src={interest.user.avatar_url}
                  alt={interest.user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                  {interest.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to={`/users/${interest.user_id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {interest.user.name}
                </Link>
                <span className="text-sm text-gray-500">
                  {formatRelativeTime(interest.created_at)}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-1">
                {interest.user.email}
              </div>

              {interest.message && (
                <div className="mt-2 text-gray-700 bg-gray-50 rounded p-3">
                  {interest.message}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
