'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, SlidersHorizontal, X, RotateCcw, ChevronDown, Check,
  DollarSign, Tag, Sparkles, Layers
} from 'lucide-react';
import {
  type FilterState,
  type SortOption,
  SORT_OPTIONS,
  DEFAULT_FILTERS,
  CATEGORIES,
  formatVND,
} from './types';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
}

export const FilterBar: React.FC<FilterBarProps> = React.memo(
  ({
    filters,
    onFiltersChange,
    searchQuery,
    onSearchChange,
    totalCount,
    filteredCount,
    categories = [],
    brands = [],
  }) => {
    const [expanded, setExpanded] = useState(false);
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Searchable Category Dropdown state
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    const [catSearchQuery, setCatSearchQuery] = useState('');
    const catDropdownRef = useRef<HTMLDivElement>(null);

    // Sync external search back to local
    useEffect(() => {
      setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Close category dropdown on outside click
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (catDropdownRef.current && !catDropdownRef.current.contains(event.target as Node)) {
          setIsCatDropdownOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search (300ms)
    const handleSearchInput = useCallback(
      (value: string) => {
        setLocalSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onSearchChange(value);
        }, 300);
      },
      [onSearchChange]
    );

    // Cleanup timeout
    useEffect(() => {
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, []);

    const updateFilter = useCallback(
      <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFiltersChange({ ...filters, [key]: value });
      },
      [filters, onFiltersChange]
    );

    // Price Preset Change handler
    const handlePricePreset = (preset: string) => {
      switch (preset) {
        case 'under_500':
          onFiltersChange({ ...filters, pricePreset: 'under_500', priceMin: '', priceMax: '500000' });
          break;
        case '500_1000':
          onFiltersChange({ ...filters, pricePreset: '500_1000', priceMin: '500000', priceMax: '1000000' });
          break;
        case '1000_2000':
          onFiltersChange({ ...filters, pricePreset: '1000_2000', priceMin: '1000000', priceMax: '2000000' });
          break;
        case 'over_2000':
          onFiltersChange({ ...filters, pricePreset: 'over_2000', priceMin: '2000000', priceMax: '' });
          break;
        default:
          onFiltersChange({ ...filters, pricePreset: 'all', priceMin: '', priceMax: '' });
          break;
      }
    };

    // Category list
    const availableCategories = useMemo(() => {
      const list = categories.length > 0 ? categories.map((c) => c.name) : CATEGORIES;
      if (!catSearchQuery.trim()) return list;
      return list.filter((c) => c.toLowerCase().includes(catSearchQuery.toLowerCase().trim()));
    }, [categories, catSearchQuery]);

    // Active filters count
    const activeFiltersCount = useMemo(() => {
      let count = 0;
      if (searchQuery.trim()) count++;
      if (filters.category) count++;
      if (filters.brand) count++;
      if (filters.priceMin || filters.priceMax) count++;
      if (filters.productStatus !== 'all') count++;
      if (filters.hasPromotion !== 'all') count++;
      if (filters.promoStatus !== 'all') count++;
      if (filters.effectivePriceMin || filters.effectivePriceMax) count++;
      return count;
    }, [searchQuery, filters]);

    const handleReset = () => {
      onFiltersChange(DEFAULT_FILTERS);
      onSearchChange('');
      setLocalSearch('');
      setCatSearchQuery('');
    };

    return (
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* Top row: Search + Quick Filters + Sort */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Smart Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, SKU, danh mục, thương hiệu..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
            />
            {localSearch && (
              <button
                onClick={() => handleSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Searchable Category Dropdown Popover */}
            <div className="relative" ref={catDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
                  filters.category
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{filters.category || 'Tất cả danh mục'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {isCatDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      value={catSearchQuery}
                      onChange={(e) => setCatSearchQuery(e.target.value)}
                      placeholder="Tìm danh mục..."
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-700 font-medium"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 text-xs">
                    <button
                      onClick={() => {
                        updateFilter('category', '');
                        setIsCatDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition-colors ${
                        filters.category === ''
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>Tất cả danh mục</span>
                      {filters.category === '' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          updateFilter('category', cat);
                          setIsCatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition-colors ${
                          filters.category === cat
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {filters.category === cat && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Quick Filter (Active / Draft / Hidden) */}
            <select
              value={filters.productStatus}
              onChange={(e) => updateFilter('productStatus', e.target.value as any)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Kích hoạt</option>
              <option value="draft">⚪ Bản nháp</option>
              <option value="hidden">🟠 Đang ẩn</option>
            </select>

            {/* Sort Options (Date, Name, Price) */}
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Advanced Filters Toggle Button */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-2xl border transition-all ${
                expanded || activeFiltersCount > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Bộ lọc nâng cao"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Bộ lọc</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Collapsible Advanced Filters Panel (2 Clean Columns) */}
        {expanded && (
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Bộ lọc nâng cao (Advanced Filters)
              </span>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại mặc định</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              
              {/* 1. Khoảng giá & Preset */}
              <div className="space-y-2.5 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Khoảng giá (VND)</span>
                </label>
                
                {/* Presets */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'under_500', label: '< 500.000 đ' },
                    { key: '500_1000', label: '500k - 1 tr' },
                    { key: '1000_2000', label: '1 tr - 2 tr' },
                    { key: 'over_2000', label: '> 2.000.000 đ' },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handlePricePreset(filters.pricePreset === preset.key ? 'all' : preset.key)}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all truncate ${
                        filters.pricePreset === preset.key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Min / Max manual inputs */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) => onFiltersChange({ ...filters, priceMin: e.target.value, pricePreset: 'custom' })}
                    placeholder="Tối thiểu"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) => onFiltersChange({ ...filters, priceMax: e.target.value, pricePreset: 'custom' })}
                    placeholder="Tối đa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs"
                  />
                </div>
              </div>

              {/* 2. Thương hiệu (Brand) */}
              <div className="space-y-2.5 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Thương hiệu (Brand)</span>
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => updateFilter('brand', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold focus:border-emerald-500"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Lọc nhanh các dòng sản phẩm thuộc thương hiệu sản xuất.
                </p>
              </div>

              {/* 3. Lọc theo Khuyến mãi (Promotion) */}
              <div className="space-y-2.5 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chương trình Khuyến mãi</span>
                </label>

                {/* Has Promo Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'has_promo', label: '🏷️ Có KM' },
                    { key: 'no_promo', label: 'Không KM' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateFilter('hasPromotion', item.key as any)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all truncate ${
                        filters.hasPromotion === item.key
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Status Selector */}
                <div className="pt-1">
                  <select
                    value={filters.promoStatus}
                    onChange={(e) => updateFilter('promoStatus', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold focus:border-emerald-500"
                  >
                    <option value="all">Tất cả trạng thái KM</option>
                    <option value="Active">🟢 Đang diễn ra (Active)</option>
                    <option value="Scheduled">🔵 Sắp diễn ra (Scheduled)</option>
                    <option value="Expired">⚪ Đã kết thúc (Expired)</option>
                  </select>
                </div>
              </div>

              {/* 4. Giá sau khuyến mãi (Effective Price) */}
              <div className="space-y-2.5 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                  <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                  <span>Giá sau giảm (Effective Price)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.effectivePriceMin}
                    onChange={(e) => updateFilter('effectivePriceMin', e.target.value)}
                    placeholder="Tối thiểu"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    value={filters.effectivePriceMax}
                    onChange={(e) => updateFilter('effectivePriceMax', e.target.value)}
                    placeholder="Tối đa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Lọc chính xác theo số tiền khách hàng thực tế sẽ thanh toán.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Selected Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            <span className="text-[11px] font-bold text-slate-400">Đang lọc:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Từ khóa:</span>
                <span className="font-bold">&quot;{searchQuery}&quot;</span>
                <button onClick={() => onSearchChange('')} className="p-0.5 hover:bg-emerald-200 rounded">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Danh mục:</span>
                <span className="font-bold">{filters.category}</span>
                <button onClick={() => updateFilter('category', '')} className="p-0.5 hover:bg-emerald-200 rounded">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.productStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Trạng thái:</span>
                <span className="font-bold">
                  {filters.productStatus === 'active'
                    ? 'Kích hoạt'
                    : filters.productStatus === 'draft'
                    ? 'Bản nháp'
                    : 'Đang ẩn'}
                </span>
                <button onClick={() => updateFilter('productStatus', 'all')} className="p-0.5 hover:bg-emerald-200 rounded">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filters.priceMin || filters.priceMax) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Giá:</span>
                <span className="font-bold">
                  {filters.priceMin ? formatVND(Number(filters.priceMin)) : '0'} →{' '}
                  {filters.priceMax ? formatVND(Number(filters.priceMax)) : '∞'}
                </span>
                <button
                  onClick={() => onFiltersChange({ ...filters, priceMin: '', priceMax: '', pricePreset: 'all' })}
                  className="p-0.5 hover:bg-emerald-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.brand && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Brand:</span>
                <span className="font-bold">{filters.brand}</span>
                <button onClick={() => updateFilter('brand', '')} className="p-0.5 hover:bg-emerald-200 rounded">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.hasPromotion !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Khuyến mãi:</span>
                <span className="font-bold">
                  {filters.hasPromotion === 'has_promo' ? '🏷️ Có khuyến mãi' : 'Không có khuyến mãi'}
                </span>
                <button onClick={() => updateFilter('hasPromotion', 'all')} className="p-0.5 hover:bg-amber-200 rounded">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.promoStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Trạng thái KM:</span>
                <span className="font-bold">
                  {filters.promoStatus === 'Active' ? '🟢 Đang diễn ra' : filters.promoStatus === 'Scheduled' ? '🔵 Sắp diễn ra' : '⚪ Đã kết thúc'}
                </span>
                <button onClick={() => updateFilter('promoStatus', 'all')} className="p-0.5 hover:bg-blue-200 rounded">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filters.effectivePriceMin || filters.effectivePriceMax) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-medium">
                <span className="text-slate-400 text-[10px]">Giá sau giảm:</span>
                <span className="font-bold">
                  {filters.effectivePriceMin ? formatVND(Number(filters.effectivePriceMin)) : '0'} →{' '}
                  {filters.effectivePriceMax ? formatVND(Number(filters.effectivePriceMax)) : '∞'}
                </span>
                <button
                  onClick={() => onFiltersChange({ ...filters, effectivePriceMin: '', effectivePriceMax: '' })}
                  className="p-0.5 hover:bg-rose-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
              title="Xóa tất cả bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa tất cả ({activeFiltersCount})</span>
            </button>

            <span className="ml-auto text-xs text-slate-400 font-medium">
              Hiển thị <strong className="text-slate-700 dark:text-slate-200">{filteredCount}</strong> / {totalCount} sản phẩm
            </span>
          </div>
        )}
      </div>
    );
  }
);

FilterBar.displayName = 'FilterBar';
