'use client';

import React from 'react';
import { Star, Trophy, Quote, CheckCircle2, Sparkles } from 'lucide-react';

export const ProPlayerShowcase: React.FC = () => {
  const testimonials = [
    {
      name: 'Tyson McGuffin',
      role: 'Tay vợt Top 1 Thế giới (Selkirk Pro)',
      image: '/images/players/tyson.png',
      quote: 'Dòng vợt Pro Series Carbon T700 tại PickleHub mang lại độ kiểm soát và cảm giác bóng chính xác từng centimet ở mọi tình huống thi đấu đỉnh cao.',
      rating: 5,
      badge: 'Selkirk Pro Player',
    },
    {
      name: 'Catherine Parenteau',
      role: 'Nhà vô địch Pickleball Chuyên nghiệp',
      image: '/images/players/catherine.png',
      quote: 'Điểm ngọt rộng cùng công nghệ lõi tổ ong 16mm giúp triệt tiêu độ rung, hỗ trợ xoay trở phản tạt cực nhanh trên lưới.',
      rating: 5,
      badge: 'Gold Medalist',
    },
    {
      name: 'Nguyễn Anh Thắng',
      role: 'Vận Động Viên Pickleball Việt Nam',
      image: '/images/players/thang.jpg',
      quote: 'PickleHub giao hàng rất nhanh, 100% sản phẩm chính hãng có tem kiểm định USAPA. Tôi hoàn toàn tin tưởng chọn thiết bị thi đấu tại đây.',
      rating: 5,
      badge: 'VĐV Chuyên Nghiệp',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            Được tin dùng bởi các tay vợt hàng đầu
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Trải nghiệm thực tế từ các vận động viên chuyên nghiệp và huấn luyện viên
          </p>
        </div>

        {/* Player Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="relative h-[420px] rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800 group cursor-pointer bg-slate-900"
            >
              {/* Default Full Player Photo Background */}
              <img
                src={t.image}
                alt={t.name}
                className="w-full h-full object-cover object-top transition-transform duration-500"
              />

              {/* Bottom Gradient Overlay for Default View */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />

              {/* Default Floating Label at Bottom */}
              <div className="absolute bottom-6 left-6 right-6 z-10 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-4">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-bold mb-2 inline-block shadow-xs">
                  {t.badge}
                </span>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-1.5">
                  <span>{t.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-300 font-normal mt-0.5">{t.role}</p>
              </div>

              {/* Hover Full Card Review Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-emerald-950/95 backdrop-blur-md p-8 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 text-white translate-y-4 group-hover:translate-y-0">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                      {t.badge}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                  </div>

                  <Quote className="w-8 h-8 text-emerald-400 opacity-60" />

                  <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed font-medium">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>{t.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </h4>
                    <span className="text-[11px] text-slate-400 font-semibold">{t.role}</span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
