import React from 'react';
import { WifiOff, RefreshCw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Mất kết nối mạng — PickleHub',
  description: 'Thiết bị của bạn hiện đang không có kết nối Internet.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="text-center max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5">
        
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <WifiOff className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
            Không có kết nối mạng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
            Bạn đang ở chế độ ngoại tuyến. Vui lòng kiểm tra lại kết nối Wi-Fi hoặc dữ liệu di động (4G/5G) để tiếp tục mua sắm tại PickleHub.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử tải lại trang</span>
          </Link>

          <Link
            href="/cart"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Xem giỏ hàng</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
