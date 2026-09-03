'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Award, Users, Flame, Heart, ArrowRight, Zap, Target, Sparkles, Handshake
} from 'lucide-react';

export default function AboutPage() {
  const partners = [
    {
      name: 'Selkirk Sport',
      logo: '/images/partners/selkirk.png',
      category: 'Vợt thi đấu Mỹ',
      badge: 'Ủy quyền chính hãng',
      desc: 'Thương hiệu vợt Pickleball số 1 thế giới với công nghệ lõi Polymer Honeycomb.',
    },
    {
      name: 'JOOLA Pickleball',
      category: 'Tiêu chuẩn Olympic',
      logo: '/images/partners/joola.png',
      badge: 'Chính hãng 100%',
      desc: 'Thương hiệu thể thao hàng đầu thế giới từ Đức, tài trợ các giải vô địch quốc tế.',
    },
    {
      name: 'Franklin Sports',
      category: 'Bóng thi đấu USAPA',
      logo: '/images/partners/franklin.png',
      badge: 'Đối tác chiến lược',
      desc: 'Nhà cung cấp bóng X-40 chính thức cho hệ thống giải đấu chuyên nghiệp USAPA.',
    },
    {
      name: 'CRBN Pickleball',
      category: 'Carbon T700 Nhám',
      logo: '/images/partners/crbn.png',
      badge: 'Đại lý phân phối',
      desc: 'Dòng vợt sợi Carbon nhám T700 cho khả năng kiểm soát độ xoáy bóng (spin) tối đa.',
    },
    {
      name: 'Cổng thanh toán PayOS',
      category: 'Thanh toán QR tự động',
      logo: '/images/partners/payos.png',
      badge: 'Đối tác Tài chính',
      desc: 'Hệ thống thanh toán tự động xác nhận chuyển khoản ngân hàng trong 5 giây.',
    },
  ];

  // Nhân bản mảng 2 lần để tạo hiệu ứng marquee trượt vô tận không đứt đoạn
  const marqueePartners = [...partners, ...partners];

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Hero Banner Section */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-8 sm:p-14 text-white shadow-xl border border-slate-800">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full inline-block">
              Câu chuyện thương hiệu
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-black leading-tight">
              Tiên phong nâng tầm bộ môn Pickleball tại Việt Nam
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              PickleHub là thương hiệu và nền tảng mua sắm trang thiết bị Pickleball chuyên nghiệp hàng đầu. Chúng tôi cung cấp vợt Carbon T700, bóng thi đấu đạt chuẩn quốc tế và phụ kiện cao cấp dành cho mọi người chơi.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <span>Khám phá sản phẩm</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition-all border border-white/10"
              >
                Liên hệ với chúng tôi
              </Link>
            </div>
          </div>
        </div>

        {/* Stat Counter Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Khách hàng hài lòng', value: '10.000+', icon: Users },
            { label: 'Sản phẩm chính hãng', value: '100%', icon: ShieldCheck },
            { label: 'Đơn hàng hoàn tất', value: '25.000+', icon: Flame },
            { label: 'Đánh giá 5 sao', value: '99.8%', icon: Award },
          ].map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-2 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                  {stat.value}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Core Values Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Tại sao nên chọn mua hàng tại PickleHub?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Công nghệ Vợt Carbon T700',
                desc: 'Tất cả dòng vợt tại PickleHub đều sử dụng sợi Carbon T700 nhập khẩu, tăng diện tích điểm ngọt (Sweetspot) và kiểm soát xoáy tối đa.',
                icon: Zap,
              },
              {
                title: 'Bóng thi đấu chuẩn USAPA',
                desc: 'Dòng bóng đúc 40 lỗ khí động học tối ưu cho điều kiện thời tiết ngoài trời và trong nhà, bền bỉ chống nứt vỡ tối đa.',
                icon: Award,
              },
              {
                title: 'Chính sách bảo hành 1-1',
                desc: 'Cam kết 100% hàng chính hãng, đổi trả trong vòng 30 ngày và bảo hành thân vợt lên đến 12 tháng.',
                icon: ShieldCheck,
              },
            ].map((v, idx) => {
              const IconComponent = v.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{v.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Partners Slider Marquee Section */}
        <div className="space-y-6 pt-4 overflow-hidden">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Thương hiệu & đối tác đồng hành
            </h2>
          </div>

          {/* Infinite Smooth Horizontal Marquee Container */}
          <div className="relative w-full overflow-hidden py-4">
            {/* Left & Right Gradient Fades */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee gap-6 flex items-center">
              {marqueePartners.map((p, idx) => (
                <div
                  key={idx}
                  className="w-72 sm:w-80 shrink-0 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:border-emerald-500 transition-all duration-300 group cursor-pointer"
                >
                  {/* Logo Display Box */}
                  <div className="h-20 w-full rounded-2xl bg-white p-3 flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
                    <img
                      src={p.logo}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {p.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      {p.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
