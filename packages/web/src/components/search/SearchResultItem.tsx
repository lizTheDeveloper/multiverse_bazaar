import { Link } from 'react-router-dom';
import { Lightbulb, FolderKanban } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { highlightText } from '@/lib/utils';
import type { SearchResult } from '@/types';

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  active: 'info',
  completed: 'success',
  on_hold: 'warning',
  archived: 'neutral',
  draft: 'neutral',
  proposed: 'info',
  in_progress: 'info',
  implemented: 'success',
  rejected: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  archived: 'Archived',
  draft: 'Draft',
  proposed: 'Proposed',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  rejected: 'Rejected',
};

export function SearchResultItem({ result, query }: SearchResultItemProps) {
  const isProject = result.type === 'project';
  const detailPath = isProject
    ? `/projects/${result.id}`
    : `/ideas/${result.id}`;

  const TypeIcon = isProject ? FolderKanban : Lightbulb;
  const typeLabel = isProject ? 'Project' : 'Idea';

  // Get status from the appropriate nested object
  const status = isProject ? result.project?.status : result.idea?.status;
  const statusVariant = status ? (STATUS_VARIANTS[status] || 'neutral') : 'neutral';
  const statusLabel = status ? (STATUS_LABELS[status] || status) : 'N/A';

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <Link to={detailPath}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2 flex-1">
              <TypeIcon
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  isProject ? 'text-blue-500' : 'text-yellow-500'
                }`}
              />
              <h3 className="text-xl font-semibold">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightText(result.title, query),
                  }}
                />
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="neutral" className="text-xs">
                {typeLabel}
              </Badge>
              <Badge variant={statusVariant} className="text-xs">
                {statusLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {result.description && (
            <p
              className="text-muted-foreground line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: highlightText(result.description, query),
              }}
            />
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            {result.creator && (
              <span>By: {result.creator.name}</span>
            )}
            {result.created_at && (
              <span>Created: {new Date(result.created_at).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
