'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Eye, ShoppingCart, Percent, AlertCircle, Sparkles,
  ExternalLink, ChevronLeft, ChevronRight, Search, X
} from 'lucide-react';
import { ProductInsightItemDto } from '@/lib/api/adminApi';

interface ProductConversionItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  sku: string;
  viewCount: number;
  soldCount: number;
  category?: string;
  isNeedsReview?: boolean;
}

interface ProductConversionSectionProps {
  products: ProductConversionItem[];
  needsReviewList: ProductInsightItemDto[];
  loading?: boolean;
}

export const ProductConversionSection: React.FC<ProductConversionSectionProps> = ({
  products,
  needsReviewList,
  loading = false
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needsReview' | 'highView'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const needsReviewIdSet = useMemo(() => {
    return new Set(needsReviewList.map(p => p.productId));
  }, [needsReviewList]);

  // Enhanced products with conversion rate and flags
  const items = useMemo(() => {
    return products.map(p => {
      const isReview = needsReviewIdSet.has(p.id) || (p.viewCount >= 20 && p.soldCount <= 2);
      const conversionRate = p.viewCount > 0 ? (p.soldCount / p.viewCount) * 100 : 0;
      return {
        ...p,
        isNeedsReview: isReview,
        conversionRate
      };
    });
  }, [products, needsReviewIdSet]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterMode === 'needsReview') {
      result = result.filter(p => p.isNeedsReview);
    } else if (filterMode === 'highView') {
      result = result.filter(p => p.viewCount > 0);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    return result.sort((a, b) => {
      if (filterMode === 'needsReview') return b.viewCount - a.viewCount;
      return b.viewCount - a.viewCount;
    });
  }, [items, filterMode, searchTerm]);

  const needsReviewCount = useMemo(() => {
    return items.filter(p => p.isNeedsReview).length;
  }, [items]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const validPage = Math.min(page, totalPages);

  const currentPageItems = useMemo(() => {
    const startIdx = (validPage - 1) * pageSize;
    return filteredItems.slice(startIdx, startIdx + pageSize);
  }, [filteredItems, validPage, pageSize]);

  const handleFilterChange = (mode: 'all' | 'needsReview' | 'highView') => {
    setFilterMode(mode);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/4" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
              Phân tích Lượt xem vs Lượt bán & Tỷ lệ chuyển đổi
            </h3>
            {needsReviewCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-300/60 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>{needsReviewCount} SP xem nhiều bán ít</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi hiệu quả chuyển đổi từ người xem sang người mua để tối ưu giá bán, hình ảnh và mô tả sản phẩm
          </p>
        </div>

        {/* Filter Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên SP, SKU..."
              className="pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium w-44 sm:w-52 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tất cả ({items.length})
          </button>
          <button
            onClick={() => handleFilterChange('needsReview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'needsReview'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cần tối ưu ({needsReviewCount})</span>
          </button>
        </div>
      </div>

      {/* Table of Conversion Data */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold">
          Không tìm thấy sản phẩm phù hợp điều kiện lọc
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Lượt xem</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Lượt bán</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-purple-500" />
                      <span>Tỷ lệ chuyển đổi</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">Trạng thái phân tích</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {currentPageItems.map((p) => {
                  const isHighConversion = p.conversionRate >= 10 && p.soldCount >= 5;
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        p.isNeedsReview
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 dark:hover:bg-amber-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || '/images/paddle.png'}
                            alt={p.name}
                            className="w-9 h-9 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <span className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate block" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-display font-black text-slate-800 dark:text-slate-200">
                          {p.viewCount.toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-display font-black text-emerald-600 dark:text-emerald-400">
                          {p.soldCount.toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-block ${
                          isHighConversion
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : p.isNeedsReview
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {p.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.isNeedsReview ? (
                          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-extrabold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Xem nhiều, bán ít ⚠️</span>
                          </div>
                        ) : isHighConversion ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Chuyển đổi cao ⭐</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Bình thường</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/products`}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-bold text-xs transition-colors"
                        >
                          <span>Sửa SP</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-semibold text-slate-500">
            {/* Left: Item Counter & Page Size Selector */}
            <div className="flex items-center gap-3">
              <span>
                Hiển thị <strong className="text-slate-800 dark:text-slate-200">{(validPage - 1) * pageSize + 1} - {Math.min(validPage * pageSize, filteredItems.length)}</strong> trên tổng số <strong className="text-slate-800 dark:text-slate-200">{filteredItems.length}</strong> sản phẩm
              </span>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400">Hiển thị:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-transparent font-bold text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value={5} className="bg-white dark:bg-slate-900">5</option>
                  <option value={10} className="bg-white dark:bg-slate-900">10</option>
                  <option value={15} className="bg-white dark:bg-slate-900">15</option>
                  <option value={20} className="bg-white dark:bg-slate-900">20</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={validPage <= 1}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - validPage) <= 1)
                  .map((pg, idx, arr) => {
                    const prevPg = arr[idx - 1];
                    return (
                      <React.Fragment key={pg}>
                        {prevPg && pg - prevPg > 1 && (
                          <span className="px-1 text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => setPage(pg)}
                          className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                            pg === validPage
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pg}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validPage >= totalPages}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
