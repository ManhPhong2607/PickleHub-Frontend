'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, RefreshCw, ChevronDown } from 'lucide-react';
import { CatalogFilterState } from '@/lib/utils/buildQueryParams';

interface CatalogFilterBarProps {
  searchInput: string;
  onSearchChange: (val: string) => void;
  filters: CatalogFilterState;
  onFilterChange: (payload: Partial<CatalogFilterState>) => void;
  isAdvancedOpen: boolean;
  onToggleAdvanced: () => void;
  activeFiltersCount: number;
  onRefresh: () => void;
  loading: boolean;
}

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  searchInput,
  onSearchChange,
  filters,
  onFilterChange,
  isAdvancedOpen,
  onToggleAdvanced,
  activeFiltersCount,
  onRefresh,
  loading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên, slug hoặc mã ID..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter: Cấp bậc (Level) */}
        <div className="flex items-center gap-2">
          <select
            value={filters.level}
            onChange={(e) => onFilterChange({ level: e.target.value as any })}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Tất cả cấp bậc</option>
            <option value="root">Danh mục gốc (Root)</option>
            <option value="sub">Danh mục con (Sub)</option>
          </select>

          {/* Quick Filter: Schema */}
          <select
            value={filters.hasSchema}
            onChange={(e) => onFilterChange({ hasSchema: e.target.value as any })}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Tất cả Schema</option>
            <option value="true">Có Schema</option>
            <option value="false">Chưa có Schema</option>
          </select>

          {/* Advanced Filter Panel Toggle Button */}
          <button
            onClick={onToggleAdvanced}
            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
              isAdvancedOpen || activeFiltersCount > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Bộ lọc nâng cao"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bộ lọc nâng cao</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
};
