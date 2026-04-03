import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout';

// Page imports
import { Home } from '@/pages/Home';
import { Projects as ProjectsPage } from '@/pages/Projects';
import { ProjectDetail as ProjectDetailPage } from '@/pages/ProjectDetail';
import { ProjectNew as ProjectNewPage } from '@/pages/ProjectNew';
import { ProjectEdit as ProjectEditPage } from '@/pages/ProjectEdit';
import { Ideas as IdeasPage } from '@/pages/Ideas';
import { IdeaDetail as IdeaDetailPage } from '@/pages/IdeaDetail';
import { IdeaNew as IdeaNewPage } from '@/pages/IdeaNew';
import { IdeaEdit as IdeaEditPage } from '@/pages/IdeaEdit';
import { Profile as UserProfilePage } from '@/pages/Profile';
import { ProfileEdit as ProfileEditPage } from '@/pages/ProfileEdit';
import { Search as SearchPage } from '@/pages/Search';
import { Login as LoginPage } from '@/pages/Login';
import { Register as RegisterPage } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';

// Layout wrapper component
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    element: <LayoutWrapper />,
    children: [
      {
        path: '/',
        element: <Home />,
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
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
