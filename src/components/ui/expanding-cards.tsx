'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
}

export const ExpandingCards = React.forwardRef<
  HTMLUListElement,
  ExpandingCardsProps
>(({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(
    defaultActiveIndex
  );

  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gridStyle = React.useMemo(() => {
    if (activeIndex === null) return {};

    if (isDesktop) {
      const columns = items
        .map((_, index) => (index === activeIndex ? '4fr' : '1fr'))
        .join(' ');
      return { gridTemplateColumns: columns };
    } else {
      const rows = items
        .map((_, index) => (index === activeIndex ? '4fr' : '1fr'))
        .join(' ');
      return { gridTemplateRows: rows };
    }
  }, [activeIndex, items.length, isDesktop]);

  const handleCardClick = (item: CardItem, index: number) => {
    setActiveIndex(index);
    if (item.linkHref) {
      router.push(item.linkHref);
    }
  };

  return (
    <ul
      className={cn(
        'w-full max-w-7xl gap-3',
        'grid',
        'h-[650px] md:h-[500px]',
        'transition-[grid-template-columns,grid-template-rows] duration-500 ease-out',
        className
      )}
      style={{
        ...gridStyle,
        ...(isDesktop
          ? { gridTemplateRows: '1fr' }
          : { gridTemplateColumns: '1fr' }),
      }}
      ref={ref}
      {...props}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            'group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-card-foreground shadow-lg transition-all duration-300',
            'md:min-w-[90px]',
            'min-h-0 min-w-0'
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onFocus={() => setActiveIndex(index)}
          onClick={() => handleCardClick(item, index)}
          tabIndex={0}
          data-active={activeIndex === index}
        >
          <img
            src={item.imgSrc}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out group-data-[active=true]:scale-105 group-data-[active=true]:grayscale-0 scale-110 grayscale opacity-85 group-data-[active=true]:opacity-100"
          />
          
          {/* Active Overlay: Full dark gradient for expanded text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent transition-opacity duration-300 opacity-0 group-data-[active=true]:opacity-90 pointer-events-none" />

          {/* Collapsed Overlay: Dải gradient đen đáy 35-40% + Chữ ngang tự nhiên cho trạng thái chưa hover */}
          <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-center p-3 sm:p-4 transition-all duration-300 group-data-[active=true]:opacity-0 pointer-events-none z-10">
            <span className="text-white font-semibold text-xs sm:text-sm text-center leading-snug tracking-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {item.title}
            </span>
          </div>

          <article className="absolute inset-0 flex flex-col justify-end gap-2 p-6 z-10 pointer-events-none group-data-[active=true]:pointer-events-auto">
            
            {/* Icon */}
            <div className="text-emerald-400 opacity-0 transition-all duration-300 delay-75 ease-out group-data-[active=true]:opacity-100 flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/30">
                {item.icon}
              </div>
            </div>

            {/* Expanded Title */}
            <h3 className="text-xl sm:text-2xl font-display font-black text-white opacity-0 transition-all duration-300 delay-150 ease-out group-data-[active=true]:opacity-100">
              {item.title}
            </h3>

            {/* Description */}
            <p className="w-full max-w-md text-xs sm:text-sm text-slate-300 opacity-0 transition-all duration-300 delay-225 ease-out group-data-[active=true]:opacity-100 leading-relaxed font-medium">
              {item.description}
            </p>

            {/* Action CTA Link */}
            <div className="pt-2 opacity-0 transition-all duration-300 delay-300 ease-out group-data-[active=true]:opacity-100">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Khám phá danh mục</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

          </article>
        </li>
      ))}
    </ul>
  );
});

ExpandingCards.displayName = 'ExpandingCards';
