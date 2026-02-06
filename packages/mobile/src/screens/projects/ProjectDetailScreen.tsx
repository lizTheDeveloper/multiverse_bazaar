import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProject, useUpvoteProject, useDeleteProject } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { UpvoteButton, CollaboratorAvatars, Avatar } from '../../components';
import { colors, spacing, typography } from '../../theme';
import type { ProjectsStackScreenProps } from '../../navigation/types';

type Props = ProjectsStackScreenProps<'ProjectDetail'>;

export function ProjectDetailScreen({ route }: Props) {
  const { projectId } = route.params;
  const navigation = useNavigation<Props['navigation']>();
  const { user, isAuthenticated } = useAuth();
  const { data: project, isLoading, error } = useProject(projectId);
  const upvoteMutation = useUpvoteProject();
  const deleteMutation = useDeleteProject();

  const isOwner = project?.collaborators.some(
    (c) => c.id === user?.id && c.role === 'owner'
  );

  const handleUpvote = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to upvote projects.');
      return;
    }
    upvoteMutation.mutate(projectId);
  }, [isAuthenticated, upvoteMutation, projectId]);

  const handleEdit = useCallback(() => {
    navigation.navigate('ProjectForm', { projectId });
  }, [navigation, projectId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(projectId, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ]
    );
  }, [deleteMutation, projectId, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !project) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['left', 'right', 'bottom']}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {project.imageUrl && (
          <Image source={{ uri: project.imageUrl }} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{project.title}</Text>
            <UpvoteButton
              count={project.upvoteCount}
              isUpvoted={project.isUpvoted}
              onPress={handleUpvote}
            />
          </View>

          <Text style={styles.description}>{project.description}</Text>

          {project.collaborators.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Team</Text>
              <View style={styles.collaboratorsList}>
                {project.collaborators.map((collaborator) => (
                  <View key={collaborator.id} style={styles.collaborator}>
                    <Avatar
                      source={collaborator.avatarUrl}
                      name={collaborator.name}
                      size="md"
                    />
                    <View style={styles.collaboratorInfo}>
                      <Text style={styles.collaboratorName}>{collaborator.name}</Text>
                      <Text style={styles.collaboratorRole}>
                        {collaborator.role === 'owner' ? 'Owner' : 'Collaborator'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.meta}>
            <Text style={styles.metaText}>
              Created {new Date(project.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>Edit Project</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.screenHorizontal,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  backButtonText: {
    ...typography.button,
    color: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: spacing.screenHorizontal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  collaboratorsList: {
    gap: spacing.md,
  },
  collaborator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collaboratorInfo: {
    marginLeft: spacing.md,
  },
  collaboratorName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  collaboratorRole: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  metaText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.buttonPaddingVertical,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.button,
    color: colors.white,
  },
  deleteButton: {
    backgroundColor: colors.gray100,
    paddingVertical: spacing.buttonPaddingVertical,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...typography.button,
    color: colors.error,
  },
});
