'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, ShoppingCart, Heart, Bell, User, LogOut, ShieldAlert,
  ChevronDown, Menu, X, ArrowRight, Sparkles, SlidersHorizontal
} from 'lucide-react';

import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotiHovered, setIsNotiHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { getTotalItems, setIsOpen: setIsCartOpen, loadCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, token, logout, isAuthModalOpen, setAuthModalOpen } = useAuthStore();
  const { notifications, unreadCount, markAllRead, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    setMounted(true);
    loadCart();
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/products', label: 'Sản phẩm' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About us' },
    { href: '/contact', label: 'Liên hệ' },
  ];

  // Lấy tối đa 3-4 thông báo mới nhất khi rà chuột
  const latestNotifications = notifications.slice(0, 4);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative">
                <img
                  src="/images/picklehub.png"
                  alt="PickleHub Logo"
                  className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white hidden sm:inline-block">
                Pickle<span className="text-emerald-500">Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-xs font-semibold">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Search, Notifications, Cart, Auth */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Search Toggle / Input */}
              <div className="relative">
                {isSearchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center animate-in fade-in zoom-in-95 duration-200">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm sản phẩm..."
                      autoFocus
                      className="w-48 sm:w-64 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-emerald-500 rounded-xl text-xs outline-none text-slate-900 dark:text-white font-medium pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    title="Tìm kiếm"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Notification Popover Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsNotiHovered(true)}
                onMouseLeave={() => setIsNotiHovered(false)}
              >
                <button
                  onClick={() => router.push('/notifications')}
                  className="p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
                  title="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {mounted && unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Popover on Hover */}
                {isNotiHovered && (
                  <div className="absolute right-0 mt-1 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Thông báo mới nhất</h4>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Realtime</span>
                      </div>
                      <button onClick={markAllRead} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                        Đánh dấu đã đọc
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {latestNotifications.length > 0 ? (
                        latestNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setIsNotiHovered(false);
                              if (n.action && (n.action.startsWith('/') || n.action.startsWith('http'))) {
                                router.push(n.action);
                              } else {
                                router.push('/notifications');
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 cursor-pointer ${
                              n.isRead ? 'opacity-60' : 'bg-emerald-50/30 dark:bg-emerald-950/20'
                            }`}
                          >
                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                            <div className="flex-1 text-xs">
                              <h5 className="font-bold text-slate-900 dark:text-white">{n.title}</h5>
                              <p className="text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{n.content}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                                {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="p-6 text-center text-xs text-slate-400">Không có thông báo nào</p>
                      )}
                    </div>

                    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setIsNotiHovered(false)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>Xem tất cả thông báo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 sm:px-3 sm:py-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm active:scale-95"
              >
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline font-semibold text-xs">Giỏ hàng</span>
                <span className="w-5 h-5 bg-emerald-600 text-white font-bold text-xs flex items-center justify-center rounded-full">
                  {mounted ? getTotalItems() : 0}
                </span>
              </button>

              {/* User Profile / Login */}
              {user ? (
                <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2">
                  {user.role === 'Admin' ? (
                    <Link
                      href="/admin/dashboard"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border border-slate-700"
                    >
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  ) : (
                    <Link
                      href="/profile"
                      className="p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2"
                    >
                      <User className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold hidden sm:inline">{user.fullName || user.email}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-700 dark:text-slate-200 lg:hidden rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

            </div>

          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Slide-out Cart Drawer Component */}
      <CartDrawer />

      {/* Global Auth Modal Component */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
