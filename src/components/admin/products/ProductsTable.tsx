'use client';

import React, { useMemo, useState } from 'react';
import { useResizableColumns, ResizeHandle } from '@/hooks/useResizableColumns';
import {
  Edit3,
  Trash2,
  Layers,
  Copy,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PackageOpen,
  AlertTriangle,
  AlertCircle,
  Tag,
  Info,
  Eye,
} from 'lucide-react';
import type { AdminProduct, SortOption, ProductPromotionSummary } from './types';
import { formatVND } from './types';
import { StatusBadge } from './StatusBadge';

// ─── Skeleton Row ───
const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-5"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg" /></td>
    <td className="py-4 px-5"><div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" /></td>
    <td className="py-4 px-5">
      <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-md mb-2" />
      <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded-md" />
    </td>
    <td className="py-4 px-5"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
    <td className="py-4 px-5"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" /></td>
    <td className="py-4 px-5"><div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md" /></td>
    <td className="py-4 px-5"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" /></td>
    <td className="py-4 px-5"><div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl ml-auto" /></td>
  </tr>
);

// ─── Product Row (Memoized) ───
interface ProductRowProps {
  product: AdminProduct;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onManageVariants: (product: AdminProduct) => void;
  onOpenPromotionPreview?: (product: AdminProduct, promo: ProductPromotionSummary) => void;
  onApplyPromotion?: (product: AdminProduct) => void;
  onOpenStorefrontPreview?: (product: AdminProduct) => void;
}

const ProductRow: React.FC<ProductRowProps> = React.memo(
  ({
    product,
    isSelected,
    onToggleSelect,
    onEdit,
    onDelete,
    onManageVariants,
    onOpenPromotionPreview,
    onApplyPromotion,
    onOpenStorefrontPreview,
  }) => {
    const [copiedSku, setCopiedSku] = useState(false);

    const handleCopySku = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (product.sku) {
        navigator.clipboard.writeText(product.sku);
        setCopiedSku(true);
        setTimeout(() => setCopiedSku(false), 2000);
      }
    };

    const hasActivePromo =
      product.isOnSale || (product.activePromotion && product.activePromotion.status === 'Active');
    const discountPercent =
      product.salePercent ?? product.activePromotion?.discountPercent ?? 0;
    const effectivePrice =
      product.effectivePrice ?? (hasActivePromo ? Math.round(product.price * (1 - discountPercent / 100)) : product.price);

    return (
      <tr
        className={`group transition-all duration-150 ${
          isSelected
            ? 'bg-emerald-50/70 dark:bg-emerald-950/25'
            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
        }`}
      >
        {/* Checkbox */}
        <td className="py-4 px-5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(product.id)}
            className="w-4 h-4 rounded-lg border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
          />
        </td>

        {/* Image / Thumbnail */}
        <td className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 p-1.5 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shadow-2xs group-hover:scale-105 transition-transform duration-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || '/images/paddle.png'}
              alt={product.name}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/paddle.png';
              }}
            />
          </div>
        </td>

        {/* Product Name + SKU Hierarchy */}
        <td className="py-4 px-5 max-w-xs sm:max-w-md border-r border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
              SKU: {product.sku || '—'}
            </span>
            {product.sku && (
              <button
                type="button"
                onClick={handleCopySku}
                className="text-slate-400 hover:text-emerald-600 transition-colors p-0.5"
                title="Sao chép SKU"
              >
                {copiedSku ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </td>

        {/* Category Badge */}
        <td className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold whitespace-nowrap border border-slate-200/60 dark:border-slate-700">
            {product.category || 'Mặc định'}
          </span>
        </td>

        {/* Status Badge */}
        <td className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">
          <StatusBadge status={product.status} />
        </td>

        {/* Price Column (VND) - Strike through & Sale */}
        <td className="py-4 px-5 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
          {hasActivePromo ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="line-through text-slate-400 dark:text-slate-500 text-[11px] font-medium tabular-nums">
                  {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice
                    ? `${formatVND(product.minPrice)} - ${formatVND(product.maxPrice)}`
                    : formatVND(product.price)}
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] font-black tracking-tight">
                  -{discountPercent}%
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                  {product.effectiveMinPrice && product.effectiveMaxPrice && product.effectiveMinPrice !== product.effectiveMaxPrice
                    ? `${formatVND(product.effectiveMinPrice)} - ${formatVND(product.effectiveMaxPrice)}`
                    : formatVND(effectivePrice)}
                </span>
                {product.activePromotion && (
                  <button
                    type="button"
                    onClick={() => onOpenPromotionPreview?.(product, product.activePromotion!)}
                    className="text-slate-400 hover:text-emerald-600 p-0.5 transition-colors"
                    title={`Khuyến mãi: ${product.activePromotion.promotionName}`}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <span className="font-black text-slate-900 dark:text-white text-sm tabular-nums">
              {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice
                ? `${formatVND(product.minPrice)} - ${formatVND(product.maxPrice)}`
                : formatVND(product.price)}
            </span>
          )}
        </td>

        {/* Promotion Badge Column */}
        <td className="py-4 px-5 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
          {product.activePromotion ? (
            <button
              type="button"
              onClick={() => onOpenPromotionPreview?.(product, product.activePromotion!)}
              className="group/promo text-left transition-transform active:scale-95"
            >
              {product.activePromotion.status === 'Active' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[110px]">{product.activePromotion.promotionName}</span>
                </span>
              ) : product.activePromotion.status === 'Scheduled' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="truncate max-w-[110px]">{product.activePromotion.promotionName}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="truncate max-w-[110px]">Hết hạn</span>
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApplyPromotion?.(product)}
              className="text-[11px] font-semibold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-2 py-1 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <Tag className="w-3 h-3 text-emerald-500" />
              <span>+ Áp KM</span>
            </button>
          )}
        </td>

        {/* Actions */}
        <td className="py-4 px-5 text-right">
          <div className="flex items-center justify-end gap-1">
            {onOpenStorefrontPreview && (
              <button
                onClick={() => onOpenStorefrontPreview(product)}
                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                title="Xem trước Storefront"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onManageVariants(product)}
              className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
              title="Quản lý Biến thể (Variants)"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(product)}
              className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Chỉnh sửa sản phẩm"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(product)}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xóa sản phẩm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }
);

ProductRow.displayName = 'ProductRow';

// ─── Main Products Table ───
interface ProductsTableProps {
  products: AdminProduct[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onManageVariants: (product: AdminProduct) => void;
  onOpenPromotionPreview?: (product: AdminProduct, promo: ProductPromotionSummary) => void;
  onApplyPromotion?: (product: AdminProduct) => void;
  onOpenStorefrontPreview?: (product: AdminProduct) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  onResetFilters?: () => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = React.memo(
  ({
    products,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onEdit,
    onDelete,
    onManageVariants,
    onOpenPromotionPreview,
    onApplyPromotion,
    onOpenStorefrontPreview,
    loading,
    error,
    onRetry,
    sortBy = 'created_desc',
    onSortChange,
    onResetFilters,
  }) => {
    const allSelected = useMemo(
      () => products.length > 0 && products.every((p) => selectedIds.has(p.id)),
      [products, selectedIds]
    );

    const someSelected = useMemo(
      () => products.some((p) => selectedIds.has(p.id)) && !allSelected,
      [products, selectedIds, allSelected]
    );

    const { widths, totalWidth, activeResizingKey, startResize } = useResizableColumns({
      storageKey: 'pickle_col_widths_products_v2',
      defaultWidths: {
        checkbox: 48,
        image: 80,
        name: 300,
        category: 130,
        status: 120,
        price: 150,
        promotion: 150,
        actions: 140,
      },
      minWidths: {
        checkbox: 40,
        image: 50,
        name: 160,
        category: 90,
        status: 80,
        price: 110,
        promotion: 110,
        actions: 110,
      },
    });

    // Toggle column sorting
    const handleColumnSort = (field: 'name' | 'price' | 'created') => {
      if (!onSortChange) return;
      if (field === 'name') {
        onSortChange(sortBy === 'name_asc' ? 'name_desc' : 'name_asc');
      } else if (field === 'price') {
        onSortChange(sortBy === 'price_asc' ? 'price_desc' : 'price_asc');
      } else if (field === 'created') {
        onSortChange(sortBy === 'created_desc' ? 'created_asc' : 'created_desc');
      }
    };

    // ── Loading Skeleton ──
    if (loading && products.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full scrollbar-thin">
            <table className="w-full text-xs text-left table-fixed border-collapse">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-5 w-10 border-r border-slate-100 dark:border-slate-800" />
                  <th className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">Hình ảnh</th>
                  <th className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">Tên sản phẩm & SKU</th>
                  <th className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">Danh mục</th>
                  <th className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">Trạng thái</th>
                  <th className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">Giá (VND)</th>
                  <th className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">Khuyến mãi</th>
                  <th className="py-4 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // ── Error State ──
    if (error) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Không thể tải danh sách sản phẩm
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{error}</p>
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97]"
          >
            Thử lại
          </button>
        </div>
      );
    }

    // ── Empty State ──
    if (products.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-12 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <PackageOpen className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Không tìm thấy sản phẩm nào
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Không có sản phẩm nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.
          </p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <span>Xóa tất cả bộ lọc</span>
            </button>
          )}
        </div>
      );
    }

    // ── Data Table ──
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
            className="text-xs text-left table-fixed border-collapse"
          >
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                {/* Select All Checkbox */}
                <th style={{ width: widths.checkbox }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded-lg border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    title="Chọn tất cả trên trang này"
                  />
                  <ResizeHandle onMouseDown={(e) => startResize('checkbox', e)} isResizing={activeResizingKey === 'checkbox'} />
                </th>

                <th style={{ width: widths.image }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Hình ảnh
                  <ResizeHandle onMouseDown={(e) => startResize('image', e)} isResizing={activeResizingKey === 'image'} />
                </th>

                {/* Sortable: Tên sản phẩm */}
                <th
                  style={{ width: widths.name }}
                  onClick={() => handleColumnSort('name')}
                  className="relative py-4 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors select-none border-r border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tên sản phẩm & SKU</span>
                    {sortBy.startsWith('name') ? (
                      sortBy === 'name_asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                  <ResizeHandle onMouseDown={(e) => startResize('name', e)} isResizing={activeResizingKey === 'name'} />
                </th>

                <th style={{ width: widths.category }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Danh mục
                  <ResizeHandle onMouseDown={(e) => startResize('category', e)} isResizing={activeResizingKey === 'category'} />
                </th>

                <th style={{ width: widths.status }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Trạng thái
                  <ResizeHandle onMouseDown={(e) => startResize('status', e)} isResizing={activeResizingKey === 'status'} />
                </th>

                {/* Sortable: Giá */}
                <th
                  style={{ width: widths.price }}
                  onClick={() => handleColumnSort('price')}
                  className="relative py-4 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors select-none border-r border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Giá (VND)</span>
                    {sortBy.startsWith('price') ? (
                      sortBy === 'price_asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                  <ResizeHandle onMouseDown={(e) => startResize('price', e)} isResizing={activeResizingKey === 'price'} />
                </th>

                {/* Promotion Column */}
                <th style={{ width: widths.promotion }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Khuyến mãi
                  <ResizeHandle onMouseDown={(e) => startResize('promotion', e)} isResizing={activeResizingKey === 'promotion'} />
                </th>

                <th style={{ width: widths.actions }} className="py-4 px-5 text-right select-none">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isSelected={selectedIds.has(product.id)}
                  onToggleSelect={onToggleSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageVariants={onManageVariants}
                  onOpenPromotionPreview={onOpenPromotionPreview}
                  onApplyPromotion={onApplyPromotion}
                  onOpenStorefrontPreview={onOpenStorefrontPreview}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

ProductsTable.displayName = 'ProductsTable';
