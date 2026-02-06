## ADDED Requirements

### Requirement: Data Minimization
Only necessary personal data is collected.

#### Scenario: Required vs optional fields
- **WHEN** a user account is created
- **THEN** only email is required (for authentication)
- **THEN** name, avatar, bio are optional and user-provided

#### Scenario: No unnecessary data collection
- **WHEN** designing data models
- **THEN** fields like date of birth, phone number, address are NOT collected
- **THEN** IP addresses are only stored in audit logs with retention limits

### Requirement: Consent-Based External Invitations
External collaborators must consent before account creation.

#### Scenario: Invitation flow (not immediate account creation)
- **WHEN** a user invites an external email as collaborator
- **THEN** a pending_invitation record is created (NOT a user account)
- **THEN** an invitation email is sent with a unique accept link
- **THEN** the invitation expires after 30 days

#### Scenario: Accepting invitation
- **WHEN** an invitee clicks the accept link
- **THEN** they see a consent screen explaining what account creation means
- **THEN** they must explicitly click "Accept & Create Account"
- **THEN** only then is a user record created

#### Scenario: Declining invitation
- **WHEN** an invitee clicks decline or ignores the invitation
- **THEN** no user account is created
- **THEN** the pending invitation is marked declined or expires

#### Scenario: Consent recording
- **WHEN** an external user accepts an invitation
- **THEN** a consent record is created with timestamp, IP, consent type

### Requirement: Right to Access (GDPR Art. 15)
Users can request a copy of their personal data.

#### Scenario: Data export endpoint
- **WHEN** an authenticated user requests GET /me/data-export
- **THEN** they receive a JSON file containing all their personal data
- **THEN** the export includes: profile, projects, ideas, upvotes, collaborations, settings

#### Scenario: Export format
- **WHEN** a data export is generated
- **THEN** it is machine-readable JSON
- **THEN** it includes metadata: export date, data controller info

#### Scenario: Export audit
- **WHEN** a data export is requested
- **THEN** the request is logged in data_requests table
- **THEN** the user receives confirmation of the export

### Requirement: Right to Erasure (GDPR Art. 17)
Users can request deletion of their account and data.

#### Scenario: Deletion request endpoint
- **WHEN** an authenticated user requests DELETE /me
- **THEN** they are asked to confirm and choose deletion options

#### Scenario: Deletion options
- **WHEN** requesting deletion
- **THEN** user can choose: "Delete all my projects" or "Anonymize my contributions"
- **THEN** default is anonymization (preserves community value)

#### Scenario: Anonymization process
- **WHEN** anonymization is chosen
- **THEN** user's name is replaced with "[Deleted User]"
- **THEN** user's email is replaced with a hash
- **THEN** avatar and bio are cleared
- **THEN** projects and ideas remain but show anonymous creator
- **THEN** upvotes remain but are de-linked from identity

#### Scenario: Full deletion process
- **WHEN** full deletion is chosen
- **THEN** all user's projects are deleted (collaborators lose access)
- **THEN** all user's ideas are deleted
- **THEN** all user's upvotes are removed
- **THEN** all collaborator records are removed
- **THEN** user record is hard deleted after 30-day grace period

#### Scenario: Deletion grace period
- **WHEN** deletion is requested
- **THEN** account is marked for deletion with 30-day grace period
- **THEN** user can cancel deletion during grace period
- **THEN** after 30 days, deletion is finalized and irreversible

#### Scenario: Deletion confirmation
- **WHEN** deletion is processed
- **THEN** confirmation email is sent to user's email
- **THEN** request is logged in data_requests table

### Requirement: Right to Rectification (GDPR Art. 16)
Users can correct their personal data.

#### Scenario: Profile updates
- **WHEN** a user updates their profile via PATCH /me
- **THEN** they can correct: name, bio, avatar
- **THEN** email changes may require re-verification

### Requirement: Right to Data Portability (GDPR Art. 20)
Users can receive their data in a portable format.

#### Scenario: Portable export
- **WHEN** GET /me/data-export is requested
- **THEN** format is structured, commonly used (JSON)
- **THEN** data can be imported into another system

### Requirement: Privacy Settings
Users can control privacy preferences.

#### Scenario: Privacy settings endpoint
- **WHEN** an authenticated user accesses GET/PATCH /me/privacy-settings
- **THEN** they can view and update their privacy preferences

#### Scenario: Available settings
- **WHEN** privacy settings are configured
- **THEN** options include: show_email_on_profile (default: false)
- **THEN** options include: include_in_search (default: true)
- **THEN** options include: show_activity_publicly (default: false)

#### Scenario: Notification preferences
- **WHEN** configuring notifications
- **THEN** user can opt out of: upvote notifications, collaboration invites
- **THEN** opting out is granular per notification type

### Requirement: Data Retention Limits
Personal data is not retained indefinitely.

#### Scenario: Pending invitation expiry
- **WHEN** a pending invitation is older than 30 days
- **THEN** it is automatically deleted by a scheduled job

#### Scenario: Inactive push token cleanup
- **WHEN** a push token has been inactive for 90 days
- **THEN** it is automatically deleted

#### Scenario: Audit log retention
- **WHEN** audit logs with personal identifiers are older than 1 year
- **THEN** they are anonymized (user ID replaced with hash)
- **THEN** anonymized logs are retained for 3 years total, then deleted

#### Scenario: Orphaned file cleanup
- **WHEN** an uploaded file is not referenced by any project for 30 days
- **THEN** it is automatically deleted

#### Scenario: Soft-deleted user cleanup
- **WHEN** a user has been soft-deleted for 30 days
- **THEN** hard deletion or anonymization is finalized

### Requirement: Image Privacy
Uploaded images do not leak personal information.

#### Scenario: EXIF metadata removal
- **WHEN** an image is uploaded
- **THEN** all EXIF metadata is stripped (GPS, camera, timestamps, etc.)

#### Scenario: Image storage privacy
- **WHEN** images are stored
- **THEN** filenames are UUIDs with no PII
- **THEN** original filenames are not retained

### Requirement: Consent Records
Consent is recorded for audit purposes.

#### Scenario: Consent record creation
- **WHEN** a user gives consent (account creation, notifications, etc.)
- **THEN** a consent_record is created with: user_id, type, timestamp, IP

#### Scenario: Consent withdrawal
- **WHEN** a user withdraws consent (e.g., disables notifications)
- **THEN** the consent_record is updated with revoked_at timestamp

#### Scenario: Consent audit trail
- **WHEN** consent records are stored
- **THEN** they are retained for compliance purposes
- **THEN** they can be exported as part of data export

### Requirement: Third-Party Data Sharing Transparency
Users know what data is shared with third parties.

#### Scenario: Push notification tokens
- **WHEN** push notifications are enabled
- **THEN** user is informed that FCM tokens are shared with Google
- **THEN** this is documented in privacy policy

#### Scenario: Image storage
- **WHEN** images are uploaded
- **THEN** user is informed images are stored in Google Cloud Storage
- **THEN** this is documented in privacy policy

### Requirement: Privacy Policy Endpoint
The privacy policy is accessible programmatically.

#### Scenario: Privacy policy availability
- **WHEN** GET /privacy-policy is requested
- **THEN** the current privacy policy is returned
- **THEN** the policy version and last updated date are included

### Requirement: Data Breach Procedures
Procedures exist for handling data breaches.

#### Scenario: Breach notification readiness
- **WHEN** a data breach is detected
- **THEN** a documented procedure exists for: containment, assessment, notification
- **THEN** affected users can be notified within 72 hours (GDPR requirement)
- **THEN** relevant supervisory authority can be notified

#### Scenario: Breach logging
- **WHEN** a potential breach is detected
- **THEN** it is logged with: timestamp, nature, scope, actions taken
