import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import type { ProfileStackScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = ProfileStackScreenProps<'Profile'>;

export function ProfileScreen({ route }: Props) {
  const navigation = useNavigation<Props['navigation']>();
  const { user, logout } = useAuth();
  const viewingUserId = route.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
          <View style={styles.karmaContainer}>
            <Text style={styles.karmaLabel}>Karma</Text>
            <Text style={styles.karmaValue}>{user?.karma || 0}</Text>
          </View>
        </View>

        {isOwnProfile && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('ProfileEdit')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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
  content: {
    padding: spacing.screenHorizontal,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 48,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  karmaContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
  karmaLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
  },
  karmaValue: {
    ...typography.h3,
    color: colors.white,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
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
