import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  useIdea,
  useUpvoteIdea,
  useDeleteIdea,
  useExpressInterest,
  useWithdrawInterest,
} from '../../hooks/useIdeas';
import { useAuth } from '../../hooks/useAuth';
import { UpvoteButton, Avatar, Button } from '../../components';
import { colors, spacing, typography } from '../../theme';
import type { IdeasStackScreenProps } from '../../navigation/types';

type Props = IdeasStackScreenProps<'IdeaDetail'>;

export function IdeaDetailScreen({ route }: Props) {
  const { ideaId } = route.params;
  const navigation = useNavigation<Props['navigation']>();
  const { user, isAuthenticated } = useAuth();
  const { data: idea, isLoading, error } = useIdea(ideaId);
  const upvoteMutation = useUpvoteIdea();
  const deleteMutation = useDeleteIdea();
  const expressInterestMutation = useExpressInterest();
  const withdrawInterestMutation = useWithdrawInterest();

  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');

  const isAuthor = idea?.author.id === user?.id;

  const handleUpvote = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to upvote ideas.');
      return;
    }
    upvoteMutation.mutate(ideaId);
  }, [isAuthenticated, upvoteMutation, ideaId]);

  const handleEdit = useCallback(() => {
    navigation.navigate('IdeaForm', { ideaId });
  }, [navigation, ideaId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Idea',
      'Are you sure you want to delete this idea? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(ideaId, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ]
    );
  }, [deleteMutation, ideaId, navigation]);

  const handleInterest = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to express interest.');
      return;
    }
    if (idea?.isInterested) {
      withdrawInterestMutation.mutate(ideaId);
    } else {
      setShowInterestModal(true);
    }
  }, [isAuthenticated, idea?.isInterested, ideaId, withdrawInterestMutation]);

  const handleSubmitInterest = useCallback(() => {
    expressInterestMutation.mutate(
      { ideaId, message: interestMessage.trim() || undefined },
      {
        onSuccess: () => {
          setShowInterestModal(false);
          setInterestMessage('');
        },
      }
    );
  }, [expressInterestMutation, ideaId, interestMessage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !idea) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['left', 'right', 'bottom']}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>Idea not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.authorRow}>
            <Avatar source={idea.author.avatarUrl} name={idea.author.name} size="md" />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{idea.author.name}</Text>
              <Text style={styles.timestamp}>
                {new Date(idea.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{idea.title}</Text>
          <Text style={styles.description}>{idea.description}</Text>

          <View style={styles.stats}>
            <UpvoteButton
              count={idea.upvoteCount}
              isUpvoted={idea.isUpvoted}
              onPress={handleUpvote}
            />
            <Text style={styles.statText}>
              {idea.interestedCount} interested
            </Text>
          </View>

          {!isAuthor && (
            <Button
              title={idea.isInterested ? "I'm No Longer Interested" : "I'm Interested"}
              onPress={handleInterest}
              variant={idea.isInterested ? 'secondary' : 'primary'}
              fullWidth
              loading={expressInterestMutation.isPending || withdrawInterestMutation.isPending}
            />
          )}

          {isAuthor && idea.interestedUsers && idea.interestedUsers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interested People</Text>
              <View style={styles.interestedList}>
                {idea.interestedUsers.map((user) => (
                  <View key={user.id} style={styles.interestedUser}>
                    <Avatar source={user.avatarUrl} name={user.name} size="sm" />
                    <View style={styles.interestedInfo}>
                      <Text style={styles.interestedName}>{user.name}</Text>
                      {user.message && (
                        <Text style={styles.interestedMessage}>"{user.message}"</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {isAuthor && (
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>Edit Idea</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showInterestModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInterestModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInterestModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Express Interest</Text>
            <TouchableOpacity
              onPress={handleSubmitInterest}
              disabled={expressInterestMutation.isPending}
            >
              <Text
                style={[
                  styles.modalSubmit,
                  expressInterestMutation.isPending && styles.modalSubmitDisabled,
                ]}
              >
                Submit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>
              Add a message (optional)
            </Text>
            <TextInput
              style={styles.modalInput}
              value={interestMessage}
              onChangeText={setInterestMessage}
              placeholder="Tell them why you're interested..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  content: {
    padding: spacing.screenHorizontal,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: {
    marginLeft: spacing.md,
  },
  authorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  statText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  interestedList: {
    gap: spacing.md,
  },
  interestedUser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  interestedInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  interestedName: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.text,
  },
  interestedMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  modalSubmit: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    padding: spacing.screenHorizontal,
  },
  modalLabel: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.inputPadding,
    ...typography.body,
    color: colors.text,
    minHeight: 120,
  },
});
