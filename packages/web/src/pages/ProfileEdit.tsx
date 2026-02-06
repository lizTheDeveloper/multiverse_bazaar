import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../lib/api';
import { ProfileEditForm } from '../components/profiles/ProfileEditForm';
import type { User } from '../types';

export function ProfileEdit() {
  const navigate = useNavigate();

  // Get current user
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: () => auth.me(),
  });

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-2 text-gray-600">
          Update your profile information and avatar
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <ProfileEditForm
          user={user}
          onSuccess={() => navigate(`/users/${user.id}`)}
          onCancel={() => navigate(`/users/${user.id}`)}
        />
      </div>
    </div>
  );
}
