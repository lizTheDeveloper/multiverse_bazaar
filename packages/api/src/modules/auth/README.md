# Auth Module

User authentication with JWT access tokens and refresh tokens.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | No | Login with email/password |
| POST | /auth/register | No | Create new account |
| POST | /auth/logout | Yes | Revoke all refresh tokens |
| POST | /auth/refresh | No | Get new access token |

## Authentication Flow

1. **Login/Register** → Returns `accessToken` + sets refresh token
2. **API Requests** → Include `Authorization: Bearer <accessToken>`
3. **Token Expired** → Call `/refresh` with refresh token
4. **Logout** → Revokes all user sessions

## Files

| File | Purpose |
|------|---------|
| `routes.ts` | HTTP endpoints with validation |
| `service.ts` | Auth logic, token generation, password hashing |
| `repository.ts` | User lookup, refresh token storage |
| `middleware.ts` | `authMiddleware` - validates JWT, sets `c.get('user')` |
| `schemas.ts` | Zod schemas for login/register/refresh |
| `types.ts` | AuthUser, LoginResult, etc. |

## Middleware Usage

```typescript
import { authMiddleware } from './modules/auth/middleware.js';

// Protected route
router.get('/me', authMiddleware(authService), async (c) => {
  const user = c.get('user'); // { id, email, name }
  return c.json(user);
});
```

## Security Features

- **Password hashing**: bcryptjs with salt
- **JWT tokens**: Short-lived access (15m default)
- **Refresh tokens**: Stored hashed in DB, longer-lived (7d default)
- **Login attempts**: Tracked for rate limiting
- **Token revocation**: Logout invalidates all sessions

## Request/Response Examples

**Login:**
```json
// POST /auth/login
{ "email": "user@example.com", "password": "secret123" }

// Response
{ "accessToken": "eyJ...", "user": { "id": "...", "email": "...", "name": "..." } }
```

**Register:**
```json
// POST /auth/register
{ "email": "new@example.com", "password": "secret123", "name": "New User" }
```
