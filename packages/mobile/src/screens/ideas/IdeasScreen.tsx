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
import { useIdeas, useUpvoteIdea, Idea } from '../../hooks/useIdeas';
import { useAuth } from '../../hooks/useAuth';
import { IdeaCard, IdeaCardSkeleton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import type { IdeasStackScreenProps } from '../../navigation/types';

export function IdeasScreen() {
  const navigation = useNavigation<IdeasStackScreenProps<'IdeasList'>['navigation']>();
  const { isAuthenticated } = useAuth();
  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useIdeas({ limit: 10 });
  const upvoteMutation = useUpvoteIdea();

  const ideas = data?.pages.flatMap((page) => page.data) ?? [];

  const handleIdeaPress = useCallback(
    (ideaId: string) => {
      navigation.navigate('IdeaDetail', { ideaId });
    },
    [navigation]
  );

  const handleUpvote = useCallback(
    (ideaId: string) => {
      if (!isAuthenticated) {
        return;
      }
      upvoteMutation.mutate(ideaId);
    },
    [isAuthenticated, upvoteMutation]
  );

  const handleAddIdea = useCallback(() => {
    navigation.navigate('IdeaForm', {});
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Idea }) => (
      <View style={styles.cardWrapper}>
        <IdeaCard
          idea={item}
          onPress={() => handleIdeaPress(item.id)}
          onUpvote={() => handleUpvote(item.id)}
        />
      </View>
    ),
    [handleIdeaPress, handleUpvote]
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
              <IdeaCardSkeleton />
            </View>
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>😕</Text>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyText}>
            {error?.message || 'Failed to load ideas. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => refetch()}>
            <Text style={styles.emptyButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💡</Text>
        <Text style={styles.emptyTitle}>No Ideas Yet</Text>
        <Text style={styles.emptyText}>
          Have an idea for a project? Share it here!
        </Text>
        {isAuthenticated && (
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddIdea}>
            <Text style={styles.emptyButtonText}>Share an Idea</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, isError, error, isAuthenticated, handleAddIdea, refetch]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={ideas}
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
      {isAuthenticated && ideas.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddIdea}>
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
