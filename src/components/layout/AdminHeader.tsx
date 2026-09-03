'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, Layers, ShoppingBag, ArrowLeft, Menu, X,
  PackageCheck, Users, ShieldCheck, Settings, History, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export const AdminHeader: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminNavLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/products', label: 'QL Sản phẩm', icon: Layers },
    { href: '/admin/orders', label: 'QL Đơn hàng', icon: PackageCheck },
    { href: '/admin/customers', label: 'QL Khách hàng', icon: Users },
    { href: '/admin/reviews', label: 'Đánh giá', icon: ShieldCheck },
    { href: '/admin/settings', label: 'Cấu hình & Brand', icon: Settings },
    { href: '/admin/audit-log', label: 'Audit Log', icon: History },
  ];

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 transition-all duration-300 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Admin Portal Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2 cursor-pointer group shrink-0">
            <img
              src="/images/picklehub.png"
              alt="PickleHub Logo"
              className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
              ADMIN PORTAL
            </span>
          </Link>



          {/* Right Admin Action & Back to Customer Store Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Về Cửa hàng</span>
            </Link>

            {/* Admin Avatar & Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs">
                AD
              </div>
              <div className="hidden xl:block text-left text-[11px]">
                <p className="font-bold leading-none text-slate-100">{user?.fullName || 'Administrator'}</p>
                <span className="text-[10px] text-emerald-400 font-medium">{user?.email || 'admin@gmail.com'}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất Admin"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Responsive Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          {adminNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-emerald-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-emerald-400 mt-2 border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về Cửa hàng Khách hàng</span>
          </Link>
        </div>
      )}
    </header>
  );
};
