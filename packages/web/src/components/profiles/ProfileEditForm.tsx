import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from '../../types';
import { useUpdateProfile, useUploadAvatar } from '../../hooks/useUser';
import { cn } from '../../lib/utils';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  bio: z.string().max(500, 'Bio is too long').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({
  user,
  onSuccess,
  onCancel,
}: ProfileEditFormProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || '',
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Upload avatar first if changed
      if (avatarFile) {
        await uploadAvatar.mutateAsync(avatarFile);
      }

      // Then update profile
      await updateProfile.mutateAsync({
        name: data.name,
        bio: data.bio || undefined,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const currentAvatar = avatarPreview || user.avatar_url;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Picture
        </label>
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile preview"
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
          <div>
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Choose File
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="sr-only"
            />
            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className={cn(
            'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500',
            errors.name ? 'border-red-300' : 'border-gray-300'
          )}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Bio
        </label>
        <textarea
          {...register('bio')}
          id="bio"
          rows={4}
          className={cn(
            'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500',
            errors.bio ? 'border-red-300' : 'border-gray-300'
          )}
          placeholder="Tell us about yourself..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || updateProfile.isPending || uploadAvatar.isPending}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || updateProfile.isPending || uploadAvatar.isPending
            ? 'Saving...'
            : 'Save Changes'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || updateProfile.isPending || uploadAvatar.isPending}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Error Message */}
      {(updateProfile.isError || uploadAvatar.isError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            Failed to update profile. Please try again.
          </p>
        </div>
      )}
    </form>
  );
}
