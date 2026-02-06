import { useState } from 'react';
import { useUpvote } from '@/hooks/useUpvotes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface UpvoteButtonProps {
  project: Project;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onLoginRequired?: () => void;
}

export function UpvoteButton({
  project,
  showCount = true,
  size = 'md',
  className,
  onLoginRequired,
}: UpvoteButtonProps) {
  const { isAuthenticated } = useAuth();
  const upvoteMutation = useUpvote(project.id);
  const [showPulse, setShowPulse] = useState(false);

  const isUpvoted = project.has_upvoted ?? false;
  const upvoteCount = project.upvote_count ?? 0;
  const isLoading = upvoteMutation.isPending;

  const handleClick = async () => {
    if (!isAuthenticated) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        // Default behavior: redirect to login
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }

    try {
      await upvoteMutation.mutateAsync();

      // Trigger pulse animation on successful toggle
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 600);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error('Failed to toggle upvote:', error);
    }
  };

  const sizeClasses = {
    sm: 'gap-1 px-2 py-1 text-xs',
    md: 'gap-1.5 px-3 py-1.5 text-sm',
    lg: 'gap-2 px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        isUpvoted
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500 hover:text-blue-600',
        showPulse && 'animate-pulse',
        className
      )}
      aria-label={isUpvoted ? 'Remove upvote' : 'Upvote project'}
      aria-pressed={isUpvoted}
      aria-disabled={isLoading}
    >
      {/* Upvote Arrow Icon */}
      <svg
        className={cn(
          iconSizes[size],
          'transition-transform duration-200',
          isUpvoted && 'scale-110'
        )}
        fill={isUpvoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isUpvoted ? '0' : '2'}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>

      {/* Count Display */}
      {showCount && (
        <span className="font-semibold tabular-nums">
          {upvoteCount}
        </span>
      )}

      {/* Loading State Indicator */}
      {isLoading && (
        <svg
          className={cn(iconSizes[size], 'animate-spin')}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </button>
  );
}

// Alternative compact variant for use in tight spaces
interface CompactUpvoteButtonProps {
  project: Project;
  className?: string;
  onLoginRequired?: () => void;
}

export function CompactUpvoteButton({
  project,
  className,
  onLoginRequired,
}: CompactUpvoteButtonProps) {
  const { isAuthenticated } = useAuth();
  const upvoteMutation = useUpvote(project.id);

  const isUpvoted = project.has_upvoted ?? false;
  const upvoteCount = project.upvote_count ?? 0;
  const isLoading = upvoteMutation.isPending;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }

    try {
      await upvoteMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to toggle upvote:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-md',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isUpvoted
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-blue-600',
        className
      )}
      aria-label={isUpvoted ? 'Remove upvote' : 'Upvote project'}
      aria-pressed={isUpvoted}
    >
      <svg
        className="w-4 h-4"
        fill={isUpvoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isUpvoted ? '0' : '2'}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
      <span className="text-xs font-semibold tabular-nums">{upvoteCount}</span>
    </button>
  );
}
