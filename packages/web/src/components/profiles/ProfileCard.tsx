import type { User } from '../../types';
import { formatDate } from '../../lib/utils';

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {user.is_external && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                External Collaborator
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-gray-600 mb-4 leading-relaxed">{user.bio}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
