'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight, Award, Flame, Star } from 'lucide-react';
import { catalogApi } from '@/lib/api/catalogApi';
import type { Product } from '@/types';

interface ParallaxHeroProps {
  initialProduct?: Product | null;
}

export const ParallaxHero: React.FC<ParallaxHeroProps> = ({ initialProduct }) => {
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const paddleY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const paddleRotate = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    if (!initialProduct) {
      catalogApi.getBestSellingProduct().then(setProduct).catch((err) => {
        console.warn('[ParallaxHero] Error loading best selling product:', err);
      });
    }
  }, [initialProduct]);

  // Default product fallback for graceful UI rendering
  const currentProduct: Product = product || {
    id: '1',
    name: 'Pro Series Carbon T700',
    category: 'paddle',
    categoryName: 'Vợt Carbon',
    brandName: 'PickleHub Pro',
    brand: 'PickleHub Pro',
    price: 3250000,
    oldPrice: 3800000,
    soldCount: 142,
    rating: 4.8,
    reviewsCount: 45,
    image: '/images/paddle.png',
    badge: 'Bán chạy nhất',
    description:
      'Trải nghiệm dòng vợt công nghệ lõi tổ ong Polypropylene 16mm kết hợp mặt Carbon Toray T700 mật độ cao mang lại lực xoáy Spin chuẩn xác và kiểm soát bóng tối đa.',
    specs: {
      'Chất liệu mặt': 'Carbon T700',
      'Độ dày lõi': '16mm',
      'Chứng nhận USAPA': '100% Chuẩn thi đấu',
    },
    stock: 20,
  };

  // Helper to extract 3 dynamic stats from product specs / attributes
  const getDynamicStats = (p: Product) => {
    const specs = p.specs || {};
    const entries = Object.entries(specs);

    if (entries.length >= 3) {
      return entries.slice(0, 3).map(([key, val], idx) => {
        let cleanVal = String(val).replace(/^(Trung bình\s*\(|\))/gi, '');
        if (cleanVal.length > 22) cleanVal = cleanVal.substring(0, 20) + '...';
        return {
          val: cleanVal,
          label: key,
          color: idx === 0 ? 'text-white' : idx === 1 ? 'text-emerald-400' : 'text-amber-400',
        };
      });
    }

    return [
      {
        val: specs['Chất liệu mặt'] || specs['Chất liệu'] || p.brandName || 'Carbon T700',
        label: specs['Chất liệu mặt'] || specs['Chất liệu'] ? 'Chất liệu cao cấp' : 'Thương hiệu',
        color: 'text-white',
      },
      {
        val: specs['Độ dày lõi'] || specs['Độ dày'] || (p.rating ? `${p.rating} ★` : '16mm'),
        label: specs['Độ dày lõi'] || specs['Độ dày'] ? 'Lõi tổ ong kiểm soát' : `${p.reviewsCount || 28}+ Đánh giá`,
        color: 'text-emerald-400',
      },
      {
        val: specs['Chứng nhận USAPA'] || specs['Trọng lượng'] || '100%',
        label: 'Chuẩn thi đấu USAPA',
        color: 'text-amber-400',
      },
    ];
  };

  const dynamicStats = getDynamicStats(currentProduct);

  // Dynamic category destination link
  const categoryHref = currentProduct.category
    ? `/products?category=${currentProduct.category}`
    : '/products';

  return (
    <div
      ref={containerRef}
      className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden pt-12 pb-20 bg-slate-950 text-white"
    >
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[100px]" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Text Column */}
          <motion.div style={{ y: textY, opacity }} className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Badge (Dynamic: Sold Count or Category/Brand Badge) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {currentProduct.soldCount && currentProduct.soldCount > 0
                  ? 'Sản phẩm bán chạy nổi bật'
                  : (currentProduct.categoryName ? `Bộ sưu tập ${currentProduct.categoryName}` : 'Trang bị Pickleball chính hãng')}
              </span>
            </motion.div>

            {/* Headline (Dynamic: Product Name with Clean Contrast) */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.14]"
            >
              <span className="text-slate-300 text-base sm:text-xl lg:text-2xl block font-medium mb-1">
                {currentProduct.brandName || 'PickleHub Pro'}
              </span>
              <span className="text-white block font-black">
                {currentProduct.name}
              </span>
              <span className="text-emerald-400 text-base sm:text-xl lg:text-2xl block font-bold tracking-normal mt-2">
                Chinh phục mọi trận đấu đỉnh cao
              </span>
            </motion.h1>

            {/* Subtitle / Description (Dynamic) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-200 text-sm sm:text-base max-w-xl font-normal leading-relaxed"
            >
              {currentProduct.description ||
                'Trải nghiệm dòng sản phẩm chính hãng đạt tiêu chuẩn thi đấu quốc tế, tối ưu hóa sức mạnh và độ kiểm soát chuẩn xác.'}
            </motion.p>

            {/* Action Buttons (Dynamic CTA) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href={categoryHref}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{`Khám phá ${currentProduct.categoryName || 'sản phẩm'} ngay`}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/products/${currentProduct.slug || currentProduct.id}`}
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700/80 backdrop-blur-md flex items-center gap-2 transition-all hover:border-emerald-500/50"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>
                  Xem chi tiết ({currentProduct.price ? `${currentProduct.price.toLocaleString('vi-VN')} ₫` : 'Giá tốt'})
                </span>
              </Link>
            </motion.div>

            {/* Live Stats (Dynamic Specs) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg"
            >
              {dynamicStats.map((st, i) => (
                <div key={i}>
                  <span className={`text-xl sm:text-2xl font-extrabold font-display block ${st.color}`}>
                    {st.val}
                  </span>
                  <span className="text-xs text-slate-400 truncate block">{st.label}</span>
                </div>
              ))}
            </motion.div>

          </motion.div>

          {/* Right Floating Product Parallax Showcase */}
          <motion.div
            style={{ y: paddleY, rotate: paddleRotate }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-72 sm:w-96 lg:w-[420px] aspect-square flex items-center justify-center">
              
              {/* Glowing Outer Halo Ring */}
              <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-spin" style={{ animationDuration: '25s' }} />
              <div className="absolute inset-6 rounded-full border border-dashed border-cyan-500/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
              
              {/* Product Hero Image (Dynamic) */}
              <motion.img
                key={currentProduct.image}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                src={currentProduct.image || '/images/paddle.png'}
                alt={currentProduct.name}
                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(16,185,129,0.35)] animate-float-slow relative z-10"
              />

              {/* Floating Feature Floating Badges */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute top-4 right-0 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-3 rounded-2xl shadow-xl flex items-center gap-3 z-20"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block">Đánh giá thực tế</span>
                  <span className="text-xs font-bold text-white">
                    {currentProduct.rating || 5.0} ★ ({currentProduct.reviewsCount || 0} lượt)
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute bottom-6 left-0 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-3 rounded-2xl shadow-xl flex items-center gap-3 z-20"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block">
                    {currentProduct.brandName || 'PickleHub'}
                  </span>
                  <span className="text-xs font-bold text-white">Chuẩn USAPA 100%</span>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
