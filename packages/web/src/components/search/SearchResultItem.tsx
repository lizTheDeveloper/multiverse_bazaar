import { Link } from 'react-router-dom';
import { Lightbulb, FolderKanban } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { highlightText } from '@/lib/utils';
import type { SearchResultItem as SearchResultType } from '@/types';

interface SearchResultItemProps {
  result: SearchResultType;
  query: string;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  on_hold: 'outline',
  archived: 'secondary',
  draft: 'outline',
  proposed: 'default',
  in_progress: 'default',
  implemented: 'secondary',
  rejected: 'destructive',
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
  const statusVariant = STATUS_VARIANTS[result.status] || 'default';
  const statusLabel = STATUS_LABELS[result.status] || result.status;

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
              <Badge variant="outline" className="text-xs">
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
          {result.metadata && (
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              {result.metadata.universe && (
                <span>Universe: {result.metadata.universe}</span>
              )}
              {result.metadata.creator && (
                <span>By: {result.metadata.creator}</span>
              )}
              {result.metadata.updatedAt && (
                <span>Updated: {new Date(result.metadata.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
