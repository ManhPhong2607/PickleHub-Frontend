'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  X,
  Search,
  Check,
  Warehouse,
  ArrowRight,
  Package
} from 'lucide-react';
import { adminApi, AdminInventoryItemDto } from '@/lib/api/adminApi';

interface LowStockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryList: AdminInventoryItemDto[];
  stockThreshold: number;
  onUpdateGlobalThreshold: (newThreshold: number) => void;
  onRefreshInventory: () => void;
}

export const LowStockAlertModal: React.FC<LowStockAlertModalProps> = ({
  isOpen,
  onClose,
  inventoryList,
  stockThreshold,
  onUpdateGlobalThreshold,
  onRefreshInventory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [tempGlobalThreshold, setTempGlobalThreshold] = useState<number>(stockThreshold);

  // Sync tempGlobalThreshold whenever parent stockThreshold changes
  useEffect(() => {
    setTempGlobalThreshold(stockThreshold);
  }, [stockThreshold]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Per-row threshold edit state
  const [editingThresholds, setEditingThresholds] = useState<Record<string, number>>({});
  const [customThresholds, setCustomThresholds] = useState<Record<string, number>>({});
  const [savingThresholdId, setSavingThresholdId] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper to determine the effective threshold for each item
  const getItemEffectiveThreshold = (item: AdminInventoryItemDto): number => {
    const targetVariantId = item.variantId || item.id;
    if (editingThresholds[targetVariantId] !== undefined) {
      return editingThresholds[targetVariantId];
    }
    if (customThresholds[targetVariantId] !== undefined) {
      return customThresholds[targetVariantId];
    }
    return stockThreshold;
  };

  // Filter low stock items based on threshold and search
  const lowStockItems = useMemo(() => {
    return inventoryList
      .filter((item) => {
        const itemThreshold = getItemEffectiveThreshold(item);
        const currentQty = item.quantity ?? 0;
        return currentQty <= itemThreshold;
      })
      .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
  }, [inventoryList, stockThreshold, editingThresholds, customThresholds]);

  const outOfStockCount = useMemo(() => {
    return lowStockItems.filter((i) => (i.quantity ?? 0) <= 0).length;
  }, [lowStockItems]);

  const nearOutOfStockCount = useMemo(() => {
    return lowStockItems.filter((i) => (i.quantity ?? 0) > 0).length;
  }, [lowStockItems]);

  // Filter by search and status tab
  const displayedItems = useMemo(() => {
    return lowStockItems.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'out_of_stock' && (item.quantity ?? 0) > 0) return false;
      if (statusFilter === 'low_stock' && (item.quantity ?? 0) <= 0) return false;

      // 2. Keyword Search
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = item.productName?.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchVariant = item.variantName?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCategory && !matchVariant) return false;
      }

      return true;
    });
  }, [lowStockItems, statusFilter, searchTerm]);

  // Save individual threshold for a product variant
  const handleSaveIndividualThreshold = async (item: AdminInventoryItemDto) => {
    const targetVariantId = item.variantId || item.id;
    const currentVal = getItemEffectiveThreshold(item);
    if (currentVal < 0) {
      showToast('Ngưỡng cảnh báo không được nhỏ hơn 0', 'error');
      return;
    }

    setSavingThresholdId(targetVariantId);
    try {
      const qtyToSend = (item.quantity !== undefined && item.quantity > 0) ? item.quantity : 15;
      await adminApi.updateInventoryThreshold(targetVariantId, currentVal, item.productId, item.sku, qtyToSend);
      setCustomThresholds((prev) => ({ ...prev, [targetVariantId]: currentVal }));
      showToast(`Đã lưu ngưỡng cảnh báo (${currentVal}) cho "${item.productName}"`);
      onRefreshInventory();
    } catch (err: any) {
      console.error('[UPDATE THRESHOLD ERROR]', err);
      showToast('Không thể cập nhật ngưỡng cảnh báo.', 'error');
    } finally {
      setSavingThresholdId(null);
    }
  };

  // Save global threshold
  const handleApplyGlobalThreshold = () => {
    if (tempGlobalThreshold < 0) {
      showToast('Ngưỡng cảnh báo không được âm', 'error');
      return;
    }
    setEditingThresholds({});
    setCustomThresholds({});
    onUpdateGlobalThreshold(tempGlobalThreshold);
    showToast(`Đã áp dụng ngưỡng cảnh báo chung (${tempGlobalThreshold} sản phẩm) cho tất cả mặt hàng.`);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`absolute top-4 right-14 z-50 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 ${
              toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            <span>{toastMessage.type === 'success' ? '✓' : '⚠'}</span>
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* ── 1. MODAL HEADER ────────────────────────────────────────── */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                  Cảnh Báo Tồn Kho & Điều Chỉnh Ngưỡng
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black shadow-xs">
                  {lowStockItems.length} sản phẩm
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Giám sát các mặt hàng hết hàng hoặc sắp chạm ngưỡng an toàn và điều chỉnh ngưỡng theo nhu cầu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/inventory"
              onClick={onClose}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Warehouse className="w-4 h-4" />
              <span>Vào Kho</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. CONTROLS BAR: SEARCH, TABS & GLOBAL THRESHOLD ───────── */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên sản phẩm, mã SKU, phân loại..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Global Threshold Adjustment Box */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs shrink-0">
              <span className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Ngưỡng cảnh báo chung:
              </span>
              <input
                type="number"
                min={0}
                max={1000}
                value={tempGlobalThreshold}
                onChange={(e) => setTempGlobalThreshold(Number(e.target.value))}
                className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-black text-center text-slate-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={handleApplyGlobalThreshold}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer"
              >
                Áp dụng
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả cảnh báo ({lowStockItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('out_of_stock')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950'
              }`}
            >
              <span>🔴 Hết hàng</span>
              <span className="px-1.5 py-0.2 bg-rose-700 text-white rounded-full text-[10px]">
                {outOfStockCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('low_stock')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950'
              }`}
            >
              <span>🟡 Sắp hết hàng</span>
              <span className="px-1.5 py-0.2 bg-amber-700 text-white rounded-full text-[10px]">
                {nearOutOfStockCount}
              </span>
            </button>
          </div>
        </div>

        {/* ── 3. DATA TABLE ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {displayedItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Không tìm thấy sản phẩm cảnh báo nào phù hợp.
              </p>
              <p className="text-xs text-slate-400">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh ngưỡng tồn kho.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Sản phẩm / Biến thể</th>
                    <th className="py-3 px-3 text-center">Tồn kho hiện tại</th>
                    <th className="py-3 px-4 text-center">Ngưỡng cảnh báo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 font-medium">
                  {displayedItems.map((item) => {
                    const targetVariantId = item.variantId || item.id;
                    const itemThreshold = getItemEffectiveThreshold(item);
                    const isOutOfStock = (item.quantity ?? 0) <= 0;
                    const editingVal = itemThreshold;
                    const isSaving = savingThresholdId === targetVariantId;

                    return (
                      <tr
                        key={item.id || targetVariantId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* 1. Product Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
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
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                                {item.productName}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-bold text-slate-600 dark:text-slate-300">
                                  {item.sku}
                                </span>
                                {item.variantName && item.variantName !== 'Mặc định' && item.variantName !== 'Bản tiêu chuẩn' && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    • {item.variantName}
                                  </span>
                                )}
                                {item.category && (
                                  <span className="hidden sm:inline">
                                    • {item.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Current Stock */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-black text-xs">
                              🔴 0 (Hết hàng)
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs">
                                🟡 {item.quantity} sản phẩm
                              </span>
                              {item.reservedQuantity ? (
                                <span className="text-[10px] text-slate-400">
                                  (Giữ: {item.reservedQuantity})
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>

                        {/* 3. Threshold Inline Edit */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={999}
                              value={editingVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingThresholds((prev) => ({
                                  ...prev,
                                  [targetVariantId]: val,
                                }));
                              }}
                              className="w-16 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-center text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                              title="Ngưỡng cảnh báo cho sản phẩm này"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveIndividualThreshold(item)}
                              disabled={isSaving}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                              title="Lưu ngưỡng cho sản phẩm này"
                            >
                              <Check className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 4. MODAL FOOTER ────────────────────────────────────────── */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <Link
            href="/admin/inventory"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Warehouse className="w-4 h-4" />
            <span>Mở trang Quản Lý Tồn Kho Chi Tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
