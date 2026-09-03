'use client';

import React from 'react';
import {
  X,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  Percent,
} from 'lucide-react';
import type { AdminProduct, ProductPromotionSummary } from './types';
import { formatVND } from './types';

interface PromotionQuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AdminProduct | null;
  promotion: ProductPromotionSummary | null;
  onUnlink?: (promotionId: string, productId: string) => Promise<void>;
  onOpenStorefrontPreview?: (product: AdminProduct) => void;
}

export const PromotionQuickPreviewModal: React.FC<PromotionQuickPreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  promotion,
  onUnlink,
  onOpenStorefrontPreview,
}) => {
  if (!isOpen || !product || !promotion) return null;

  const now = new Date();
  const startDate = new Date(promotion.startsAt);
  const endDate = new Date(promotion.endsAt);

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progressPercent = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

  const getStatusBadge = () => {
    switch (promotion.status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            🟢 Đang diễn ra
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            🔵 Sắp diễn ra
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            ⚪ Đã kết thúc
          </span>
        );
    }
  };

  const basePrice = product.price || 0;
  const discountAmount = Math.round((basePrice * promotion.discountPercent) / 100);
  const effectivePrice = Math.max(0, basePrice - discountAmount);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Chi Tiết Chương Trình Khuyến Mãi</h3>
              <p className="text-xs text-emerald-100/90 font-medium truncate max-w-sm">
                Áp dụng cho: {product.name}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Top Banner Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {promotion.promotionName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Mức giảm áp dụng riêng cho sản phẩm này
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  -{promotion.discountPercent}%
                </span>
              </div>
            </div>

            {/* Status & Priority */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              {getStatusBadge()}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                Độ ưu tiên: {promotion.priority}
              </span>
            </div>
          </div>

          {/* Timeline & Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Thời gian hiệu lực
              </span>
              <span>{Math.round(progressPercent)}% hoàn thành</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Bắt đầu</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {startDate.toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Kết thúc</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                  {endDate.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2.5">
            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-emerald-600" />
              Công thức tính giá bán thực tế (Effective Price)
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-emerald-200/40 dark:border-emerald-800/40">
              <span className="text-slate-600 dark:text-slate-400">Giá gốc niêm yết:</span>
              <span className="font-bold text-slate-900 dark:text-white line-through">{formatVND(basePrice)}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-emerald-200/40 dark:border-emerald-800/40">
              <span className="text-slate-600 dark:text-slate-400">Mức giảm ({promotion.discountPercent}%):</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">-{formatVND(discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="font-black text-slate-900 dark:text-white">Giá sau khuyến mãi:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatVND(effectivePrice)}
              </span>
            </div>
          </div>

          {/* Rules & Stacking Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-200">ℹ️ Quy tắc áp dụng & Chồng lấn:</div>
            <p>
              • Nếu sản phẩm được gán nhiều chương trình cùng lúc, hệ thống sẽ ưu tiên chọn chương trình có <strong>Độ ưu tiên (Priority) cao nhất</strong> ({promotion.priority}).
            </p>
            <p>
              • Giá khuyến mãi tự động kích hoạt vào ngày bắt đầu và tự động quay về giá gốc khi hết hạn.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div>
            {onUnlink && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Bạn có chắc chắn muốn gỡ sản phẩm này khỏi khuyến mãi "${promotion.promotionName}"?`)) {
                    await onUnlink(promotion.promotionId, product.id);
                    onClose();
                  }
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
              >
                Gỡ khỏi khuyến mãi
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onOpenStorefrontPreview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStorefrontPreview(product);
                }}
                className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                Xem trước Storefront
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
