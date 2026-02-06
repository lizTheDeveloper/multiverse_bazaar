import React from 'react';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

export interface LoadingPageProps {
  message?: string;
  className?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading...',
  className
}) => {
  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center bg-gray-50',
        className
      )}
    >
      <Spinner size="xl" className="mb-4" />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
};

export default LoadingPage;
