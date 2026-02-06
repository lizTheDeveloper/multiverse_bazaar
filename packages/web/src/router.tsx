import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Page imports
import { HomePage } from '@/pages/HomePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ProjectNewPage } from '@/pages/ProjectNewPage';
import { ProjectEditPage } from '@/pages/ProjectEditPage';
import { IdeasPage } from '@/pages/IdeasPage';
import { IdeaDetailPage } from '@/pages/IdeaDetailPage';
import { IdeaNewPage } from '@/pages/IdeaNewPage';
import { IdeaEditPage } from '@/pages/IdeaEditPage';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { ProfileEditPage } from '@/pages/ProfileEditPage';
import { SearchPage } from '@/pages/SearchPage';
import { LoginPage } from '@/pages/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/projects',
    element: <ProjectsPage />,
  },
  {
    path: '/projects/new',
    element: (
      <ProtectedRoute>
        <ProjectNewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/projects/:id',
    element: <ProjectDetailPage />,
  },
  {
    path: '/projects/:id/edit',
    element: (
      <ProtectedRoute>
        <ProjectEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ideas',
    element: <IdeasPage />,
  },
  {
    path: '/ideas/new',
    element: (
      <ProtectedRoute>
        <IdeaNewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ideas/:id',
    element: <IdeaDetailPage />,
  },
  {
    path: '/ideas/:id/edit',
    element: (
      <ProtectedRoute>
        <IdeaEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:id',
    element: <UserProfilePage />,
  },
  {
    path: '/profile/edit',
    element: (
      <ProtectedRoute>
        <ProfileEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
