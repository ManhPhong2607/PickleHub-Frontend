'use client';

import React from 'react';
import { CatalogFilterState } from '@/lib/utils/buildQueryParams';
import { Calendar, CheckCircle2, Layers, Image as ImageIcon, Box, Sparkles } from 'lucide-react';

interface CatalogAdvancedFiltersProps {
  isOpen: boolean;
  filters: CatalogFilterState;
  onFilterChange: (payload: Partial<CatalogFilterState>) => void;
  onReset: () => void;
}

export const CatalogAdvancedFilters: React.FC<CatalogAdvancedFiltersProps> = ({
  isOpen,
  filters,
  onFilterChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="p-5 bg-slate-50/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Bộ Lọc Nâng Cao (Advanced Filters)
          </h4>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
        >
          Đặt lại mặc định
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* 1. Cấu trúc danh mục */}
        <div className="space-y-2 p-3 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Cấu trúc phân cấp</span>
          </label>
          <div className="space-y-1.5">
            <select
              value={filters.level}
              onChange={(e) => onFilterChange({ level: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-slate-200 focus:border-emerald-500"
            >
              <option value="all">Tất cả cấp bậc</option>
              <option value="root">Danh mục gốc (Root - Cấp 0)</option>
              <option value="sub">Danh mục con (Sub - Cấp 1+)</option>
            </select>

            <select
              value={filters.hasChildren}
              onChange={(e) => onFilterChange({ hasChildren: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-slate-200 focus:border-emerald-500"
            >
              <option value="all">Tất cả (Có/Không có con)</option>
              <option value="true">Chỉ danh mục có danh mục con</option>
              <option value="false">Chỉ danh mục lá (Leaf)</option>
            </select>
          </div>
        </div>

        {/* 2. Dữ liệu & Sản phẩm */}
        <div className="space-y-2 p-3 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sản phẩm & Schema</span>
          </label>
          <div className="space-y-1.5">
            <select
              value={filters.hasProducts}
              onChange={(e) => onFilterChange({ hasProducts: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-slate-200 focus:border-emerald-500"
            >
              <option value="all">Tất cả sản phẩm liên kết</option>
              <option value="true">Đang có sản phẩm ({'>'}0)</option>
              <option value="false">Chưa có sản phẩm (=0)</option>
            </select>

            <select
              value={filters.hasSchema}
              onChange={(e) => onFilterChange({ hasSchema: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-slate-200 focus:border-emerald-500"
            >
              <option value="all">Tất cả Schema thuộc tính</option>
              <option value="true">Đã cấu hình Schema thuộc tính</option>
              <option value="false">Chưa cấu hình Schema</option>
            </select>
          </div>
        </div>

        {/* 3. Hình ảnh & Trạng thái */}
        <div className="space-y-2 p-3 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Hình ảnh đại diện</span>
          </label>
          <div className="space-y-1.5">
            <select
              value={filters.hasImage}
              onChange={(e) => onFilterChange({ hasImage: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-slate-200 focus:border-emerald-500"
            >
              <option value="all">Tất cả hình ảnh</option>
              <option value="true">Đã upload ảnh Cloudinary</option>
              <option value="false">Chưa có ảnh đại diện</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-800 dark:text-slate-200 focus:border-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </div>
        </div>

        {/* 4. Khoảng thời gian tạo (Start Date & End Date) */}
        <div className="space-y-2 p-3 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ngày tạo (Created Date)</span>
          </label>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                Từ ngày (Start date):
              </span>
              <input
                type="date"
                value={filters.createdFrom || ''}
                max={filters.createdTo || undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  if (filters.createdTo && val && val > filters.createdTo) {
                    onFilterChange({ createdFrom: val, createdTo: val });
                  } else {
                    onFilterChange({ createdFrom: val });
                  }
                }}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:border-emerald-500"
                title="Từ ngày (Start date)"
              />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                Đến ngày (End date):
              </span>
              <input
                type="date"
                value={filters.createdTo || ''}
                min={filters.createdFrom || undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  if (filters.createdFrom && val && val < filters.createdFrom) {
                    onFilterChange({ createdTo: val, createdFrom: val });
                  } else {
                    onFilterChange({ createdTo: val });
                  }
                }}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-200 text-xs font-semibold focus:border-emerald-500"
                title="Đến ngày (End date)"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
