import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'neutral' | 'danger';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', className, children, ...props }, ref) => {
    const variantStyles = {
      success: 'bg-primary/20 text-primary border-primary/40',
      warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
      info: 'bg-accent/20 text-accent border-accent/40',
      neutral: 'bg-muted text-muted-foreground border-border',
      danger: 'bg-destructive/20 text-destructive border-destructive/40',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
