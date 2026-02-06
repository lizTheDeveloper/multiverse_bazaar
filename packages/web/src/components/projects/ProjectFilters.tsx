import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import type { ProjectStatus } from '@/types';

export function ProjectFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatus = searchParams.get('status') as ProjectStatus | null;
  const currentFeatured = searchParams.get('featured');

  const handleStatusChange = (status: ProjectStatus | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams);
  };

  const handleFeaturedToggle = () => {
    const newParams = new URLSearchParams(searchParams);
    if (currentFeatured === 'true') {
      newParams.delete('featured');
    } else {
      newParams.set('featured', 'true');
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = currentStatus || currentFeatured === 'true';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex gap-2">
            <Button
              variant={!currentStatus ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusChange(null)}
            >
              All
            </Button>
            <Button
              variant={currentStatus === 'building' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusChange('building')}
            >
              Building
            </Button>
            <Button
              variant={currentStatus === 'launched' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusChange('launched')}
            >
              Launched
            </Button>
          </div>
        </div>

        {/* Featured Filter */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentFeatured === 'true' ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleFeaturedToggle}
          >
            Featured Only
          </Button>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
