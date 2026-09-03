'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  adminApi,
  type AdminAuditLogDto,
  type GetAuditLogsParams,
} from '@/lib/api/adminApi';
import { useResizableColumns, ResizeHandle } from '@/hooks/useResizableColumns';
import {
  Search,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Eye,
  ExternalLink,
  Filter,
  User,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import {
  AuditLogDetailModal,
  getActionBadgeInfo,
  getEntityRoute,
} from './audit/AuditLogDetailModal';

const MODULE_OPTIONS = [
  { label: 'Tất cả Module', value: '' },
  { label: 'Sản phẩm (Product)', value: 'Product' },
  { label: 'Kho hàng (Inventory)', value: 'InventoryItem' },
  { label: 'Đơn hàng (Order)', value: 'Order' },
  { label: 'Khách hàng (Customer)', value: 'Customer' },
  { label: 'Tài khoản & Auth (User)', value: 'User' },
  { label: 'Cấu hình hệ thống (SystemConfig)', value: 'SystemConfig' },
];

export const MODULE_ACTIONS_MAP: Record<string, { label: string; value: string }[]> = {
  Product: [
    { label: 'Tạo sản phẩm (Product.Created)', value: 'Product.Created' },
    { label: 'Cập nhật sản phẩm (Product.Updated)', value: 'Product.Updated' },
    { label: 'Đăng bán sản phẩm (Product.Published)', value: 'Product.Published' },
    { label: 'Ẩn sản phẩm (Product.Hidden)', value: 'Product.Hidden' },
  ],
  InventoryItem: [
    { label: 'Nhập kho (Stock.Imported)', value: 'Stock.Imported' },
    { label: 'Cập nhật ngưỡng kho (Stock.ThresholdUpdated)', value: 'Stock.ThresholdUpdated' },
  ],
  Order: [
    { label: 'Tạo đơn hàng (Order.Created)', value: 'Order.Created' },
    { label: 'Đổi trạng thái đơn (Order.StatusUpdated)', value: 'Order.StatusUpdated' },
    { label: 'Hủy đơn hàng (Order.Cancelled)', value: 'Order.Cancelled' },
  ],
  Customer: [
    { label: 'Khóa khách hàng (Customer.Blocked)', value: 'Customer.Blocked' },
    { label: 'Mở khóa khách hàng (Customer.Unblocked)', value: 'Customer.Unblocked' },
  ],
  User: [
    { label: 'Đăng nhập hệ thống (User.LoggedIn)', value: 'User.LoggedIn' },
    { label: 'Đổi mật khẩu (User.PasswordChanged)', value: 'User.PasswordChanged' },
  ],
  SystemConfig: [
    { label: 'Sửa cấu hình hệ thống (SystemConfig.Updated)', value: 'SystemConfig.Updated' },
  ],
};

const ROLE_OPTIONS = [
  { label: 'Tất cả vai trò', value: '' },
  { label: 'Quản trị viên (Admin)', value: 'Admin' },
  { label: 'Khách hàng (Customer)', value: 'Customer' },
  { label: 'Hệ thống tự động (System)', value: 'System' },
];

// Helper to extract clean entity name / display title
function getEntityDisplayName(log: AdminAuditLogDto): { name: string; subtitle?: string } {
  let meta: any = null;
  if (log.metadata) {
    try {
      meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
    } catch {
      meta = null;
    }
  }

  const type = log.entityType?.toLowerCase() || '';

  if (type === 'product') {
    const name = meta?.productName || (log.description.match(/Sản phẩm '([^']+)'/)?.[1]) || 'Sản phẩm';
    return { name, subtitle: meta?.categoryName ? `Danh mục: ${meta.categoryName}` : undefined };
  }

  if (type === 'order') {
    const code = meta?.orderCode || meta?.trackingNumber || (log.entityId ? `#${log.entityId.slice(0, 8)}` : 'Đơn hàng');
    return { name: `Đơn hàng ${code}`, subtitle: meta?.totalAmount ? `${Number(meta.totalAmount).toLocaleString('vi-VN')}₫` : undefined };
  }

  if (type === 'inventoryitem') {
    const sku = meta?.skuSnapshot || (log.description.match(/SKU: ([^\s|]+)/)?.[1]) || 'Kho';
    return { name: `SKU: ${sku}`, subtitle: meta?.quantityAfter !== undefined ? `Tồn: ${meta.quantityAfter}` : undefined };
  }

  if (type === 'customer') {
    const email = meta?.customerEmail || (log.description.match(/Tài khoản ([^\s]+)/)?.[1]) || 'Khách hàng';
    return { name: email, subtitle: meta?.isBlocked ? 'Đã khóa' : 'Hoạt động' };
  }

  if (type === 'systemconfig') {
    const key = meta?.key || (log.description.match(/Cấu hình '([^']+)'/)?.[1]) || 'Cấu hình hệ thống';
    return { name: key };
  }

  if (type === 'user') {
    const email = meta?.email || log.actorEmail || 'Tài khoản người dùng';
    return { name: email, subtitle: meta?.role ? `Quyền: ${meta.role}` : undefined };
  }

  return {
    name: log.entityType || 'Đối tượng',
    subtitle: log.entityId ? `#${log.entityId.slice(0, 8)}` : undefined,
  };
}

// Helper to extract 1-line change summary
function getQuickChangeSummary(log: AdminAuditLogDto): React.ReactNode {
  let meta: any = null;
  if (log.metadata) {
    try {
      meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
    } catch {
      meta = null;
    }
  }

  if (meta) {
    if (meta.oldValue !== undefined && meta.newValue !== undefined) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
          <span className="text-rose-600 dark:text-rose-400 line-through truncate max-w-[80px]">{String(meta.oldValue)}</span>
          <span className="text-slate-400">→</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[80px]">{String(meta.newValue)}</span>
        </span>
      );
    }

    if (meta.oldStatus && meta.newStatus) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
          <span className="text-slate-500">{meta.oldStatus}</span>
          <span className="text-slate-400">→</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{meta.newStatus}</span>
        </span>
      );
    }

    if (meta.quantityImported !== undefined) {
      return (
        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
          +{meta.quantityImported} cái {meta.quantityAfter !== undefined ? `(Tồn: ${meta.quantityAfter})` : ''}
        </span>
      );
    }

    if (meta.oldThreshold !== undefined && meta.newThreshold !== undefined) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
          <span className="text-slate-400">{meta.oldThreshold}</span>
          <span className="text-slate-400">→</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">{meta.newThreshold}</span>
        </span>
      );
    }

    if (meta.reason) {
      return (
        <span className="text-slate-600 dark:text-slate-300 text-[11px] italic truncate max-w-[150px] inline-block" title={meta.reason}>
          {meta.reason}
        </span>
      );
    }
  }

  // Fallback description snippet
  return (
    <span className="text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[160px] inline-block" title={log.description}>
      {log.description}
    </span>
  );
}

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="py-4 px-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
        {i === 2 && <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2 mt-1.5" />}
      </td>
    ))}
  </tr>
);

export const AuditLogModule: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Lọc danh sách hành động tương ứng với module đã chọn
  const availableActionOptions = useMemo(() => {
    if (!moduleFilter) return [];
    return MODULE_ACTIONS_MAP[moduleFilter] || [];
  }, [moduleFilter]);

  // Selected Log for Diff Viewer Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogDto | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Column Resizing
  const { widths, totalWidth, activeResizingKey, startResize } = useResizableColumns({
    storageKey: 'pickle_col_widths_audit_logs_v3',
    defaultWidths: {
      time: 150,
      actor: 220,
      module: 140,
      action: 160,
      entity: 230,
      detail: 200,
    },
    minWidths: {
      time: 120,
      actor: 170,
      module: 110,
      action: 130,
      entity: 160,
      detail: 140,
    },
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetAuditLogsParams = {
        page,
        pageSize,
        entityType: moduleFilter || undefined,
        action: actionFilter || undefined,
        actorRole: roleFilter || undefined,
        fromDate: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        toDate: dateTo ? new Date(dateTo + 'T23:59:59.999Z').toISOString() : undefined,
      };

      const res = await adminApi.getAuditLogs(params);
      setLogs(res.items);
      setTotalItems(res.totalItems);
    } catch (e: any) {
      console.error('[AuditLogModule] Fetch Error:', e);
      setError(e?.response?.data?.message || e.message || 'Không thể tải nhật ký thao tác.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, moduleFilter, actionFilter, roleFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search input handler
  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val);
      setPage(1);
    }, 300);
  };

  const handleResetFilters = () => {
    setLocalSearch('');
    setSearchQuery('');
    setModuleFilter('');
    setActionFilter('');
    setRoleFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Client-side text search refinement for rapid instant feedback
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const entity = getEntityDisplayName(log);
    return (
      (log.actorEmail || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.entityType || '').toLowerCase().includes(q) ||
      (log.description || '').toLowerCase().includes(q) ||
      (log.entityId || '').toLowerCase().includes(q) ||
      entity.name.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasActiveFilters = Boolean(
    localSearch || moduleFilter || actionFilter || roleFilter || dateFrom || dateTo
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
              Nhật ký thao tác hệ thống
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ghi nhận toàn bộ biến động dữ liệu (sản phẩm, đơn hàng, kho hàng, bảo mật). Tổng:{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> bản ghi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shadow-sm disabled:opacity-50 shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        {/* Row 1: Search & Date Range Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo email, tên sản phẩm, mã đơn, SKU, ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 dark:focus:border-emerald-400 font-medium text-slate-900 dark:text-white transition-all shadow-inner"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Filter (Tái sử dụng chuẩn phong cách Account Page) */}
          <div className="lg:col-span-6 flex items-center justify-between sm:justify-start gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 shadow-inner">
            <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Từ:</span>
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              max={dateTo || undefined}
              className="bg-transparent text-xs outline-none font-semibold text-slate-900 dark:text-white w-[115px]"
            />
            <span className="text-xs text-slate-400 shrink-0 font-medium">đến</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              min={dateFrom || undefined}
              className="bg-transparent text-xs outline-none font-semibold text-slate-900 dark:text-white w-[115px]"
            />
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-auto shrink-0"
                title="Xóa khoảng ngày"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Module, Action, and Role Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Module Select */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setActionFilter(''); // Tự động xóa bộ lọc hành động khi đổi module
                setPage(1);
              }}
              className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer py-1"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Select (Phụ thuộc vào Module) */}
          <div className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-3 py-1.5 transition-all ${
            !moduleFilter ? 'opacity-55' : ''
          }`}>
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Hành động:</span>
            <select
              value={actionFilter}
              disabled={!moduleFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer py-1 truncate disabled:cursor-not-allowed"
            >
              {!moduleFilter ? (
                <option value="" className="bg-white dark:bg-slate-900 text-slate-400">
                  -- Vui lòng chọn module trước --
                </option>
              ) : (
                <>
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    Tất cả hành động ({MODULE_OPTIONS.find(m => m.value === moduleFilter)?.label.split(' (')[0] || moduleFilter})
                  </option>
                  {availableActionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {opt.label}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Role Select */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Người thực hiện:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer py-1"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
            className="text-xs text-left table-fixed border-collapse"
          >
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 tracking-wider">
              <tr>
                <th style={{ width: widths.time }} className="relative py-4 px-4 select-none">
                  Thời gian
                  <ResizeHandle onMouseDown={(e) => startResize('time', e)} isResizing={activeResizingKey === 'time'} />
                </th>
                <th style={{ width: widths.actor }} className="relative py-4 px-4 select-none">
                  Người thực hiện
                  <ResizeHandle onMouseDown={(e) => startResize('actor', e)} isResizing={activeResizingKey === 'actor'} />
                </th>
                <th style={{ width: widths.module }} className="relative py-4 px-4 select-none">
                  Module
                  <ResizeHandle onMouseDown={(e) => startResize('module', e)} isResizing={activeResizingKey === 'module'} />
                </th>
                <th style={{ width: widths.action }} className="relative py-4 px-4 select-none">
                  Hành động
                  <ResizeHandle onMouseDown={(e) => startResize('action', e)} isResizing={activeResizingKey === 'action'} />
                </th>
                <th style={{ width: widths.entity }} className="relative py-4 px-4 select-none">
                  Đối tượng
                  <ResizeHandle onMouseDown={(e) => startResize('entity', e)} isResizing={activeResizingKey === 'entity'} />
                </th>
                <th style={{ width: widths.detail }} className="relative py-4 px-4 select-none">
                  Chi tiết thay đổi
                  <ResizeHandle onMouseDown={(e) => startResize('detail', e)} isResizing={activeResizingKey === 'detail'} />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 border border-rose-200 dark:border-rose-800/50">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-rose-600 dark:text-rose-400 font-bold mb-3">{error}</p>
                    <button
                      onClick={fetchLogs}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      Thử tải lại
                    </button>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-14 h-14 mx-auto mb-3.5 rounded-3xl bg-slate-100 dark:bg-slate-800/70 flex items-center justify-center text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Không tìm thấy bản ghi nhật ký nào
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Thử điều chỉnh từ khóa tìm kiếm hoặc xóa các điều kiện lọc để hiển thị nhiều dữ liệu hơn.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badgeInfo = getActionBadgeInfo(log.action);
                  const entity = getEntityDisplayName(log);
                  const entityLink = getEntityRoute(log.entityType, log.entityId);
                  const changeSnippet = getQuickChangeSummary(log);

                  const roleStyle =
                    log.actorRole === 'Admin'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
                      : log.actorRole === 'Customer'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Time */}
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {new Date(log.occurredAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.occurredAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* 2. Actor */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-black text-[11px] shrink-0">
                            {log.actorEmail.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={log.actorEmail}>
                              {log.actorEmail}
                            </div>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border mt-0.5 ${roleStyle}`}>
                              {log.actorRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Module */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200/60 dark:border-slate-700/60">
                          {log.entityType}
                        </span>
                      </td>

                      {/* 4. Action */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${badgeInfo.className}`}
                          title={log.action}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.dotColor}`} />
                          <span className="truncate max-w-[110px]">{log.action.split('.').pop() || log.action}</span>
                        </span>
                      </td>

                      {/* 5. Entity */}
                      <td className="py-4 px-4">
                        <div className="min-w-0">
                          {entityLink ? (
                            <Link
                              href={entityLink}
                              target="_blank"
                              className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 group/link truncate max-w-full"
                              title={entity.name}
                            >
                              <span className="truncate">{entity.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-emerald-500 shrink-0" />
                            </Link>
                          ) : (
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={entity.name}>
                              {entity.name}
                            </div>
                          )}
                          {entity.subtitle && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {entity.subtitle}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Detail & Diff Trigger */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {changeSnippet}
                          </div>

                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-600 dark:text-slate-300 transition-all shrink-0 shadow-sm"
                            title="Xem chi tiết thay đổi (Diff Viewer)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && !error && totalItems > pageSize && (
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-bold">
            <span>
              Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> • Tổng{' '}
              <strong>{totalItems}</strong> bản ghi
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      pg === page
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
                title="Trang tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diff Viewer Modal */}
      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
