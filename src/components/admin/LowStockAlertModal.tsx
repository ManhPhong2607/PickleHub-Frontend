'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  X,
  Search,
  Warehouse,
  ArrowRight,
  Package
} from 'lucide-react';
import { AdminInventoryItemDto } from '@/lib/api/adminApi';

interface LowStockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryList: AdminInventoryItemDto[];
  onRefreshInventory?: () => void;
}

export const LowStockAlertModal: React.FC<LowStockAlertModalProps> = ({
  isOpen,
  onClose,
  inventoryList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');

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

  // Filter low stock items: strictly compare each item's actual quantity to its own lowStockThreshold
  const lowStockItems = useMemo(() => {
    return inventoryList
      .filter((item) => {
        const itemThreshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10;
        const currentQty = item.quantity ?? 0;
        return currentQty <= itemThreshold;
      })
      .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
  }, [inventoryList]);

  const outOfStockCount = useMemo(() => {
    return lowStockItems.filter((i) => (i.quantity ?? 0) <= 0).length;
  }, [lowStockItems]);

  const nearOutOfStockCount = useMemo(() => {
    return lowStockItems.filter((i) => (i.quantity ?? 0) > 0).length;
  }, [lowStockItems]);

  // Filter by search keyword and status tab
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
        
        {/* ── 1. MODAL HEADER ────────────────────────────────────────── */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                  Cảnh Báo Tồn Kho
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black shadow-xs">
                  {lowStockItems.length} sản phẩm
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Giám sát các mặt hàng hết hàng hoặc chạm ngưỡng cảnh báo an toàn của từng sản phẩm.
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

        {/* ── 2. CONTROLS BAR: SEARCH & TABS (NO GLOBAL THRESHOLD) ───── */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
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
        </div>

        {/* ── 3. DATA TABLE (READ-ONLY THRESHOLD) ────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {displayedItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Không có sản phẩm nào chạm ngưỡng cảnh báo tồn kho.
              </p>
              <p className="text-xs text-slate-400">
                Tất cả các sản phẩm hiện đều đạt số lượng tồn kho an toàn theo cấu hình riêng của từng sản phẩm.
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
                    const itemThreshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10;
                    const isOutOfStock = (item.quantity ?? 0) <= 0;

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

                        {/* 3. Product's Own Threshold (Read-only badge) */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs border border-slate-200/60 dark:border-slate-700"
                            title="Ngưỡng cảnh báo an toàn được cấu hình riêng cho sản phẩm này"
                          >
                            {itemThreshold}
                          </span>
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
