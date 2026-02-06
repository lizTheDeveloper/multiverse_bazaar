## ADDED Requirements

### Requirement: Authentication Hardening
Authentication endpoints are protected against abuse.

#### Scenario: Login rate limiting
- **WHEN** more than 5 login attempts occur for the same email within 15 minutes
- **THEN** further attempts are blocked with 429 Too Many Requests
- **THEN** the response does not reveal whether the email exists

#### Scenario: Email enumeration prevention
- **WHEN** a login attempt is made with an unknown email
- **THEN** the response message is identical to a known email failure timing-wise
- **THEN** the message says "If this email is registered, check your inbox" (for magic link) or generic error

#### Scenario: Token expiration
- **WHEN** an access token is issued
- **THEN** it expires after 15 minutes
- **THEN** a refresh token (7 day expiry) is also issued for token renewal

#### Scenario: Secure token storage (web)
- **WHEN** tokens are stored in the web client
- **THEN** the access token is stored in memory only
- **THEN** the refresh token is stored in an httpOnly, secure, sameSite=strict cookie

#### Scenario: Token revocation on logout
- **WHEN** a user logs out
- **THEN** their refresh token is added to a revocation list
- **THEN** subsequent requests with that token are rejected

### Requirement: Authorization Middleware
All protected endpoints verify user permissions.

#### Scenario: Centralized authorization
- **WHEN** any protected endpoint is accessed
- **THEN** authorization is checked via a centralized authorize() function
- **THEN** the function verifies resource ownership or role-based access

#### Scenario: Project modification authorization
- **WHEN** a user attempts to update or delete a project
- **THEN** authorization verifies they are a collaborator with "creator" role

#### Scenario: Idea modification authorization
- **WHEN** a user attempts to update, delete, or view interests on an idea
- **THEN** authorization verifies they are the idea creator

#### Scenario: Authorization failure logging
- **WHEN** an authorization check fails
- **THEN** the attempt is logged to the audit log with user ID, resource, and action

### Requirement: Input Validation
All user input is validated and sanitized.

#### Scenario: Schema validation
- **WHEN** a request body is received
- **THEN** it is validated against a Zod schema before processing
- **THEN** validation errors return 400 with specific field errors

#### Scenario: HTML sanitization
- **WHEN** user-generated content (title, description, bio) is stored
- **THEN** HTML is sanitized to prevent XSS (strip dangerous tags/attributes)
- **THEN** safe formatting may be preserved (if markdown is supported)

#### Scenario: URL validation
- **WHEN** a URL field is submitted (project url, repo_url)
- **THEN** it must be a valid URL format
- **THEN** repo_url must match allowed domains (github.com, gitlab.com, bitbucket.org)

#### Scenario: Size limits
- **WHEN** text fields are submitted
- **THEN** title is limited to 200 characters
- **THEN** description/bio is limited to 5000 characters
- **THEN** fields are trimmed of leading/trailing whitespace

### Requirement: File Upload Security
File uploads are validated and processed securely.

#### Scenario: File size limit
- **WHEN** a file upload is received
- **THEN** files larger than 5MB are rejected immediately
- **THEN** rejection happens before full file is read into memory

#### Scenario: MIME type validation
- **WHEN** an image file is uploaded
- **THEN** the actual file content (magic bytes) is checked, not just extension
- **THEN** only image/jpeg, image/png, image/gif, image/webp are allowed

#### Scenario: Filename security
- **WHEN** a file is stored
- **THEN** the original filename is discarded
- **THEN** a UUID-based filename is generated
- **THEN** path traversal attempts (../) are impossible

#### Scenario: EXIF stripping
- **WHEN** an image is processed
- **THEN** all EXIF metadata is removed (GPS, camera info, timestamps)
- **THEN** the image is re-encoded to ensure cleanliness

#### Scenario: Storage location
- **WHEN** files are stored
- **THEN** they are stored outside the web root
- **THEN** they are served via a dedicated endpoint with proper headers

### Requirement: Security Headers
All responses include security headers.

#### Scenario: Standard security headers
- **WHEN** any API response is sent
- **THEN** it includes: X-Content-Type-Options: nosniff
- **THEN** it includes: X-Frame-Options: DENY
- **THEN** it includes: X-XSS-Protection: 1; mode=block
- **THEN** it includes: Referrer-Policy: strict-origin-when-cross-origin

#### Scenario: Content Security Policy
- **WHEN** serving HTML or acting as a web server
- **THEN** a CSP header restricts resource loading to known sources

### Requirement: CORS Configuration
Cross-origin requests are restricted to known clients.

#### Scenario: Allowed origins
- **WHEN** a cross-origin request is received
- **THEN** only requests from allowed origins are permitted (web app domain, mobile deep link scheme)
- **THEN** wildcard (*) origins are never used
- **THEN** credentials are allowed only from trusted origins

### Requirement: Rate Limiting
API endpoints are protected against abuse.

#### Scenario: General rate limiting
- **WHEN** more than 100 requests per minute are made from one IP
- **THEN** subsequent requests receive 429 Too Many Requests

#### Scenario: Write operation rate limiting
- **WHEN** more than 10 project/idea creations are attempted per hour per user
- **THEN** subsequent attempts receive 429

#### Scenario: Upvote rate limiting
- **WHEN** more than 60 upvote operations per minute are attempted per user
- **THEN** subsequent attempts receive 429

#### Scenario: Upload rate limiting
- **WHEN** more than 20 file uploads per hour are attempted per user
- **THEN** subsequent attempts receive 429

#### Scenario: Search rate limiting
- **WHEN** more than 30 searches per minute are attempted per user/IP
- **THEN** subsequent attempts receive 429

### Requirement: Audit Logging
Security-relevant events are logged for review.

#### Scenario: Authentication events
- **WHEN** a login succeeds or fails
- **THEN** it is logged with: timestamp, email (hashed for failures), IP, user agent, success/failure

#### Scenario: Authorization failures
- **WHEN** an authorization check fails
- **THEN** it is logged with: timestamp, user ID, resource type, resource ID, action attempted, IP

#### Scenario: Data modification events
- **WHEN** a project or idea is deleted
- **THEN** it is logged with: timestamp, user ID, resource type, resource ID

#### Scenario: External user creation
- **WHEN** an external collaborator account is created
- **THEN** it is logged with: timestamp, inviter ID, invitee email (hashed), project ID

#### Scenario: Sensitive data access
- **WHEN** a data export or account deletion is requested
- **THEN** it is logged with: timestamp, user ID, request type, IP

#### Scenario: Audit log retention
- **WHEN** audit logs are stored
- **THEN** logs with user IDs are retained for 1 year
- **THEN** anonymized logs are retained for 3 years
- **THEN** logs are stored in a separate table/service from application data

### Requirement: Dependency Security
Third-party dependencies are monitored for vulnerabilities.

#### Scenario: Dependency auditing
- **WHEN** the application is built or deployed
- **THEN** npm audit (or equivalent) is run
- **THEN** high/critical vulnerabilities block deployment

#### Scenario: Regular updates
- **WHEN** dependencies are managed
- **THEN** a process exists for regular security updates
- **THEN** Dependabot or similar is configured for automated PRs
