import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProjects, useUpvoteProject, Project } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { ProjectCard, ProjectCardSkeleton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import type { ProjectsStackScreenProps } from '../../navigation/types';

export function ProjectsScreen() {
  const navigation = useNavigation<ProjectsStackScreenProps<'ProjectsList'>['navigation']>();
  const { isAuthenticated } = useAuth();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useProjects({ limit: 10, sort: 'recent' });
  const upvoteMutation = useUpvoteProject();

  const projects = data?.pages.flatMap((page) => page.projects) ?? [];

  const handleProjectPress = useCallback(
    (projectId: string) => {
      navigation.navigate('ProjectDetail', { projectId });
    },
    [navigation]
  );

  const handleUpvote = useCallback(
    (projectId: string) => {
      if (!isAuthenticated) {
        // Could show a login prompt here
        return;
      }
      upvoteMutation.mutate(projectId);
    },
    [isAuthenticated, upvoteMutation]
  );

  const handleAddProject = useCallback(() => {
    navigation.navigate('ProjectForm', {});
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Project }) => (
      <View style={styles.cardWrapper}>
        <ProjectCard
          project={item}
          onPress={() => handleProjectPress(item.id)}
          onUpvote={() => handleUpvote(item.id)}
        />
      </View>
    ),
    [handleProjectPress, handleUpvote]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.cardWrapper}>
              <ProjectCardSkeleton />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No Projects Yet</Text>
        <Text style={styles.emptyText}>
          Be the first to share a project!
        </Text>
        {isAuthenticated && (
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddProject}>
            <Text style={styles.emptyButtonText}>Create Project</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, isAuthenticated, handleAddProject]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
      {isAuthenticated && projects.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddProject}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    padding: spacing.screenHorizontal,
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  skeletonContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.white,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.screenHorizontal,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
  },
});
