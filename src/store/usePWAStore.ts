'use client';

import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showBanner: boolean;
  showIOSModal: boolean;
  isInitialized: boolean;

  init: () => void;
  promptInstall: () => Promise<void>;
  dismissBanner: () => void;
  setShowIOSModal: (show: boolean) => void;
}

export const usePWAStore = create<PWAState>((set, get) => ({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  showBanner: false,
  showIOSModal: false,
  isInitialized: false,

  init: () => {
    if (typeof window === 'undefined' || get().isInitialized) return;
    set({ isInitialized: true });

    // 1. Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      set({ isInstalled: true, isInstallable: false, showBanner: false });
      return;
    }

    // 2. Detect iOS device (Safari on iOS doesn't support beforeinstallprompt)
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;

    if (isIOSDevice) {
      set({ isIOS: true, isInstallable: true });
    }

    // 3. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 4. Capture beforeinstallprompt (Chromium, Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      
      set({
        deferredPrompt: promptEvent,
        isInstallable: true,
      });

      // Show bottom banner after 2.5s if not previously dismissed in this session
      const isDismissed = sessionStorage.getItem('picklehub_pwa_banner_dismissed');
      if (!isDismissed) {
        setTimeout(() => {
          // Re-check installed status before showing
          if (!get().isInstalled) {
            set({ showBanner: true });
          }
        }, 2500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Handle app installed event
    const handleAppInstalled = () => {
      set({
        isInstalled: true,
        isInstallable: false,
        showBanner: false,
        deferredPrompt: null,
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);
  },

  promptInstall: async () => {
    const { deferredPrompt, isIOS } = get();

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          set({
            isInstalled: true,
            isInstallable: false,
            showBanner: false,
            deferredPrompt: null,
          });
        }
      } catch (err) {
        console.error('[PWA Install Error]:', err);
      }
    } else if (isIOS) {
      set({ showIOSModal: true });
    }
  },

  dismissBanner: () => {
    set({ showBanner: false });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('picklehub_pwa_banner_dismissed', 'true');
    }
  },

  setShowIOSModal: (show: boolean) => {
    set({ showIOSModal: show });
  },
}));
