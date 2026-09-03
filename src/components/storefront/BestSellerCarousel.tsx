'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Flame, ChevronLeft, ChevronRight, ArrowRight, ShoppingBag } from 'lucide-react';
import { Product, ProductVariantItem } from '@/types';
import { catalogApi } from '@/lib/api/catalogApi';
import { useCartStore } from '@/store/useCartStore';
import { QuickAddModal } from '@/components/common/QuickAddModal';

const COLOR_MAP: Record<string, string> = {
  'đen': '#111827',
  'den': '#111827',
  'black': '#111827',
  'carbon': '#1f2937',
  'trắng': '#FFFFFF',
  'trang': '#FFFFFF',
  'white': '#FFFFFF',
  'hồng': '#F472B6',
  'hong': '#F472B6',
  'pink': '#F472B6',
  'đỏ': '#EF4444',
  'do': '#EF4444',
  'red': '#EF4444',
  'xanh navy': '#1E3A8A',
  'navy': '#1E3A8A',
  'xanh dương': '#3B82F6',
  'xanh duong': '#3B82F6',
  'blue': '#3B82F6',
  'xanh lá': '#10B981',
  'xanh la': '#10B981',
  'green': '#10B981',
  'vàng': '#F59E0B',
  'vang': '#F59E0B',
  'yellow': '#F59E0B',
  'cam': '#F97316',
  'orange': '#F97316',
  'tím': '#8B5CF6',
  'tim': '#8B5CF6',
  'purple': '#8B5CF6',
  'bạc': '#CBD5E1',
  'silver': '#CBD5E1',
  'xám': '#64748B',
  'xam': '#64748B',
  'gray': '#64748B',
  'grey': '#64748B',
  'nâu': '#78350F',
  'brown': '#78350F',
};

function resolveColorHex(val: string): string {
  if (!val) return '#94A3B8';
  const lower = val.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }
  if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) return val;
  return '#475569';
}

function matchesCategory(p: Product, targetCat: string): boolean {
  const cat = (p.category || '').toLowerCase();
  const catName = (p.categoryName || '').toLowerCase();
  if (targetCat === 'paddle') return cat.includes('paddle') || cat.includes('vot') || catName.includes('vợt');
  if (targetCat === 'balls') return cat.includes('ball') || cat.includes('bong') || catName.includes('bóng');
  if (targetCat === 'shoes') return cat.includes('shoe') || cat.includes('giay') || catName.includes('giày');
  if (targetCat === 'bag') return cat.includes('bag') || cat.includes('balo') || cat.includes('tui') || catName.includes('túi');
  if (targetCat === 'apparel') return cat.includes('apparel') || cat.includes('ao') || cat.includes('quan') || catName.includes('áo');
  if (targetCat === 'accessories') return cat.includes('accessories') || cat.includes('phu-kien') || cat.includes('luoi') || catName.includes('phụ kiện');
  return cat === targetCat;
}

const CATEGORY_DEFINITIONS = [
  { id: 'paddle', name: 'Vợt Pickleball', matcher: (p: Product) => matchesCategory(p, 'paddle') },
  { id: 'balls', name: 'Bóng Thi Đấu', matcher: (p: Product) => matchesCategory(p, 'balls') },
  { id: 'shoes', name: 'Giày Thể Thao', matcher: (p: Product) => matchesCategory(p, 'shoes') },
  { id: 'bag', name: 'Túi & Balo', matcher: (p: Product) => matchesCategory(p, 'bag') },
  { id: 'apparel', name: 'Quần Áo Thể Thao', matcher: (p: Product) => matchesCategory(p, 'apparel') },
  { id: 'accessories', name: 'Phụ Kiện & Lưới', matcher: (p: Product) => matchesCategory(p, 'accessories') },
];

// ── SINGLE BEST SELLER PRODUCT CARD (SELKIRK STYLE) ──────────────────────────
const BestSellerCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCartStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);

  // Extract color swatches if variants have colors
  const colorVariants = useMemo(() => {
    if (!product.variants || product.variants.length <= 1) return [];
    const colors: { name: string; hex: string; image?: string; variant: ProductVariantItem }[] = [];
    const seen = new Set<string>();

    product.variants.forEach((v) => {
      const colorVal = v.attributes?.['Color'] || v.attributes?.['Màu'] || v.attributes?.['màu'] || v.attributes?.['color'];
      if (colorVal && !seen.has(colorVal.toLowerCase().trim())) {
        seen.add(colorVal.toLowerCase().trim());
        colors.push({
          name: colorVal,
          hex: resolveColorHex(colorVal),
          image: v.attributes?.['ImageUrl'] || v.attributes?.['imageUrl'] || undefined,
          variant: v,
        });
      }
    });
    return colors;
  }, [product.variants]);

  const activeImage = useMemo(() => {
    if (colorVariants.length > 0 && colorVariants[selectedVariantIndex]?.image) {
      return colorVariants[selectedVariantIndex].image;
    }
    return product.image || (product.images && product.images[0]) || '/images/paddle.png';
  }, [colorVariants, selectedVariantIndex, product.image, product.images]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.variants && product.variants.length > 1) {
      setIsQuickAddOpen(true);
    } else {
      const v = (product.variants && product.variants.length === 1) ? product.variants[0] : null;
      addItem(product, v?.id, v?.label, v?.effectivePrice || product.price, 1);
    }
  };

  const displayCategory = product.categoryName || (
    product.category === 'paddle' ? 'Vợt Pickleball' :
    product.category === 'balls' ? 'Bóng Thi Đấu' :
    product.category === 'shoes' ? 'Giày Thể Thao' :
    product.category === 'bag' ? 'Túi & Balo' :
    product.category === 'apparel' ? 'Quần Áo' :
    product.category === 'accessories' ? 'Phụ Kiện' :
    'Thiết Bị Pickleball'
  );

  const displayBrand = product.brandName || product.brand;

  return (
    <>
      <div className="group flex flex-col h-full space-y-3 relative select-none">
        {/* Studio Product Image Area */}
        <Link
          href={`/products/${product.id}`}
          className="relative aspect-square w-full rounded-2xl bg-[#f4f5f7] dark:bg-slate-800/60 p-6 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-md"
        >
          {/* Badge Tag */}
          <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1">
            {product.salePercent && product.salePercent > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                -{product.salePercent}%
              </span>
            ) : (product.soldCount && product.soldCount > 0) ? (
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shadow-xs flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 fill-current" />
                <span>Best Seller</span>
              </span>
            ) : product.badge ? (
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-wider shadow-xs">
                {product.badge}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                Hot
              </span>
            )}
          </div>

          {/* Product Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/paddle.png';
            }}
          />
        </Link>

        {/* Color Swatches (Selkirk Style) */}
        {colorVariants.length > 1 && (
          <div className="flex items-center gap-1.5 px-1 py-0.5">
            {colorVariants.map((c, idx) => {
              const isSelected = selectedVariantIndex === idx;
              const isWhiteOrLight = c.hex.toLowerCase() === '#ffffff' || c.hex === '#fff';
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariantIndex(idx);
                  }}
                  onMouseEnter={() => setSelectedVariantIndex(idx)}
                  className={`w-4 h-4 rounded-xs transition-all duration-150 p-0.5 flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-slate-900 dark:ring-white scale-110'
                      : 'opacity-70 hover:opacity-100 hover:scale-105 border border-slate-300 dark:border-slate-700'
                  }`}
                  title={c.name}
                  aria-label={c.name}
                >
                  <span
                    className={`w-full h-full rounded-[1px] block ${isWhiteOrLight ? 'border border-slate-300' : ''}`}
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              );
            })}
          </div>
        )}

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

          {/* Price & Action Button */}
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
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
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

// ── BEST SELLER SLIDER (EXACTLY 1 BEST SELLER PER CATEGORY, 4 IN 1 ROW SLIDER) ─
export const BestSellerCarousel: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Carousel slider state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(4);

  // Fetch all products
  useEffect(() => {
    setLoading(true);
    catalogApi.getProducts()
      .then((data) => {
        setAllProducts(data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Update visible card count based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. FILTER EXACTLY 1 TOP BEST-SELLING PRODUCT FOR EACH CATEGORY
  const bestSellerProductsPerCategory = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const topProducts: Product[] = [];
    const usedProductIds = new Set<string>();

    CATEGORY_DEFINITIONS.forEach((catDef) => {
      const catProducts = allProducts.filter((p) => catDef.matcher(p));
      if (catProducts.length > 0) {
        // Sort by soldCount descending, then reviewsCount / rating
        catProducts.sort((a, b) => {
          const soldA = a.soldCount ?? 0;
          const soldB = b.soldCount ?? 0;
          if (soldB !== soldA) return soldB - soldA;
          return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
        });

        // Pick the #1 best seller of this category
        const top1 = catProducts[0];
        if (top1 && !usedProductIds.has(top1.id)) {
          topProducts.push(top1);
          usedProductIds.add(top1.id);
        }
      }
    });

    // Check if there are other categories not in standard list
    const remainingProducts = allProducts.filter((p) => !usedProductIds.has(p.id));
    const otherCategories = new Set<string>();
    remainingProducts.forEach((p) => {
      const c = p.category || p.categoryName || 'other';
      if (!otherCategories.has(c)) {
        otherCategories.add(c);
        const group = remainingProducts.filter((item) => (item.category || item.categoryName || 'other') === c);
        group.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
        if (group[0] && !usedProductIds.has(group[0].id)) {
          topProducts.push(group[0]);
          usedProductIds.add(group[0].id);
        }
      }
    });

    return topProducts;
  }, [allProducts]);

  const maxIndex = Math.max(0, bestSellerProductsPerCategory.length - visibleCount);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const GAP = 24; // 24px gap (gap-6)

  return (
    <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Row: Title on Left, View All on Right */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              Sản phẩm bán chạy nhất
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Top các thiết bị thi đấu được các vận động viên và câu lạc bộ tin dùng
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* View All Link */}
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* 1-Row Carousel Slider Container */}
        <div className="relative">
          {/* Left Arrow Button */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute -left-3 sm:-left-5 lg:-left-6 top-[38%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-800 dark:text-white hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors backdrop-blur-md cursor-pointer"
              title="Trượt sang trái"
              aria-label="Previous products"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Viewport Box (Always exactly 1 row, 4 items on desktop) */}
          <div ref={containerRef} className="w-full overflow-hidden py-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="aspect-[4/5] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : bestSellerProductsPerCategory.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <p className="text-sm font-medium">Chưa có sản phẩm nào.</p>
              </div>
            ) : (
              <div
                className="flex items-stretch transition-transform duration-500 ease-out"
                style={{
                  gap: `${GAP}px`,
                  transform: `translateX(calc(-${currentIndex} * ((100% - ${(visibleCount - 1) * GAP}px) / ${visibleCount} + ${GAP}px)))`,
                }}
              >
                {bestSellerProductsPerCategory.map((prod) => (
                  <div
                    key={prod.id}
                    className="shrink-0"
                    style={{
                      width: `calc((100% - ${(visibleCount - 1) * GAP}px) / ${visibleCount})`,
                    }}
                  >
                    <BestSellerCard product={prod} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Arrow Button */}
          {currentIndex < maxIndex && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute -right-3 sm:-right-5 lg:-right-6 top-[38%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-800 dark:text-white hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors backdrop-blur-md cursor-pointer"
              title="Trượt sang phải"
              aria-label="Next products"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Slide Position Indicator Dots */}
        {bestSellerProductsPerCategory.length > visibleCount && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                title={`Vị trí ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
