# Privacy Module

User privacy settings and data request management (GDPR compliance).

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /me/privacy | Yes | Get privacy settings |
| PATCH | /me/privacy | Yes | Update privacy settings |
| POST | /me/data-request | Yes | Request data export/deletion |
| GET | /me/data-request | Yes | Get data request status |
| DELETE | /me/account | Yes | Request account deletion |

## Privacy Settings

```typescript
interface PrivacySettings {
  showEmailOnProfile: boolean;   // Email visible publicly
  includeInSearch: boolean;      // Appear in search results
  showActivityPublicly: boolean; // Activity feed visible
}
```

## Data Requests

GDPR-compliant data handling:

```typescript
interface DataRequest {
  id: string;
  userId: string;
  requestType: 'EXPORT' | 'DELETION';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  options?: object;
  requestedAt: Date;
  completedAt?: Date;
}
```

## Data Export

Request full data export:
```json
// POST /me/data-request
{
  "requestType": "EXPORT",
  "options": {
    "includeProjects": true,
    "includeIdeas": true,
    "includeComments": true
  }
}
```

Export processed by background job, download link provided when complete.

## Account Deletion

Soft delete flow:
1. User requests deletion
2. `deletionRequestedAt` set on user
3. Grace period (e.g., 30 days)
4. Background job finalizes deletion
5. Data anonymized, not fully deleted

## Consent Records

```typescript
interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;  // e.g., 'marketing', 'analytics'
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

## Files

| File | Purpose |
|------|---------|
| `routes.ts` | Privacy endpoints |
| `service.ts` | Privacy logic, data request handling |
| `repository.ts` | Settings and consent storage |
| `types.ts` | PrivacySettings, DataRequest interfaces |

## Related Modules

- `users` - Privacy settings stored on user
- `jobs` - Processes data requests
- `audit` - Logs privacy-related actions
