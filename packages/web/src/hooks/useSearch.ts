import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { searchApi } from '@/lib/api';
import type { SearchParams, SearchResponse } from '@/types';

const DEBOUNCE_MS = 300;

export function useSearch(params: SearchParams) {
  const [debouncedQuery, setDebouncedQuery] = useState(params.query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(params.query);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [params.query]);

  return useQuery<SearchResponse>({
    queryKey: ['search', { ...params, query: debouncedQuery }],
    queryFn: () => searchApi.search({ ...params, query: debouncedQuery }),
    enabled: !!debouncedQuery && debouncedQuery.trim().length > 0,
    staleTime: 30000, // 30 seconds
  });
}
