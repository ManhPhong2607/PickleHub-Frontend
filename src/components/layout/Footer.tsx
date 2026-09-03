'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 pt-16 pb-12 transition-colors">
      
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-xs">
        
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <img src="/images/picklehub.png" alt="PickleHub" className="h-8 w-auto" />
            <span className="font-display font-extrabold text-xl text-white">
              Pickle<span className="text-emerald-400">Hub</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            Nền tảng mua sắm dụng cụ Pickleball chuyên nghiệp hàng đầu Việt Nam. Cung cấp các dòng vợt sợi Carbon Toray T700, bóng tiêu chuẩn USAPA, túi thể thao và phụ kiện thi đấu đỉnh cao.
          </p>

          <div className="space-y-2 pt-2 text-slate-300">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Hotline: 1900 6868 - 090 123 4567</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>support@picklehub.vn</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-white">Danh mục</h4>
          <ul className="space-y-2 text-slate-400 font-medium">
            <li><Link href="/products?category=paddle" className="hover:text-emerald-400 transition-colors">Vợt Pickleball</Link></li>
            <li><Link href="/products?category=balls" className="hover:text-emerald-400 transition-colors">Bóng thi đấu USAPA</Link></li>
            <li><Link href="/products?category=bag" className="hover:text-emerald-400 transition-colors">Túi & Balo Chống nước</Link></li>
            <li><Link href="/products?category=net" className="hover:text-emerald-400 transition-colors">Lưới di động 6.7m</Link></li>
            <li><Link href="/products?category=apparel" className="hover:text-emerald-400 transition-colors">Trang phục Pickleball</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-white">Hỗ trợ khách hàng</h4>
          <ul className="space-y-2 text-slate-400 font-medium">
            <li><Link href="/orders" className="hover:text-emerald-400 transition-colors">Theo dõi đơn hàng</Link></li>
            <li><Link href="/profile" className="hover:text-emerald-400 transition-colors">Sổ địa chỉ giao hàng</Link></li>
            <li><Link href="/wishlist" className="hover:text-emerald-400 transition-colors">Sản phẩm đã lưu</Link></li>
            <li><Link href="/verify-email" className="hover:text-emerald-400 transition-colors">Xác minh email</Link></li>
          </ul>
        </div>

        {/* Newsletter Subscription */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-white">Đăng ký nhận ưu đãi</h4>
          <p className="text-slate-400 text-xs">Nhận thông báo khi có sản phẩm mới và mã giảm giá VIP 10%.</p>

          <form onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã đăng ký nhận tin từ PickleHub!'); }} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                required
                placeholder="Nhập email của bạn..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 text-white"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Payment Method Badges */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Thanh toán an toàn</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-emerald-400">PayOS QR</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-blue-400">COD (Tiền mặt)</span>
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">Nội địa / Visa</span>
            </div>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 PickleHub. Tất cả quyền được bảo lưu</p>
      </div>

    </footer>
  );
};
