## Context

Building the React web application for Multiverse Bazaar. This is the primary interface for desktop/laptop users to browse projects, post ideas, and interact with the community.

The web app consumes the backend API and shares types with the mobile app via a shared package.

## Goals / Non-Goals

**Goals:**
- Modern React application with TypeScript
- Responsive design (tablet and desktop focus)
- Fast loading with code splitting
- Accessible (WCAG 2.1 AA)
- Shareable URLs for projects, ideas, profiles, and searches
- Optimistic updates for upvotes

**Non-Goals:**
- Mobile-first design (mobile app handles that)
- Offline support (not needed for web)
- SSR/SSG (client-side React is fine for this use case)
- Complex state management (server state via TanStack Query is sufficient)

## Decisions

### Build Tool: Vite
- Fast development server with HMR
- Excellent TypeScript support
- Easy code splitting
- Production builds optimized out of the box

### Routing: React Router v6
- Standard routing solution
- URL-based state for filters/search
- Protected route patterns

### Data Fetching: TanStack Query (React Query)
- Server state management
- Caching, background refetching
- Optimistic updates for upvotes
- Shared with mobile via wrapper in shared package

### Styling: Tailwind CSS
- Utility-first for rapid development
- Consistent design tokens
- Small bundle with purging
- Good component patterns with @apply

### Form Handling: React Hook Form + Zod
- Type-safe form validation
- Shared validation schemas with backend
- Good error handling

### Project Structure

```
packages/web/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component with providers
│   ├── router.tsx               # Route definitions
│   ├── components/
│   │   ├── ui/                  # Generic UI components (Button, Card, Modal, etc.)
│   │   ├── layout/              # Header, Footer, Sidebar, Page wrappers
│   │   ├── auth/                # Login form, auth guards
│   │   ├── projects/            # Project card, list, form, detail
│   │   ├── ideas/               # Idea card, list, form, detail
│   │   ├── profiles/            # Profile card, page, edit form
│   │   └── search/              # Search bar, results, filters
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth state and methods
│   │   ├── useProjects.ts       # Project queries and mutations
│   │   ├── useIdeas.ts          # Idea queries and mutations
│   │   ├── useUpvotes.ts        # Upvote mutations with optimistic updates
│   │   └── useSearch.ts         # Search queries
│   ├── lib/
│   │   ├── api.ts               # API client (uses shared)
│   │   └── utils.ts             # Utility functions
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Projects.tsx         # Gallery
│   │   ├── ProjectDetail.tsx
│   │   ├── ProjectNew.tsx
│   │   ├── ProjectEdit.tsx
│   │   ├── Ideas.tsx            # Board
│   │   ├── IdeaDetail.tsx
│   │   ├── IdeaNew.tsx
│   │   ├── Profile.tsx
│   │   ├── ProfileEdit.tsx
│   │   ├── Search.tsx
│   │   └── Login.tsx
│   └── styles/
│       └── globals.css          # Tailwind imports, custom styles
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]         Projects   Ideas   Search________    [Avatar ▼] or [Login] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         PAGE CONTENT                                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │   Projects Gallery / Ideas Board / Search Results / etc.            │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Footer: About · Terms · Contact                    Made with ♥ at MV      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Project Card Design

```
┌─────────────────────────────────────┐
│  [Image or Gradient placeholder]    │
├─────────────────────────────────────┤
│  Project Title                      │
│  Short description text that        │
│  truncates after two lines...       │
│                                     │
│  ┌───┐ ┌───┐ ┌───┐  +2             │
│  │ 👤│ │ 👤│ │ 👤│  collaborators  │
│  └───┘ └───┘ └───┘                 │
│                                     │
│  [🏷️ launched]        [▲ 42]       │
└─────────────────────────────────────┘
```

### Authentication Flow
1. User enters email on login page
2. API validates against students table or external collaborators
3. JWT stored in localStorage (or httpOnly cookie if we add backend session)
4. Auth context provides user state to all components
5. Protected routes redirect to login with return URL

### Optimistic Updates for Upvotes
1. User clicks upvote
2. UI immediately updates (count +1, button state)
3. API call fires in background
4. On failure, revert UI and show error toast

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| localStorage JWT security | Acceptable for internal app; can upgrade to httpOnly cookies |
| Large bundle size | Code splitting by route; Tailwind purges unused CSS |
| Accessibility | Use semantic HTML, ARIA labels, test with screen reader |
| Form validation duplication | Share Zod schemas via shared package |
| State management complexity | TanStack Query handles server state; minimal client state |
