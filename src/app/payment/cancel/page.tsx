'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowRight } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
        
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-600/20">
          <XCircle className="w-12 h-12 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Giao dịch bị hủy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Bạn đã hủy quá trình thanh toán trên PayOS. Đơn hàng của bạn vẫn được lưu giữ và có thể thực hiện thanh toán lại bất cứ lúc nào.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => router.push('/orders')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Quay lại Quản lý đơn hàng</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
