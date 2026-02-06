# Changelog

All notable changes to the Multiverse Bazaar project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Web Application
- Complete web application with React, TypeScript, and Vite
- Comprehensive UI component library (Button, Card, Modal, Input, Toast, etc.)
- Authentication system with protected routes
- Full page implementations for Ideas, Projects, and Profiles
- API integration layer with React hooks
- Search functionality with result highlighting

#### Mobile Application
- Mobile app with Expo and React Native
- Push notifications support
- Profile editing with avatar upload
- Ideas and Projects tabs with full CRUD operations
- Error handling with retry functionality on Projects and Ideas screens
- EAS Build configuration for development, preview, and production
- App distribution setup for iOS and Android

#### Backend API - Core Modules
- **API Collaborators Module**: Complete CRUD operations for project collaboration management
- **API Projects Module**: Full project management functionality with repository, service, and routes
- **API Upvotes Module**: Voting system implementation with upvote tracking
- **API Users Module**: User management, profiles, and karma system
- **API Ideas Module**: Full CRUD for ideas marketplace with interest expression and graduation flow
- **API Karma Module**: Role-based calculation system with batch recalculation and featured project bonuses
- **API Search Module**: PostgreSQL full-text search with ts_vector/ts_query and relevance scoring
- **API Notifications Module**: In-app notifications with read/unread tracking and FCM push token registration

#### Backend API - Security & Infrastructure
- **File Uploads Module**: Secure file handling with magic byte validation, size limits, and EXIF stripping
- **Security Middleware**: Rate limiting, security headers, enhanced CORS, HTML sanitization, and input validation
- **Audit Logging Module**: 16 audit action types with fire-and-forget pattern and retention policies
- **Privacy/GDPR Module**: Complete data export, account deletion with grace period, and consent recording
- **Scheduled Jobs Module**: 7 automated cleanup jobs including karma recalculation and audit log management

#### Testing & Documentation
- Comprehensive integration tests (~3,800 lines covering auth, projects, upvotes, ideas, collaborators, search, notifications)
- Full application wiring with DI container
- Health check endpoint with database connectivity
- OpenSpec workflow documentation and configuration

### Changed
- Improved import consistency using explicit type imports
- Standardized button variants across components
- Enhanced semantic HTML with proper heading elements
- Enhanced API client with improved error handling
- Refined React hooks for better data fetching
- Updated router configuration
- Application routes centralized under /api/v1
- Security middleware stack applied globally
- Graceful shutdown with database and job cleanup

### Fixed
- Import path casing issues in search components
- Icon naming conflicts in Search component
- Various component refinements and bug fixes

## [0.1.0] - 2026-02-06

### Added
- Initial project setup with OpenSpec documentation
- Monorepo structure with npm workspaces
- Development tooling (ESLint, Prettier, TypeScript)
- Mobile app initialization with Expo
- Authentication with guest mode support
- Backend API Phase 1 foundations
- Projects Tab implementation
- Ideas Tab with interest functionality
- Profile Tab with editing capabilities
- Database schema Phase 2 with authentication
- Notifications system
- Image picker for project and profile images
- Development environment configuration
