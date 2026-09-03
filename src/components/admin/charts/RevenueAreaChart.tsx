'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Calendar } from 'lucide-react';
import { DailyRevenuePointDto } from '@/lib/api/adminApi';

interface RevenueAreaChartProps {
  timeline: DailyRevenuePointDto[];
  totalRevenue: number;
  totalOrders: number;
  growthPercent: number;
  days: number;
  periodLabel?: string;
  loading?: boolean;
}

export const RevenueAreaChart: React.FC<RevenueAreaChartProps> = ({
  timeline,
  totalRevenue,
  totalOrders,
  growthPercent,
  days,
  periodLabel,
  loading = false
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DailyRevenuePointDto | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG dimensions
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 65 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max value calculation
  const maxRevenue = useMemo(() => {
    if (!timeline || timeline.length === 0) return 1_000_000;
    const max = Math.max(...timeline.map(p => p.revenue));
    return max > 0 ? max * 1.15 : 1_000_000; // 15% headroom
  }, [timeline]);

  // Generate SVG Points
  const points = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];
    const count = timeline.length;
    return timeline.map((p, idx) => {
      const x = padding.left + (count > 1 ? (idx / (count - 1)) * chartWidth : chartWidth / 2);
      const y = padding.top + chartHeight - (p.revenue / maxRevenue) * chartHeight;
      return { x, y, data: p, index: idx };
    });
  }, [timeline, maxRevenue, chartWidth, chartHeight, padding.left, padding.top]);

  // Smooth Bezier Curve Path
  const { pathD, areaD } = useMemo(() => {
    if (points.length === 0) return { pathD: '', areaD: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        pathD: `M ${p.x} ${p.y} L ${p.x + 1} ${p.y}`,
        areaD: `M ${p.x} ${padding.top + chartHeight} L ${p.x} ${p.y} L ${p.x + 1} ${p.y} L ${p.x + 1} ${padding.top + chartHeight} Z`
      };
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      d += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const bottomY = padding.top + chartHeight;
    const area = `${d} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;

    return { pathD: d, areaD: area };
  }, [points, chartHeight, padding.top]);

  // Format currency for Y axis ticks
  const formatYTick = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return `${val}`;
  };

  const yTicks = useMemo(() => {
    return [0, maxRevenue * 0.33, maxRevenue * 0.66, maxRevenue];
  }, [maxRevenue]);

  // Filter X ticks so we don't overcrowd or collide at boundaries
  const xTickIndices = useMemo(() => {
    const total = points.length;
    if (total <= 7) return points.map((_, i) => i);

    const step = total <= 15 ? 2 : total <= 31 ? 5 : 10;
    const indices: number[] = [];

    for (let i = 0; i < total; i += step) {
      indices.push(i);
    }

    const lastIndex = total - 1;
    if (indices[indices.length - 1] !== lastIndex) {
      if (lastIndex - indices[indices.length - 1] < Math.floor(step / 2) + 1 && indices.length > 1) {
        indices[indices.length - 1] = lastIndex;
      } else {
        indices.push(lastIndex);
      }
    }

    return indices;
  }, [points]);

  const isPositive = growthPercent >= 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/4" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
      
      {/* Header Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
              Doanh thu theo thời gian
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-200/60 dark:border-emerald-800/60">
              {periodLabel || (days === 1 ? 'Hôm nay' : `${days} ngày qua`)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Biểu đồ xu hướng doanh thu thực tế và khối lượng đơn hàng được ghi nhận
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Tổng doanh thu kỳ này</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-display font-black text-2xl text-slate-900 dark:text-white">
                {totalRevenue.toLocaleString('vi-VN')} ₫
              </span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${
                isPositive 
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(growthPercent)}%
              </span>
            </div>
          </div>

          <div className="border-l border-slate-200 dark:border-slate-800 pl-4 sm:pl-6">
            <span className="text-[11px] font-bold text-slate-400 block">Tổng số đơn hàng</span>
            <span className="font-display font-black text-xl text-slate-900 dark:text-white mt-0.5 block">
              {totalOrders} <span className="text-xs font-semibold text-slate-500">đơn</span>
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-visible">
        {timeline.length === 0 || totalRevenue === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Chưa có dữ liệu doanh thu trong khoảng thời gian này
            </p>
          </div>
        ) : (
          <div className="relative overflow-visible">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Horizontal Grid Lines & Y Ticks */}
              {yTicks.map((val, idx) => {
                const y = padding.top + chartHeight - (val / maxRevenue) * chartHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/80"
                      strokeDasharray={idx === 0 ? '0' : '4 4'}
                      strokeWidth={1}
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500"
                    >
                      {formatYTick(val)}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {areaD && <path d={areaD} fill="url(#emeraldGradient)" />}

              {/* Line Stroke */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              )}

              {/* X Axis Dates */}
              {xTickIndices.map((idx) => {
                const pt = points[idx];
                if (!pt) return null;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={height - 12}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500"
                  >
                    {pt.data.formattedDate}
                  </text>
                );
              })}

              {/* Interactive Crosshair & Points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g key={idx}>
                    {/* Vertical guideline on hover */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={padding.top}
                        x2={pt.x}
                        y2={padding.top + chartHeight}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Point Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6.5 : (pt.data.revenue > 0 ? 3.5 : 2)}
                      fill={isHovered ? '#10b981' : '#ffffff'}
                      stroke="#10b981"
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-150 cursor-pointer"
                    />

                    {/* Invisible Hitbox for easier hovering */}
                    <rect
                      x={pt.x - (chartWidth / points.length) / 2}
                      y={padding.top}
                      width={Math.max(chartWidth / points.length, 20)}
                      height={chartHeight + 20}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => {
                        setHoveredPoint(pt.data);
                        setHoveredIndex(idx);
                      }}
                      onMouseLeave={() => {
                        setHoveredPoint(null);
                        setHoveredIndex(null);
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating Tooltip Box with Boundary-Aware Positioning */}
            {hoveredPoint && hoveredIndex !== null && points[hoveredIndex] && (() => {
              const pt = points[hoveredIndex];
              const xRatio = pt.x / width;
              const isNearRight = xRatio > 0.72;
              const isNearLeft = xRatio < 0.28;
              const isNearTop = pt.y < 65;

              const transformX = isNearRight ? '-translate-x-[92%]' : isNearLeft ? '-translate-x-[8%]' : '-translate-x-1/2';
              const transformY = isNearTop ? 'translate-y-3' : '-translate-y-full';
              const topVal = isNearTop ? `${(pt.y / height) * 100 + 4}%` : `${(pt.y / height) * 100 - 4}%`;

              return (
                <div
                  className={`absolute z-30 pointer-events-none transition-all duration-75 transform ${transformX} ${transformY}`}
                  style={{
                    left: `${(pt.x / width) * 100}%`,
                    top: topVal,
                  }}
                >
                  <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs space-y-1 min-w-[160px]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span>{hoveredPoint.date}</span>
                    </div>
                    <div className="font-extrabold text-sm text-emerald-400 font-display">
                      {hoveredPoint.revenue.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-[10px] text-slate-300 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-emerald-400" />
                      <span>{hoveredPoint.orderCount} đơn hàng thành công</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

    </div>
  );
};
