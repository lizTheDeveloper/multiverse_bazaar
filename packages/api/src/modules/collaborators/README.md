# Collaborators Module

Project team management with invitations and role assignments.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /projects/:id/collaborators | No | List project collaborators |
| POST | /collaborators/invite | Yes | Invite user to project |
| DELETE | /collaborators/:id | Yes | Remove collaborator |
| POST | /collaborators/leave | Yes | Leave project |
| GET | /invitations/pending | Yes | List pending invitations |
| POST | /invitations/:token/accept | Yes | Accept invitation |
| POST | /invitations/:token/decline | Yes | Decline invitation |

## Collaborator Roles

| Role | Permissions |
|------|-------------|
| CREATOR | Full control, can't be removed |
| CONTRIBUTOR | Can edit project content |
| ADVISOR | View-only, listed as advisor |

## Invitation Flow

1. Creator invites via email
2. System creates `PendingInvitation` with token
3. Invitee receives notification
4. Invitee accepts/declines via token endpoint
5. On accept: Creates `Collaborator` record

## Models

```typescript
interface Collaborator {
  id: string;
  userId: string;
  projectId: string;
  role: 'CREATOR' | 'CONTRIBUTOR' | 'ADVISOR';
  createdAt: Date;
  user: User;
}

interface PendingInvitation {
  id: string;
  email: string;
  invitedById: string;
  projectId: string;
  role: CollaboratorRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}
```

## Authorization

- **Invite**: Creator only
- **Remove**: Creator only (can't remove self)
- **Leave**: Any collaborator except creator
- **Accept/Decline**: Invitation recipient only

## Related Modules

- `projects` - Parent resource
- `notifications` - Sends invite notifications
- `users` - Collaborator profiles
