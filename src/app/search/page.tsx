'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/common/ProductCard';
import { catalogApi } from '@/lib/api/catalogApi';
import { Product } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [inputVal, setInputVal] = useState(query);

  useEffect(() => {
    catalogApi.getProducts().then(setProducts);
  }, []);

  const results = products.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputVal.trim())}`);
    }
  };

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <form onSubmit={handleSearch} className="relative max-w-xl">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhập tên sản phẩm, loại vợt, bóng..."
              className="w-full pl-10 pr-24 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium shadow-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
            >
              Tìm kiếm
            </button>
          </form>

          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Kết quả tìm kiếm cho: <span className="text-emerald-600 dark:text-emerald-400">"{query || 'Tất cả'}"</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tìm thấy {results.length} sản phẩm phù hợp
            </p>
          </div>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <Search className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy sản phẩm phù hợp</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Thử tìm với từ khóa ngắn hơn như "Carbon", "Bóng", "Túi".</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-slate-400">Đang tìm kiếm sản phẩm...</div>}>
      <SearchContent />
    </Suspense>
  );
}
