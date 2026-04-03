import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-4 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved or doesn't exist.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button>Go to Homepage</Button>
          </Link>
          <Link to="/projects">
            <Button variant="secondary">Browse Projects</Button>
          </Link>
          <Link to="/ideas">
            <Button variant="secondary">Explore Ideas</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
