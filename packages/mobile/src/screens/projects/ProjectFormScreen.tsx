import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ProjectsStackScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = ProjectsStackScreenProps<'ProjectForm'>;

export function ProjectFormScreen({ route }: Props) {
  const projectId = route.params?.projectId;
  const isEditing = !!projectId;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>{isEditing ? '✏️' : '➕'}</Text>
          <Text style={styles.placeholderText}>
            {isEditing ? 'Edit Project' : 'New Project'}
          </Text>
          {isEditing && (
            <Text style={styles.placeholderSubtext}>ID: {projectId}</Text>
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
  content: {
    padding: spacing.screenHorizontal,
    flexGrow: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  placeholderText: {
    ...typography.h3,
    color: colors.text,
  },
  placeholderSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
