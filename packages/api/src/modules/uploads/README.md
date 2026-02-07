# Uploads Module

File upload handling for images and avatars.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /uploads/image | Yes | Upload project image |
| POST | /uploads/avatar | Yes | Upload user avatar |
| GET | /uploads/:filename | No | Serve uploaded file |
| DELETE | /uploads/:filename | Yes | Delete uploaded file |

## Upload Limits

- Max file size: 5MB (configurable via `MAX_FILE_SIZE`)
- Allowed types: image/jpeg, image/png, image/gif, image/webp
- Rate limit: 20 uploads per hour per user

## Request Format

Multipart form data:
```
POST /uploads/image
Content-Type: multipart/form-data

image: [binary file data]
```

## Response

```json
{
  "url": "http://localhost:3000/uploads/abc123-image.jpg",
  "filename": "abc123-image.jpg"
}
```

## Storage

- Files stored in `UPLOAD_DIR` (default: ./uploads)
- Filenames prefixed with UUID for uniqueness
- Original filename preserved in database

## Model

```typescript
interface Upload {
  id: string;
  filename: string;      // UUID-prefixed filename
  originalName: string;  // Original filename
  mimeType: string;
  size: number;          // Bytes
  path: string;          // Filesystem path
  uploadedBy: string;    // User ID
  createdAt: Date;
}
```

## Cleanup

- Orphaned files (not referenced) cleaned by scheduled job
- Files for deleted users removed on account deletion

## Files

| File | Purpose |
|------|---------|
| `routes.ts` | Upload/serve endpoints |
| `service.ts` | File processing, validation |
| `repository.ts` | Upload record management |
| `utils.ts` | File type validation, path utilities |
| `types.ts` | Upload interface |
