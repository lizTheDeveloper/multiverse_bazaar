import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { Avatar } from './ui/Avatar';
import { UpvoteButton } from './UpvoteButton';
import { colors, spacing, typography } from '../theme';

interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  author: Author;
  upvoteCount: number;
  isUpvoted: boolean;
  interestedCount: number;
  createdAt: string;
}

interface IdeaCardProps {
  idea: Idea;
  onPress: () => void;
  onUpvote: () => void;
}

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

export function IdeaCard({ idea, onPress, onUpvote }: IdeaCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Avatar
          source={idea.author.avatarUrl}
          name={idea.author.name}
          size="sm"
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{idea.author.name}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(idea.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {idea.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {idea.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {idea.interestedCount} interested
          </Text>
        </View>
        <UpvoteButton
          count={idea.upvoteCount}
          isUpvoted={idea.isUpvoted}
          onPress={onUpvote}
          size="sm"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorInfo: {
    marginLeft: spacing.sm,
  },
  authorName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
