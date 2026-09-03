'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Tag, Truck, Gift, Sparkles, ArrowRight, ChevronLeft, ChevronRight,
  Flame, Zap, Megaphone
} from 'lucide-react';
import { adminApi, AdminSiteAnnouncementDto } from '@/lib/api/adminApi';
import { catalogApi } from '@/lib/api/catalogApi';

export interface PromoBannerItem {
  id: string;
  badge: string;
  badgeBg: string;
  icon?: any;
  titlePrefix?: string;
  titleHighlight: string;
  titleSuffix?: string;
  description: string;
  highlightText?: string;
  ctaText: string;
  ctaLink: string;
  ctaBg: string;
  cardGradient: string;
  borderColor: string;
  imageUrl?: string | null;
}

function getBannerTheme(index: number, title: string = '') {
  const t = title.toLowerCase();
  if (t.includes('freeship') || t.includes('vận chuyển') || t.includes('giao hàng')) {
    return {
      badge: 'MIỄN PHÍ VẬN CHUYỂN',
      badgeBg: 'bg-amber-500 text-slate-950',
      icon: Truck,
      ctaBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
      cardGradient: 'from-slate-900 via-amber-950/70 to-slate-900',
      borderColor: 'border-amber-500/40',
    };
  }
  if (t.includes('quà') || t.includes('tặng') || t.includes('gift') || t.includes('combo')) {
    return {
      badge: 'QUÀ TẶNG ĐẶC BIỆT',
      badgeBg: 'bg-rose-500 text-white',
      icon: Gift,
      ctaBg: 'bg-rose-500 hover:bg-rose-400 text-white',
      cardGradient: 'from-slate-900 via-rose-950/70 to-slate-900',
      borderColor: 'border-rose-500/40',
    };
  }
  if (t.includes('giảm') || t.includes('%') || t.includes('sale') || t.includes('khuyến mãi') || t.includes('ưu đãi')) {
    return {
      badge: 'ƯU ĐÃI ĐẶC BIỆT',
      badgeBg: 'bg-emerald-500 text-slate-950',
      icon: Tag,
      ctaBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
      cardGradient: 'from-emerald-950/95 via-slate-900 to-emerald-900/80',
      borderColor: 'border-emerald-500/40',
    };
  }
  const themes = [
    {
      badge: 'THÔNG BÁO TỪ SHOP',
      badgeBg: 'bg-emerald-500 text-slate-950',
      icon: Sparkles,
      ctaBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
      cardGradient: 'from-emerald-950/90 via-slate-900 to-emerald-900/70',
      borderColor: 'border-emerald-500/40',
    },
    {
      badge: 'SỰ KIỆN NỔI BẬT',
      badgeBg: 'bg-cyan-500 text-slate-950',
      icon: Zap,
      ctaBg: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
      cardGradient: 'from-slate-900 via-cyan-950/60 to-slate-900',
      borderColor: 'border-cyan-500/40',
    },
    {
      badge: 'TIN TỨC MỚI NHẤT',
      badgeBg: 'bg-purple-500 text-white',
      icon: Flame,
      ctaBg: 'bg-purple-500 hover:bg-purple-400 text-white',
      cardGradient: 'from-slate-900 via-purple-950/60 to-slate-900',
      borderColor: 'border-purple-500/40',
    },
  ];
  return themes[index % themes.length];
}

export const PromoBannerSection: React.FC = () => {
  const [banners, setBanners] = useState<PromoBannerItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Measure container width for responsive carousel
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();

    // Use ResizeObserver for accurate sizing after render
    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateWidth());
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      if (ro) ro.disconnect();
    };
  }, [loaded, banners.length]);

  // Fetch active announcements and active promotions from database
  useEffect(() => {
    Promise.all([
      adminApi.getActiveAnnouncements().catch(() => []),
      catalogApi.getActivePromotions?.().catch(() => []),
    ])
      .then(([annList, promoList]) => {
        const dynamicItems: PromoBannerItem[] = [];

        if (Array.isArray(annList) && annList.length > 0) {
          annList.forEach((ann: AdminSiteAnnouncementDto, idx: number) => {
            const theme = getBannerTheme(idx, ann.title);
            dynamicItems.push({
              id: `db-ann-${ann.id || idx}`,
              badge: theme.badge,
              badgeBg: theme.badgeBg,
              icon: theme.icon,
              titlePrefix: '',
              titleHighlight: ann.title,
              description: ann.content || 'Ưu đãi hấp dẫn đang diễn ra tại PickleHub!',
              ctaText: 'Xem chi tiết',
              ctaLink: ann.ctaLink || '/products',
              ctaBg: theme.ctaBg,
              cardGradient: theme.cardGradient,
              borderColor: theme.borderColor,
              imageUrl: ann.imageUrl || null,
            });
          });
        }

        if (Array.isArray(promoList) && promoList.length > 0) {
          promoList.forEach((p: any, idx: number) => {
            dynamicItems.push({
              id: `db-promo-${p.id || idx}`,
              badge: 'CHIẾN DỊCH KHUYẾN MÃI',
              badgeBg: 'bg-emerald-500 text-slate-950',
              icon: Flame,
              titlePrefix: 'KHUYẾN MÃI: ',
              titleHighlight: p.name,
              description: 'Giá cực sốc cho danh sách sản phẩm chọn lọc hôm nay.',
              ctaText: 'Mua ngay',
              ctaLink: '/products',
              ctaBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
              cardGradient: 'from-emerald-950/90 via-slate-900 to-emerald-900/70',
              borderColor: 'border-emerald-500/40',
              imageUrl: null,
            });
          });
        }

        setBanners(dynamicItems);
        setCurrentIndex(dynamicItems.length > 0 ? dynamicItems.length : 0);
      })
      .catch(() => {
        setBanners([]);
      })
      .finally(() => {
        setLoaded(true);
      });
  }, []);

  const numItems = banners.length;

  // Seamless 3x cloned array for smooth infinite continuous sliding
  const infiniteSlides = numItems > 1 ? [...banners, ...banners, ...banners] : banners;

  // Geometry calculation
  const GAP = 16;
  const isMobile = containerWidth < 768;
  const visibleCards = isMobile || numItems === 1 ? 1 : 2;
  const cardWidth = (containerWidth - (visibleCards - 1) * GAP) / visibleCards;

  const handlePrev = () => {
    if (numItems <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (numItems <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // Seamless jump when crossing set boundaries
  const handleTransitionEnd = () => {
    if (numItems <= 1) return;
    if (currentIndex >= numItems * 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - numItems);
    } else if (currentIndex < numItems) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + numItems);
    }
  };

  // 5-second Auto Slide timer (only when >= 2 banners)
  useEffect(() => {
    if (isPaused || numItems <= 1) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isPaused, numItems, currentIndex]);

  const activeDotIndex = numItems > 0 ? ((currentIndex % numItems) + numItems) % numItems : 0;

  // If loaded and there are 0 active announcements in DB, do not render banner
  if (loaded && numItems === 0) {
    return null;
  }

  // Initial loading placeholder
  if (!loaded && numItems === 0) {
    return null;
  }

  return (
    <section
      className="py-8 bg-slate-900 border-y border-slate-800 text-white relative overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-4">
        
        {/* Top Section Header & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Ưu đãi & sự kiện đang diễn ra
            </span>
          </div>

          {/* Navigation Arrows (shown when > 1 banner) */}
          {numItems > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm cursor-pointer"
                title="Lướt sang banner trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm cursor-pointer"
                title="Lướt sang banner tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Viewport Container */}
        <div ref={containerRef} className="w-full overflow-hidden rounded-2xl">
          <div
            className="flex items-stretch"
            onTransitionEnd={handleTransitionEnd}
            style={{
              gap: `${GAP}px`,
              transform: numItems > 1 ? `translateX(-${currentIndex * (cardWidth + GAP)}px)` : 'none',
              transition: isTransitioning && numItems > 1 ? 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            }}
          >
            {infiniteSlides.map((item, idx) => {
              const IconComponent = item.icon || Tag;
              const hasImage = !!item.imageUrl;

              return (
                <div
                  key={`banner-slide-${idx}`}
                  style={{
                    width: `${cardWidth}px`,
                    minWidth: `${cardWidth}px`,
                    flexShrink: 0,
                  }}
                  className={`p-6 rounded-2xl bg-gradient-to-r ${item.cardGradient} border ${item.borderColor} shadow-md flex flex-col justify-between relative overflow-hidden group min-h-[175px] transition-all`}
                >
                  {/* Optional Background / Side Image with Gradient Overlay */}
                  {hasImage && (
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 sm:w-2/5 overflow-hidden pointer-events-none opacity-35 sm:opacity-50 group-hover:opacity-75 transition-opacity duration-300">
                      <img
                        src={item.imageUrl!}
                        alt={item.titleHighlight}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as any).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Top: Badge */}
                  <div className="flex items-center justify-between z-10">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full ${item.badgeBg} font-bold text-[11px] shadow-xs`}>
                      <IconComponent className="w-3 h-3" />
                      <span>{item.badge}</span>
                    </span>
                  </div>

                  {/* Middle: Content */}
                  <div className="space-y-1.5 my-2 z-10 max-w-[85%]">
                    <h3 className="text-lg sm:text-xl font-bold font-display text-white leading-tight">
                      {item.titlePrefix}
                      <span className="text-emerald-400">{item.titleHighlight}</span>
                      {item.titleSuffix}
                    </h3>
                    <p className="text-xs text-slate-300 font-normal line-clamp-2">
                      {item.description}
                      {item.highlightText && (
                        <strong className="text-amber-400 font-mono ml-1">{item.highlightText}</strong>
                      )}
                    </p>
                  </div>

                  {/* Bottom: Action CTA */}
                  <div className="z-10 pt-1 flex items-center justify-between">
                    <Link
                      href={item.ctaLink}
                      className={`px-4 py-2 ${item.ctaBg} font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:brightness-110 active:opacity-90`}
                    >
                      <span>{item.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Pagination Dots (when > 1 banner) */}
        {numItems > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {banners.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(numItems + idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeDotIndex
                    ? 'w-6 bg-emerald-400'
                    : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Chuyển tới banner ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
