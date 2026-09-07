'use client';

import React, { useEffect } from 'react';
import { Download, X, Sparkles, Share2, PlusSquare, Check } from 'lucide-react';
import { usePWAStore } from '@/store/usePWAStore';

export const PWAInstallPrompt: React.FC = () => {
  const {
    showBanner,
    showIOSModal,
    isInstalled,
    init,
    promptInstall,
    dismissBanner,
    setShowIOSModal,
  } = usePWAStore();

  // Initialize PWA event listeners on mount
  useEffect(() => {
    init();
  }, [init]);

  // Auto-dismiss banner after 10 seconds
  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => {
        dismissBanner();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showBanner, dismissBanner]);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. Bottom Install Notification Banner (Auto-dismisses in 10s) */}
      {showBanner && (
        <div
          role="banner"
          aria-label="Cài đặt ứng dụng PickleHub"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-emerald-500/40 text-white shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">Cài đặt ứng dụng</h4>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-300 font-normal">
                Trải nghiệm PickleHub mượt mà hơn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={promptInstall}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-xs active:scale-95"
            >
              Cài đặt
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng thông báo (tự tắt sau 10s)"
              aria-label="Đóng thông báo cài đặt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. iOS Safari Manual Install Instruction Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-slate-900 dark:text-white">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Đóng hướng dẫn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800/60">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">Cài đặt trên iOS / Safari</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Thêm PickleHub vào Màn hình chính trong 3 bước:
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p>
                    Nhấn vào nút <strong className="text-slate-900 dark:text-white">Chia sẻ</strong>{' '}
                    <Share2 className="w-3.5 h-3.5 inline text-emerald-500 mx-0.5" /> ở thanh dưới cùng của Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p>
                    Cuộn xuống danh sách tác vụ và chọn{' '}
                    <strong className="text-slate-900 dark:text-white">&quot;Thêm vào MH chính&quot;</strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-emerald-500 mx-0.5" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p>
                    Nhấn <strong className="text-slate-900 dark:text-white">&quot;Thêm&quot;</strong>{' '}
                    <Check className="w-3.5 h-3.5 inline text-emerald-500 mx-0.5" /> ở góc trên bên phải để hoàn tất.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs active:scale-98"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
