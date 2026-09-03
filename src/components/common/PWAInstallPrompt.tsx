'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker in browser environment
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for updates on load
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] Phiên bản mới đã sẵn sàng.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.error('[PWA Register Error]:', err);
          });
      });
    }

    // 2. Check if already installed as standalone app
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // 3. Listen for PWA install eligibility
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user previously dismissed prompt in this session
      const dismissed = sessionStorage.getItem('picklehub_pwa_dismissed');
      if (!dismissed) {
        // Delay display by 2.5 seconds for a pleasant initial browsing experience
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('[PWA Install Error]:', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('picklehub_pwa_dismissed', 'true');
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
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
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-xs"
        >
          Cài đặt
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Đóng thông báo"
          aria-label="Đóng thông báo cài đặt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
