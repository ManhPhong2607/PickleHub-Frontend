'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  MessageSquare,
  Settings,
  HelpCircle,
  ShieldAlert,
  ArrowLeft,
  LogIn,
  LogOut,
  Bell,
  Search,
  Users,
  History,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Warehouse,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout, setAuthModalOpen } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Responsive Sidebar States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // desktop toggle (expanded/collapsed)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // mobile drawer toggle

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Đang xác thực quyền Admin...</span>
        </div>
      </div>
    );
  }

  // Check if user is logged in AND has Admin role
  const isAdmin = user && user.role === 'Admin' && token;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-white">Truy cập bị Từ chối (403)</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trang này dành riêng cho Quản trị viên (Admin). Bạn chưa đăng nhập hoặc tài khoản hiện tại không có quyền truy cập.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                setAuthModalOpen(true, 'login');
                router.push('/');
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập Tài khoản Admin</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trở về Trang chủ Cửa hàng</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Danh mục sản phẩm', href: '/admin/categories', icon: Layers },
    { label: 'Sản phẩm', href: '/admin/products', icon: Package },
    { label: 'Kho', href: '/admin/inventory', icon: Warehouse },
    { label: 'Bài viết / Blog', href: '/admin/posts', icon: BookOpen },
    { label: 'Đơn hàng & Giao vận', href: '/admin/orders', icon: Truck },
    { label: 'Khách hàng', href: '/admin/customers', icon: Users },
    { label: 'Đánh giá', href: '/admin/reviews', icon: MessageSquare },
    { label: 'Cài đặt chung', href: '/admin/settings', icon: Settings },
    { label: 'Nhật ký Audit Log', href: '/admin/audit-log', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex transition-colors">
      
      {/* ------------------------------------------------------------- */}
      {/* MOBILE OVERLAY & BACKDROP                                      */}
      {/* ------------------------------------------------------------- */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION (RESPONSIVE: MOBILE DRAWER + DESKTOP COLLAPSIBLE) */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-3.5 sm:p-5 transition-all duration-300 ease-in-out shadow-sm ${
          // Mobile state
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop state
          isSidebarOpen ? 'lg:w-64' : 'lg:w-[76px]'
        }`}
      >
        <div className="space-y-6">
          
          {/* Brand Admin Title & Toggle Button */}
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} gap-2`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={() => setIsSidebarOpen((v) => !v)}
                className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-emerald-600/30 shrink-0 transition-transform active:scale-95"
                title={isSidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
              >
                P
              </button>
              {isSidebarOpen && (
                <div className="transition-opacity duration-200 truncate">
                  <h1 className="font-display font-extrabold text-base text-slate-900 dark:text-white leading-tight truncate">
                    Quản trị PickleHub
                  </h1>
                  <span className="text-[11px] font-semibold text-slate-400 block">Admin</span>
                </div>
              )}
            </div>

            {/* Desktop toggle collapse button right in sidebar header */}
            {isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="hidden lg:flex p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                title="Thu gọn sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Menu */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === '/admin/dashboard' && pathname === '/admin');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`group relative flex items-center ${
                    isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'
                  } py-2.5 rounded-2xl font-bold text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`} />
                  {isSidebarOpen ? (
                    <span className="truncate">{item.label}</span>
                  ) : (
                    // Hover Tooltip when sidebar is collapsed
                    <span className="fixed left-20 ml-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden lg:block">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Bottom Menu & User Profile */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <nav className="space-y-1">
            <Link
              href="/"
              title="Về Trang chủ Store"
              className={`group relative flex items-center ${
                isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'
              } py-2 rounded-xl font-semibold text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all`}
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              {isSidebarOpen ? (
                <span className="truncate">Về Trang chủ Store</span>
              ) : (
                <span className="fixed left-20 ml-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden lg:block">
                  Về Trang chủ Store
                </span>
              )}
            </Link>
          </nav>

          {/* Admin User Badge & Logout */}
          {isSidebarOpen ? (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {user.email.substring(0, 1).toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    Quản trị viên
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center group relative">
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                title="Đăng xuất tài khoản Admin"
                className="w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Floating Tooltip when collapsed */}
              <span className="fixed left-20 ml-2 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden lg:block">
                Đăng xuất ({user.email})
              </span>
            </div>
          )}

        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA WITH TOP BAR                                  */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 max-w-full transition-all duration-300 ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-[76px]'
        }`}
      >
        
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
              <span className="font-bold text-slate-900 dark:text-white capitalize truncate max-w-[150px] sm:max-w-none">
                {pathname.split('/')[2] || 'Dashboard'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3.5 sm:p-6 lg:p-8 flex-1 min-w-0 max-w-full overflow-x-hidden">{children}</main>

      </div>

    </div>
  );
}
