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
import { useNavigation, CommonActions } from '@react-navigation/native';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  getNotificationIcon,
  Notification,
} from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components';
import { colors, spacing, typography } from '../../theme';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function NotificationItem({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const icon = getNotificationIcon(notification.type);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.notificationItem, !notification.read && styles.unread]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(notification.createdAt)}
          </Text>
        </View>
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
}

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, isGuest } = useAuth();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read
      if (!notification.read) {
        markAsReadMutation.mutate(notification.id);
      }

      // Navigate to relevant content
      if (notification.data?.projectId) {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'ProjectsTab',
            params: {
              screen: 'ProjectDetail',
              params: { projectId: notification.data.projectId },
            },
          })
        );
      } else if (notification.data?.ideaId) {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'IdeasTab',
            params: {
              screen: 'IdeaDetail',
              params: { ideaId: notification.data.ideaId },
            },
          })
        );
      } else if (notification.data?.userId) {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'ProfileTab',
            params: {
              screen: 'Profile',
              params: { userId: notification.data.userId },
            },
          })
        );
      }
    },
    [markAsReadMutation, navigation]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={() => handleNotificationPress(item)}
      />
    ),
    [handleNotificationPress]
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>No Notifications</Text>
        <Text style={styles.emptyText}>
          You're all caught up! New notifications will appear here.
        </Text>
      </View>
    );
  }, [isLoading]);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>🔔</Text>
          <Text style={styles.guestTitle}>Sign In for Notifications</Text>
          <Text style={styles.guestText}>
            Sign in to receive notifications about upvotes and collaboration invites.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {hasUnread && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text style={styles.markAllRead}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.screenHorizontal,
    paddingBottom: 0,
  },
  markAllRead: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.screenHorizontal,
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.cardPadding,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  unread: {
    backgroundColor: colors.primaryLight + '10',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notificationBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
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
    textAlign: 'center',
  },
  guestText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
