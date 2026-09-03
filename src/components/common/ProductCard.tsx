'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { QuickAddModal } from './QuickAddModal';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const { addItem } = useCartStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If product has multiple variants, open quick select modal first
    if (product.variants && product.variants.length > 1) {
      setIsQuickAddOpen(true);
    } else {
      // Single variant or standard product
      const v = (product.variants && product.variants.length === 1) ? product.variants[0] : null;
      addItem(product, v?.id, v?.label, v?.effectivePrice || product.price, 1);
    }
  };

  // Determine display category name
  const displayCategory = product.categoryName || (
    product.category === 'paddle' ? 'Vợt Pickleball' :
    product.category === 'balls' ? 'Bóng Pickleball' :
    product.category === 'shoes' ? 'Giày Thể Thao' :
    product.category === 'bag' ? 'Túi & Balo' :
    product.category === 'apparel' ? 'Quần Áo' :
    product.category === 'accessories' ? 'Phụ Kiện' :
    'Dụng cụ Pickleball'
  );

  const displayBrand = product.brandName || product.brand;

  // -------------------------------------------------------------------
  // LIST VIEW LAYOUT (CLEAN & FRAMELESS HORIZONTAL ROW)
  // -------------------------------------------------------------------
  if (viewMode === 'list') {
    return (
      <>
        <div className="group flex flex-col sm:flex-row items-center gap-6 py-6 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
          {/* Product Image Thumbnail */}
          <Link
            href={`/products/${product.id}`}
            className="relative w-full sm:w-48 aspect-square bg-slate-100/80 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-center shrink-0 overflow-hidden"
          >
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
              {product.salePercent && product.salePercent > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                  -{product.salePercent}%
                </span>
              ) : product.badge ? (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[9px] uppercase tracking-wider">
                  {product.badge}
                </span>
              ) : (product.soldCount && product.soldCount >= 50) ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                  Bán chạy
                </span>
              ) : null}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || '/images/paddle.png'}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/paddle.png';
              }}
            />
          </Link>

          {/* Content Info */}
          <div className="flex-1 w-full space-y-2">
            {/* Brand & Category Subtitle */}
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {displayBrand ? `${displayBrand} — ` : ''}{displayCategory}
            </p>

            {/* Product Title */}
            <Link href={`/products/${product.id}`}>
              <h3 className="font-bold text-slate-900 dark:text-white text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>

            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {product.description || `${product.name} chính hãng đạt tiêu chuẩn thi đấu quốc tế.`}
            </p>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="font-black text-lg text-slate-900 dark:text-white">
                  {product.price.toLocaleString('vi-VN')} ₫
                </span>
                {product.oldPrice && (
                  <span className="text-xs text-slate-400 line-through ml-2 font-medium">
                    {product.oldPrice.toLocaleString('vi-VN')} ₫
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/products/${product.id}`}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  Chi tiết
                </Link>
                <button
                  onClick={handleAddToCart}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Thêm vào giỏ</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Modal */}
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          product={product}
        />
      </>
    );
  }

  // -------------------------------------------------------------------
  // GRID VIEW LAYOUT (FRAMELESS, MINIMALIST, HIGH-IMPACT)
  // -------------------------------------------------------------------
  return (
    <>
      <div className="group flex flex-col space-y-3 relative">
        {/* Frameless Image Area */}
        <Link
          href={`/products/${product.id}`}
          className="relative aspect-[4/5] w-full rounded-2xl bg-[#f4f5f7] dark:bg-slate-800/50 p-6 flex items-center justify-center overflow-hidden transition-all duration-300"
        >
          {/* Subtle Badge Tag */}
          <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1">
            {product.salePercent && product.salePercent > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                -{product.salePercent}%
              </span>
            ) : product.badge ? (
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-wider shadow-xs">
                {product.badge}
              </span>
            ) : (product.soldCount && product.soldCount >= 50) ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                Bán chạy
              </span>
            ) : null}
          </div>

          {/* Product Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || '/images/paddle.png'}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/paddle.png';
            }}
          />
        </Link>

        {/* Product Details */}
        <div className="space-y-1.5 px-1 flex flex-col flex-1 justify-between">
          <div>
            {/* Brand & Category Subtitle */}
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {displayBrand ? `${displayBrand} — ` : ''}{displayCategory}
            </p>

            {/* Product Title */}
            <Link href={`/products/${product.id}`} className="block mt-0.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
          </div>

          {/* Price & Green Action Button Row */}
          <div className="pt-2 flex items-end justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              {product.oldPrice && product.oldPrice > (product.effectiveMinPrice ?? product.price) && (
                <div className="text-xs text-slate-400 line-through font-medium leading-none mb-1">
                  {product.oldPrice.toLocaleString('vi-VN')} ₫
                </div>
              )}
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums leading-tight">
                {`${(product.effectiveMinPrice ?? product.minPrice ?? product.price).toLocaleString('vi-VN')} ₫`}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        product={product}
      />
    </>
  );
};
