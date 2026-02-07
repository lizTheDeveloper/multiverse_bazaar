# Notifications Module

In-app notifications with push notification support.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /notifications | Yes | List user's notifications |
| PATCH | /notifications/:id/read | Yes | Mark as read |
| POST | /notifications/read-all | Yes | Mark all as read |
| DELETE | /notifications/:id | Yes | Delete notification |
| POST | /notifications/push-token | Yes | Register push token |
| DELETE | /notifications/push-token | Yes | Unregister push token |

## Notification Types

| Type | Trigger |
|------|---------|
| UPVOTE | Someone upvotes your project/idea |
| COLLABORATION_INVITE | Invited to collaborate |
| IDEA_INTEREST | Someone expresses interest in your idea |

## Models

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'UPVOTE' | 'COLLABORATION_INVITE' | 'IDEA_INTEREST';
  title: string;
  body: string;
  data?: object;   // Type-specific payload
  read: boolean;
  createdAt: Date;
}

interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: 'IOS' | 'ANDROID';
  lastUsedAt: Date;
}
```

## Push Notifications

Mobile apps register push tokens:
```json
// POST /notifications/push-token
{
  "token": "ExponentPushToken[...]",
  "platform": "IOS"
}
```

Tokens are used to send push notifications via Expo.

## Service Usage

Other modules send notifications via service:
```typescript
await notificationService.create({
  userId: recipientId,
  type: 'UPVOTE',
  title: 'New Upvote!',
  body: 'Someone upvoted your project',
  data: { projectId, upvoterId }
});
```

## Cleanup Jobs

- Expired push tokens cleaned by scheduled job
- Old notifications may be auto-deleted
