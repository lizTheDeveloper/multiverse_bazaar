import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <View style={styles.projectCard}>
      <Skeleton width={100} height={100} borderRadius={12} />
      <View style={styles.projectContent}>
        <Skeleton width="80%" height={20} />
        <Skeleton width="100%" height={14} style={{ marginTop: spacing.xs }} />
        <Skeleton width="60%" height={14} style={{ marginTop: spacing.xs }} />
        <View style={styles.projectFooter}>
          <View style={styles.avatarRow}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: -8 }} />
            <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: -8 }} />
          </View>
          <Skeleton width={60} height={28} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

export function IdeaCardSkeleton() {
  return (
    <View style={styles.ideaCard}>
      <View style={styles.ideaHeader}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <View style={styles.ideaAuthorInfo}>
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={12} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
      <Skeleton width="90%" height={20} />
      <Skeleton width="100%" height={14} style={{ marginTop: spacing.sm }} />
      <Skeleton width="80%" height={14} style={{ marginTop: spacing.xs }} />
      <View style={styles.ideaFooter}>
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={28} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray200,
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  projectContent: {
    flex: 1,
    padding: spacing.cardPadding,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
  },
  ideaCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.cardPadding,
  },
  ideaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ideaAuthorInfo: {
    marginLeft: spacing.sm,
  },
  ideaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
});
