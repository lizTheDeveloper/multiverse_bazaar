import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'default' | 'large';
  autoFocus?: boolean;
}

export function SearchBar({
  defaultValue = '',
  onSearch,
  placeholder = 'Search projects and ideas...',
  className,
  size = 'default',
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative flex items-center gap-2', className)}
    >
      <div className="relative flex-1">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
            size === 'large' ? 'h-5 w-5' : 'h-4 w-4'
          )}
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full',
            size === 'large' ? 'h-12 pl-10 pr-10 text-lg' : 'h-10 pl-9 pr-9'
          )}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className={cn(
              'absolute right-1 top-1/2 -translate-y-1/2',
              size === 'large' ? 'h-8 w-8' : 'h-6 w-6'
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit" disabled={!query.trim()}>
        Search
      </Button>
    </form>
  );
}
