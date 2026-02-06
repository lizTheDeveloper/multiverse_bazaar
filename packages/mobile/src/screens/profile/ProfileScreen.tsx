import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProfile, Profile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, Card } from '../../components';
import { colors, spacing, typography } from '../../theme';
import type { ProfileStackScreenProps } from '../../navigation/types';

type Props = ProfileStackScreenProps<'Profile'>;

interface UserProject {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  role: 'owner' | 'collaborator';
  upvoteCount: number;
}

function ProjectItem({ project }: { project: UserProject }) {
  return (
    <Card style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle} numberOfLines={1}>
          {project.title}
        </Text>
        <View
          style={[
            styles.roleBadge,
            project.role === 'owner' && styles.ownerBadge,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              project.role === 'owner' && styles.ownerText,
            ]}
          >
            {project.role === 'owner' ? 'Owner' : 'Collaborator'}
          </Text>
        </View>
      </View>
      <Text style={styles.projectDescription} numberOfLines={2}>
        {project.description}
      </Text>
      <Text style={styles.projectUpvotes}>▲ {project.upvoteCount}</Text>
    </Card>
  );
}

export function ProfileScreen({ route }: Props) {
  const navigation = useNavigation<Props['navigation']>();
  const { user, logout, isGuest } = useAuth();
  const viewingUserId = route.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;

  const { data: profile, isLoading, error } = useProfile(
    isOwnProfile ? undefined : viewingUserId
  );

  const handleEdit = useCallback(() => {
    navigation.navigate('ProfileEdit');
  }, [navigation]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  if (isGuest && isOwnProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestText}>
            Sign in to create a profile and save your progress.
          </Text>
          <TouchableOpacity style={styles.signInButton} onPress={logout}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['left', 'right', 'bottom']}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>Profile not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Avatar
            source={profile.avatarUrl}
            name={profile.name}
            size="xl"
          />
          <Text style={styles.name}>{profile.name}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.karmaContainer}>
            <Text style={styles.karmaValue}>{profile.karma}</Text>
            <Text style={styles.karmaLabel}>Karma</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.projectCount}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.upvotesReceived}</Text>
              <Text style={styles.statLabel}>Upvotes</Text>
            </View>
          </View>
        </View>

        {profile.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {profile.projects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
          </View>
        )}

        {isOwnProfile && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.h3,
    color: colors.text,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenHorizontal,
  },
  guestIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  guestTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  guestText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.buttonPaddingVertical,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  signInButtonText: {
    ...typography.button,
    color: colors.white,
  },
  scrollContent: {
    padding: spacing.screenHorizontal,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  karmaContainer: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  karmaValue: {
    ...typography.h3,
    color: colors.white,
  },
  karmaLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  projectCard: {
    marginBottom: spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  projectTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  roleBadge: {
    backgroundColor: colors.gray100,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  ownerBadge: {
    backgroundColor: colors.primaryLight,
  },
  roleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  ownerText: {
    color: colors.white,
  },
  projectDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  projectUpvotes: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  editButton: {
    backgroundColor: colors.primary,
    padding: spacing.buttonPaddingVertical,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.button,
    color: colors.white,
  },
  logoutButton: {
    backgroundColor: colors.gray100,
    padding: spacing.buttonPaddingVertical,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.error,
  },
});
