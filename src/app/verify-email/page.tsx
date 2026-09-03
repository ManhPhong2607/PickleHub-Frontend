'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { authApi } from '@/lib/api/authApi';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  const executedRef = React.useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    if (token) {
      authApi
        .verifyEmail(token)
        .then((resMsg) => {
          setStatus('success');
          setMsg(resMsg || 'Xác minh địa chỉ Email thành công! Bạn đã hoàn tất đăng ký tài khoản PickleHub.');
        })
        .catch((err) => {
          setStatus('error');
          const errorDetail =
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.response?.data ||
            'Mã token xác minh không hợp lệ hoặc đã hết hạn.';
          setMsg(typeof errorDetail === 'string' ? errorDetail : 'Mã token xác minh không hợp lệ hoặc đã hết hạn.');
        });
    } else {
      setStatus('error');
      setMsg('Không tìm thấy mã token xác minh.');
    }
  }, [token]);

  return (
    <div className="py-24 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center px-4 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6">
        
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Đang xác minh địa chỉ Email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Xác minh Thành công!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{msg}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <span>Chuyển tới trang Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Xác minh không thành công</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{msg}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Trở về Trang chủ
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-slate-400">Đang kiểm tra thông tin xác minh...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
