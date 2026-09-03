'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingBag, PieChart as PieIcon, CheckCircle2, Clock, Truck, XCircle, ShieldCheck } from 'lucide-react';
import { OrderStatusItemDto } from '@/lib/api/adminApi';

interface OrderStatusDonutChartProps {
  items: OrderStatusItemDto[];
  totalOrders: number;
  days: number;
  periodLabel?: string;
  loading?: boolean;
}

export const OrderStatusDonutChart: React.FC<OrderStatusDonutChartProps> = ({
  items,
  totalOrders,
  days,
  periodLabel,
  loading = false
}) => {
  const [hoveredStatus, setHoveredStatus] = useState<OrderStatusItemDto | null>(null);

  // SVG dimensions for Donut
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment offsets
  const segments = useMemo(() => {
    if (!items || items.length === 0 || totalOrders === 0) return [];
    
    let accumulatedPercent = 0;
    return items.map((item) => {
      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
      accumulatedPercent += item.percentage;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset
      };
    });
  }, [items, totalOrders, circumference]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'Confirmed':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />;
      case 'Shipping':
        return <Truck className="w-3.5 h-3.5 text-blue-500" />;
      case 'Completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Cancelled':
        return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-5">
      
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <PieIcon className="w-4 h-4" />
          </div>
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Đơn hàng theo trạng thái
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tỷ lệ phân bổ và tiến độ xử lý đơn hàng trong {periodLabel ? periodLabel.toLowerCase() : (days === 1 ? 'hôm nay' : `${days} ngày qua`)}
        </p>
      </div>

      {/* Main Content: Donut + Legend */}
      {totalOrders === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold">
          Chưa có đơn hàng nào trong khoảng thời gian này
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
          
          {/* Donut SVG */}
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth={strokeWidth}
              />

              {/* Status segments */}
              {segments.map((seg, idx) => {
                const isHovered = hoveredStatus?.status === seg.status;
                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredStatus(seg)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-bold text-slate-400">
                {hoveredStatus ? hoveredStatus.statusText : 'Tổng số đơn'}
              </span>
              <span className="font-display font-black text-2xl text-slate-900 dark:text-white">
                {hoveredStatus ? hoveredStatus.count : totalOrders}
              </span>
              {hoveredStatus && (
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {hoveredStatus.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Legend List */}
          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const isHovered = hoveredStatus?.status === item.status;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredStatus(item)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                    isHovered 
                      ? 'bg-slate-100 dark:bg-slate-800 scale-[1.02]' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {getStatusIcon(item.status)}
                      <span>{item.statusText}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-white">{item.count}</span>
                    <span className="text-[11px] font-bold text-slate-400 min-w-[36px] text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 text-[11px] text-slate-400 font-semibold text-center border-t border-slate-100 dark:border-slate-800">
        💡 Rê chuột vào từng phần trên biểu đồ để xem chi tiết tỷ lệ chuyển đổi đơn hàng
      </div>

    </div>
  );
};
