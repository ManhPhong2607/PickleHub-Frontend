'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Sparkles,
  Search,
  Check,
  AlertCircle,
  Percent,
  Layers,
  Calendar,
  Loader2,
} from 'lucide-react';
import { adminApi, AdminPromotionSummaryDto } from '@/lib/api/adminApi';
import type { AdminProduct } from './types';
import { formatVND } from './types';

interface AssignPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AdminProduct[];
  onSuccess: () => void;
}

export const AssignPromotionModal: React.FC<AssignPromotionModalProps> = ({
  isOpen,
  onClose,
  products,
  onSuccess,
}) => {
  const [promotions, setPromotions] = useState<AdminPromotionSummaryDto[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedPromoId('');
      setDiscountPercent(15);
      fetchPromotions();
    }
  }, [isOpen]);

  const fetchPromotions = async () => {
    setLoadingPromos(true);
    try {
      const res = await adminApi.getPromotions(1, 100);
      setPromotions(res.items || []);
      if (res.items && res.items.length > 0) {
        setSelectedPromoId(res.items[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load promotions:', err);
      setError('Không thể tải danh sách chương trình khuyến mãi.');
    } finally {
      setLoadingPromos(false);
    }
  };

  if (!isOpen || products.length === 0) return null;

  const filteredPromotions = promotions.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPromo = promotions.find((p) => p.id === selectedPromoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromoId) {
      setError('Vui lòng chọn một chương trình khuyến mãi.');
      return;
    }
    if (discountPercent <= 0 || discountPercent > 99) {
      setError('Mức giảm giá phải từ 1% đến 99%.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const items = products.map((p) => ({
        productId: p.id,
        discountPercent: Number(discountPercent),
      }));

      const res = await adminApi.addProductsToPromotion(selectedPromoId, items);

      if (res.conflictingProductIds && res.conflictingProductIds.length > 0) {
        alert(
          `Đã áp dụng thành công cho ${res.successCount} sản phẩm. Có ${res.conflictingProductIds.length} sản phẩm bị trùng lặp độ ưu tiên đã được bỏ qua.`
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Assign promotion error:', err);
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi áp dụng khuyến mãi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
              <Tag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Áp Dụng Khuyến Mãi Cho Sản Phẩm
              </h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                Đang chọn: <strong>{products.length}</strong> sản phẩm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Chọn chương trình khuyến mãi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  1. Chọn Chương Trình Khuyến Mãi
                </label>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm chương trình..."
                    className="w-full pl-8 pr-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {loadingPromos ? (
                <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Đang tải danh sách khuyến mãi...</span>
                </div>
              ) : filteredPromotions.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  Chưa có chương trình khuyến mãi nào phù hợp.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {filteredPromotions.map((p) => {
                    const isSelected = selectedPromoId === p.id;
                    const startDate = new Date(p.startsAt).toLocaleDateString('vi-VN');
                    const endDate = new Date(p.endsAt).toLocaleDateString('vi-VN');

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPromoId(p.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                            {p.name}
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-emerald-500" /> {startDate} → {endDate}
                          </span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            P:{p.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Mức giảm giá (%) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                2. Mức Chiết Khấu / Giảm Giá (%)
              </label>

              <div className="flex items-center gap-4">
                <div className="relative w-36">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    %
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 10, 15, 20, 30, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDiscountPercent(val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        discountPercent === val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Preview danh sách sản phẩm & giá mới */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                3. Danh Sách Sản Phẩm Được Áp Dụng ({products.length})
              </label>

              <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => {
                  const base = p.price || 0;
                  const discountAmount = Math.round((base * discountPercent) / 100);
                  const effective = Math.max(0, base - discountAmount);

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <img
                          src={p.image || '/images/paddle.png'}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku || '—'}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-400 line-through mr-2">
                          {formatVND(base)}
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {formatVND(effective)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-bold text-xs rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPromoId}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Áp Dụng Cho {products.length} Sản Phẩm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
