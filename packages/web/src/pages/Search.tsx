import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { useSearch } from '@/hooks/useSearch';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { Search, FileQuestion } from 'lucide-react';
import type { SearchParams } from '@/types';

const RESULTS_PER_PAGE = 20;

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);

  const params: SearchParams = {
    query,
    type: type as 'project' | 'idea' | undefined,
    status,
    page,
    limit: RESULTS_PER_PAGE,
  };

  const { data, isLoading, isError, error } = useSearch(params);

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('q', newQuery);
    params.delete('page'); // Reset to first page on new search
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = data ? Math.ceil(data.total / RESULTS_PER_PAGE) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Search Multiverse Bazaar</h1>
          <SearchBar
            defaultValue={query}
            onSearch={handleSearch}
            size="large"
            autoFocus={!query}
          />
        </div>

        {query && (
          <>
            <SearchFilters />

            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3 p-6 border rounded-lg">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="text-center py-12">
                <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Search Error</h3>
                <p className="text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : 'An error occurred while searching. Please try again.'}
                </p>
              </div>
            )}

            {data && !isLoading && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {data.total} result{data.total !== 1 ? 's' : ''} for "
                    <span className="font-medium text-foreground">{query}</span>"
                  </p>
                </div>

                {data.results.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {data.results.map((result) => (
                        <SearchResultItem
                          key={`${result.type}-${result.id}`}
                          result={result}
                          query={query}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page <= 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            // Show first page, last page, current page, and pages around current
                            const showPage =
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= page - 1 && pageNum <= page + 1);

                            if (!showPage) {
                              // Show ellipsis once before and once after current range
                              if (pageNum === page - 2 || pageNum === page + 2) {
                                return (
                                  <span
                                    key={pageNum}
                                    className="px-2 text-muted-foreground"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find any projects or ideas matching your search.
                    </p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Try:</p>
                      <ul className="list-disc list-inside">
                        <li>Using different keywords</li>
                        <li>Checking your spelling</li>
                        <li>Using more general terms</li>
                        <li>Removing filters</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground mb-4">
              Search across all projects and ideas in the Multiverse Bazaar
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Popular searches:</p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['AI', 'Web Development', 'Mobile App', 'Data Science', 'Design'].map(
                  (term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(term)}
                    >
                      {term}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
