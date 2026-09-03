'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Award, Layers, Sparkles, Shirt, Tag, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { catalogApi } from '@/lib/api/catalogApi';

interface CategorySlideItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
}

const FALLBACK_CATEGORY_DATA: Record<string, { image: string; desc: string; icon: React.ReactNode; filterKey: string }> = {
  'vot-pickleball': {
    image: '/images/paddle.png',
    desc: 'Lõi tổ ong Polypropylene 16mm kết hợp mặt Carbon Toray T700 chuẩn USAPA giúp kiểm soát bóng tối đa và tạo xoáy cực căng.',
    icon: <Zap className="w-5 h-5" />,
    filterKey: 'paddle',
  },
  'paddle': {
    image: '/images/paddle.png',
    desc: 'Lõi tổ ong Polypropylene 16mm kết hợp mặt Carbon Toray T700 chuẩn USAPA giúp kiểm soát bóng tối đa và tạo xoáy cực căng.',
    icon: <Zap className="w-5 h-5" />,
    filterKey: 'paddle',
  },
  'bong-thi-dau': {
    image: '/images/balls.png',
    desc: 'Cấu trúc đúc nguyên khối chống móp vỡ, thiết kế 40 lỗ chuẩn ngoài trời giúp đường bóng bay chuẩn xác 100%.',
    icon: <Award className="w-5 h-5" />,
    filterKey: 'balls',
  },
  'balls': {
    image: '/images/balls.png',
    desc: 'Cấu trúc đúc nguyên khối chống móp vỡ, thiết kế 40 lỗ chuẩn ngoài trời giúp đường bóng bay chuẩn xác 100%.',
    icon: <Award className="w-5 h-5" />,
    filterKey: 'balls',
  },
  'giay-the-thao': {
    image: '/images/paddle.png',
    desc: 'Đế cao su Non-Marking ma sát cao, đệm khí EVA êm ái hỗ trợ đổi hướng tức thì và bảo vệ khớp cổ chân.',
    icon: <Sparkles className="w-5 h-5" />,
    filterKey: 'shoes',
  },
  'shoes': {
    image: '/images/paddle.png',
    desc: 'Đế cao su Non-Marking ma sát cao, đệm khí EVA êm ái hỗ trợ đổi hướng tức thì và bảo vệ khớp cổ chân.',
    icon: <Sparkles className="w-5 h-5" />,
    filterKey: 'shoes',
  },
  'tui-balo': {
    image: '/images/bag.png',
    desc: 'Thiết kế ngăn cách nhiệt chuyên dụng chứa đến 4 cây vợt cùng ngăn riêng đựng giày thoáng khí chống mồ hôi.',
    icon: <Layers className="w-5 h-5" />,
    filterKey: 'bag',
  },
  'bag': {
    image: '/images/bag.png',
    desc: 'Thiết kế ngăn cách nhiệt chuyên dụng chứa đến 4 cây vợt cùng ngăn riêng đựng giày thoáng khí chống mồ hôi.',
    icon: <Layers className="w-5 h-5" />,
    filterKey: 'bag',
  },
  'quan-ao': {
    image: '/images/paddle.png',
    desc: 'Chất liệu vải thể thao Quick-Dry co giãn 4 chiều, siêu nhẹ, kháng khuẩn và thoáng khí tối ưu cho vận động viên.',
    icon: <Shirt className="w-5 h-5" />,
    filterKey: 'apparel',
  },
  'apparel': {
    image: '/images/paddle.png',
    desc: 'Chất liệu vải thể thao Quick-Dry co giãn 4 chiều, siêu nhẹ, kháng khuẩn và thoáng khí tối ưu cho vận động viên.',
    icon: <Shirt className="w-5 h-5" />,
    filterKey: 'apparel',
  },
  'luoi-phu-kien': {
    image: '/images/net.png',
    desc: 'Khung thép sơn tĩnh điện gấp gọn 6.7m tiêu chuẩn quốc tế, kèm băng quấn cán da đục lỗ và viền bảo vệ vợt chống trầy.',
    icon: <Tag className="w-5 h-5" />,
    filterKey: 'accessories',
  },
  'phu-kien': {
    image: '/images/net.png',
    desc: 'Phụ kiện thi đấu cao cấp: quấn cán, băng bảo vệ viền, chì dán trọng lượng và dụng cụ làm sạch mặt vợt.',
    icon: <Tag className="w-5 h-5" />,
    filterKey: 'accessories',
  },
  'accessories': {
    image: '/images/net.png',
    desc: 'Khung thép sơn tĩnh điện gấp gọn 6.7m tiêu chuẩn quốc tế, kèm băng quấn cán da đục lỗ và viền bảo vệ vợt chống trầy.',
    icon: <Tag className="w-5 h-5" />,
    filterKey: 'accessories',
  },
};

function getCategoryMeta(slug: string, name: string) {
  const normalizedSlug = (slug || '').toLowerCase().replace(/\s+/g, '-');
  const normalizedName = (name || '').toLowerCase();

  if (FALLBACK_CATEGORY_DATA[normalizedSlug]) {
    return FALLBACK_CATEGORY_DATA[normalizedSlug];
  }
  if (normalizedName.includes('vợt') || normalizedName.includes('paddle')) {
    return FALLBACK_CATEGORY_DATA['paddle'];
  }
  if (normalizedName.includes('bóng') || normalizedName.includes('ball')) {
    return FALLBACK_CATEGORY_DATA['balls'];
  }
  if (normalizedName.includes('giày') || normalizedName.includes('shoe')) {
    return FALLBACK_CATEGORY_DATA['shoes'];
  }
  if (normalizedName.includes('túi') || normalizedName.includes('balo') || normalizedName.includes('bag')) {
    return FALLBACK_CATEGORY_DATA['bag'];
  }
  if (normalizedName.includes('áo') || normalizedName.includes('quần') || normalizedName.includes('apparel')) {
    return FALLBACK_CATEGORY_DATA['apparel'];
  }

  return {
    image: '/images/net.png',
    desc: 'Trang thiết bị và phụ kiện thi đấu Pickleball cao cấp chính hãng tại PickleHub.',
    icon: <Tag className="w-5 h-5" />,
    filterKey: normalizedSlug || 'accessories',
  };
}

export const CategoryQuickAccess: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySlideItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Carousel Indexing & Animation State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  // Track container width for exact pixel calculations
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Fetch real categories from database
  useEffect(() => {
    setLoading(true);
    catalogApi.getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          const mapped: CategorySlideItem[] = cats.map((c) => {
            const meta = getCategoryMeta(c.slug, c.name);
            const realImage = c.imageUrl || c.url || meta.image;
            return {
              id: c.id,
              title: c.name,
              description: c.description || meta.desc,
              imgSrc: realImage,
              icon: meta.icon,
              linkHref: `/products?category=${meta.filterKey}`,
            };
          });
          setCategories(mapped);
          setCurrentIndex(mapped.length); // Start in middle clone
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const numItems = categories.length;
  // Seamless 3x cloned array
  const infiniteSlides = numItems > 0 ? [...categories, ...categories, ...categories] : [];

  const handlePrev = () => {
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // Seamless jump when crossing set boundaries
  const handleTransitionEnd = () => {
    if (numItems === 0) return;
    if (currentIndex >= numItems * 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - numItems);
    } else if (currentIndex < numItems) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + numItems);
    }
  };

  const handleCardClick = (item: CategorySlideItem) => {
    if (item.linkHref) {
      router.push(item.linkHref);
    }
  };

  // Calculate geometry
  const GAP = 12; // 12px gap between cards
  const cardWidth = (containerWidth - 3 * GAP) / 4; // standard 4 cards per view
  const activeDotIndex = numItems > 0 ? ((currentIndex % numItems) + numItems) % numItems : 0;

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden border-b border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            Trang bị đồ thể thao Pickleball
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Rà chuột hoặc nhấn vào từng danh mục để khám phá các dòng thiết bị đạt chuẩn thi đấu
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative flex items-center justify-center">
          
          {/* Left Arrow Button - Circular Glassmorphic */}
          {numItems > 0 && (
            <button
              onClick={handlePrev}
              className="absolute -left-3 sm:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-800 dark:text-white hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors backdrop-blur-md cursor-pointer"
              title="Trượt sang trái"
              aria-label="Previous category"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Carousel Viewport Container (Fixes 100% width, exactly 4 cards visible) */}
          <div ref={containerRef} className="w-full overflow-hidden rounded-2xl">
            {loading ? (
              <div className="h-[480px] w-full flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : numItems > 0 ? (
              <div
                className="flex items-stretch h-[520px] md:h-[480px]"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  gap: `${GAP}px`,
                  transform: `translateX(-${currentIndex * (cardWidth + GAP)}px)`,
                  transition: isTransitioning
                    ? 'transform 0.48s cubic-bezier(0.2, 0.9, 0.3, 1.0)'
                    : 'none',
                }}
              >
                {infiniteSlides.map((item, idx) => {
                  const isHovered = hoveredIdx === idx;
                  
                  // Calculate dynamic width: If this card is hovered inside visible window, expand it while keeping 4 cards fitting 100%
                  let currentWidth = cardWidth;
                  if (hoveredIdx !== null) {
                    if (isHovered) {
                      // Expanded card width
                      currentWidth = cardWidth * 1.75;
                    } else if (idx >= currentIndex && idx < currentIndex + 4 && hoveredIdx >= currentIndex && hoveredIdx < currentIndex + 4) {
                      // Other 3 visible cards shrink proportionally so total = 100%
                      currentWidth = (containerWidth - 3 * GAP - cardWidth * 1.75) / 3;
                    }
                  }

                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => handleCardClick(item)}
                      style={{
                        width: `${currentWidth}px`,
                        flexShrink: 0,
                        transition: 'width 0.38s cubic-bezier(0.2, 0.9, 0.3, 1.0)',
                      }}
                      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-card-foreground shadow-md select-none"
                    >
                      {/* Background Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imgSrc}
                        alt={item.title}
                        className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out ${
                          isHovered
                            ? 'scale-105 grayscale-0 opacity-100'
                            : 'scale-105 grayscale opacity-85 hover:opacity-95'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/paddle.png';
                        }}
                      />

                      {/* Active Dark Gradient Overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent transition-opacity duration-300 pointer-events-none ${
                          isHovered ? 'opacity-95' : 'opacity-0'
                        }`}
                      />

                      {/* Collapsed Bottom Label */}
                      <div
                        className={`absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center p-3 sm:p-4 transition-opacity duration-300 pointer-events-none z-10 ${
                          isHovered ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        <span className="text-white font-bold text-xs sm:text-sm text-center leading-snug tracking-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-2">
                          {item.title}
                        </span>
                      </div>

                      {/* Expanded Content Details */}
                      <div
                        className={`absolute inset-0 flex flex-col justify-end gap-2.5 p-6 sm:p-7 z-20 transition-all duration-300 ${
                          isHovered
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 translate-y-4 pointer-events-none'
                        }`}
                      >
                        {/* Icon */}
                        <div className="text-emerald-400 flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30">
                            {item.icon}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="w-full max-w-sm text-xs sm:text-sm text-slate-300 leading-relaxed font-normal line-clamp-3">
                          {item.description}
                        </p>

                        {/* CTA Link */}
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all">
                            <span>Khám phá danh mục</span>
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Right Arrow Button - Circular Glassmorphic */}
          {numItems > 0 && (
            <button
              onClick={handleNext}
              className="absolute -right-3 sm:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-800 dark:text-white hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors backdrop-blur-md cursor-pointer"
              title="Trượt sang phải"
              aria-label="Next category"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

        </div>

        {/* Dots Circular Indicator */}
        {numItems > 0 && (
          <div className="flex items-center justify-center gap-2 pt-1">
            {categories.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!isTransitioning) setIsTransitioning(true);
                  setCurrentIndex(numItems + idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeDotIndex === idx
                    ? 'w-8 bg-emerald-600 dark:bg-emerald-400'
                    : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                title={`Vị trí danh mục ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
