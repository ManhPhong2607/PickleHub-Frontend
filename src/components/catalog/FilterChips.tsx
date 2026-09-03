'use client';

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { CatalogFilterState } from '@/lib/utils/buildQueryParams';

interface FilterChipsProps {
  filters: CatalogFilterState;
  onRemoveFilter: (key: keyof CatalogFilterState) => void;
  onResetFilters: () => void;
  totalResults: number;
  totalAll: number;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onResetFilters,
  totalResults,
  totalAll,
}) => {
  const chips: { key: keyof CatalogFilterState; label: string; value: string }[] = [];

  if (filters.search.trim()) {
    chips.push({
      key: 'search',
      label: 'Từ khóa',
      value: `"${filters.search}"`,
    });
  }

  if (filters.status !== 'all') {
    chips.push({
      key: 'status',
      label: 'Trạng thái',
      value: filters.status === 'active' ? 'Đang hoạt động' : 'Tạm ẩn',
    });
  }

  if (filters.hasSchema !== 'all') {
    chips.push({
      key: 'hasSchema',
      label: 'Schema thuộc tính',
      value: filters.hasSchema === 'true' ? 'Đã có Schema' : 'Chưa có Schema',
    });
  }

  if (filters.level !== 'all') {
    chips.push({
      key: 'level',
      label: 'Cấp bậc',
      value: filters.level === 'root' ? 'Danh mục Gốc (Root)' : 'Danh mục Con (Sub)',
    });
  }

  if (filters.hasChildren !== 'all') {
    chips.push({
      key: 'hasChildren',
      label: 'Danh mục con',
      value: filters.hasChildren === 'true' ? 'Có danh mục con' : 'Không có danh mục con',
    });
  }

  if (filters.hasProducts !== 'all') {
    chips.push({
      key: 'hasProducts',
      label: 'Sản phẩm',
      value: filters.hasProducts === 'true' ? 'Đã có sản phẩm (>0)' : 'Chưa có sản phẩm (=0)',
    });
  }

  if (filters.hasImage !== 'all') {
    chips.push({
      key: 'hasImage',
      label: 'Hình ảnh',
      value: filters.hasImage === 'true' ? 'Đã có ảnh đại diện' : 'Chưa có ảnh',
    });
  }

  if (filters.createdFrom || filters.createdTo) {
    const formatToDDMMYYYY = (dStr?: string) => {
      if (!dStr) return '...';
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    };

    let rangeText = '';
    if (filters.createdFrom && filters.createdTo) {
      rangeText = `${formatToDDMMYYYY(filters.createdFrom)} → ${formatToDDMMYYYY(filters.createdTo)}`;
    } else if (filters.createdFrom) {
      rangeText = `Từ ${formatToDDMMYYYY(filters.createdFrom)}`;
    } else {
      rangeText = `Đến ${formatToDDMMYYYY(filters.createdTo)}`;
    }

    chips.push({
      key: 'createdFrom',
      label: 'Ngày tạo',
      value: rangeText,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 animate-in fade-in duration-200">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
        Đang lọc:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium shadow-2xs"
        >
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">{chip.label}:</span>
          <span className="font-bold">{chip.value}</span>
          <button
            onClick={() => onRemoveFilter(chip.key)}
            className="hover:bg-emerald-200/60 dark:hover:bg-emerald-800/60 p-0.5 rounded-md transition-colors text-emerald-700 dark:text-emerald-300"
            title={`Xóa lọc ${chip.label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      <button
        onClick={onResetFilters}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
        title="Xóa tất cả bộ lọc"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Xóa tất cả ({chips.length})</span>
      </button>

      <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">
        Hiển thị <span className="font-bold text-slate-700 dark:text-slate-200">{totalResults}</span> / {totalAll} danh mục
      </span>
    </div>
  );
};
