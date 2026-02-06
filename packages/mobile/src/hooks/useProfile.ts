import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { storage } from '../lib/storage';

interface UserProject {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  role: 'owner' | 'collaborator';
  upvoteCount: number;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  karma: number;
  projectCount: number;
  upvotesReceived: number;
  projects: UserProject[];
  createdAt: string;
}

interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

const PROFILE_KEY = 'profile';
const MY_PROFILE_KEY = 'my-profile';

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: userId ? [PROFILE_KEY, userId] : [MY_PROFILE_KEY],
    queryFn: () => api.get<Profile>(userId ? `/users/${userId}` : '/users/me'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => api.patch<Profile>('/users/me', data),
    onSuccess: async (data) => {
      queryClient.setQueryData([MY_PROFILE_KEY], data);
      // Also update stored user
      await storage.setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        karma: data.karma,
      });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      } as unknown as Blob);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/me/avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${await storage.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      return response.json() as Promise<{ avatarUrl: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_PROFILE_KEY] });
    },
  });
}
