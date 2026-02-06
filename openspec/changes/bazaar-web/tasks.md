## 1. Project Setup

- [ ] 1.1 Initialize `packages/web/` with Vite + React + TypeScript
- [ ] 1.2 Configure Tailwind CSS
- [ ] 1.3 Set up React Router with basic route structure
- [ ] 1.4 Configure TanStack Query provider
- [ ] 1.5 Set up ESLint and Prettier (extend root config)
- [ ] 1.6 Create API client using shared package types

## 2. Layout & UI Components

- [ ] 2.1 Create base UI components: Button, Card, Modal, Input, Textarea
- [ ] 2.2 Create Header component with navigation and search bar
- [ ] 2.3 Create Footer component
- [ ] 2.4 Create Page wrapper component with consistent padding/max-width
- [ ] 2.5 Create responsive grid layout for galleries
- [ ] 2.6 Create loading spinners and skeleton components

## 3. Authentication

- [ ] 3.1 Create auth context and useAuth hook
- [ ] 3.2 Build Login page with email form
- [ ] 3.3 Implement token storage and retrieval
- [ ] 3.4 Create ProtectedRoute component
- [ ] 3.5 Add user menu dropdown in header (profile, logout)
- [ ] 3.6 Handle 401 responses globally (logout + redirect)

## 4. Projects Gallery

- [ ] 4.1 Create ProjectCard component
- [ ] 4.2 Build Projects page with grid layout
- [ ] 4.3 Implement pagination (infinite scroll or numbered)
- [ ] 4.4 Add filter controls (status, featured)
- [ ] 4.5 Create useProjects hook with TanStack Query

## 5. Project Detail

- [ ] 5.1 Build ProjectDetail page
- [ ] 5.2 Display collaborators list with roles
- [ ] 5.3 Add upvote button with count
- [ ] 5.4 Show edit/delete buttons for creators
- [ ] 5.5 Add external links (website, repo)

## 6. Project CRUD

- [ ] 6.1 Create project form component (reused for new/edit)
- [ ] 6.2 Build ProjectNew page
- [ ] 6.3 Build ProjectEdit page
- [ ] 6.4 Implement image upload with preview
- [ ] 6.5 Add delete confirmation modal
- [ ] 6.6 Create useProjectMutations hook

## 7. Upvotes

- [ ] 7.1 Create UpvoteButton component
- [ ] 7.2 Implement optimistic updates with TanStack Query
- [ ] 7.3 Handle upvote toggle (add/remove)
- [ ] 7.4 Add visual feedback (animation)
- [ ] 7.5 Handle unauthenticated users (prompt login)

## 8. Ideas Board

- [ ] 8.1 Create IdeaCard component
- [ ] 8.2 Build Ideas page with list layout
- [ ] 8.3 Implement pagination
- [ ] 8.4 Add status filter (default: open only)
- [ ] 8.5 Create useIdeas hook

## 9. Idea Detail & CRUD

- [ ] 9.1 Build IdeaDetail page
- [ ] 9.2 Show "I'm Interested" button for non-creators
- [ ] 9.3 Show interested users list for creators
- [ ] 9.4 Build IdeaNew page with form
- [ ] 9.5 Implement idea editing
- [ ] 9.6 Add "Graduate to Project" flow

## 10. User Profiles

- [ ] 10.1 Build Profile page
- [ ] 10.2 Display karma with visual treatment
- [ ] 10.3 Show projects list with role badges
- [ ] 10.4 Build ProfileEdit page
- [ ] 10.5 Implement avatar upload
- [ ] 10.6 Add external collaborator badge

## 11. Collaborators

- [ ] 11.1 Create CollaboratorsList component for project detail
- [ ] 11.2 Build InviteCollaborator modal/form
- [ ] 11.3 Implement remove collaborator with confirmation
- [ ] 11.4 Add "Leave Project" button for non-creators

## 12. Search

- [ ] 12.1 Create SearchBar component in header
- [ ] 12.2 Build Search results page
- [ ] 12.3 Implement type filters (all/projects/ideas)
- [ ] 12.4 Add URL state for query and filters
- [ ] 12.5 Handle empty results gracefully
- [ ] 12.6 Add search result highlighting

## 13. Home Page

- [ ] 13.1 Design and build home/landing page
- [ ] 13.2 Show featured projects section
- [ ] 13.3 Show recent activity or trending
- [ ] 13.4 Add call-to-action for posting

## 14. Polish & Testing

- [ ] 14.1 Add toast notifications for actions
- [ ] 14.2 Implement error boundaries
- [ ] 14.3 Add loading states throughout
- [ ] 14.4 Accessibility audit (keyboard nav, ARIA)
- [ ] 14.5 Write component tests (Vitest + React Testing Library)
- [ ] 14.6 Cross-browser testing
