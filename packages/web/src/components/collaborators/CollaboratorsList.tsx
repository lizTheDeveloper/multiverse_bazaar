import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Collaborator, User } from '@/types';
import RemoveCollaboratorModal from './RemoveCollaboratorModal';

export interface CollaboratorsListProps {
  collaborators: Collaborator[];
  projectId: string;
  currentUser: User;
  isCreator: boolean;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = ({
  collaborators,
  projectId,
  currentUser,
  isCreator,
}) => {
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<Collaborator | null>(
    null
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'creator':
        return 'info';
      case 'contributor':
        return 'success';
      case 'advisor':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <>
      <div className="space-y-3">
        {collaborators.map((collaborator) => {
          const isCurrentUser = collaborator.user_id === currentUser.id;
          const canRemove = isCreator && collaborator.role !== 'creator' && !isCurrentUser;

          return (
            <div
              key={collaborator.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar
                  src={collaborator.user.avatar_url}
                  alt={collaborator.user.name}
                  fallback={collaborator.user.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/users/${collaborator.user_id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                    >
                      {collaborator.user.name}
                    </Link>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {collaborator.user.email}
                  </p>
                </div>
                <Badge variant={getRoleBadgeVariant(collaborator.role)}>
                  {getRoleLabel(collaborator.role)}
                </Badge>
              </div>

              {canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollaboratorToRemove(collaborator)}
                  className="ml-2"
                >
                  Remove
                </Button>
              )}
            </div>
          );
        })}

        {collaborators.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No collaborators yet
          </div>
        )}
      </div>

      {collaboratorToRemove && (
        <RemoveCollaboratorModal
          isOpen={true}
          onClose={() => setCollaboratorToRemove(null)}
          collaborator={collaboratorToRemove}
          projectId={projectId}
        />
      )}
    </>
  );
};

export default CollaboratorsList;
