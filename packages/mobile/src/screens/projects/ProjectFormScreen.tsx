import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { ProjectsStackScreenProps } from '../../navigation/types';
import {
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../../hooks/useProjects';
import { api } from '../../lib/api';
import { Button } from '../../components';
import { colors, spacing, typography } from '../../theme';

type Props = ProjectsStackScreenProps<'ProjectForm'>;

export function ProjectFormScreen({ route }: Props) {
  const navigation = useNavigation();
  const projectId = route.params?.projectId;
  const isEditing = !!projectId;

  const { data: existingProject, isLoading: isLoadingProject } = useProject(
    projectId ?? ''
  );

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (existingProject) {
      setTitle(existingProject.title);
      setDescription(existingProject.description);
      if (existingProject.imageUrl) {
        setImageUri(existingProject.imageUrl);
      }
    }
  }, [existingProject]);

  const handlePickImage = useCallback(async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'}.`
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSelectImage = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Image'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: imageUri ? 3 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePickImage('camera');
          } else if (buttonIndex === 2) {
            handlePickImage('library');
          } else if (buttonIndex === 3) {
            setImageUri(null);
          }
        }
      );
    } else {
      const options: Array<{ text: string; style?: 'cancel' | 'default' | 'destructive'; onPress?: () => void }> = [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => { handlePickImage('camera'); } },
        { text: 'Choose from Library', onPress: () => { handlePickImage('library'); } },
      ];
      if (imageUri) {
        options.push({
          text: 'Remove Image',
          onPress: () => setImageUri(null),
        });
      }
      Alert.alert('Project Image', 'Choose an option', options);
    }
  }, [handlePickImage, imageUri]);

  const uploadImage = async (uri: string): Promise<string | undefined> => {
    // If the URI is already a remote URL, no need to upload
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri,
        name: filename,
        type,
      } as unknown as Blob);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'}/upload/image`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return undefined;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert('Validation Error', 'Title must be at least 3 characters');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return false;
    }
    if (description.trim().length < 10) {
      Alert.alert('Validation Error', 'Description must be at least 10 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      let finalImageUrl: string | undefined;

      // Upload image if changed
      if (imageUri) {
        finalImageUrl = await uploadImage(imageUri);
        if (imageUri && !finalImageUrl) {
          // Upload failed, don't proceed
          return;
        }
      }

      if (isEditing && projectId) {
        await updateMutation.mutateAsync({
          id: projectId,
          title: title.trim(),
          description: description.trim(),
          imageUrl: finalImageUrl,
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          imageUrl: finalImageUrl,
        });
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save project. Please try again.');
    }
  }, [
    title,
    description,
    imageUri,
    isEditing,
    projectId,
    createMutation,
    updateMutation,
    navigation,
  ]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (projectId) {
                await deleteMutation.mutateAsync(projectId);
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            }
          },
        },
      ]
    );
  }, [projectId, deleteMutation, navigation]);

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    isUploadingImage;
  const isDeleting = deleteMutation.isPending;

  if (isEditing && isLoadingProject) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleSelectImage}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>Add Project Image</Text>
              <Text style={styles.imagePlaceholderHint}>16:9 aspect ratio recommended</Text>
            </View>
          )}
          {imageUri && (
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>Change Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter project title"
              placeholderTextColor={colors.textTertiary}
              maxLength={100}
              editable={!isSaving}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your project..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
              editable={!isSaving}
            />
            <Text style={styles.charCount}>{description.length}/2000</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={isEditing ? 'Save Changes' : 'Create Project'}
            onPress={handleSubmit}
            loading={isSaving}
            fullWidth
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            disabled={isSaving || isDeleting}
            fullWidth
          />

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Project</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.screenHorizontal,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    marginBottom: spacing.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  imagePlaceholderText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  imagePlaceholderHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.sm,
    alignItems: 'center',
  },
  imageOverlayText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '500',
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.inputPadding,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  deleteButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
  },
});
