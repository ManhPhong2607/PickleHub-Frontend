'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/common/ProductCard';
import { useWishlistStore } from '@/store/useWishlistStore';

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Sản phẩm yêu thích ({items.length})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Danh sách các trang bị bạn đã lưu lại để tham khảo hoặc mua sau
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa toàn bộ</span>
            </button>
          )}
        </div>

        {/* Saved Items Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bạn chưa lưu sản phẩm nào</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bấm vào biểu tượng trái tim ở góc sản phẩm để lưu lại xem sau.</p>
            <Link href="/products" className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
              Khám phá sản phẩm ngay
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
