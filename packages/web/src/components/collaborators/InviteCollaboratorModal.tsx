import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { useInviteCollaborator } from '@/hooks/useCollaborators';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['contributor', 'advisor']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [toast, setToast] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  const inviteCollaborator = useInviteCollaborator(projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'contributor',
    },
  });

  const handleClose = () => {
    reset();
    setToast(null);
    onClose();
  };

  const onSubmit = async (data: InviteFormData) => {
    try {
      await inviteCollaborator.mutateAsync(data);
      setToast({
        variant: 'success',
        message: 'Collaborator invited successfully!',
      });
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      let errorMessage = 'Failed to invite collaborator. Please try again.';

      if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (error?.status === 409) {
        errorMessage = 'This user is already a collaborator on this project.';
      } else if (error?.status === 404) {
        errorMessage = 'User not found. An invitation will be sent to create an external account.';
      }

      setToast({
        variant: 'error',
        message: errorMessage,
      });
    }
  };

  const roleOptions = [
    { value: 'contributor', label: 'Contributor' },
    { value: 'advisor', label: 'Advisor' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Invite Collaborator"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Select
            label="Role"
            options={roleOptions}
            error={errors.role?.message}
            {...register('role')}
          />

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Role Descriptions:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>
                <strong>Contributor:</strong> Can actively work on the project and make changes
              </li>
              <li>
                <strong>Advisor:</strong> Provides guidance and feedback on the project
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={inviteCollaborator.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={inviteCollaborator.isPending}
              disabled={inviteCollaborator.isPending}
            >
              Send Invitation
            </Button>
          </div>
        </form>
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

export default InviteCollaboratorModal;
