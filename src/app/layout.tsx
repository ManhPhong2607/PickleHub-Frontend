import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'PickleHub — Nền Tảng Dụng Cụ Pickleball Chuyên Nghiệp Hàng Đầu Việt Nam',
  description: 'Chuyên cung cấp vợt pickleball sợi Carbon Toray T700, bóng thi đấu USAPA, túi thể thao chống nước và phụ kiện cao cấp chính hãng.',
  keywords: ['pickleball', 'vợt pickleball', 'carbon T700', 'bóng pickleball', 'selkirk', 'vulcan aura', 'picklehub', 'pwa'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PickleHub',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'PickleHub — Nền Tảng Dụng Cụ Pickleball Chuyên Nghiệp',
    description: 'Mua sắm vợt pickleball Carbon T700, bóng USAPA chính hãng với giá tốt nhất.',
    images: ['/images/picklehub.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
