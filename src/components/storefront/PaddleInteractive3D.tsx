'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Cpu, Zap, Layers, Info } from 'lucide-react';

interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  top: string;
  left: string;
  icon: any;
}

export const PaddleInteractive3D: React.FC = () => {
  const hotspots: Hotspot[] = [
    {
      id: 'surface',
      title: 'Mặt Carbon Toray T700',
      subtitle: 'Mật độ sợi cao',
      description: 'Lớp phủ nhám ma sát nhám cao cấp kết cấu bề mặt nhám gợn sóng sinh ra ma sát tối đa khi cắt bóng spin xoáy xoáy cực hiểm.',
      top: '25%',
      left: '48%',
      icon: Layers,
    },
    {
      id: 'core',
      title: 'Lõi tổ ong Polypropylene 16mm',
      subtitle: 'Kiểm soát & Hấp thụ lực',
      description: 'Cấu trúc màng tổ ong hấp thụ chấn động từ cú đập smashes mạnh nhất, hỗ trợ cảm giác bóng đầm tay tuyệt đối.',
      top: '48%',
      left: '52%',
      icon: Cpu,
    },
    {
      id: 'edge',
      title: 'Khung viền TPU chống dập',
      subtitle: 'Bảo vệ độ bền',
      description: 'Bo viền nhựa đàn hồi chịu va đập mặt sân cứng, gia tăng tuổi thọ sử dụng khi cọ xát với mảng sân.',
      top: '18%',
      left: '72%',
      icon: Shield,
    },
    {
      id: 'grip',
      title: 'Cán đúc Ergonomic Perforated',
      subtitle: 'Thấm hút mồ hôi',
      description: 'Cán cuộn đục lỗ thoáng khí chống trượt tay, chu vi 4.25 inches vừa vặn với mọi cỡ bàn tay người chơi Châu Á.',
      top: '80%',
      left: '50%',
      icon: Zap,
    },
  ];

  const [activeHotspot, setActiveHotspot] = useState<Hotspot>(hotspots[0]);

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      
      {/* Background Lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mô phỏng cấu trúc tương tác</span>
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white">
            Cấu trúc vợt thi đấu cao cấp
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-normal">
            Chạm vào các điểm tương tác để khám phá chi tiết vật liệu công nghệ cao cấu thành nên dòng vợt PickleHub Pro Series
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Interactive Visual Canvas */}
          <div className="lg:col-span-7 relative min-h-[420px] flex items-center justify-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800 backdrop-blur-md">
            
            {/* Main Paddle Image */}
            <div className="relative w-72 sm:w-80 h-96 flex items-center justify-center">
              <img
                src="/images/paddle.png"
                alt="Pickleball Paddle Interactive Inspector"
                className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(16,185,129,0.3)] select-none"
              />

              {/* Hotspot Markers */}
              {hotspots.map((spot) => {
                const isSelected = activeHotspot.id === spot.id;
                return (
                  <button
                    key={spot.id}
                    onClick={() => setActiveHotspot(spot)}
                    style={{ top: spot.top, left: spot.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
                  >
                    <span className="relative flex h-8 w-8 items-center justify-center">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-white'} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-6 w-6 items-center justify-center text-[10px] font-bold transition-all ${isSelected ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-125' : 'bg-white text-slate-900 hover:scale-110'}`}>
                        +
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Detailed Spec Card Column */}
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeHotspot.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-3xl bg-slate-950/90 border border-emerald-500/30 shadow-2xl backdrop-blur-md space-y-4 relative"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <activeHotspot.icon className="w-6 h-6" />
                </div>

                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                    {activeHotspot.subtitle}
                  </span>
                  <h3 className="text-2xl font-bold text-white font-display">
                    {activeHotspot.title}
                  </h3>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed font-normal">
                  {activeHotspot.description}
                </p>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span>Đạt tiêu chuẩn USAPA 2026</span>
                  </span>
                  <span className="font-bold text-emerald-400">Pro Carbon Spec</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Trọng lượng: 7.8 - 8.1 oz</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Độ dài tay cầm: 5.3 inches</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
