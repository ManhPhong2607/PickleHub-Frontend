'use client';

import React, { useEffect, useRef } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

interface HeroBannerProps {
  onExplore: () => void;
  onViewProduct: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore, onViewProduct }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
      tl.from(textRef.current, { y: 40, opacity: 0, delay: 0.1 })
        .from(imageRef.current, { scale: 0.8, opacity: 0, rotate: -15 }, '-=0.6');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl min-h-[380px] flex items-center border border-slate-800"
    >
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="grid md:grid-cols-2 gap-8 items-center p-8 md:p-12 z-10 w-full">
        
        {/* Text Content */}
        <div ref={textRef} className="space-y-4 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Công nghệ Pickleball 2026
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Kỹ thuật chính xác cho <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">từng sân đấu.</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Trang bị dòng vợt PickleHub Carbon Pro cao cấp, bóng đạt chuẩn thi đấu quốc tế và phụ kiện đẳng cấp dành riêng cho cơ thủ chuyên nghiệp.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={onExplore}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Khám phá ngay <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onViewProduct}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-all border border-white/20 backdrop-blur-md"
            >
              Xem sản phẩm HOT ⚡
            </button>
          </div>
        </div>

        {/* Hero Image */}
        <div ref={imageRef} className="relative flex justify-center items-center">
          <div className="w-72 h-72 rounded-full bg-emerald-500/20 absolute blur-3xl animate-pulse" />
          <img
            src="/images/paddle.png"
            alt="Pickleball Paddle Hero"
            className="w-80 h-auto object-contain drop-shadow-[0_20px_40px_rgba(16,185,129,0.3)] transform -rotate-12 hover:rotate-0 transition-all duration-500"
          />
        </div>

      </div>
    </div>
  );
};
