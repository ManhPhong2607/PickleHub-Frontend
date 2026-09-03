'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy, ChevronRight, ChevronLeft, Package, Flame,
  DollarSign, SlidersHorizontal
} from 'lucide-react';

interface TopProductItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  soldCount: number;
  revenue: number;
  viewCount?: number;
}

interface TopProductsChartProps {
  products: TopProductItem[];
  loading?: boolean;
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({
  products,
  loading = false
}) => {
  const [mode, setMode] = useState<'sold' | 'revenue'>('sold');
  const [topLimit, setTopLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  // Lọc và sắp xếp toàn bộ danh sách sản phẩm theo chế độ (sold / revenue)
  const fullRankedList = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Tạo bản sao để sắp xếp
    const list = [...products];
    if (mode === 'sold') {
      list.sort((a, b) => b.soldCount - a.soldCount);
    } else {
      list.sort((a, b) => b.revenue - a.revenue);
    }

    // Giới hạn theo Top Limit (Top 5, 10, 15, 20)
    return list.slice(0, topLimit);
  }, [products, mode, topLimit]);

  // Giá trị max để tính % thanh progress bar
  const maxValue = useMemo(() => {
    if (fullRankedList.length === 0) return 1;
    return mode === 'sold'
      ? Math.max(...fullRankedList.map(p => p.soldCount), 1)
      : Math.max(...fullRankedList.map(p => p.revenue), 1);
  }, [fullRankedList, mode]);

  // Phân trang: 5 sản phẩm / 1 trang
  const totalPages = Math.max(1, Math.ceil(fullRankedList.length / pageSize));
  
  // Đảm bảo page hiện tại không vượt quá totalPages khi đổi limit
  const validPage = Math.min(page, totalPages);

  const currentPageItems = useMemo(() => {
    const startIdx = (validPage - 1) * pageSize;
    return fullRankedList.slice(startIdx, startIdx + pageSize);
  }, [fullRankedList, validPage, pageSize]);

  // Đổi mode hoặc đổi topLimit -> reset về trang 1
  const handleModeChange = (newMode: 'sold' | 'revenue') => {
    setMode(newMode);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setTopLimit(newLimit);
    setPage(1);
  };

  const getMedalColor = (globalIndex: number) => {
    switch (globalIndex) {
      case 0:
        return 'bg-amber-400 text-amber-950 font-black shadow-sm ring-2 ring-amber-400/40';
      case 1:
        return 'bg-slate-300 dark:bg-slate-500 text-slate-900 dark:text-white font-black ring-2 ring-slate-300/40';
      case 2:
        return 'bg-amber-700/90 text-white font-black ring-2 ring-amber-700/40';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Top sản phẩm bán chạy (Best Seller)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Xếp hạng sản phẩm có hiệu suất kinh doanh nổi bật nhất
          </p>
        </div>

        {/* Action Controls: Top Limit & Sold/Revenue Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Top Limit Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Top:</span>
            <select
              value={topLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-xs px-2.5 py-1 rounded-xl outline-none border-none shadow-sm cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
            <button
              onClick={() => handleModeChange('sold')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                mode === 'sold'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Số lượng bán</span>
            </button>
            <button
              onClick={() => handleModeChange('revenue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                mode === 'revenue'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Doanh thu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Bar List */}
      {fullRankedList.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold">
          Chưa có sản phẩm nào trong hệ thống
        </div>
      ) : (
        <div className="space-y-4 min-h-[290px] flex flex-col justify-start">
          {currentPageItems.map((p, idx) => {
            const globalRank = (validPage - 1) * pageSize + idx;
            const currentVal = mode === 'sold' ? p.soldCount : p.revenue;
            const percent = maxValue > 0 ? (currentVal / maxValue) * 100 : 0;

            return (
              <div key={p.id || globalRank} className="group space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-semibold gap-3">
                  
                  {/* Left info: Global Rank, Image, Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${getMedalColor(globalRank)}`}>
                      {globalRank + 1}
                    </span>
                    <img
                      src={p.image || '/images/paddle.png'}
                      alt={p.name}
                      className="w-8 h-8 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 border border-slate-100 dark:border-slate-800 shrink-0"
                    />
                    <Link
                      href={`/products/${p.slug || p.id}`}
                      target="_blank"
                      className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 truncate max-w-[180px] sm:max-w-[240px]"
                      title={p.name}
                    >
                      {p.name}
                    </Link>
                  </div>

                  {/* Right metric display */}
                  <div className="text-right shrink-0">
                    {mode === 'sold' ? (
                      <span className="font-display font-black text-slate-900 dark:text-white">
                        {p.soldCount.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 font-normal">đã bán</span>
                      </span>
                    ) : (
                      <span className="font-display font-black text-emerald-600 dark:text-emerald-400">
                        {p.revenue >= 1_000_000
                          ? `${(p.revenue / 1_000_000).toFixed(1)}M ₫`
                          : `${p.revenue.toLocaleString('vi-VN')} ₫`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      globalRank === 0
                        ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                        : globalRank === 1
                        ? 'bg-emerald-500'
                        : globalRank === 2
                        ? 'bg-emerald-400'
                        : 'bg-emerald-300 dark:bg-emerald-600'
                    }`}
                    style={{ width: `${Math.max(percent, currentVal > 0 ? 4 : 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer & Details Link */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Pagination Info & Prev/Next Buttons */}
        {totalPages > 1 ? (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[11px] font-bold text-slate-400">
              Trang {validPage}/{totalPages} (Top {fullRankedList.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
                title="Trang tiếp"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-slate-400">
            Hiển thị Top {fullRankedList.length} sản phẩm
          </span>
        )}

        {/* Navigation to Products Management */}
        <Link
          href="/admin/products"
          className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1 self-stretch sm:self-auto justify-center"
        >
          <Package className="w-3.5 h-3.5" />
          <span>Xem tất cả sản phẩm</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
};
