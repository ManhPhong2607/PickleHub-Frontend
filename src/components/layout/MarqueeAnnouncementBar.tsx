'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Flame, Gift, Tag, ChevronRight, X } from 'lucide-react';
import { catalogApi } from '@/lib/api/catalogApi';
import { adminApi, type AdminSiteAnnouncementDto } from '@/lib/api/adminApi';

interface PromotionItem {
  id: string;
  name: string;
  isCurrentlyRunning?: boolean;
}

export const MarqueeAnnouncementBar: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [announcements, setAnnouncements] = useState<AdminSiteAnnouncementDto[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed marquee for current session
    const dismissed = sessionStorage.getItem('pickle_marquee_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // 1. Fetch active announcements from System Service database (Port 5004)
    adminApi.getActiveAnnouncements()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
        }
      })
      .catch(() => {});

    // 2. Fetch active promotions from Catalog Service database (Port 5002)
    catalogApi.getActivePromotions?.()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPromotions(data);
        }
      })
      .catch(() => {});
  }, []);

  if (isDismissed) return null;

  // Build list of active items from database
  const dbAnnouncementItems = announcements.map((a) => ({
    icon: Sparkles,
    iconColor: 'text-yellow-300',
    badge: 'THÔNG BÁO',
    badgeBg: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    text: a.title + (a.content && a.content !== a.title ? ` — ${a.content}` : ''),
    link: a.ctaLink || '/products',
  }));

  const dbPromoItems = promotions.map((p) => ({
    icon: Flame,
    iconColor: 'text-amber-300',
    badge: 'ĐANG DIỄN RA',
    badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    text: `Khuyến mãi: ${p.name} — Xem ngay các sản phẩm ưu đãi!`,
    link: '/products',
  }));

  // Fallback defaults if database has no active announcements yet
  const defaultItems = [
    {
      icon: Flame,
      iconColor: 'text-amber-300',
      badge: 'HOT SALE',
      badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      text: 'Siêu Hội Vợt Pickleball Carbon T700 — Giảm tới 30% cho Vợt & Phụ Kiện',
      link: '/products',
    },
    {
      icon: Zap,
      iconColor: 'text-emerald-300',
      badge: 'FREESHIP',
      badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
      text: 'Miễn phí giao hàng tiêu chuẩn toàn quốc cho đơn hàng từ 1.500.000₫',
      link: '/products',
    },
    {
      icon: Gift,
      iconColor: 'text-rose-300',
      badge: 'QUÀ TẶNG',
      badgeBg: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
      text: 'Tặng 1 Hộp 3 Quả Bóng Dura Fast 40 USAPA khi mua Combo Vợt Pickleball',
      link: '/products',
    },
  ];

  const allItems =
    dbAnnouncementItems.length > 0 || dbPromoItems.length > 0
      ? [...dbAnnouncementItems, ...dbPromoItems]
      : defaultItems;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem('pickle_marquee_dismissed', 'true');
  };

  return (
    <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white text-xs border-b border-emerald-500/20 overflow-hidden select-none z-50 shadow-inner">
      <div className="flex items-center h-9 sm:h-10">
        
        {/* Left fixed brand tag */}
        <div className="hidden md:flex items-center gap-1.5 px-4 bg-emerald-900/60 border-r border-emerald-500/30 h-full shrink-0 font-extrabold text-[11px] uppercase tracking-wider text-emerald-300 backdrop-blur-sm z-10">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>ƯU ĐÃI NỔI BẬT</span>
        </div>

        {/* Running Continuous Marquee Container */}
        <div className="overflow-hidden flex-1 relative flex items-center h-full">
          <div className="animate-marquee-infinite flex items-center py-1">
            {/* Duplicated list 1 for continuous seamless loop */}
            {allItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={`m1-${idx}`}
                  href={item.link}
                  className="inline-flex items-center gap-2.5 mx-6 text-slate-200 hover:text-white transition-colors group cursor-pointer"
                >
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${item.badgeBg}`}>
                    <IconComponent className={`w-3 h-3 mr-1 ${item.iconColor}`} />
                    {item.badge}
                  </span>
                  <span className="font-semibold tracking-wide group-hover:underline">
                    {item.text}
                  </span>
                  <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-slate-600 dark:text-slate-500 mx-2 font-mono">•</span>
                </Link>
              );
            })}

            {/* Duplicated list 2 for continuous seamless loop */}
            {allItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={`m2-${idx}`}
                  href={item.link}
                  className="inline-flex items-center gap-2.5 mx-6 text-slate-200 hover:text-white transition-colors group cursor-pointer"
                >
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${item.badgeBg}`}>
                    <IconComponent className={`w-3 h-3 mr-1 ${item.iconColor}`} />
                    {item.badge}
                  </span>
                  <span className="font-semibold tracking-wide group-hover:underline">
                    {item.text}
                  </span>
                  <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-slate-600 dark:text-slate-500 mx-2 font-mono">•</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 z-10"
          title="Tạm ẩn dòng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
