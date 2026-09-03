'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types';

interface RelatedProductsSectionProps {
  products: Product[];
  loading?: boolean;
  categoryName?: string;
}

export const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({
  products,
  loading = false,
  categoryName,
}) => {
  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  // Tối đa 4 sản phẩm gợi ý nhỏ gọn
  const displayProducts = products.slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
      
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Gợi ý sản phẩm liên quan
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {categoryName ? `Có thể bạn cũng thích trong danh mục ${categoryName}` : 'Dành riêng cho bạn'}
            </p>
          </div>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mini Compact Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5 animate-pulse"
            >
              <div className="w-full aspect-square bg-slate-200/70 dark:bg-slate-700/60 rounded-lg" />
              <div className="h-3 bg-slate-200/70 dark:bg-slate-700/60 rounded w-2/3" />
              <div className="h-3.5 bg-slate-200/70 dark:bg-slate-700/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {displayProducts.map((p) => {
            const displayPrice = p.effectiveMinPrice ?? p.minPrice ?? p.price;
            const hasSale = p.oldPrice && p.oldPrice > displayPrice;
            const salePercent = hasSale ? Math.round(((p.oldPrice! - displayPrice) / p.oldPrice!) * 100) : 0;
            const brandOrCat = p.brandName || p.categoryName || 'PickleHub';

            return (
              <Link
                key={p.id}
                href={`/products/${p.slug || p.id}`}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative flex flex-col p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 hover:shadow-sm"
              >
                {/* Badge giảm giá nếu có */}
                {hasSale && salePercent > 0 && (
                  <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold leading-none shadow-xs">
                    -{salePercent}%
                  </span>
                )}

                {/* Compact Thumbnail */}
                <div className="w-full aspect-square rounded-lg bg-white dark:bg-slate-900/80 p-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800/80 mb-2">
                  <img
                    src={p.image || '/images/paddle.png'}
                    alt={p.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as any).src = '/images/paddle.png'; }}
                  />
                </div>

                {/* Brand / Category tag */}
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate mb-0.5">
                  {brandOrCat}
                </span>

                {/* Product Name */}
                <h4
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1 transition-colors mb-1.5"
                  title={p.name}
                >
                  {p.name}
                </h4>

                {/* Price (chỉ hiện minPrice) */}
                <div className="mt-auto flex items-baseline gap-1.5 pt-1">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums">
                    {displayPrice.toLocaleString('vi-VN')} ₫
                  </span>
                  {hasSale && (
                    <span className="text-[10px] text-slate-400 line-through">
                      {p.oldPrice!.toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
};
