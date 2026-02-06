import { useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { X } from 'lucide-react';

type SearchType = 'all' | 'project' | 'idea';

const PROJECT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' },
];

const IDEA_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'implemented', label: 'Implemented' },
  { value: 'rejected', label: 'Rejected' },
];

export function SearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const type = (searchParams.get('type') || 'all') as SearchType;
  const status = searchParams.get('status') || 'all';

  const handleTypeChange = (newType: SearchType) => {
    const params = new URLSearchParams(searchParams);
    if (newType === 'all') {
      params.delete('type');
    } else {
      params.set('type', newType);
    }
    // Clear status when type changes
    params.delete('status');
    params.delete('page'); // Reset to first page
    setSearchParams(params);
  };

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus === 'all') {
      params.delete('status');
    } else {
      params.set('status', newStatus);
    }
    params.delete('page'); // Reset to first page
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('type');
    params.delete('status');
    params.delete('page');
    setSearchParams(params);
  };

  const hasFilters = type !== 'all' || status !== 'all';

  const statusOptions = type === 'project' ? PROJECT_STATUSES : IDEA_STATUSES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              type === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTypeChange('project')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              type === 'project'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projects Only
          </button>
          <button
            onClick={() => handleTypeChange('idea')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              type === 'idea'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ideas Only
          </button>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {type !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={statusOptions}
            className="w-[180px]"
          />
        </div>
      )}
    </div>
  );
}
