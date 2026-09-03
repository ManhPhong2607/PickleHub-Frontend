'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Grid,
  List,
  X,
  Star,
  SlidersHorizontal,
  Flame,
  RotateCcw,
  Layers,
  Tag,
  Package,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from 'lucide-react';
import { ProductCard } from '@/components/common/ProductCard';
import { catalogApi } from '@/lib/api/catalogApi';
import { Product } from '@/types';

function ProductListingContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [dbBrands, setDbBrands] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ─── Collapsible Filter Sections State ─────────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    brand: true,
    status: true,
    rating: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isAllSectionsOpen = useMemo(() => Object.values(openSections).every(Boolean), [openSections]);
  const toggleAllSections = () => {
    const next = !isAllSectionsOpen;
    setOpenSections({
      category: next,
      price: next,
      brand: next,
      status: next,
      rating: next,
    });
  };

  // ─── Filter States ────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState<string>('');
  
  // Price States
  const [priceRange, setPriceRange] = useState<string>('all'); // all, under-500k, 500k-1.5m, 1.5m-3m, 3m-5m, over-5m, custom
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [appliedCustomPrice, setAppliedCustomPrice] = useState<{ min?: number; max?: number } | null>(null);

  // Stock, Status, Promotion & Rating
  const [stockStatus, setStockStatus] = useState<'all' | 'in-stock' | 'low-stock'>('all');
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [bestSellerOnly, setBestSellerOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);

  // Search & Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);

  // ─── Pagination States ───────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Fetch initial catalog data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      catalogApi.getProducts(),
      catalogApi.getCategories(),
      catalogApi.getBrands(),
    ]).then(([prods, cats, brs]) => {
      setProducts(prods);
      setDbCategories(cats);
      setDbBrands(brs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Standard category definitions
  const CATEGORIES = useMemo(() => [
    { id: 'all', label: 'Tất cả sản phẩm', icon: Layers },
    { id: 'paddle', label: 'Vợt Pickleball', icon: Award },
    { id: 'balls', label: 'Bóng thi đấu', icon: Package },
    { id: 'shoes', label: 'Giày thể thao', icon: Tag },
    { id: 'bag', label: 'Túi & Balo', icon: Package },
    { id: 'apparel', label: 'Quần áo', icon: Tag },
    { id: 'accessories', label: 'Lưới & Phụ kiện', icon: Award },
  ], []);

  // Category product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    CATEGORIES.forEach((c) => {
      if (c.id !== 'all') {
        counts[c.id] = products.filter((p) => {
          const cat = (p.category || '').toLowerCase();
          const cName = (p.categoryName || '').toLowerCase();
          const slug = (p.slug || '').toLowerCase();
          if (c.id === 'paddle') return cat.includes('paddle') || cat.includes('vot') || cName.includes('vợt');
          if (c.id === 'balls') return cat.includes('ball') || cat.includes('bong') || cName.includes('bóng');
          if (c.id === 'shoes') return cat.includes('shoe') || cat.includes('giay') || cName.includes('giày');
          if (c.id === 'bag') return cat.includes('bag') || cat.includes('balo') || cat.includes('tui') || cName.includes('túi');
          if (c.id === 'apparel') return cat.includes('apparel') || cat.includes('ao') || cat.includes('quan') || cName.includes('áo');
          if (c.id === 'accessories') return cat.includes('accessories') || cat.includes('phu-kien') || cat.includes('luoi') || cName.includes('phụ kiện');
          return cat === c.id.toLowerCase() || slug.includes(c.id.toLowerCase());
        }).length;
      }
    });
    return counts;
  }, [products, CATEGORIES]);

  // Extracted distinct brands from products & dbBrands
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, number>();
    products.forEach((p) => {
      const b = p.brandName || p.brand;
      if (b) {
        brandMap.set(b, (brandMap.get(b) || 0) + 1);
      }
    });
    dbBrands.forEach((dbB) => {
      if (!brandMap.has(dbB.name)) {
        brandMap.set(dbB.name, 0);
      }
    });

    const result = Array.from(brandMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
    return result.sort((a, b) => b.count - a.count);
  }, [products, dbBrands]);

  // Filtered brands by search
  const filteredBrandsList = useMemo(() => {
    if (!brandSearch.trim()) return availableBrands;
    const q = brandSearch.toLowerCase().trim();
    return availableBrands.filter((b) => b.name.toLowerCase().includes(q));
  }, [availableBrands, brandSearch]);

  // Reset All Filters
  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setBrandSearch('');
    setPriceRange('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setAppliedCustomPrice(null);
    setStockStatus('all');
    setOnSaleOnly(false);
    setBestSellerOnly(false);
    setMinRating(0);
    setSearchQuery('');
    setSortBy('Newest');
    setCurrentPage(1);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (priceRange !== 'all') count++;
    if (appliedCustomPrice) count++;
    if (stockStatus !== 'all') count++;
    if (onSaleOnly) count++;
    if (bestSellerOnly) count++;
    if (minRating > 0) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [
    selectedCategory,
    selectedBrands,
    priceRange,
    appliedCustomPrice,
    stockStatus,
    onSaleOnly,
    bestSellerOnly,
    minRating,
    searchQuery,
  ]);

  // Whenever any filter changes, reset to page 1
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const handleApplyCustomPrice = () => {
    const min = minPriceInput ? parseFloat(minPriceInput.replace(/\D/g, '')) : undefined;
    const max = maxPriceInput ? parseFloat(maxPriceInput.replace(/\D/g, '')) : undefined;
    if (min !== undefined || max !== undefined) {
      setAppliedCustomPrice({ min, max });
      setPriceRange('custom');
      setCurrentPage(1);
    }
  };

  const handleToggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
    setCurrentPage(1);
  };

  // ─── Filter & Sort Execution Logic ────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Category Filter
    if (selectedCategory !== 'all') {
      list = list.filter((p) => {
        const c = (p.category || '').toLowerCase();
        const cName = (p.categoryName || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();
        if (selectedCategory === 'paddle') return c.includes('paddle') || c.includes('vot') || cName.includes('vợt');
        if (selectedCategory === 'balls') return c.includes('ball') || c.includes('bong') || cName.includes('bóng');
        if (selectedCategory === 'shoes') return c.includes('shoe') || c.includes('giay') || cName.includes('giày');
        if (selectedCategory === 'bag') return c.includes('bag') || c.includes('balo') || c.includes('tui') || cName.includes('túi');
        if (selectedCategory === 'apparel') return c.includes('apparel') || c.includes('ao') || c.includes('quan') || cName.includes('áo');
        if (selectedCategory === 'accessories') return c.includes('accessories') || c.includes('phu-kien') || c.includes('luoi') || cName.includes('phụ kiện');
        return c === selectedCategory.toLowerCase() || slug.includes(selectedCategory.toLowerCase());
      });
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.brandName && p.brandName.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // 3. Brand Filter (Multi-select)
    if (selectedBrands.length > 0) {
      list = list.filter((p) => {
        const b = p.brandName || p.brand || '';
        return selectedBrands.includes(b);
      });
    }

    // 4. Price Filter
    if (priceRange === 'under-500k') {
      list = list.filter((p) => p.price < 500000);
    } else if (priceRange === '500k-1.5m') {
      list = list.filter((p) => p.price >= 500000 && p.price <= 1500000);
    } else if (priceRange === '1.5m-3m') {
      list = list.filter((p) => p.price > 1500000 && p.price <= 3000000);
    } else if (priceRange === '3m-5m') {
      list = list.filter((p) => p.price > 3000000 && p.price <= 5000000);
    } else if (priceRange === 'over-5m') {
      list = list.filter((p) => p.price > 5000000);
    } else if (priceRange === 'custom' && appliedCustomPrice) {
      if (appliedCustomPrice.min !== undefined) {
        list = list.filter((p) => p.price >= appliedCustomPrice.min!);
      }
      if (appliedCustomPrice.max !== undefined) {
        list = list.filter((p) => p.price <= appliedCustomPrice.max!);
      }
    }

    // 5. Stock Status Filter
    if (stockStatus === 'in-stock') {
      list = list.filter((p) => (p.stock === undefined || p.stock > 0) && (p as any).status !== 'OutOfStock');
    } else if (stockStatus === 'low-stock') {
      list = list.filter((p) => p.stock > 0 && p.stock <= 5);
    }

    // 6. On Promotion / Discounted
    if (onSaleOnly) {
      list = list.filter((p) => p.isOnSale || (p.oldPrice && p.oldPrice > p.price) || (p.salePercent && p.salePercent > 0));
    }

    // 7. Rating Filter
    if (minRating > 0) {
      list = list.filter((p) => p.rating >= minRating);
    }

    // 8. Sorting Logic (Sắp xếp theo thứ tự bán chạy nhất từ cao đến thấp)
    if (sortBy === 'PriceAsc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PriceDesc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'BestSelling' || bestSellerOnly) {
      list.sort((a, b) => {
        const soldA = a.soldCount ?? 0;
        const soldB = b.soldCount ?? 0;
        if (soldB !== soldA) return soldB - soldA;
        const reviewA = a.reviewsCount ?? 0;
        const reviewB = b.reviewsCount ?? 0;
        if (reviewB !== reviewA) return reviewB - reviewA;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
    } else if (sortBy === 'TopRated') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0));
    } else if (sortBy === 'BiggestDiscount') {
      list.sort((a, b) => (b.salePercent ?? 0) - (a.salePercent ?? 0));
    } else if (sortBy === 'Newest') {
      list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    }

    return list;
  }, [
    products,
    selectedCategory,
    searchQuery,
    selectedBrands,
    priceRange,
    appliedCustomPrice,
    stockStatus,
    onSaleOnly,
    bestSellerOnly,
    minRating,
    sortBy,
  ]);

  // ─── Pagination Calculations ─────────────────────────────────────────────
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }
  };

  // Generate pagination page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [totalPages, safeCurrentPage]);

  return (
    <div className="py-8 sm:py-10 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Header Title Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Tất cả sản phẩm
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
              ({totalItems} sản phẩm)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Trang bị Pickleball chính hãng đạt chuẩn thi đấu quốc tế USAPA
          </p>
        </div>

        {/* Top Control Toolbar (Search, Filter Button, Sort, View Mode) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box & Mobile Filter Button */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo tên, mã SKU, thương hiệu..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="md:hidden px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>Bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>
          </div>

          {/* Sort Dropdown, Page Size & Grid/List View Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="Newest">Mới nhất (Newest)</option>
                <option value="BestSelling">⚡ Bán chạy nhất (Best Selling)</option>
                <option value="PriceAsc">Giá: Thấp đến Cao (PriceAsc)</option>
                <option value="PriceDesc">Giá: Cao đến Thấp (PriceDesc)</option>
                <option value="TopRated">⭐ Đánh giá cao nhất (Top Rated)</option>
                <option value="BiggestDiscount">🔥 Giảm giá nhiều nhất (Big Sale)</option>
              </select>
            </div>

            {/* Page Size selector */}
            <div className="hidden sm:flex items-center gap-1 text-xs">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                title="Số sản phẩm mỗi trang"
              >
                <option value={9}>9 / trang</option>
                <option value={12}>12 / trang</option>
                <option value={24}>24 / trang</option>
                <option value={36}>36 / trang</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400'
                }`}
                title="Dạng lưới"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* ACTIVE FILTER BADGES ROW */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/50">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              Đang lọc ({activeFiltersCount}):
            </span>
            
            {/* Category badge */}
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-bold flex items-center gap-1.5 text-[11px] shadow-xs">
                Danh mục: {CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => handleCategoryChange('all')} />
              </span>
            )}

            {/* Selected Brands badges */}
            {selectedBrands.map((b) => (
              <span key={b} className="px-3 py-1 bg-slate-800 text-white rounded-full font-bold flex items-center gap-1.5 text-[11px] shadow-xs">
                Hiệu: {b}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => handleToggleBrand(b)} />
              </span>
            ))}

            {/* Price badge */}
            {priceRange !== 'all' && (
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-bold flex items-center gap-1.5 text-[11px]">
                Giá: {
                  priceRange === 'under-500k' ? '< 500.000₫' :
                  priceRange === '500k-1.5m' ? '500k - 1.5tr' :
                  priceRange === '1.5m-3m' ? '1.5tr - 3tr' :
                  priceRange === '3m-5m' ? '3tr - 5tr' :
                  priceRange === 'over-5m' ? '> 5.000.000₫' :
                  `${appliedCustomPrice?.min?.toLocaleString('vi-VN') || 0}₫ - ${appliedCustomPrice?.max?.toLocaleString('vi-VN') || '∞'}₫`
                }
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setPriceRange('all'); setAppliedCustomPrice(null); setCurrentPage(1); }} />
              </span>
            )}

            {/* Stock status badge */}
            {stockStatus !== 'all' && (
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-bold flex items-center gap-1.5 text-[11px]">
                {stockStatus === 'in-stock' ? 'Còn hàng' : 'Sắp hết hàng'}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setStockStatus('all'); setCurrentPage(1); }} />
              </span>
            )}

            {/* On Sale badge */}
            {onSaleOnly && (
              <span className="px-3 py-1 bg-rose-600 text-white rounded-full font-bold flex items-center gap-1.5 text-[11px]">
                🔥 Đang giảm giá
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setOnSaleOnly(false); setCurrentPage(1); }} />
              </span>
            )}

            {/* Best Seller badge */}
            {bestSellerOnly && (
              <span className="px-3 py-1 bg-amber-500 text-white rounded-full font-bold flex items-center gap-1.5 text-[11px]">
                ⚡ Bán chạy nhất
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setBestSellerOnly(false); setSortBy('Newest'); setCurrentPage(1); }} />
              </span>
            )}

            {/* Rating badge */}
            {minRating > 0 && (
              <span className="px-3 py-1 bg-amber-500 text-white rounded-full font-bold flex items-center gap-1.5 text-[11px]">
                Từ {minRating}★
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setMinRating(0); setCurrentPage(1); }} />
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* MAIN LAYOUT: SIDEBAR FILTER (LEFT 1 COL) + PRODUCTS & PAGINATION (RIGHT 3 COLS) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* SIDEBAR FILTER PANEL */}
          <aside className={`md:block space-y-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-fit ${showMobileFilter ? 'block' : 'hidden'}`}>
            
            {/* Header / Reset / Expand-Collapse All */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Bộ Lọc Sản Phẩm</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title={isAllSectionsOpen ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                >
                  {isAllSectionsOpen ? "Thu gọn" : "Mở tất cả"}
                </button>
                {activeFiltersCount > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button onClick={resetAllFilters} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                      <RotateCcw className="w-3 h-3" />
                      Đặt lại
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 1. DANH MỤC (Category Filter with Counts) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between text-left group py-1.5 select-none cursor-pointer"
              >
                <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-wider flex items-center gap-1.5 transition-colors">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Danh mục thiết bị
                </h4>
                <div className="flex items-center gap-1.5">
                  {selectedCategory !== 'all' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold leading-none">
                      1
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                      openSections.category ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </div>
              </button>

              {openSections.category && (
                <div className="space-y-1 text-xs font-semibold pt-2 animate-in fade-in duration-200">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const isSelected = selectedCategory === c.id;
                    const count = categoryCounts[c.id] || 0;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleCategoryChange(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span>{c.label}</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isSelected
                            ? 'bg-emerald-700/80 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. KHOẢNG GIÁ (Predefined + Custom Inputs) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => toggleSection('price')}
                className="w-full flex items-center justify-between text-left group py-1.5 select-none cursor-pointer"
              >
                <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-wider flex items-center gap-1.5 transition-colors">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Khoảng giá (VNĐ)
                </h4>
                <div className="flex items-center gap-1.5">
                  {priceRange !== 'all' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold leading-none">
                      ✓
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                      openSections.price ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </div>
              </button>
              
              {openSections.price && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  {/* Custom Min/Max Price Inputs (Selkirk Style) */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tự chọn khoảng giá (₫)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                        placeholder="Từ ₫"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="number"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                        placeholder="Đến ₫"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={handleApplyCustomPrice}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition-all shadow-xs"
                    >
                      Áp dụng khoảng giá
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs font-medium">
                    {[
                      { id: 'all', label: 'Tất cả mức giá' },
                      { id: 'under-500k', label: 'Dưới 500.000 ₫' },
                      { id: '500k-1.5m', label: '500.000 ₫ - 1.500.000 ₫' },
                      { id: '1.5m-3m', label: '1.500.000 ₫ - 3.000.000 ₫' },
                      { id: '3m-5m', label: '3.000.000 ₫ - 5.000.000 ₫' },
                      { id: 'over-5m', label: 'Trên 5.000.000 ₫' },
                    ].map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={priceRange === p.id}
                          onChange={() => {
                            setPriceRange(p.id);
                            setAppliedCustomPrice(null);
                            setCurrentPage(1);
                          }}
                          className="text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. THƯƠNG HIỆU (Multi-Select Brands with Search) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => toggleSection('brand')}
                className="w-full flex items-center justify-between text-left group py-1.5 select-none cursor-pointer"
              >
                <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-wider flex items-center gap-1.5 transition-colors">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Thương hiệu
                </h4>
                <div className="flex items-center gap-1.5">
                  {selectedBrands.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold leading-none">
                      {selectedBrands.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                      openSections.brand ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </div>
              </button>

              {openSections.brand && (
                <div className="space-y-2.5 pt-2 animate-in fade-in duration-200">
                  {selectedBrands.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedBrands([]);
                          setCurrentPage(1);
                        }}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Bỏ chọn tất cả ({selectedBrands.length})
                      </button>
                    </div>
                  )}

                  {/* Brand Search Input if > 5 brands */}
                  {availableBrands.length > 5 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        placeholder="Tìm thương hiệu..."
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1 text-xs pr-1 scrollbar-thin">
                    {filteredBrandsList.map((b) => {
                      const isChecked = selectedBrands.includes(b.name);
                      return (
                        <label
                          key={b.name}
                          className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleBrand(b.name)}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 accent-emerald-600"
                            />
                            <span>{b.name}</span>
                          </span>
                          {b.count > 0 && (
                            <span className="text-[10px] font-mono text-slate-400 font-bold">
                              ({b.count})
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. TÌNH TRẠNG HÀNG & KHUYẾN MÃI (Stock & Sales) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => toggleSection('status')}
                className="w-full flex items-center justify-between text-left group py-1.5 select-none cursor-pointer"
              >
                <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-wider flex items-center gap-1.5 transition-colors">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  Tình trạng & Ưu đãi
                </h4>
                <div className="flex items-center gap-1.5">
                  {(onSaleOnly || bestSellerOnly || stockStatus !== 'all') && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold leading-none">
                      ✓
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                      openSections.status ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </div>
              </button>

              {openSections.status && (
                <div className="space-y-2 text-xs font-medium pt-2 animate-in fade-in duration-200">
                  {/* On Sale */}
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 font-bold">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => {
                        setOnSaleOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 accent-rose-600"
                    />
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      Đang giảm giá / Khuyến mãi
                    </span>
                  </label>

                  {/* Best Seller */}
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 font-bold">
                    <input
                      type="checkbox"
                      checked={bestSellerOnly || sortBy === 'BestSelling'}
                      onChange={(e) => {
                        setBestSellerOnly(e.target.checked);
                        setSortBy(e.target.checked ? 'BestSelling' : 'Newest');
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 accent-amber-500"
                    />
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      Sản phẩm bán chạy nhất
                    </span>
                  </label>

                  {/* In Stock */}
                  <label className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="stockStatus"
                      checked={stockStatus === 'in-stock'}
                      onChange={() => {
                        setStockStatus('in-stock');
                        setCurrentPage(1);
                      }}
                      className="text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <span>Chỉ hiện sản phẩm còn hàng</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="stockStatus"
                      checked={stockStatus === 'all'}
                      onChange={() => {
                        setStockStatus('all');
                        setCurrentPage(1);
                      }}
                      className="text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <span>Tất cả trạng thái tồn kho</span>
                  </label>
                </div>
              )}
            </div>

            {/* 5. ĐÁNH GIÁ (Customer Reviews & Rating) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => toggleSection('rating')}
                className="w-full flex items-center justify-between text-left group py-1.5 select-none cursor-pointer"
              >
                <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-wider flex items-center gap-1.5 transition-colors">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  Đánh giá sản phẩm
                </h4>
                <div className="flex items-center gap-1.5">
                  {minRating > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold leading-none">
                      {minRating}★
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                      openSections.rating ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </div>
              </button>

              {openSections.rating && (
                <div className="space-y-1 text-xs font-medium pt-2 animate-in fade-in duration-200">
                  {[
                    { stars: 5, label: '5 sao tuyệt đối' },
                    { stars: 4, label: 'Từ 4 sao trở lên' },
                    { stars: 3, label: 'Từ 3 sao trở lên' },
                    { stars: 0, label: 'Tất cả đánh giá' },
                  ].map((r) => (
                    <label key={r.stars} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="minRating"
                        checked={minRating === r.stars}
                        onChange={() => {
                          setMinRating(r.stars);
                          setCurrentPage(1);
                        }}
                        className="text-amber-500 focus:ring-amber-400 accent-amber-500"
                      />
                      <span className="flex items-center gap-1">
                        {r.stars > 0 && (
                          <span className="text-amber-400 font-bold">
                            {'★'.repeat(r.stars)}
                            {'☆'.repeat(5 - r.stars)}
                          </span>
                        )}
                        <span>{r.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </aside>

          {/* PRODUCT LISTING DISPLAY & PAGINATION (RIGHT 3 COLUMNS) */}
          <div className="md:col-span-3 space-y-6">
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400">Đang tải danh mục sản phẩm PickleHub...</p>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                {/* Product Grid / List */}
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {paginatedProducts.map((prod) => (
                    <ProductCard key={prod.id} product={prod} viewMode={viewMode} />
                  ))}
                </div>

                {/* ─── PAGINATION BAR ─────────────────────────────────────── */}
                <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 dark:border-slate-800">
                  {/* Results Count Info */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Hiển thị{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(safeCurrentPage - 1) * pageSize + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {Math.min(safeCurrentPage * pageSize, totalItems)}
                    </span>{' '}
                    trên tổng số{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {totalItems}
                    </span>{' '}
                    sản phẩm
                  </p>

                  {/* Page Navigation Buttons */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      {/* First Page */}
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={safeCurrentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Trang đầu"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>

                      {/* Previous Page */}
                      <button
                        onClick={() => handlePageChange(safeCurrentPage - 1)}
                        disabled={safeCurrentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {pageNumbers.map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`dots-${idx}`} className="px-2 text-xs font-bold text-slate-400">
                                ...
                              </span>
                            );
                          }
                          const pageNum = Number(p);
                          const isActive = pageNum === safeCurrentPage;
                          return (
                            <button
                              key={`page-${pageNum}`}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                                isActive
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Page */}
                      <button
                        onClick={() => handlePageChange(safeCurrentPage + 1)}
                        disabled={safeCurrentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Trang tiếp"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Last Page */}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={safeCurrentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Trang cuối"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <SlidersHorizontal className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy sản phẩm phù hợp</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Hãy thử mở rộng khoảng giá hoặc bỏ chọn bớt thương hiệu.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa tất cả bộ lọc</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-xs font-medium text-slate-400 space-y-2">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Đang tải danh mục thiết bị Pickleball...</p>
      </div>
    }>
      <ProductListingContent />
    </Suspense>
  );
}
