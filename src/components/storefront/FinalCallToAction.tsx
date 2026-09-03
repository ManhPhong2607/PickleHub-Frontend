'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Sparkles, Flame, CheckCircle2 } from 'lucide-react';

export const FinalCallToAction: React.FC = () => {
  return (
    <section className="py-20 bg-slate-950 text-white relative overflow-hidden border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        <div className="space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-tight text-white">
            Sẵn sàng nâng tầm kỹ năng cùng PickleHub
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            Sở hữu các dòng vợt chuẩn thi đấu USAPA cùng phụ kiện chính hãng. Nhận tư vấn chuyên sâu theo thể lực và phong cách chơi của bạn.
          </p>
        </div>

        {/* Benefits Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Hàng chính hãng</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Đổi trả 30 ngày 1-1</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Giao hỏa tốc 2h nội thành</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/products"
            className="px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <span>Khám phá toàn bộ sản phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/products?category=paddle"
            className="px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm border border-slate-700/80 flex items-center gap-2 transition-colors hover:border-emerald-500/50"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Xem vợt bán chạy</span>
          </Link>
        </div>

      </div>
    </section>
  );
};
