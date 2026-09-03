'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  Flame,
  Timer,
  ShoppingBag,
  Heart,
  Star,
  Sparkles,
  Smartphone,
  Monitor,
  Share2,
} from 'lucide-react';
import type { AdminProduct } from './types';
import { formatVND } from './types';

interface StorefrontPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AdminProduct | null;
}

export const StorefrontPreviewModal: React.FC<StorefrontPreviewModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    if (!isOpen || !product) return;

    if (product.activePromotion?.endsAt) {
      const targetTime = new Date(product.activePromotion.endsAt).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = Math.max(0, targetTime - now);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const basePrice = product.price || 0;
  const effectivePrice = product.effectivePrice || (product.isOnSale ? product.effectivePrice : basePrice) || basePrice;
  const isOnSale = product.isOnSale || (product.activePromotion && product.activePromotion.status === 'Active');
  const discountPercent = product.salePercent || product.activePromotion?.discountPercent || 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Xem Trước Giao Diện Storefront (Public)</h3>
              <p className="text-xs text-slate-400 font-medium">
                Mô phỏng hiển thị trực quan thẻ sản phẩm trên giao diện khách hàng
              </p>
            </div>
          </div>

          {/* Device toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg transition-colors ${
                  deviceMode === 'desktop' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Giao diện Máy tính"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg transition-colors ${
                  deviceMode === 'mobile' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Giao diện Điện thoại"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storefront simulation container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950 flex flex-col items-center justify-center">
          {/* Top Flash Sale Countdown Banner */}
          {isOnSale && (
            <div className="w-full max-w-md mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 text-white flex items-center justify-between shadow-lg shadow-rose-950/50">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {product.activePromotion?.promotionName || 'Flash Sale Đang Diễn Ra'}
                  </div>
                  <div className="text-[10px] text-amber-100 font-medium">Giảm sốc tới {discountPercent}%</div>
                </div>
              </div>

              {/* Countdown Numbers */}
              <div className="flex items-center gap-1 text-xs font-black font-mono">
                <div className="bg-black/40 px-2 py-1 rounded-md border border-white/10">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span>:</span>
                <div className="bg-black/40 px-2 py-1 rounded-md border border-white/10">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span>:</span>
                <div className="bg-black/40 px-2 py-1 rounded-md border border-white/10">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          )}

          {/* Product Card Simulation */}
          <div
            className={`transition-all duration-300 ${
              deviceMode === 'desktop' ? 'w-80' : 'w-72'
            }`}
          >
            <div className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col">
              {/* Top Badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                {isOnSale && (
                  <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[11px] font-black tracking-tight shadow-md flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
                    -{discountPercent}%
                  </span>
                )}
                {product.brand && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold border border-white/10">
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs text-slate-600 dark:text-slate-300 hover:text-rose-500 flex items-center justify-center shadow-md transition-colors"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              {/* Product Image */}
              <div className="relative w-full aspect-square p-6 bg-radial from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                <img
                  src={product.image || '/images/paddle.png'}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Product Details */}
              <div className="p-5 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    {product.brand ? `${product.brand} • ` : ''}{product.category || 'Pickleball'}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                </div>

                {/* Price Section */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                  <div>
                    {isOnSale && (
                      <div className="text-xs text-slate-400 line-through font-medium">
                        {formatVND(basePrice)}
                      </div>
                    )}
                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                      {formatVND(effectivePrice)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>✨ Giao diện khách hàng được cập nhật tự động theo thời gian thực (Realtime).</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            Đóng Xem Trước
          </button>
        </div>
      </div>
    </div>
  );
};
