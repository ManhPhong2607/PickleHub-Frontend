'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderCode, setOrderCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('orderCode') || searchParams.get('id');
    setOrderCode(code);

    // Chuyển hướng sau 2.5 giây về trang Quản lý đơn hàng (/orders)
    const timer = setTimeout(() => {
      router.push('/orders');
    }, 2500);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
        
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 animate-bounce">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Thanh toán thành công!
          </h1>
          {orderCode && (
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              Mã giao dịch PayOS: #{orderCode}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Hệ thống đã nhận được tiền chuyển khoản của bạn. Đơn hàng đang được chuẩn bị đóng gói & vận chuyển.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Tự động chuyển về trang Đơn hàng trong giây lát...</span>
          </div>

          <button
            onClick={() => router.push('/orders')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Xem lịch sử đơn hàng ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
