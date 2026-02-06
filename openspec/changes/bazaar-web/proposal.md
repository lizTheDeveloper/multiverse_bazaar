## Why

The Multiverse Bazaar needs a web interface where community members can browse, post, and interact with projects and ideas. The web app is the primary interface for desktop users and provides full functionality for all platform features.

## What Changes

Building a React web application with:
- Public browsing of projects and ideas (no login required)
- Authentication flow for Multiverse members
- Project gallery with search, filtering, and upvoting
- Ideas board for collaboration recruitment
- User profile pages with karma and project history
- Project/idea submission and management
- Responsive design for tablet/desktop

## Capabilities

### New Capabilities
- `web-auth`: Login/logout flow, session management, protected routes
- `web-projects`: Project gallery, detail view, submission form, edit/delete
- `web-ideas`: Ideas board, interest expression, graduation flow
- `web-profiles`: User profile pages, karma display, project portfolio
- `web-search`: Search interface with filters
- `web-upvotes`: Upvote interactions with optimistic updates
- `web-collaborators`: Team display, invite flow, role management

### Modified Capabilities
<!-- None - greenfield project -->

## Impact

- **Codebase**: New React application in `packages/web/`
- **Dependencies**: React, React Router, TanStack Query (or tRPC client), Tailwind CSS
- **Shared Code**: Uses types and API client from `packages/shared/`
- **Build**: Vite for development and production builds
