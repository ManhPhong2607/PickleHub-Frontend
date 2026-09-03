'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Layers, Award, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const SelkirkTechSpotlight: React.FC = () => {
  const techFeatures = [
    {
      title: 'Mặt Carbon Toray T700 Nhám',
      desc: 'Bề mặt sợi carbon T700 với độ nhám tối ưu, sinh ra độ xoáy (Spin) vượt trội và kiểm soát bóng quỹ đạo chuẩn xác.',
      icon: Zap,
    },
    {
      title: 'Lõi Tổ Ong Polypropylene 16mm',
      desc: 'Hấp thụ rung chấn tối đa, mở rộng điểm ngọt (Sweetspot) giúp giảm áp lực cổ tay và tăng độ chính xác ở mỗi cú dink.',
      icon: Layers,
    },
    {
      title: 'Viền Bảo Vệ EdgeSentry™',
      desc: 'Thiết kế viền siêu nhẹ đúc liền khối, chống va đập mặt sân, kéo dài tuổi thọ vợt gấp 3 lần so với vợt thông thường.',
      icon: ShieldCheck,
    },
    {
      title: 'Tay Cầm Cân Bằng Ergonomic',
      desc: 'Cán vợt bọc da đục lỗ thoáng khí, chống trơn trượt mồ hôi và giúp xoay trở linh hoạt trong các pha phòng thủ phản tạt.',
      icon: Award,
    },
  ];

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-14">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tiêu chuẩn thi đấu chuyên nghiệp</span>
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white">
            Công nghệ vợt tiên phong chuẩn Selkirk
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Được nghiên cứu và thử nghiệm cùng các vận động viên Pickleball hàng đầu
          </p>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Feature Column */}
          <div className="lg:col-span-6 space-y-4">
            {techFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/40 transition-colors flex items-start gap-4 backdrop-blur-md group"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Link
                href="/products?category=paddle"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Trải nghiệm vợt công nghệ Selkirk ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Product Image & Specs Card */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative max-w-md w-full p-8 bg-slate-800/70 rounded-2xl border border-slate-700/80 shadow-xl text-center space-y-6">
              <div className="w-full h-80 flex items-center justify-center p-4">
                <img
                  src="/images/paddle.png"
                  alt="Selkirk Technology Paddle"
                  className="max-h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                />
              </div>

              <div className="pt-4 border-t border-slate-700/60 space-y-2">
                <span className="text-xs font-semibold text-emerald-400 block">
                  Pro Series Carbon T700
                </span>
                <h4 className="text-xl font-bold text-white">Vợt Pickleball Cao Cấp Selkirk Tech</h4>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300 pt-2 font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60">Trọng lượng: 221g</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60">Độ dày: 16mm</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-emerald-400 font-semibold">USAPA Approved</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
