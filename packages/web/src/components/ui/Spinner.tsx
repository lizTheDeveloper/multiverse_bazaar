import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', className, ...props }, ref) => {
    const sizeStyles = {
      sm: 'w-4 h-4 border-2',
      md: 'w-8 h-8 border-2',
      lg: 'w-12 h-12 border-3',
      xl: 'w-16 h-16 border-4',
    };

    return (
      <div
        ref={ref}
        className={cn('inline-block', className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full border-gray-300 border-t-blue-600',
            sizeStyles[size]
          )}
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
