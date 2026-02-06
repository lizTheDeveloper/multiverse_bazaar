import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Page({ children, title, className }: PageProps) {
  return (
    <div className={cn('container mx-auto px-4 py-8 max-w-7xl', className)}>
      {title && (
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{title}</h1>
      )}
      {children}
    </div>
  );
}
