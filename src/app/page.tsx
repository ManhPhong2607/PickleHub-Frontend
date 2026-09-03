'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame, ShieldCheck, Star, Award, Layers, CheckCircle2, Trophy, Truck, RefreshCw, Headphones, Zap, ArrowRight, Tag, Gift
} from 'lucide-react';
import { ParallaxHero } from '@/components/storefront/ParallaxHero';
import { CategoryQuickAccess } from '@/components/storefront/CategoryQuickAccess';
import { PromoBannerSection } from '@/components/storefront/PromoBannerSection';
import { BestSellerCarousel } from '@/components/storefront/BestSellerCarousel';
import { SelkirkTechSpotlight } from '@/components/storefront/SelkirkTechSpotlight';
import { ProPlayerShowcase } from '@/components/storefront/ProPlayerShowcase';
import { SocialProofReviews } from '@/components/storefront/SocialProofReviews';
import { BlogSection } from '@/components/storefront/BlogSection';
import { FinalCallToAction } from '@/components/storefront/FinalCallToAction';

export default function HomePage() {
  return (
    <div className="space-y-0">
      
      {/* 1. HERO BANNER CHÍNH (PARALLAX HERO) */}
      <ParallaxHero />

      {/* 2. PROMOTION / BANNER VOUCHER (GIẢM 10% / FREESHIP > 500K) */}
      <PromoBannerSection />

      {/* 3. CATEGORY QUICK ACCESS (DANH MỤC TRUY CẬP NHANH CARD) */}
      <CategoryQuickAccess />

      {/* 4. VALUE PROPOSITION / WHY PICKLEHUB (THANH CAM KẾT TRỤ CỘT NĂNG LỰC) */}
      <section className="bg-slate-900 border-y border-slate-800 py-10 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Sản phẩm chính hãng</h4>
                <p className="text-slate-400 text-[11px]">Cam kết đền 200% nếu giả</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Giao nhanh hỏa tốc 2h</h4>
                <p className="text-slate-400 text-[11px]">Nội thành HN & TP.HCM</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Đổi trả dễ dàng 30 ngày</h4>
                <p className="text-slate-400 text-[11px]">Đổi mới 1-1 lỗi NSX</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Hỗ trợ tư vấn 24/7</h4>
                <p className="text-slate-400 text-[11px]">Hotline: 090 123 4567</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. BEST SELLER / HOT PRODUCTS (SẢN PHẨM BÁN CHẠY THEO TỪNG DANH MỤC - 4 SẢN PHẨM 1 HÀNG SLIDER TRƯỢT SELKIRK STYLE) */}
      <BestSellerCarousel />

      {/* 6. SELKIRK TECH SPOTLIGHT (TÍNH NĂNG CÔNG NGHỆ CHẤT LƯỢNG) */}
      <SelkirkTechSpotlight />

      {/* 7. SOCIAL PROOF (ĐÁNH GIÁ THỰC TẾ & REVIEW KHÁCH HÀNG / VĐV PRO) */}
      <SocialProofReviews />

      {/* 8. VĐV PRO SHOWCASE (TESTIMONIALS TỪ TAY VỢT TOP 1) */}
      <ProPlayerShowcase />

      {/* 9. BLOG / CONTENT ( HƯỚNG DẪN CHỌN VỢT & MẸO THI ĐẤU) */}
      <BlogSection />

      {/* 10. CTA CUỐI TRANG (ÉP USER HÀNH ĐỘNG MUA HÀNG NGAY) */}
      <FinalCallToAction />

    </div>
  );
}
