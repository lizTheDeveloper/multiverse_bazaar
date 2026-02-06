import React from 'react';
import Avatar from '@/components/ui/Avatar';
import type { Collaborator } from '@/types';
import { cn } from '@/lib/utils';

export interface CollaboratorAvatarsProps {
  collaborators: Collaborator[];
  maxDisplay?: number;
  onClick?: () => void;
  className?: string;
}

const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({
  collaborators,
  maxDisplay = 4,
  onClick,
  className,
}) => {
  const displayedCollaborators = collaborators.slice(0, maxDisplay);
  const remainingCount = Math.max(0, collaborators.length - maxDisplay);

  const containerClasses = cn(
    'flex items-center',
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  );

  return (
    <div className={containerClasses} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="flex -space-x-2">
        {displayedCollaborators.map((collaborator, index) => (
          <div
            key={collaborator.id}
            className="relative ring-2 ring-white rounded-full"
            style={{ zIndex: displayedCollaborators.length - index }}
            title={collaborator.user.name}
          >
            <Avatar
              src={collaborator.user.avatar_url}
              alt={collaborator.user.name}
              fallback={collaborator.user.name}
              size="sm"
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="relative ring-2 ring-white rounded-full"
            style={{ zIndex: 0 }}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
              +{remainingCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorAvatars;
