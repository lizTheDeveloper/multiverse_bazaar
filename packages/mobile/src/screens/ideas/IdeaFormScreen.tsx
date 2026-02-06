import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { IdeasStackScreenProps } from '../../navigation/types';
import {
  useIdea,
  useCreateIdea,
  useUpdateIdea,
  useDeleteIdea,
} from '../../hooks/useIdeas';
import { Button } from '../../components';
import { colors, spacing, typography } from '../../theme';

type Props = IdeasStackScreenProps<'IdeaForm'>;

export function IdeaFormScreen({ route }: Props) {
  const navigation = useNavigation();
  const ideaId = route.params?.ideaId;
  const isEditing = !!ideaId;

  const { data: existingIdea, isLoading: isLoadingIdea } = useIdea(ideaId ?? '');

  const createMutation = useCreateIdea();
  const updateMutation = useUpdateIdea();
  const deleteMutation = useDeleteIdea();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (existingIdea) {
      setTitle(existingIdea.title);
      setDescription(existingIdea.description);
    }
  }, [existingIdea]);

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
    if (description.trim().length < 20) {
      Alert.alert('Validation Error', 'Description must be at least 20 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && ideaId) {
        await updateMutation.mutateAsync({
          id: ideaId,
          title: title.trim(),
          description: description.trim(),
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim(),
        });
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save idea. Please try again.');
    }
  }, [title, description, isEditing, ideaId, createMutation, updateMutation, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Idea',
      'Are you sure you want to delete this idea? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (ideaId) {
                await deleteMutation.mutateAsync(ideaId);
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete idea. Please try again.');
            }
          },
        },
      ]
    );
  }, [ideaId, deleteMutation, navigation]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  if (isEditing && isLoadingIdea) {
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
        <View style={styles.header}>
          <Text style={styles.headerIcon}>💡</Text>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Your Idea' : 'Share Your Idea'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Describe your project idea and let others know you're looking for collaborators.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your idea a catchy title"
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
              placeholder="Describe your idea in detail. What problem does it solve? What skills are you looking for in collaborators?"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
              editable={!isSaving}
            />
            <Text style={styles.charCount}>{description.length}/2000</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={isEditing ? 'Save Changes' : 'Post Idea'}
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
                <Text style={styles.deleteButtonText}>Delete Idea</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
    minHeight: 160,
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
