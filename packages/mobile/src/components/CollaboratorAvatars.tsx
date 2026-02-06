import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './ui/Avatar';
import { colors, spacing, typography } from '../theme';

interface Collaborator {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface CollaboratorAvatarsProps {
  collaborators: Collaborator[];
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export function CollaboratorAvatars({
  collaborators,
  maxVisible = 3,
  size = 'sm',
}: CollaboratorAvatarsProps) {
  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const remainingCount = collaborators.length - maxVisible;
  const avatarSize = size === 'sm' ? 'xs' : 'sm';
  const overlap = size === 'sm' ? -8 : -10;

  return (
    <View style={styles.container}>
      {visibleCollaborators.map((collaborator, index) => (
        <View
          key={collaborator.id}
          style={[
            styles.avatarWrapper,
            { marginLeft: index === 0 ? 0 : overlap, zIndex: maxVisible - index },
          ]}
        >
          <Avatar
            source={collaborator.avatarUrl}
            name={collaborator.name}
            size={avatarSize}
            style={styles.avatar}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.remainingBadge,
            size === 'sm' && styles.remainingBadgeSm,
            { marginLeft: overlap },
          ]}
        >
          <Text
            style={[
              styles.remainingText,
              size === 'sm' && styles.remainingTextSm,
            ]}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 100,
  },
  avatar: {
    borderWidth: 0,
  },
  remainingBadge: {
    backgroundColor: colors.gray200,
    borderRadius: 100,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  remainingBadgeSm: {
    width: 24,
    height: 24,
  },
  remainingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  remainingTextSm: {
    fontSize: 10,
  },
});
