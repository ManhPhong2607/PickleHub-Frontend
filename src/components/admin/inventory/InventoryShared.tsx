'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Package,
  AlertTriangle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Search,
  RotateCw,
  Plus,
  SlidersHorizontal,
  History,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type { AdminInventoryItemDto } from '@/lib/api/adminApi';

// ─── Stock Status Helper ─────────────────────────────────────────────────────

export type StockStatus = 'out' | 'low' | 'safe';

export function getStockStatus(availableQty: number, threshold: number): StockStatus {
  if (availableQty <= 0) return 'out';
  if (availableQty <= threshold) return 'low';
  return 'safe';
}

export const STOCK_STATUS_CONFIG = {
  out: {
    label: 'Hết hàng',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  },
  low: {
    label: 'Sắp hết',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  },
  safe: {
    label: 'An toàn',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  },
};

// ─── Parse Attributes ────────────────────────────────────────────────────────

export function parseAttributes(attributesJson?: string): { key: string; value: string }[] {
  if (!attributesJson) return [];
  try {
    const parsed = JSON.parse(attributesJson);
    return Object.entries(parsed)
      .filter(([k, v]) => k && v && k !== 'ImageUrl')
      .map(([key, value]) => ({ key, value: String(value) }));
  } catch {
    return [];
  }
}

/**
 * Lọc và chỉ giữ lại các thuộc tính KHÁC NHAU giữa các biến thể của cùng một sản phẩm.
 * Ví dụ: Cùng dòng bóng "Dura Fast 40" đều có PackSize=6, CourtType=Outdoor, HoleCount=40,
 * nhưng khác nhau ở Color (Vàng vs Trắng) -> Chỉ hiển thị Color.
 */
export function getDistinguishingAttributes(
  item: AdminInventoryItemDto,
  allItems: AdminInventoryItemDto[]
): { key: string; value: string }[] {
  const itemAttrs = parseAttributes(item.attributesJson);
  if (itemAttrs.length === 0) return [];

  // Group theo productId hoặc chuẩn hóa productName
  const productKey = item.productId || item.productName?.trim().toLowerCase();

  // Tìm tất cả biến thể anh em cùng sản phẩm
  const siblingVariants = allItems.filter((sibling) => {
    const siblingKey = sibling.productId || sibling.productName?.trim().toLowerCase();
    return siblingKey === productKey;
  });

  // Nếu sản phẩm chỉ có 1 biến thể duy nhất, hiển thị thuộc tính của biến thể đó
  if (siblingVariants.length <= 1) {
    return itemAttrs;
  }

  // Thu thập các giá trị của từng key trong nhóm sản phẩm này
  const valuesByKey = new Map<string, Set<string>>();
  for (const sibling of siblingVariants) {
    const sAttrs = parseAttributes(sibling.attributesJson);
    for (const { key, value } of sAttrs) {
      if (!valuesByKey.has(key)) {
        valuesByKey.set(key, new Set());
      }
      valuesByKey.get(key)!.add(value.trim().toLowerCase());
    }
  }

  // Tìm các key có nhiều hơn 1 giá trị khác nhau (tức là điểm phân biệt giữa các biến thể)
  const distinguishingKeys = new Set<string>();
  for (const [key, valueSet] of valuesByKey.entries()) {
    if (valueSet.size > 1) {
      distinguishingKeys.add(key);
    }
  }

  // Lọc ra các thuộc tính khác biệt của biến thể hiện tại
  const diffAttrs = itemAttrs.filter(({ key }) => distinguishingKeys.has(key));

  // Nếu tất cả thuộc tính đều giống hệt nhau (hoặc không có key nào khác biệt), hiển thị toàn bộ
  return diffAttrs.length > 0 ? diffAttrs : itemAttrs;
}

// ─── StockBadge ──────────────────────────────────────────────────────────────

export const StockBadge: React.FC<{ availableQty: number; threshold: number; showCount?: boolean }> = ({
  availableQty,
  threshold,
  showCount = false,
}) => {
  const status = getStockStatus(availableQty, threshold);
  const cfg = STOCK_STATUS_CONFIG[status];
  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 w-fit ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}{showCount && status === 'low' ? ` (${availableQty})` : ''}
    </span>
  );
};

// ─── Velocity Badge ──────────────────────────────────────────────────────────

export const VelocityBadge: React.FC<{ velocity?: 'fast' | 'normal' | 'slow' }> = ({ velocity = 'normal' }) => {
  if (velocity === 'fast') {
    return (
      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5 w-fit">
        <TrendingUp className="w-2.5 h-2.5" /> Bán chạy
      </span>
    );
  }
  if (velocity === 'slow') {
    return (
      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-medium w-fit">
        Chậm
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-medium w-fit">
      Ổn định
    </span>
  );
};

// ─── SKU Snippet + Copy Button ────────────────────────────────────────────────

export const SkuCopyButton: React.FC<{ sku: string }> = ({ sku }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(sku).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [sku]);

  return (
    <button
      onClick={handleCopy}
      type="button"
      title="Click để sao chép SKU"
      className="group inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
    >
      <span>SKU: {sku}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
      )}
    </button>
  );
};

// ─── Inline Threshold Editor with Explicit Save/Cancel UX ─────────────────────

export const InlineThresholdEditor: React.FC<{
  value: number;
  onSave: (val: number) => Promise<void>;
}> = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (localVal === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(localVal);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min={0}
          value={localVal}
          onChange={(e) => setLocalVal(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-12 px-1.5 py-0.5 text-xs font-bold border border-emerald-500 rounded bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-white"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          type="button"
          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          title="Lưu ngưỡng"
        >
          {saving ? <span className="text-[9px]">...</span> : <Check className="w-3 h-3" />}
        </button>
        <button
          onClick={() => { setLocalVal(value); setEditing(false); }}
          type="button"
          className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          title="Hủy"
        >
          <XCircle className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setLocalVal(value);
        setEditing(true);
      }}
      type="button"
      className="group px-2 py-0.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-medium text-slate-600 dark:text-slate-300 transition-colors"
      title="Click để chỉnh sửa mức cảnh báo"
    >
      ≤ {value}
    </button>
  );
};

// ─── Sort Button ─────────────────────────────────────────────────────────────

export type SortField = 'productName' | 'sku' | 'quantity' | 'availableQuantity' | 'reservedQuantity' | 'lowStockThreshold' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export const SortButton: React.FC<{
  field: SortField;
  label: string;
  current: SortField;
  dir: SortDir;
  onClick: (f: SortField) => void;
}> = ({ field, label, current, dir, onClick }) => {
  const active = current === field;
  return (
    <button
      type="button"
      onClick={() => onClick(field)}
      className={`inline-flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? 'text-slate-900 dark:text-white'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      {label}
      {active ? (
        dir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

export const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800">
    <td className="py-3 pl-4 pr-2 w-10"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="py-3 px-3 w-12"><div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg" /></td>
    <td className="py-3 px-3"><div className="space-y-1.5"><div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-36" /><div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-20" /></div></td>
    <td className="py-3 px-3"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-16" /></td>
    <td className="py-3 px-3 text-right"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-10 ml-auto" /></td>
    <td className="py-3 px-3 text-right"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-10 ml-auto" /></td>
    <td className="py-3 px-3 text-right"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-10 ml-auto" /></td>
    <td className="py-3 px-3"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-12" /></td>
    <td className="py-3 px-3"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-16" /></td>
    <td className="py-3 pl-3 pr-4 text-right"><div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-24 ml-auto" /></td>
  </tr>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────

export const KPICard: React.FC<{
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ label, value, subValue, icon, iconBg, iconColor, onClick, active }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm transition-all duration-150 flex items-center gap-3.5 ${
        onClick
          ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700'
          : 'cursor-default'
      } ${
        active
          ? 'ring-2 ring-emerald-500 border-emerald-500'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      <div className={`p-3 rounded-xl shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">
          {value}
        </p>
        {subValue && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subValue}</p>
        )}
      </div>
    </button>
  );
};

// ─── KPI Section ──────────────────────────────────────────────────────────────

export const KPISection: React.FC<{
  totalSku: number;
  totalPhysical: number;
  totalReserved: number;
  totalAvailable: number;
  totalValueVND: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeFilter: FilterState['stockStatus'];
  onFilter: (s: FilterState['stockStatus']) => void;
  loading: boolean;
}> = ({
  totalSku,
  totalPhysical,
  totalReserved,
  totalAvailable,
  totalValueVND,
  lowStockCount,
  outOfStockCount,
  activeFilter,
  onFilter,
  loading,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      <KPICard
        label="Tổng biến thể SKU"
        value={loading ? '–' : `${totalSku} SKU`}
        icon={<Package className="w-5 h-5" />}
        iconBg="bg-emerald-100 dark:bg-emerald-950/60"
        iconColor="text-emerald-600"
      />
      <KPICard
        label="Tồn vật lý / Giữ chỗ"
        value={loading ? '–' : `${totalPhysical.toLocaleString('vi-VN')}`}
        subValue={`Đang giữ: ${totalReserved.toLocaleString('vi-VN')} · Khả dụng: ${totalAvailable.toLocaleString('vi-VN')}`}
        icon={<Layers className="w-5 h-5" />}
        iconBg="bg-blue-100 dark:bg-blue-950/60"
        iconColor="text-blue-600"
      />
      <KPICard
        label="Tổng giá trị tồn"
        value={loading ? '–' : `${(totalValueVND / 1_000_000).toFixed(1)} tr ₫`}
        subValue="Tính theo giá vốn khả dụng"
        icon={<DollarSign className="w-5 h-5" />}
        iconBg="bg-purple-100 dark:bg-purple-950/60"
        iconColor="text-purple-600"
      />
      <KPICard
        label="Sắp hết hàng"
        value={loading ? '–' : `${lowStockCount} SKU`}
        icon={<AlertTriangle className="w-5 h-5" />}
        iconBg="bg-amber-100 dark:bg-amber-950/60"
        iconColor="text-amber-600"
        onClick={() => onFilter(activeFilter === 'low' ? 'all' : 'low')}
        active={activeFilter === 'low'}
      />
      <KPICard
        label="Đã hết hàng"
        value={loading ? '–' : `${outOfStockCount} SKU`}
        icon={<XCircle className="w-5 h-5" />}
        iconBg="bg-rose-100 dark:bg-rose-950/60"
        iconColor="text-rose-600"
        onClick={() => onFilter(activeFilter === 'out' ? 'all' : 'out')}
        active={activeFilter === 'out'}
      />
    </div>
  );
};

// ─── Inventory Row ────────────────────────────────────────────────────────────

export const InventoryRow: React.FC<{
  item: AdminInventoryItemDto;
  distinguishingAttrs?: { key: string; value: string }[];
  selected: boolean;
  onSelect: (id: string) => void;
  onImport: (item: AdminInventoryItemDto) => void;
  onAdjust: (item: AdminInventoryItemDto) => void;
  onViewMovements: (item: AdminInventoryItemDto) => void;
  onUpdateThreshold: (variantId: string, val: number) => Promise<void>;
  sortField: SortField;
  sortDir: SortDir;
}> = ({
  item,
  distinguishingAttrs,
  selected,
  onSelect,
  onImport,
  onAdjust,
  onViewMovements,
  onUpdateThreshold,
}) => {
  const allAttrs = parseAttributes(item.attributesJson);
  const displayAttrs = distinguishingAttrs !== undefined ? distinguishingAttrs : allAttrs;
  const fullTooltip = allAttrs.length > 0 ? allAttrs.map((a) => `${a.key}: ${a.value}`).join(' · ') : undefined;
  
  return (
    <tr
      className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${
        selected
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
      }`}
    >
      {/* Checkbox */}
      <td className="py-3 pl-4 pr-2 border-r border-slate-100 dark:border-slate-800">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.id)}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
        />
      </td>

      {/* Image */}
      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image || '/images/paddle.png'}
            alt={item.productName}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/paddle.png';
            }}
          />
        </div>
      </td>

      {/* Product Name & SKU */}
      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate" title={item.productName}>
            {item.productName}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <SkuCopyButton sku={item.sku} />
            <span className="text-[10px] text-slate-400">· {item.category || 'Vợt'}</span>
          </div>
        </div>
      </td>

      {/* Attributes (Chỉ hiển thị phần khác nhau giữa các biến thể) */}
      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800" title={fullTooltip}>
        {displayAttrs.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {displayAttrs.map((attr) => (
              <span
                key={attr.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] font-medium text-slate-700 dark:text-slate-300"
              >
                <span className="text-slate-400 font-normal">{attr.key}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{attr.value}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">
            {item.variantName && item.variantName !== 'Mặc định' ? item.variantName : 'Bản tiêu chuẩn'}
          </span>
        )}
      </td>

      {/* Physical Stock */}
      <td className="py-3 px-3 text-right tabular-nums border-r border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {item.quantity.toLocaleString('vi-VN')}
        </span>
      </td>

      {/* Reserved Stock */}
      <td className="py-3 px-3 text-right tabular-nums border-r border-slate-100 dark:border-slate-800">
        <span className={`text-xs font-bold ${item.reservedQuantity > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
          {item.reservedQuantity.toLocaleString('vi-VN')}
        </span>
      </td>

      {/* Available Stock */}
      <td className="py-3 px-3 text-right tabular-nums border-r border-slate-100 dark:border-slate-800">
        <span
          className={`text-sm font-black ${
            item.availableQuantity === 0
              ? 'text-rose-600'
              : item.availableQuantity <= item.lowStockThreshold
              ? 'text-amber-600'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {item.availableQuantity.toLocaleString('vi-VN')}
        </span>
      </td>

      {/* Threshold Editor */}
      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800">
        <InlineThresholdEditor
          value={item.lowStockThreshold}
          onSave={(val) => onUpdateThreshold(item.variantId, val)}
        />
      </td>

      {/* Status Badge */}
      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800">
        <StockBadge availableQty={item.availableQuantity} threshold={item.lowStockThreshold} showCount />
      </td>

      {/* Action Buttons */}
      <td className="py-3 pl-3 pr-4 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={() => onImport(item)}
            type="button"
            className="p-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg shadow-sm transition-all"
            title="Nhập kho bổ sung"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
          </button>
          <button
            onClick={() => onAdjust(item)}
            type="button"
            className="p-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg shadow-sm transition-all"
            title="Kiểm kê & Điều chỉnh / Xuất hủy"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
          </button>
          <button
            onClick={() => onViewMovements(item)}
            type="button"
            className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg shadow-sm transition-all"
            title="Xem nhật ký biến động kho"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>
      </td>
    </tr>
  );
};

import { useResizableColumns, ResizeHandle } from '@/hooks/useResizableColumns';

const DEFAULT_INVENTORY_WIDTHS = {
  checkbox: 48,
  image: 64,
  productName: 280,
  attributes: 180,
  quantity: 110,
  reservedQuantity: 100,
  availableQuantity: 110,
  lowStockThreshold: 100,
  status: 120,
  actions: 130,
};

// ─── Inventory Table ──────────────────────────────────────────────────────────

export const InventoryTable: React.FC<{
  items: AdminInventoryItemDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onImport: (item: AdminInventoryItemDto) => void;
  onAdjust: (item: AdminInventoryItemDto) => void;
  onViewMovements: (item: AdminInventoryItemDto) => void;
  onUpdateThreshold: (variantId: string, val: number) => Promise<void>;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}> = ({
  items,
  loading,
  error,
  onRetry,
  selectedIds,
  onSelect,
  onSelectAll,
  onImport,
  onAdjust,
  onViewMovements,
  onUpdateThreshold,
  sortField,
  sortDir,
  onSort,
}) => {
  const allSelected = items.length > 0 && items.every((it) => selectedIds.has(it.id));
  const { widths, totalWidth, activeResizingKey, startResize } = useResizableColumns({
    storageKey: 'pickle_col_widths_inventory',
    defaultWidths: DEFAULT_INVENTORY_WIDTHS,
    minWidths: {
      checkbox: 40,
      image: 50,
      productName: 160,
      attributes: 120,
      quantity: 80,
      reservedQuantity: 80,
      availableQuantity: 80,
      lowStockThreshold: 80,
      status: 90,
      actions: 110,
    },
  });

  // Tính toán trước các thuộc tính phân biệt (khác nhau) cho từng biến thể cùng sản phẩm
  const distinguishingMap = useMemo(() => {
    const map = new Map<string, { key: string; value: string }[]>();
    for (const it of items) {
      map.set(it.id, getDistinguishingAttributes(it, items));
    }
    return map;
  }, [items]);

  return (
    <div className="overflow-x-auto w-full scrollbar-thin">
      <table
        style={{ width: `${totalWidth}px`, minWidth: '100%' }}
        className="text-xs text-left table-fixed border-collapse"
      >
        <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700">
          <tr>
            {/* Checkbox */}
            <th style={{ width: widths.checkbox }} className="relative py-3 pl-4 pr-2 select-none border-r border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <ResizeHandle onMouseDown={(e) => startResize('checkbox', e)} isResizing={activeResizingKey === 'checkbox'} />
            </th>

            {/* Image */}
            <th style={{ width: widths.image }} className="relative py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none border-r border-slate-200 dark:border-slate-700">
              ẢNH
              <ResizeHandle onMouseDown={(e) => startResize('image', e)} isResizing={activeResizingKey === 'image'} />
            </th>

            {/* Product Name & SKU */}
            <th style={{ width: widths.productName }} className="relative py-3 px-3 select-none border-r border-slate-200 dark:border-slate-700">
              <SortButton field="productName" label="TÊN SẢN PHẨM & SKU" current={sortField} dir={sortDir} onClick={onSort} />
              <ResizeHandle onMouseDown={(e) => startResize('productName', e)} isResizing={activeResizingKey === 'productName'} />
            </th>

            {/* Attributes */}
            <th style={{ width: widths.attributes }} className="relative py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none border-r border-slate-200 dark:border-slate-700">
              PHÂN LOẠI
              <ResizeHandle onMouseDown={(e) => startResize('attributes', e)} isResizing={activeResizingKey === 'attributes'} />
            </th>

            {/* Physical Stock */}
            <th style={{ width: widths.quantity }} className="relative py-3 px-3 text-right select-none border-r border-slate-200 dark:border-slate-700">
              <SortButton field="quantity" label="TỔNG TỒN" current={sortField} dir={sortDir} onClick={onSort} />
              <ResizeHandle onMouseDown={(e) => startResize('quantity', e)} isResizing={activeResizingKey === 'quantity'} />
            </th>

            {/* Reserved Stock */}
            <th style={{ width: widths.reservedQuantity }} className="relative py-3 px-3 text-right select-none border-r border-slate-200 dark:border-slate-700">
              <SortButton field="reservedQuantity" label="ĐANG CHỜ XN" current={sortField} dir={sortDir} onClick={onSort} />
              <ResizeHandle onMouseDown={(e) => startResize('reservedQuantity', e)} isResizing={activeResizingKey === 'reservedQuantity'} />
            </th>

            {/* Available Stock */}
            <th style={{ width: widths.availableQuantity }} className="relative py-3 px-3 text-right select-none border-r border-slate-200 dark:border-slate-700">
              <SortButton field="availableQuantity" label="CÓ THỂ BÁN" current={sortField} dir={sortDir} onClick={onSort} />
              <ResizeHandle onMouseDown={(e) => startResize('availableQuantity', e)} isResizing={activeResizingKey === 'availableQuantity'} />
            </th>

            {/* Threshold */}
            <th style={{ width: widths.lowStockThreshold }} className="relative py-3 px-3 select-none border-r border-slate-200 dark:border-slate-700">
              <SortButton field="lowStockThreshold" label="NGƯỠNG" current={sortField} dir={sortDir} onClick={onSort} />
              <ResizeHandle onMouseDown={(e) => startResize('lowStockThreshold', e)} isResizing={activeResizingKey === 'lowStockThreshold'} />
            </th>

            {/* Status */}
            <th style={{ width: widths.status }} className="relative py-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none border-r border-slate-200 dark:border-slate-700">
              TRẠNG THÁI
              <ResizeHandle onMouseDown={(e) => startResize('status', e)} isResizing={activeResizingKey === 'status'} />
            </th>

            {/* Actions */}
            <th style={{ width: widths.actions }} className="relative py-3 pl-3 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              THAO TÁC
              <ResizeHandle onMouseDown={(e) => startResize('actions', e)} isResizing={activeResizingKey === 'actions'} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : error ? (
            <tr>
              <td colSpan={10} className="py-16 text-center">
                <AlertTriangle className="w-9 h-9 text-rose-500 mx-auto mb-2" />
                <div className="text-sm text-slate-900 dark:text-white font-bold mb-1">Không thể tải dữ liệu kho</div>
                <p className="text-xs text-slate-500 mb-4">{error}</p>
                <button
                  onClick={onRetry}
                  type="button"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Thử lại
                </button>
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-16 text-center">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy SKU nào</p>
                <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                distinguishingAttrs={distinguishingMap.get(item.id)}
                selected={selectedIds.has(item.id)}
                onSelect={onSelect}
                onImport={onImport}
                onAdjust={onAdjust}
                onViewMovements={onViewMovements}
                onUpdateThreshold={onUpdateThreshold}
                sortField={sortField}
                sortDir={sortDir}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── Inventory Filters & Advanced Engine ──────────────────────────────────────

export type FilterState = {
  search: string;
  category: string;
  stockStatus: 'all' | 'safe' | 'low' | 'out' | 'reserved';
  stockRange: 'all' | 'under5' | '5to20' | 'over20' | 'under10' | '10to50' | 'over50' | 'custom';
  minStock: number | '';
  maxStock: number | '';
  selectedAttributes: Record<string, string[]>;
  velocity: 'all' | 'fast' | 'normal' | 'slow';
};

export const DEFAULT_INVENTORY_FILTERS: FilterState = {
  search: '',
  category: 'all',
  stockStatus: 'all',
  stockRange: 'all',
  minStock: '',
  maxStock: '',
  selectedAttributes: {},
  velocity: 'all',
};

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.search.trim()) count++;
  if (filters.category !== 'all') count++;
  if (filters.stockStatus !== 'all') count++;
  if (filters.stockRange !== 'all') count++;
  if (filters.velocity !== 'all') count++;
  for (const values of Object.values(filters.selectedAttributes)) {
    if (values && values.length > 0) count += values.length;
  }
  return count;
}

export function extractAvailableAttributes(items: AdminInventoryItemDto[]): Record<string, string[]> {
  const result: Record<string, Set<string>> = {};
  for (const item of items) {
    const attrs = parseAttributes(item.attributesJson);
    for (const { key, value } of attrs) {
      if (!key || !value) continue;
      if (!result[key]) {
        result[key] = new Set();
      }
      result[key].add(value.trim());
    }
  }
  const finalObj: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(result)) {
    finalObj[k] = Array.from(set).sort();
  }
  return finalObj;
}

export function exportInventoryToCSV(
  items: AdminInventoryItemDto[],
  period?: { label: string; startDate: string; endDate: string; mode?: string; selectedMonth?: number; selectedQuarter?: number; selectedYear?: number }
) {
  if (!items || items.length === 0) return;

  const now = new Date();
  const exportTime = now.toLocaleString('vi-VN');

  // Metadata headers
  const metaLines = [
    'BÁO CÁO TỔN KHO & ĐỊNH GIÁ HÀNG HÓA PICKLEHUB',
    `"Kỳ báo cáo:","${period ? period.label : 'Toàn thời gian'}"`,
    `"Khoảng thời gian:","${period ? `Từ ${period.startDate} đến ${period.endDate}` : 'Tất cả'}"`,
    `"Thời điểm trích xuất:","${exportTime}"`,
    `"Tổng số mặt hàng:","${items.length} SKU"`,
    '', // Dòng trống ngăn cách
  ];

  const headers = [
    'Mã SKU',
    'Tên sản phẩm',
    'Danh mục',
    'Thuộc tính phân loại',
    'Tổng tồn vật lý',
    'Đang giữ chỗ',
    'Có thể bán (Khả dụng)',
    'Ngưỡng cảnh báo',
    'Đơn giá nhập ước tính (VNĐ)',
    'Tổng giá trị tồn kho (VNĐ)',
    'Trạng thái kho',
    'Ngày cập nhật gần nhất',
  ];

  const rows = items.map((item) => {
    const status = getStockStatus(item.availableQuantity, item.lowStockThreshold);
    const statusText = status === 'safe' ? 'An toàn' : status === 'low' ? 'Sắp hết' : 'Hết hàng';
    const attrs = parseAttributes(item.attributesJson)
      .map((a) => `${a.key}: ${a.value}`)
      .join('; ');
    const cost = item.costPerUnit || 150000;
    const totalVal = item.availableQuantity * cost;
    const updated = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : '—';

    return [
      `"${item.sku || ''}"`,
      `"${(item.productName || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${attrs.replace(/"/g, '""')}"`,
      item.quantity,
      item.reservedQuantity,
      item.availableQuantity,
      item.lowStockThreshold,
      cost,
      totalVal,
      `"${statusText}"`,
      `"${updated}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [...metaLines, headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  let sanitizedLabel = 'Toan_bo';
  if (period) {
    if (period.mode === 'month') sanitizedLabel = `Thang_${String(period.selectedMonth || '').padStart(2, '0')}_${period.selectedYear || ''}`;
    else if (period.mode === 'quarter') sanitizedLabel = `Quy_${period.selectedQuarter || ''}_${period.selectedYear || ''}`;
    else if (period.mode === 'year') sanitizedLabel = `Nam_${period.selectedYear || ''}`;
    else sanitizedLabel = `${period.startDate}_den_${period.endDate}`;
  }

  link.setAttribute('href', url);
  link.setAttribute('download', `PickleHub_BaoCaoTonKho_${sanitizedLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Active Filter Chips ──────────────────────────────────────────────────────

export const ActiveFilterChips: React.FC<{
  filters: FilterState;
  onRemove: (patch: Partial<FilterState>) => void;
  onClearAll: () => void;
}> = ({ filters, onRemove, onClearAll }) => {
  const activeCount = countActiveFilters(filters);
  if (activeCount === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs pt-1 pb-1">
      <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Đang lọc:</span>

      {/* Search Chip */}
      {filters.search.trim() && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold">
          <span>Tìm: &quot;{filters.search}&quot;</span>
          <button onClick={() => onRemove({ search: '' })} className="hover:text-rose-500 transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Category Chip */}
      {filters.category !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold">
          <span>Danh mục: {filters.category}</span>
          <button onClick={() => onRemove({ category: 'all' })} className="hover:text-rose-500 transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Stock Status Chip */}
      {filters.stockStatus !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-semibold">
          <span>
            Trạng thái:{' '}
            {filters.stockStatus === 'safe'
              ? 'An toàn'
              : filters.stockStatus === 'low'
              ? 'Sắp hết'
              : filters.stockStatus === 'out'
              ? 'Hết hàng'
              : 'Có giữ chỗ'}
          </span>
          <button onClick={() => onRemove({ stockStatus: 'all' })} className="hover:text-rose-500 transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Stock Range Chip */}
      {filters.stockRange !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-semibold">
          <span>
            Khoảng tồn:{' '}
            {filters.stockRange === 'under5'
              ? '< 5 chiếc'
              : filters.stockRange === '5to20'
              ? '5 – 20 chiếc'
              : filters.stockRange === 'over20'
              ? '> 20 chiếc'
              : filters.minStock !== '' && filters.maxStock !== ''
              ? `${filters.minStock} – ${filters.maxStock} chiếc`
              : filters.minStock !== ''
              ? `≥ ${filters.minStock} chiếc`
              : filters.maxStock !== ''
              ? `≤ ${filters.maxStock} chiếc`
              : `Tùy chỉnh (0 - ∞)`}
          </span>
          <button onClick={() => onRemove({ stockRange: 'all', minStock: '', maxStock: '' })} className="hover:text-rose-500 transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Dynamic Attributes Chips */}
      {Object.entries(filters.selectedAttributes).map(([key, values]) =>
        (values || []).map((val) => (
          <span
            key={`${key}-${val}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg text-xs font-semibold"
          >
            <span>
              {key}: {val}
            </span>
            <button
              onClick={() => {
                const next = { ...filters.selectedAttributes };
                next[key] = (next[key] || []).filter((v) => v !== val);
                if (next[key].length === 0) delete next[key];
                onRemove({ selectedAttributes: next });
              }}
              className="hover:text-rose-500 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </span>
        ))
      )}

      {/* Velocity Chip */}
      {filters.velocity !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-300 rounded-lg text-xs font-semibold">
          <span>Tốc độ: {filters.velocity === 'fast' ? '🔥 Bán chạy' : filters.velocity === 'slow' ? 'Bán chậm' : 'Ổn định'}</span>
          <button onClick={() => onRemove({ velocity: 'all' })} className="hover:text-rose-500 transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Clear All Button */}
      <button
        onClick={onClearAll}
        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2 ml-1"
      >
        Xóa tất cả ({activeCount})
      </button>
    </div>
  );
};

// ─── Advanced Filters Collapsible Card ────────────────────────────────────────

export const AdvancedFiltersPanel: React.FC<{
  isOpen: boolean;
  filters: FilterState;
  availableAttributes: Record<string, string[]>;
  onChange: (f: Partial<FilterState>) => void;
  onReset: () => void;
}> = ({ isOpen, filters, availableAttributes, onChange, onReset }) => {
  if (!isOpen) return null;

  const handleToggleAttr = (key: string, val: string) => {
    const next = { ...filters.selectedAttributes };
    const currentList = next[key] || [];
    if (currentList.includes(val)) {
      next[key] = currentList.filter((v) => v !== val);
      if (next[key].length === 0) delete next[key];
    } else {
      next[key] = [...currentList, val];
    }
    onChange({ selectedAttributes: next });
  };

  const hasAttributes = Object.keys(availableAttributes).length > 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Bộ lọc nâng cao theo thuộc tính & thông số
          </h4>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-rose-600 font-bold transition-colors"
        >
          Đặt lại bộ lọc nâng cao
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Custom Min / Max Stock Range */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Khoảng tồn kho tùy chỉnh (Tồn khả dụng)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Tối thiểu"
              value={filters.minStock}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                onChange({ stockRange: 'custom', minStock: val });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500"
            />
            <span className="text-slate-400 font-bold">–</span>
            <input
              type="number"
              min={0}
              placeholder="Tối đa"
              value={filters.maxStock}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                onChange({ stockRange: 'custom', maxStock: val });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Velocity Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Tốc độ tiêu thụ (Velocity)
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'fast', label: '🔥 Bán chạy' },
              { id: 'normal', label: 'Ổn định' },
              { id: 'slow', label: 'Bán chậm' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange({ velocity: v.id as FilterState['velocity'] })}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filters.velocity === v.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attribute Multi-select summary count */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Thuộc tính sản phẩm hiện có
          </label>
          <p className="text-xs text-slate-500">
            {hasAttributes
              ? `Tìm thấy ${Object.keys(availableAttributes).length} nhóm thuộc tính biến thể.`
              : 'Chưa có dữ liệu thuộc tính biến thể.'}
          </p>
        </div>
      </div>

      {/* Dynamic Attributes Grid */}
      {hasAttributes && (
        <div className="pt-2 space-y-3 border-t border-slate-200/80 dark:border-slate-700">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Lọc theo biến thể (Dynamic Attributes):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(availableAttributes).map(([key, values]) => {
              const selectedValues = filters.selectedAttributes[key] || [];
              return (
                <div key={key} className="space-y-1.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{key}</span>
                    {selectedValues.length > 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                        {selectedValues.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                    {values.map((val) => {
                      const isSelected = selectedValues.includes(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleToggleAttr(key, val)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Inventory Filters Toolbar ────────────────────────────────────────────────

export const InventoryFilters: React.FC<{
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  onRefresh: () => void;
  categories: string[];
  totalVisible: number;
  totalAll: number;
  availableAttributes: Record<string, string[]>;
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField, dir: SortDir) => void;
}> = ({
  filters,
  onChange,
  onRefresh,
  categories,
  totalVisible,
  totalAll,
  availableAttributes,
  sortField,
  sortDir,
  onSortChange,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isCustomStockModalOpen, setIsCustomStockModalOpen] = useState(false);
  const [tempMin, setTempMin] = useState<number | ''>(filters.minStock);
  const [tempMax, setTempMax] = useState<number | ''>(filters.maxStock);

  // Keep tempMin and tempMax in sync with filters
  useEffect(() => {
    setTempMin(filters.minStock);
    setTempMax(filters.maxStock);
  }, [filters.minStock, filters.maxStock]);

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ search: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep searchInput in sync if filters.search was reset externally
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <div className="space-y-2.5">
      {/* Quick Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Tất cả SKU', active: filters.stockStatus === 'all' && filters.velocity === 'all' },
          { id: 'out', label: '🔴 Hết hàng', active: filters.stockStatus === 'out' },
          { id: 'low', label: '🟡 Sắp hết (< Ngưỡng)', active: filters.stockStatus === 'low' },
          { id: 'reserved', label: '📦 Có hàng giữ chỗ', active: filters.stockStatus === 'reserved' },
          { id: 'safe', label: '🟢 Tồn an toàn', active: filters.stockStatus === 'safe' },
          { id: 'fast', label: '🔥 Bán chạy', active: filters.velocity === 'fast' },
        ].map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              if (preset.id === 'fast') {
                onChange({ velocity: filters.velocity === 'fast' ? 'all' : 'fast' });
              } else if (preset.id === 'all') {
                onChange({ stockStatus: 'all', velocity: 'all' });
              } else {
                onChange({
                  stockStatus: filters.stockStatus === preset.id ? 'all' : (preset.id as FilterState['stockStatus']),
                });
              }
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap shrink-0 ${
              preset.active
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-3 flex flex-col md:flex-row items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, mã SKU, barcode, thuộc tính..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onChange({ search: '' });
              }}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={filters.stockStatus}
            onChange={(e) => onChange({ stockStatus: e.target.value as FilterState['stockStatus'] })}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="safe">🟢 An toàn</option>
            <option value="low">🟡 Cảnh báo sắp hết</option>
            <option value="out">🔴 Đã hết hàng</option>
            <option value="reserved">📦 Có hàng giữ chỗ</option>
          </select>

          {/* Stock Range Filter */}
          <div className="relative inline-flex items-center gap-1.5">
            <select
              value={filters.stockRange}
              onChange={(e) => {
                const val = e.target.value as FilterState['stockRange'];
                if (val === 'custom') {
                  setIsCustomStockModalOpen(true);
                  onChange({ stockRange: 'custom' });
                } else {
                  setIsCustomStockModalOpen(false);
                  onChange({ stockRange: val, minStock: '', maxStock: '' });
                }
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">Mọi khoảng tồn</option>
              <option value="under5">&lt; 5 chiếc (Cực thấp)</option>
              <option value="5to20">5 – 20 chiếc</option>
              <option value="over20">&gt; 20 chiếc</option>
              <option value="custom">Tùy chỉnh min / max...</option>
            </select>

            {/* Inline Custom Range Inputs when 'custom' is active */}
            {filters.stockRange === 'custom' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl text-xs shadow-xs animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Min:</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={filters.minStock}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                    onChange({ stockRange: 'custom', minStock: val });
                  }}
                  className="w-12 px-1 py-0.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-center text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  title="Số lượng tồn tối thiểu"
                />
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">–</span>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Max:</span>
                <input
                  type="number"
                  min={0}
                  placeholder="∞"
                  value={filters.maxStock}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                    onChange({ stockRange: 'custom', maxStock: val });
                  }}
                  className="w-12 px-1 py-0.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-center text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  title="Số lượng tồn tối đa"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomStockModalOpen(true)}
                  className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200 transition-colors"
                  title="Mở bảng chọn khoảng nhanh"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Sort Dropdown */}
          <select
            value={`${sortField}_${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split('_') as [SortField, SortDir];
              onSortChange(field, dir);
            }}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="productName_asc">Tên SP (A-Z)</option>
            <option value="productName_desc">Tên SP (Z-A)</option>
            <option value="quantity_desc">Tổng tồn (Cao → Thấp)</option>
            <option value="quantity_asc">Tổng tồn (Thấp → Cao)</option>
            <option value="availableQuantity_asc">Có thể bán (Thấp nhất)</option>
            <option value="availableQuantity_desc">Có thể bán (Nhiều nhất)</option>
            <option value="reservedQuantity_desc">Đang giữ chỗ (Nhiều nhất)</option>
            <option value="updatedAt_desc">Cập nhật mới nhất</option>
          </select>

          {/* Advanced Filters Toggle Button */}
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            type="button"
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isAdvancedOpen || activeFiltersCount > 0
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Mở bộ lọc thuộc tính nâng cao"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bộ lọc</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            type="button"
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
            title="Làm mới dữ liệu"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom Min/Max Stock Range Popover Modal */}
      {isCustomStockModalOpen && (
        <div
          onClick={() => setIsCustomStockModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-sm">
                  #
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Tùy chỉnh khoảng tồn khả dụng
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lọc những sản phẩm có số lượng trong khoảng min – max
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomStockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tối thiểu (Min)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={tempMin}
                    onChange={(e) => setTempMin(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tối đa (Max)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="∞"
                    value={tempMax}
                    onChange={(e) => setTempMax(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gợi ý khoảng phổ biến:
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {(
                    [
                      { label: '0 – 5 chiếc', min: 0, max: 5 },
                      { label: '5 – 20 chiếc', min: 5, max: 20 },
                      { label: '20 – 50 chiếc', min: 20, max: 50 },
                      { label: '50 – 100 chiếc', min: 50, max: 100 },
                      { label: '> 100 chiếc', min: 100, max: '' },
                    ] as { label: string; min: number; max: number | '' }[]
                  ).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTempMin(p.min);
                        setTempMax(p.max);
                      }}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTempMin('');
                  setTempMax('');
                  onChange({ stockRange: 'all', minStock: '', maxStock: '' });
                  setIsCustomStockModalOpen(false);
                }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Bỏ bộ lọc
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    stockRange: 'custom',
                    minStock: tempMin,
                    maxStock: tempMax,
                  });
                  setIsCustomStockModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Collapsible Card */}
      <AdvancedFiltersPanel
        isOpen={isAdvancedOpen}
        filters={filters}
        availableAttributes={availableAttributes}
        onChange={onChange}
        onReset={() =>
          onChange({
            stockRange: 'all',
            minStock: '',
            maxStock: '',
            selectedAttributes: {},
            velocity: 'all',
          })
        }
      />

      {/* Active Filter Chips */}
      <ActiveFilterChips
        filters={filters}
        onRemove={onChange}
        onClearAll={() =>
          onChange({
            search: '',
            category: 'all',
            stockStatus: 'all',
            stockRange: 'all',
            minStock: '',
            maxStock: '',
            selectedAttributes: {},
            velocity: 'all',
          })
        }
      />
    </div>
  );
};

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

export const BulkActionBar: React.FC<{
  count: number;
  onBulkAdjust: () => void;
  onClear: () => void;
}> = ({ count, onBulkAdjust, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3 border border-slate-700">
        <span className="text-xs font-bold flex items-center">
          <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-500 text-white rounded-full text-[11px] mr-1.5 font-black">
            {count}
          </span>
          SKU đã chọn
        </span>
        <div className="w-px h-4 bg-slate-700" />
        <button
          onClick={onBulkAdjust}
          type="button"
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Layers className="w-3.5 h-3.5" />
          Điều chỉnh / Nhập kho
        </button>
        <button
          onClick={onClear}
          type="button"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Bỏ chọn"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Sorting Utility ─────────────────────────────────────────────────────────

export function applySort(
  items: AdminInventoryItemDto[],
  field: SortField,
  dir: SortDir,
): AdminInventoryItemDto[] {
  return [...items].sort((a, b) => {
    let av: string | number;
    let bv: string | number;

    if (field === 'productName') {
      av = a.productName ?? '';
      bv = b.productName ?? '';
    } else if (field === 'sku') {
      av = a.sku ?? '';
      bv = b.sku ?? '';
    } else if (field === 'quantity') {
      av = a.quantity ?? 0;
      bv = b.quantity ?? 0;
    } else if (field === 'availableQuantity') {
      av = a.availableQuantity ?? 0;
      bv = b.availableQuantity ?? 0;
    } else if (field === 'reservedQuantity') {
      av = a.reservedQuantity ?? 0;
      bv = b.reservedQuantity ?? 0;
    } else if (field === 'updatedAt') {
      av = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      bv = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    } else {
      av = a.lowStockThreshold ?? 0;
      bv = b.lowStockThreshold ?? 0;
    }

    if (typeof av === 'string' && typeof bv === 'string') {
      return dir === 'asc'
        ? av.localeCompare(bv, 'vi', { sensitivity: 'base', numeric: true })
        : bv.localeCompare(av, 'vi', { sensitivity: 'base', numeric: true });
    }

    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// ─── Filter Utility ──────────────────────────────────────────────────────────

export function applyFilters(
  items: AdminInventoryItemDto[],
  filters: FilterState,
): AdminInventoryItemDto[] {
  return items.filter((item) => {
    // 1. Search filter
    const q = filters.search.toLowerCase().trim();
    if (q) {
      const hit =
        (item.productName?.toLowerCase().includes(q) ?? false) ||
        (item.sku?.toLowerCase().includes(q) ?? false) ||
        (item.variantName?.toLowerCase().includes(q) ?? false) ||
        (item.category?.toLowerCase().includes(q) ?? false) ||
        (item.attributesJson?.toLowerCase().includes(q) ?? false);
      if (!hit) return false;
    }

    // 2. Category filter
    if (filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }

    // 3. Stock Status filter
    if (filters.stockStatus !== 'all') {
      if (filters.stockStatus === 'reserved') {
        if (item.reservedQuantity <= 0) return false;
      } else {
        const status = getStockStatus(item.availableQuantity, item.lowStockThreshold);
        if (status !== filters.stockStatus) return false;
      }
    }

    // 4. Stock Range filter
    if (filters.stockRange === 'under5' && item.availableQuantity >= 5) return false;
    if (filters.stockRange === '5to20' && (item.availableQuantity < 5 || item.availableQuantity > 20)) return false;
    if (filters.stockRange === 'over20' && item.availableQuantity <= 20) return false;
    if (filters.stockRange === 'under10' && item.availableQuantity >= 10) return false;
    if (filters.stockRange === '10to50' && (item.availableQuantity < 10 || item.availableQuantity > 50)) return false;
    if (filters.stockRange === 'over50' && item.availableQuantity <= 50) return false;
    if (filters.stockRange === 'custom') {
      if (filters.minStock !== '' && item.availableQuantity < Number(filters.minStock)) return false;
      if (filters.maxStock !== '' && item.availableQuantity > Number(filters.maxStock)) return false;
    }

    // 5. Dynamic Attributes Filter
    if (filters.selectedAttributes && Object.keys(filters.selectedAttributes).length > 0) {
      const itemAttrs = parseAttributes(item.attributesJson);
      for (const [filterKey, allowedValues] of Object.entries(filters.selectedAttributes)) {
        if (allowedValues && allowedValues.length > 0) {
          const match = itemAttrs.find((a) => a.key.toLowerCase() === filterKey.toLowerCase());
          if (!match || !allowedValues.some((v) => v.toLowerCase() === match.value.toLowerCase())) {
            return false;
          }
        }
      }
    }

    // 6. Velocity Filter (Optional estimation)
    if (filters.velocity !== 'all') {
      const isFast = item.quantity > 0 && item.reservedQuantity > 0;
      const isSlow = item.quantity > 50 && item.reservedQuantity === 0;
      if (filters.velocity === 'fast' && !isFast) return false;
      if (filters.velocity === 'slow' && !isSlow) return false;
      if (filters.velocity === 'normal' && (isFast || isSlow)) return false;
    }

    return true;
  });
}
