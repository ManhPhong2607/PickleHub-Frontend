'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight, KeyRound, ShieldAlert } from 'lucide-react';
import { authApi } from '@/lib/api/authApi';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setStatus('error');
      setErrorMsg('Mã token đặt lại mật khẩu không hợp lệ hoặc đã thiếu.');
      return;
    }

    if (newPassword.length < 6) {
      setStatus('error');
      setErrorMsg('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const resMsg = await authApi.resetPassword({
        token,
        newPassword,
      });
      setStatus('success');
      setSuccessMsg(resMsg || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
    } catch (err: any) {
      setStatus('error');
      const detail =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.response?.data ||
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
      setErrorMsg(typeof detail === 'string' ? detail : 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 sm:p-10 relative overflow-hidden">
        
        {/* Background gradient decorative element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {status === 'success' ? (
          <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
              Đặt lại mật khẩu thành công!
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
              {successMsg}
            </p>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Về trang chủ đăng nhập</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/50">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Tạo mật khẩu mới
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                Vui lòng nhập mật khẩu mới cho tài khoản của bạn
              </p>
            </div>

            {/* Global Error Banner */}
            {status === 'error' && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm animate-in fade-in duration-200">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Lock-in Email Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Email tài khoản (Đã khóa)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={initialEmail || 'Email xác thực từ hệ thống'}
                    disabled
                    readOnly
                    className="w-full pl-11 pr-24 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-medium text-sm cursor-not-allowed shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                      <Lock className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập ít nhất 6 ký tự..."
                    required
                    className="w-full pl-11 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    className="w-full pl-11 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Cập nhật mật khẩu mới</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
