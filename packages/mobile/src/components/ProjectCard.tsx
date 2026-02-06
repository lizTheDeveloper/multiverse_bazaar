import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { UpvoteButton } from './UpvoteButton';
import { CollaboratorAvatars } from './CollaboratorAvatars';
import { colors, spacing, typography } from '../theme';

interface Collaborator {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  upvoteCount: number;
  isUpvoted: boolean;
  collaborators: Collaborator[];
}

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onUpvote: () => void;
}

export function ProjectCard({ project, onPress, onUpvote }: ProjectCardProps) {
  return (
    <Card onPress={onPress} noPadding>
      <View style={styles.container}>
        {project.imageUrl && (
          <Image
            source={{ uri: project.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {project.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {project.description}
          </Text>
          <View style={styles.footer}>
            {project.collaborators.length > 0 && (
              <CollaboratorAvatars
                collaborators={project.collaborators}
                size="sm"
              />
            )}
            <View style={styles.upvoteContainer}>
              <UpvoteButton
                count={project.upvoteCount}
                isUpvoted={project.isUpvoted}
                onPress={onUpvote}
                size="sm"
              />
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  image: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    padding: spacing.cardPadding,
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upvoteContainer: {
    marginLeft: 'auto',
  },
});
