'use client';

import { useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  CatalogFilterState,
  DEFAULT_CATALOG_FILTERS,
  buildQueryParams,
  parseQueryParams,
} from '@/lib/utils/buildQueryParams';
import { AdminCategoryDto } from '@/lib/api/adminApi';

type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<CatalogFilterState> }
  | { type: 'REMOVE_FILTER'; payload: keyof CatalogFilterState }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_PAGE'; payload: number };

function filterReducer(state: CatalogFilterState, action: FilterAction): CatalogFilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload, page: 1 };
    case 'SET_FILTER':
      return { ...state, ...action.payload, page: 1 };
    case 'REMOVE_FILTER': {
      if (action.payload === 'createdFrom' || action.payload === 'createdTo') {
        return { ...state, createdFrom: '', createdTo: '', page: 1 };
      }
      const defaultVal = DEFAULT_CATALOG_FILTERS[action.payload];
      return { ...state, [action.payload]: defaultVal, page: 1 };
    }
    case 'RESET_FILTERS':
      return { ...DEFAULT_CATALOG_FILTERS };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    default:
      return state;
  }
}

export function useCatalogFilters(initialCategories: AdminCategoryDto[] = []) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const initialFromUrl = useMemo(() => {
    const parsed = parseQueryParams(searchParams);
    return { ...DEFAULT_CATALOG_FILTERS, ...parsed };
  }, [searchParams]);

  const [filters, dispatch] = useReducer(filterReducer, initialFromUrl);

  // Local debounced search input state
  const [searchInput, setSearchInput] = useReducer(
    (_: string, action: string) => action,
    initialFromUrl.search
  );

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize search input with debounced dispatch
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_SEARCH', payload: value });
    }, 400);
  }, []);

  // Update URL search params whenever filters change
  useEffect(() => {
    const queryString = buildQueryParams(filters);
    const newUrl = `${pathname}${queryString}`;
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router]);

  // Actions
  const setFilter = useCallback((payload: Partial<CatalogFilterState>) => {
    dispatch({ type: 'SET_FILTER', payload });
  }, []);

  const removeFilter = useCallback((key: keyof CatalogFilterState) => {
    if (key === 'search') {
      setSearchInput('');
    }
    dispatch({ type: 'REMOVE_FILTER', payload: key });
  }, []);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  // Calculate active filter count (excluding pagination, sort, search)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.status !== 'all') count++;
    if (filters.hasSchema !== 'all') count++;
    if (filters.level !== 'all') count++;
    if (filters.hasChildren !== 'all') count++;
    if (filters.hasProducts !== 'all') count++;
    if (filters.hasImage !== 'all') count++;
    if (filters.createdFrom || filters.createdTo) count++;
    if (filters.updatedFrom || filters.updatedTo) count++;
    return count;
  }, [filters]);

  // Client-side filtering & sorting engine
  const filteredCategories = useMemo(() => {
    // 1. Identify which categories have children
    const parentIdSet = new Set(
      initialCategories.map((c) => c.parentId).filter(Boolean)
    );

    return initialCategories.filter((cat) => {
      // 1. Search filter (by name, slug, or ID)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchName = cat.name.toLowerCase().includes(query);
        const matchSlug = cat.slug.toLowerCase().includes(query);
        const matchId = cat.id.toLowerCase().includes(query);
        if (!matchName && !matchSlug && !matchId) return false;
      }

      // 2. Status filter
      if (filters.status !== 'all') {
        const isActive = cat.isActive ?? true;
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }

      // 3. Schema filter
      if (filters.hasSchema !== 'all') {
        let hasAttr = false;
        try {
          const parsed = JSON.parse(cat.attributeSchemaJson || '[]');
          hasAttr = Array.isArray(parsed) && parsed.length > 0;
        } catch {
          hasAttr = false;
        }
        if (filters.hasSchema === 'true' && !hasAttr) return false;
        if (filters.hasSchema === 'false' && hasAttr) return false;
      }

      // 4. Level filter (Root vs Sub-category)
      if (filters.level !== 'all') {
        const isRoot = !cat.parentId;
        if (filters.level === 'root' && !isRoot) return false;
        if (filters.level === 'sub' && isRoot) return false;
      }

      // 5. Has Children filter
      if (filters.hasChildren !== 'all') {
        const hasKids = parentIdSet.has(cat.id);
        if (filters.hasChildren === 'true' && !hasKids) return false;
        if (filters.hasChildren === 'false' && hasKids) return false;
      }

      // 6. Has Products filter
      if (filters.hasProducts !== 'all') {
        const pCount = cat.productCount ?? 0;
        if (filters.hasProducts === 'true' && pCount <= 0) return false;
        if (filters.hasProducts === 'false' && pCount > 0) return false;
      }

      // 7. Has Image filter
      if (filters.hasImage !== 'all') {
        const hasImg = !!cat.imageUrl && !cat.imageUrl.includes('placeholder');
        if (filters.hasImage === 'true' && !hasImg) return false;
        if (filters.hasImage === 'false' && hasImg) return false;
      }

      // 8. Created Date Range (Start date & End date)
      if (filters.createdFrom) {
        if (!cat.createdAt) return false;
        const catDate = new Date(cat.createdAt);
        const fromDate = new Date(filters.createdFrom + 'T00:00:00');
        if (catDate < fromDate) return false;
      }
      if (filters.createdTo) {
        if (!cat.createdAt) return false;
        const catDate = new Date(cat.createdAt);
        const toDate = new Date(filters.createdTo + 'T23:59:59.999');
        if (catDate > toDate) return false;
      }

      return true;
    });
  }, [initialCategories, filters]);

  return {
    filters,
    searchInput,
    setSearch: handleSearchChange,
    setFilter,
    removeFilter,
    resetFilters,
    setPage,
    activeFiltersCount,
    filteredCategories,
  };
}
