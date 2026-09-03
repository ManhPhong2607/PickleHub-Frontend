'use client';

import React from 'react';
import { Trash2, CheckCircle2, FileEdit, X, FolderTree } from 'lucide-react';
import { CATEGORIES } from './types';

interface BulkActionBarProps {
  selectedCount: number;
  categories?: { id: string; name: string }[];
  onDelete: () => void;
  onChangeCategory: (categoryName: string, categoryId?: string) => void;
  onSetActive: () => void;
  onSetDraft: () => void;
  onSetHidden?: () => void;
  onApplyPromo?: () => void;
  onDeselectAll: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = React.memo(
  ({ selectedCount, categories = [], onDelete, onChangeCategory, onSetActive, onSetDraft, onSetHidden, onApplyPromo, onDeselectAll }) => {
    if (selectedCount === 0) return null;

    const availableCategories = categories.length > 0 ? categories.map((c) => c.name) : CATEGORIES;

    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-900/95 dark:bg-slate-900/95 text-white rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700/80 backdrop-blur-xl">
          
          {/* Counter Badge */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
              {selectedCount}
            </span>
            <span className="text-xs font-bold text-slate-300 whitespace-nowrap">đã chọn</span>
          </div>

          {/* Action: Kích hoạt (Active) */}
          <button
            type="button"
            onClick={onSetActive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 rounded-xl transition-all active:scale-[0.97]"
            title="Kích hoạt các sản phẩm đã chọn"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kích hoạt</span>
          </button>

          {/* Action: Ẩn (Hidden) */}
          {onSetHidden && (
            <button
              type="button"
              onClick={onSetHidden}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 hover:text-slate-950 bg-amber-500/10 hover:bg-amber-400 rounded-xl transition-all active:scale-[0.97]"
              title="Ẩn các sản phẩm đã chọn khỏi cửa hàng"
            >
              <span>Ẩn</span>
            </button>
          )}

          {/* Action: Bản nháp (Draft) */}
          <button
            type="button"
            onClick={onSetDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-[0.97]"
            title="Chuyển các sản phẩm đã chọn sang Bản nháp"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Bản nháp</span>
          </button>

          {/* Action: Đổi danh mục (Category) */}
          <div className="relative">
            <select
              onChange={(e) => {
                const catName = e.target.value;
                if (catName) {
                  const targetCat = categories.find((c) => c.name === catName);
                  onChangeCategory(catName, targetCat?.id);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl cursor-pointer transition-all outline-none"
              title="Đổi danh mục hàng loạt"
            >
              <option value="" disabled>
                📁 Đổi danh mục
              </option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Action: Áp dụng khuyến mãi (Apply Promo) */}
          {onApplyPromo && (
            <button
              type="button"
              onClick={onApplyPromo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-slate-950 bg-amber-500/20 hover:bg-amber-400 rounded-xl transition-all active:scale-[0.97] border border-amber-500/30"
              title="Áp dụng chương trình khuyến mãi cho các sản phẩm đã chọn"
            >
              <span>🏷️ Áp Khuyến Mãi</span>
            </button>
          )}

          {/* Action: Xóa (Delete) */}
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl transition-all active:scale-[0.97]"
            title="Xóa các sản phẩm đã chọn (Có thể hoàn tác trong 5s)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>

          {/* Deselect All */}
          <div className="pl-1 sm:pl-2 border-l border-slate-700/80">
            <button
              type="button"
              onClick={onDeselectAll}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Bỏ chọn tất cả"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

BulkActionBar.displayName = 'BulkActionBar';
