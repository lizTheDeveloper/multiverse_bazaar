import { useParams, Link, Navigate } from 'react-router-dom';
import { useUser, useUserProjects } from '../hooks/useUser';
import { ProfileCard } from '../components/profiles/ProfileCard';
import { KarmaDisplay } from '../components/profiles/KarmaDisplay';
import { ProfileProjectsList } from '../components/profiles/ProfileProjectsList';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading: userLoading, isError } = useUser(id!);
  const { data: projects, isLoading: projectsLoading } = useUserProjects(id!);

  // Get current user from auth context (you may need to implement this)
  const currentUserId = localStorage.getItem('current_user_id'); // Placeholder
  const isOwnProfile = currentUserId === id;

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">User not found</p>
          <Link
            to="/"
            className="mt-4 inline-block text-purple-600 hover:text-purple-700"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  if (userLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Profile Card with Karma */}
        <div className="space-y-4">
          <ProfileCard user={user} />

          <div className="flex items-center justify-between">
            <KarmaDisplay karma={user.karma} />
            {isOwnProfile && (
              <Link
                to="/profile/edit"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Projects List */}
        {projectsLoading ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : (
          <ProfileProjectsList projects={projects || []} userId={id} />
        )}
      </div>
    </div>
  );
}
