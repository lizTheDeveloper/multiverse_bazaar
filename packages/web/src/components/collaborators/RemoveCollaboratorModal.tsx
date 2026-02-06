import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useRemoveCollaborator } from '@/hooks/useCollaborators';
import type { Collaborator } from '@/types';

export interface RemoveCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborator: Collaborator;
  projectId: string;
}

const RemoveCollaboratorModal: React.FC<RemoveCollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaborator,
  projectId,
}) => {
  const [toast, setToast] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  const removeCollaborator = useRemoveCollaborator(projectId);

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

  const handleRemove = async () => {
    try {
      await removeCollaborator.mutateAsync(collaborator.id);
      setToast({
        variant: 'success',
        message: 'Collaborator removed successfully!',
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error?.data?.error || 'Failed to remove collaborator. Please try again.';
      setToast({
        variant: 'error',
        message: errorMessage,
      });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Remove Collaborator"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to remove this collaborator from the project?
          </p>

          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <Avatar
              src={collaborator.user.avatar_url}
              alt={collaborator.user.name}
              fallback={collaborator.user.name}
              size="md"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {collaborator.user.name}
              </p>
              <p className="text-sm text-gray-500">{collaborator.user.email}</p>
            </div>
            <Badge variant={getRoleBadgeVariant(collaborator.role)}>
              {getRoleLabel(collaborator.role)}
            </Badge>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <p className="font-medium mb-1">Warning:</p>
            <p>
              This action cannot be undone. The collaborator will lose access to the
              project immediately.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={removeCollaborator.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleRemove}
              loading={removeCollaborator.isPending}
              disabled={removeCollaborator.isPending}
            >
              Remove Collaborator
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default RemoveCollaboratorModal;
