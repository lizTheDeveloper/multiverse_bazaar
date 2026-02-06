import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../theme';

interface UpvoteButtonProps {
  count: number;
  isUpvoted: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function UpvoteButton({
  count,
  isUpvoted,
  onPress,
  disabled = false,
  size = 'md',
}: UpvoteButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  async function handlePress() {
    if (disabled) return;

    setIsAnimating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();

    setTimeout(() => setIsAnimating(false), 200);
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        size === 'sm' && styles.containerSm,
        isUpvoted && styles.containerUpvoted,
        isAnimating && styles.containerAnimating,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.arrow,
          size === 'sm' && styles.arrowSm,
          isUpvoted && styles.arrowUpvoted,
        ]}
      >
        ▲
      </Text>
      <Text
        style={[
          styles.count,
          size === 'sm' && styles.countSm,
          isUpvoted && styles.countUpvoted,
        ]}
      >
        {count}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  containerSm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  containerUpvoted: {
    backgroundColor: colors.primary,
  },
  containerAnimating: {
    transform: [{ scale: 1.05 }],
  },
  arrow: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  arrowSm: {
    fontSize: 12,
  },
  arrowUpvoted: {
    color: colors.white,
  },
  count: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  countSm: {
    fontSize: typography.fontSize.xs,
  },
  countUpvoted: {
    color: colors.white,
  },
});
