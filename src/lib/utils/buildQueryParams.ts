/**
 * Utility to build and serialize query parameter strings or URLSearchParams
 * strips out empty, null, undefined, or default ('all') values.
 */

export interface CatalogFilterState {
  search: string;
  status: 'all' | 'active' | 'inactive';
  hasSchema: 'all' | 'true' | 'false';
  level: 'all' | 'root' | 'sub';
  hasChildren: 'all' | 'true' | 'false';
  hasProducts: 'all' | 'true' | 'false';
  hasImage: 'all' | 'true' | 'false';
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  search: '',
  status: 'all',
  hasSchema: 'all',
  level: 'all',
  hasChildren: 'all',
  hasProducts: 'all',
  hasImage: 'all',
  createdFrom: '',
  createdTo: '',
  updatedFrom: '',
  updatedTo: '',
  sortBy: 'name_asc',
  page: 1,
  pageSize: 20,
};

export function buildQueryParams(filters: Partial<CatalogFilterState>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }
    // Skip default page = 1 to keep URL clean
    if (key === 'page' && value === 1) return;
    if (key === 'pageSize' && value === 20) return;
    if (key === 'sortBy' && value === 'name_asc') return;

    params.set(key, String(value));
  });

  const str = params.toString();
  return str ? `?${str}` : '';
}

export function parseQueryParams(searchParams: URLSearchParams): Partial<CatalogFilterState> {
  const filters: Partial<CatalogFilterState> = {};

  const search = searchParams.get('search');
  if (search) filters.search = search;

  const status = searchParams.get('status');
  if (status === 'active' || status === 'inactive') filters.status = status;

  const hasSchema = searchParams.get('hasSchema');
  if (hasSchema === 'true' || hasSchema === 'false') filters.hasSchema = hasSchema;

  const level = searchParams.get('level');
  if (level === 'root' || level === 'sub') filters.level = level;

  const hasChildren = searchParams.get('hasChildren');
  if (hasChildren === 'true' || hasChildren === 'false') filters.hasChildren = hasChildren;

  const hasProducts = searchParams.get('hasProducts');
  if (hasProducts === 'true' || hasProducts === 'false') filters.hasProducts = hasProducts;

  const hasImage = searchParams.get('hasImage');
  if (hasImage === 'true' || hasImage === 'false') filters.hasImage = hasImage;

  const createdFrom = searchParams.get('createdFrom');
  if (createdFrom) filters.createdFrom = createdFrom;

  const createdTo = searchParams.get('createdTo');
  if (createdTo) filters.createdTo = createdTo;

  const updatedFrom = searchParams.get('updatedFrom');
  if (updatedFrom) filters.updatedFrom = updatedFrom;

  const updatedTo = searchParams.get('updatedTo');
  if (updatedTo) filters.updatedTo = updatedTo;

  const sortBy = searchParams.get('sortBy');
  if (sortBy) filters.sortBy = sortBy;

  const page = searchParams.get('page');
  if (page) filters.page = parseInt(page, 10) || 1;

  const pageSize = searchParams.get('pageSize');
  if (pageSize) filters.pageSize = parseInt(pageSize, 10) || 20;

  return filters;
}
