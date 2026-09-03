'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  RotateCw,
  Layers,
  Download,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { adminApi, type AdminInventoryItemDto } from '@/lib/api/adminApi';
import {
  KPISection,
  InventoryFilters,
  InventoryTable,
  BulkActionBar,
  applyFilters,
  applySort,
  extractAvailableAttributes,
  DEFAULT_INVENTORY_FILTERS,
  type FilterState,
  type SortField,
  type SortDir,
} from './inventory/InventoryShared';
import { MovementModal } from './inventory/MovementModal';
import { AdjustModal } from './inventory/AdjustModal';
import { BulkAdjustModal } from './inventory/BulkAdjustModal';

// ─── Toast Notification ───────────────────────────────────────────────────────

type ToastType = 'success' | 'error';
const Toast: React.FC<{ msg: string; type: ToastType }> = ({ msg, type }) => (
  <div
    className={`fixed top-5 right-5 z-[60] px-4 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg animate-in slide-in-from-top-2 flex items-center gap-2 ${
      type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
    }`}
  >
    <span>{type === 'success' ? '✓' : '⚠'}</span>
    <span>{msg}</span>
  </div>
);

// ─── Import Excel Modal (Backend Sync Architecture) ───────────────────────────

const ImportExcelModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ isOpen, onClose, onSuccess, showToast }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalRowsProcessed: number;
    successCount: number;
    failedCount: number;
    failedRows?: { rowNumber: number; sku?: string; reason: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const blob = await adminApi.downloadInventoryTemplateExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_import_template_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Đã tải file Excel mẫu thành công!');
    } catch {
      showToast('Không thể tải file mẫu Excel.', 'error');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      setImporting(true);
      const res = await adminApi.importInventoryExcel(selectedFile);
      setImportResult(res);
      if (res.successCount > 0) {
        showToast(`Nhập kho thành công ${res.successCount} dòng!`);
        onSuccess();
      } else {
        showToast('Không có dòng nào được nhập thành công.', 'error');
      }
    } catch (err: any) {
      showToast(err?.response?.data || err?.message || 'Lỗi khi nhập file Excel', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nhập kho từ file Excel
              </h3>
              <p className="text-xs text-slate-500">Cập nhật số lượng nhập kho hàng loạt theo danh sách</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Step 1: Download template */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Bước 1: Tải file Excel mẫu</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                File mẫu chứa sẵn toàn bộ SKU & biến thể hiện có
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{downloadingTemplate ? 'Đang tải...' : 'Tải file mẫu'}</span>
            </button>
          </div>

          {/* Step 2: Upload file */}
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">
                Bước 2: Chọn file Excel đã điền số lượng nhập (.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setImportResult(null);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded-2xl"
              />
            </div>

            {/* Import Results if any */}
            {importResult && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                importResult.failedCount === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Kết quả xử lý:</span>
                  <span>
                    Thành công: <strong>{importResult.successCount}</strong> · Lỗi: <strong>{importResult.failedCount}</strong>
                  </span>
                </div>
                {importResult.failedRows && importResult.failedRows.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] pt-1">
                    {importResult.failedRows.map((err, idx) => (
                      <div key={idx} className="text-rose-600 dark:text-rose-400">
                        • Dòng {err.rowNumber} (SKU: {err.sku || 'N/A'}): {err.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={importing || !selectedFile}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{importing ? 'Đang xử lý import...' : 'Tiến hành Nhập kho'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Import Stock Modal (Clean SaaS Design) ───────────────────────────────────

const ImportStockModal: React.FC<{
  item: AdminInventoryItemDto | null;
  allItems: AdminInventoryItemDto[];
  onChangeItem: (item: AdminInventoryItemDto) => void;
  onClose: () => void;
  onSubmit: (variantId: string, qty: number, note: string) => Promise<void>;
  submitting: boolean;
}> = ({ item, allItems, onChangeItem, onClose, onSubmit, submitting }) => {
  const [qty, setQty] = useState(50);
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || qty <= 0) return;
    await onSubmit(item.variantId, qty, note);
    setQty(50);
    setNote('');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nhập kho bổ sung
              </h3>
              <p className="text-xs text-slate-500">Tăng số lượng tồn kho vật lý</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-xs">
          {/* SKU Select */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">
              Sản phẩm / SKU <span className="text-rose-500">*</span>
            </label>
            <select
              value={item?.variantId || ''}
              onChange={(e) => {
                const found = allItems.find((i) => i.variantId === e.target.value);
                if (found) onChangeItem(found);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-semibold text-xs text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 transition-all"
            >
              {allItems.map((i) => (
                <option key={i.variantId} value={i.variantId}>
                  {i.productName} ({i.sku}) — Tồn: {i.quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview */}
          {item && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Hiện tại</div>
                <div className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                  {item.quantity}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Nhập thêm</div>
                <div className="text-base font-black text-emerald-600 tabular-nums">+{qty}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Sau khi nhập</div>
                <div className="text-base font-black text-blue-600 tabular-nums">
                  {item.quantity + qty}
                </div>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">
              Số lượng nhập <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 10))}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                required
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-xs text-center focus:bg-white focus:border-emerald-500 transition-all text-slate-900 dark:text-white tabular-nums"
              />
              <button
                type="button"
                onClick={() => setQty((q) => q + 10)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
              >
                +
              </button>
            </div>
            {/* Quick Presets */}
            <div className="flex gap-1.5 pt-1">
              {[10, 50, 100, 200, 500].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQty(n)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                    qty === n
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">
              Ghi chú nhập kho
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nhập hàng lô tháng 8..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !item}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Đang lưu...' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Module ──────────────────────────────────────────────────────────────

export const InventoryModule: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<AdminInventoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>(DEFAULT_INVENTORY_FILTERS);

  // Sort
  const [sortField, setSortField] = useState<SortField>('productName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedItemForImport, setSelectedItemForImport] = useState<AdminInventoryItemDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const [adjustModalItem, setAdjustModalItem] = useState<AdminInventoryItemDto | null>(null);
  const [movementModalItem, setMovementModalItem] = useState<AdminInventoryItemDto | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await adminApi.getInventory();
      setInventoryItems(items);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || 'Không thể kết nối đến Inventory Service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filters, sortField, sortDir]);

  // ─── Derived Data ─────────────────────────────────────────────────────────

  const availableAttributes = useMemo(
    () => extractAvailableAttributes(inventoryItems),
    [inventoryItems]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    inventoryItems.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    const f = applyFilters(inventoryItems, filters);
    return applySort(f, sortField, sortDir);
  }, [inventoryItems, filters, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = useMemo(
    () => filteredItems.slice((page - 1) * pageSize, page * pageSize),
    [filteredItems, page, pageSize],
  );

  const lowStockCount = useMemo(
    () => inventoryItems.filter((i) => i.availableQuantity <= i.lowStockThreshold && i.availableQuantity > 0).length,
    [inventoryItems],
  );
  const outOfStockCount = useMemo(
    () => inventoryItems.filter((i) => i.availableQuantity <= 0).length,
    [inventoryItems],
  );
  const totalPhysicalSum = useMemo(
    () => inventoryItems.reduce((acc, i) => acc + i.quantity, 0),
    [inventoryItems],
  );
  const totalReservedSum = useMemo(
    () => inventoryItems.reduce((acc, i) => acc + i.reservedQuantity, 0),
    [inventoryItems],
  );
  const totalAvailableSum = useMemo(
    () => inventoryItems.reduce((acc, i) => acc + i.availableQuantity, 0),
    [inventoryItems],
  );
  const totalValueVND = useMemo(
    () => inventoryItems.reduce((acc, i) => acc + (i.availableQuantity * (i.costPerUnit || 150000)), 0),
    [inventoryItems],
  );

  // Selected items list for bulk modal
  const selectedItemsList = useMemo(
    () => inventoryItems.filter((i) => selectedIds.has(i.id)),
    [inventoryItems, selectedIds],
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = useCallback((field: SortField) => {
    setSortDir((prev) => (sortField === field && prev === 'asc' ? 'desc' : 'asc'));
    setSortField(field);
  }, [sortField]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (pagedItems.every((it) => selectedIds.has(it.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedItems.forEach((it) => next.delete(it.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedItems.forEach((it) => next.add(it.id));
        return next;
      });
    }
  }, [pagedItems, selectedIds]);

  const handleImportSubmit = useCallback(
    async (variantId: string, qty: number, note: string) => {
      setSubmitting(true);
      try {
        const found = inventoryItems.find((i) => i.variantId === variantId);
        await adminApi.importStock({
          variantId,
          productId: found?.productId,
          skuSnapshot: found?.sku,
          quantity: qty,
          note: note || 'Nhập kho từ trang Quản lý Kho',
        });
        showToast('Nhập kho thành công!');
        setImportModalOpen(false);
        setSelectedItemForImport(null);
        await fetchInventory();
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Lỗi nhập kho', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [inventoryItems, fetchInventory, showToast],
  );

  const handleUpdateThreshold = useCallback(
    async (variantId: string, val: number) => {
      try {
        await adminApi.updateInventoryThreshold(variantId, val);
        showToast('Cập nhật mức cảnh báo thành công!');
        await fetchInventory();
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Lỗi cập nhật ngưỡng', 'error');
      }
    },
    [fetchInventory, showToast],
  );

  const handleExportExcel = useCallback(async () => {
    try {
      setExportingExcel(true);
      const blob = await adminApi.exportInventoryExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Đã xuất file Excel tồn kho thành công!');
    } catch {
      showToast('Không thể xuất file Excel.', 'error');
    } finally {
      setExportingExcel(false);
    }
  }, [showToast]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      setDownloadingTemplate(true);
      const blob = await adminApi.downloadInventoryTemplateExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_import_template_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Đã xuất file Excel mẫu thành công!');
    } catch {
      showToast('Không thể xuất file Excel mẫu.', 'error');
    } finally {
      setDownloadingTemplate(false);
    }
  }, [showToast]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-20">
      {/* Toast Notification */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-2xl">
              <Package className="w-6 h-6" />
            </span>
            Quản lý Tồn kho & SKU
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi số lượng tồn thực tế, hàng đang chờ xử lý và thiết lập ngưỡng cảnh báo
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Nút Xuất Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            type="button"
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            title="Xuất toàn bộ tồn kho hiện tại ra file Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{exportingExcel ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>

          {/* Nút Nhập Excel */}
          <button
            onClick={() => setExcelModalOpen(true)}
            type="button"
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Nhập tồn kho hàng loạt từ file Excel (.xlsx)"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Nhập Excel</span>
          </button>

          {/* Nút Nhập kho mới */}
          <button
            onClick={() => {
              setSelectedItemForImport(inventoryItems[0] || null);
              setImportModalOpen(true);
            }}
            type="button"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nhập kho mới</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <KPISection
        totalSku={inventoryItems.length}
        totalPhysical={totalPhysicalSum}
        totalReserved={totalReservedSum}
        totalAvailable={totalAvailableSum}
        totalValueVND={totalValueVND}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        activeFilter={filters.stockStatus}
        onFilter={(s) => setFilters((prev) => ({ ...prev, stockStatus: s }))}
        loading={loading}
      />

      {/* Filter Bar */}
      <InventoryFilters
        filters={filters}
        onChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
        onRefresh={fetchInventory}
        categories={categories}
        totalVisible={filteredItems.length}
        totalAll={inventoryItems.length}
        availableAttributes={availableAttributes}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={(field, dir) => {
          setSortField(field);
          setSortDir(dir);
        }}
      />

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <InventoryTable
          items={pagedItems}
          loading={loading}
          error={error}
          onRetry={fetchInventory}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onImport={(item) => {
            setSelectedItemForImport(item);
            setImportModalOpen(true);
          }}
          onAdjust={(item) => setAdjustModalItem(item)}
          onViewMovements={(item) => setMovementModalItem(item)}
          onUpdateThreshold={handleUpdateThreshold}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </div>

      {/* Pagination Footer */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold">
          <div className="text-slate-500 dark:text-slate-400">
            Hiển thị <strong className="text-slate-900 dark:text-white">{filteredItems.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> -{' '}
            <strong className="text-slate-900 dark:text-white">{Math.min(page * pageSize, filteredItems.length)}</strong> trong{' '}
            <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong> sản phẩm
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold cursor-pointer text-slate-900 dark:text-white"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>

            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        count={selectedIds.size}
        onBulkAdjust={() => setBulkModalOpen(true)}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Excel Import Modal */}
      <ImportExcelModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        onSuccess={() => {
          fetchInventory();
        }}
        showToast={showToast}
      />

      {/* Import Modal */}
      {importModalOpen && (
        <ImportStockModal
          item={selectedItemForImport}
          allItems={inventoryItems}
          onChangeItem={setSelectedItemForImport}
          onClose={() => {
            setImportModalOpen(false);
            setSelectedItemForImport(null);
          }}
          onSubmit={handleImportSubmit}
          submitting={submitting}
        />
      )}

      {/* Manual Adjust Modal */}
      {adjustModalItem && (
        <AdjustModal
          item={adjustModalItem}
          onClose={() => setAdjustModalItem(null)}
          onSuccess={() => {
            showToast(`Đã điều chỉnh kho cho ${adjustModalItem.sku} thành công!`);
            fetchInventory();
          }}
        />
      )}

      {/* Audit Trail Movement Modal */}
      {movementModalItem && (
        <MovementModal
          item={movementModalItem}
          onClose={() => setMovementModalItem(null)}
        />
      )}

      {/* Bulk Action Modal */}
      {bulkModalOpen && selectedItemsList.length > 0 && (
        <BulkAdjustModal
          selectedItems={selectedItemsList}
          onClose={() => setBulkModalOpen(false)}
          onSuccess={(count) => {
            showToast(`Đã hoàn tất thao tác hàng loạt cho ${count} SKU!`);
            setSelectedIds(new Set());
            fetchInventory();
          }}
        />
      )}
    </div>
  );
};
