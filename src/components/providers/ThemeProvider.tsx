'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || '');
      const stack = event.reason?.stack || '';
      if (
        reason.includes('M_ID') ||
        reason.includes('200.js') ||
        stack.includes('200.js') ||
        reason.includes('bis_skin_checked')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      const filename = event.filename || '';
      if (
        msg.includes('M_ID') ||
        filename.includes('200.js') ||
        msg.includes('bis_skin_checked')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
