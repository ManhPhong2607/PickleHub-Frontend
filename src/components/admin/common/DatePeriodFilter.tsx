'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, Check, Clock, CalendarDays, BarChart2, CalendarRange, X } from 'lucide-react';

export type PeriodMode = 'preset' | 'month' | 'quarter' | 'year' | 'custom';

export interface DatePeriodValue {
  mode: PeriodMode;
  presetKey?: 'today' | '7days' | '30days' | '90days' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year';
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  selectedMonth?: number;   // 1 - 12
  selectedQuarter?: number; // 1 - 4
  selectedYear?: number;    // e.g. 2026
  label: string;     // e.g. "30 ngày qua", "Tháng 09/2026", "Quý 3/2026", "Năm 2026", "01/09/2026 - 15/09/2026"
  days: number;
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatVN(dStr: string): string {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return `${d}/${m}/${y}`;
}

export function computePeriod(
  mode: PeriodMode,
  params: {
    presetKey?: DatePeriodValue['presetKey'];
    month?: number;
    quarter?: number;
    year?: number;
    customStart?: string;
    customEnd?: string;
  }
): DatePeriodValue {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentQuarter = Math.ceil(currentMonth / 3);

  if (mode === 'preset') {
    const key = params.presetKey || '30days';
    switch (key) {
      case 'today': {
        const iso = formatDateISO(now);
        return {
          mode: 'preset',
          presetKey: 'today',
          startDate: iso,
          endDate: iso,
          label: 'Hôm nay',
          days: 1,
        };
      }
      case '7days': {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        return {
          mode: 'preset',
          presetKey: '7days',
          startDate: formatDateISO(start),
          endDate: formatDateISO(now),
          label: '7 ngày qua',
          days: 7,
        };
      }
      case '30days': {
        const start = new Date(now);
        start.setDate(now.getDate() - 29);
        return {
          mode: 'preset',
          presetKey: '30days',
          startDate: formatDateISO(start),
          endDate: formatDateISO(now),
          label: '30 ngày qua',
          days: 30,
        };
      }
      case '90days': {
        const start = new Date(now);
        start.setDate(now.getDate() - 89);
        return {
          mode: 'preset',
          presetKey: '90days',
          startDate: formatDateISO(start),
          endDate: formatDateISO(now),
          label: '90 ngày qua',
          days: 90,
        };
      }
      case 'this_month': {
        const start = new Date(currentYear, currentMonth - 1, 1);
        const end = new Date(currentYear, currentMonth, 0);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          mode: 'preset',
          presetKey: 'this_month',
          startDate: formatDateISO(start),
          endDate: formatDateISO(end),
          selectedMonth: currentMonth,
          selectedYear: currentYear,
          label: `Tháng này (${String(currentMonth).padStart(2, '0')}/${currentYear})`,
          days,
        };
      }
      case 'last_month': {
        const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
        const lmYear = prevMonthDate.getFullYear();
        const lmMonth = prevMonthDate.getMonth() + 1;
        const start = new Date(lmYear, lmMonth - 1, 1);
        const end = new Date(lmYear, lmMonth, 0);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          mode: 'preset',
          presetKey: 'last_month',
          startDate: formatDateISO(start),
          endDate: formatDateISO(end),
          selectedMonth: lmMonth,
          selectedYear: lmYear,
          label: `Tháng trước (${String(lmMonth).padStart(2, '0')}/${lmYear})`,
          days,
        };
      }
      case 'this_quarter': {
        const startMonth = (currentQuarter - 1) * 3;
        const start = new Date(currentYear, startMonth, 1);
        const end = new Date(currentYear, startMonth + 3, 0);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          mode: 'preset',
          presetKey: 'this_quarter',
          startDate: formatDateISO(start),
          endDate: formatDateISO(end),
          selectedQuarter: currentQuarter,
          selectedYear: currentYear,
          label: `Quý này (Q${currentQuarter}/${currentYear})`,
          days,
        };
      }
      case 'this_year': {
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 11, 31);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          mode: 'preset',
          presetKey: 'this_year',
          startDate: formatDateISO(start),
          endDate: formatDateISO(end),
          selectedYear: currentYear,
          label: `Năm nay (${currentYear})`,
          days,
        };
      }
    }
  }

  if (mode === 'month') {
    const y = params.year || currentYear;
    const m = params.month || currentMonth;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      mode: 'month',
      startDate: formatDateISO(start),
      endDate: formatDateISO(end),
      selectedMonth: m,
      selectedYear: y,
      label: `Tháng ${String(m).padStart(2, '0')}/${y}`,
      days,
    };
  }

  if (mode === 'quarter') {
    const y = params.year || currentYear;
    const q = params.quarter || currentQuarter;
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1);
    const end = new Date(y, startMonth + 3, 0);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      mode: 'quarter',
      startDate: formatDateISO(start),
      endDate: formatDateISO(end),
      selectedQuarter: q,
      selectedYear: y,
      label: `Quý ${q}/${y}`,
      days,
    };
  }

  if (mode === 'year') {
    const y = params.year || currentYear;
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      mode: 'year',
      startDate: formatDateISO(start),
      endDate: formatDateISO(end),
      selectedYear: y,
      label: `Năm ${y}`,
      days,
    };
  }

  // mode === 'custom'
  const sStr = params.customStart || formatDateISO(now);
  const eStr = params.customEnd || formatDateISO(now);
  const sDate = new Date(sStr);
  const eDate = new Date(eStr);
  const diffDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return {
    mode: 'custom',
    startDate: sStr,
    endDate: eStr,
    label: `${formatVN(sStr)} — ${formatVN(eStr)}`,
    days: diffDays,
  };
}

interface DatePeriodFilterProps {
  value: DatePeriodValue;
  onChange: (val: DatePeriodValue) => void;
  className?: string;
  buttonClassName?: string;
}

export const DatePeriodFilter: React.FC<DatePeriodFilterProps> = ({
  value,
  onChange,
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Tab inside dropdown
  const [activeTab, setActiveTab] = useState<PeriodMode>(value.mode || 'preset');

  // Internal draft states
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const [tempMonth, setTempMonth] = useState<number>(value.selectedMonth || currentMonth);
  const [tempMonthYear, setTempMonthYear] = useState<number>(value.selectedYear || currentYear);

  const [tempQuarter, setTempQuarter] = useState<number>(value.selectedQuarter || currentQuarter);
  const [tempQuarterYear, setTempQuarterYear] = useState<number>(value.selectedYear || currentYear);

  const [tempYear, setTempYear] = useState<number>(value.selectedYear || currentYear);

  const [tempStart, setTempStart] = useState<string>(value.startDate);
  const [tempEnd, setTempEnd] = useState<string>(value.endDate);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const yearsOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const handleSelectPreset = (presetKey: DatePeriodValue['presetKey']) => {
    const computed = computePeriod('preset', { presetKey });
    onChange(computed);
    setIsOpen(false);
  };

  const handleApplyMonth = () => {
    const computed = computePeriod('month', { month: tempMonth, year: tempMonthYear });
    onChange(computed);
    setIsOpen(false);
  };

  const handleApplyQuarter = () => {
    const computed = computePeriod('quarter', { quarter: tempQuarter, year: tempQuarterYear });
    onChange(computed);
    setIsOpen(false);
  };

  const handleApplyYear = () => {
    const computed = computePeriod('year', { year: tempYear });
    onChange(computed);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (!tempStart || !tempEnd) return;
    if (tempStart > tempEnd) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
      return;
    }
    const computed = computePeriod('custom', { customStart: tempStart, customEnd: tempEnd });
    onChange(computed);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-xs active:scale-98 ${buttonClassName}`}
      >
        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="truncate max-w-[200px]">{value.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Modal Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-[340px] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-1.5 gap-1">
            {[
              { id: 'preset', label: 'Nhanh', icon: Clock },
              { id: 'month', label: 'Tháng', icon: CalendarDays },
              { id: 'quarter', label: 'Quý', icon: BarChart2 },
              { id: 'year', label: 'Năm', icon: Calendar },
              { id: 'custom', label: 'Tùy chọn', icon: CalendarRange },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as PeriodMode)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Presets Nhanh */}
          {activeTab === 'preset' && (
            <div className="p-3 grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
              {[
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày qua' },
                { key: '30days', label: '30 ngày qua' },
                { key: '90days', label: '90 ngày qua' },
                { key: 'this_month', label: 'Tháng này' },
                { key: 'last_month', label: 'Tháng trước' },
                { key: 'this_quarter', label: 'Quý này' },
                { key: 'this_year', label: 'Năm nay' },
              ].map((p) => {
                const isSelected = value.mode === 'preset' && value.presetKey === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleSelectPreset(p.key as DatePeriodValue['presetKey'])}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Theo Tháng */}
          {activeTab === 'month' && (
            <div className="p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chọn năm:</span>
                <select
                  value={tempMonthYear}
                  onChange={(e) => setTempMonthYear(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono outline-none"
                >
                  {yearsOptions.map((y) => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const isSelected = tempMonth === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTempMonth(m)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Tháng {m}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyMonth}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Áp dụng Tháng {tempMonth}/{tempMonthYear}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Theo Quý */}
          {activeTab === 'quarter' && (
            <div className="p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chọn năm:</span>
                <select
                  value={tempQuarterYear}
                  onChange={(e) => setTempQuarterYear(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono outline-none"
                >
                  {yearsOptions.map((y) => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { q: 1, label: 'Quý 1 (T1 - T3)' },
                  { q: 2, label: 'Quý 2 (T4 - T6)' },
                  { q: 3, label: 'Quý 3 (T7 - T9)' },
                  { q: 4, label: 'Quý 4 (T10 - T12)' },
                ].map((item) => {
                  const isSelected = tempQuarter === item.q;
                  return (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() => setTempQuarter(item.q)}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyQuarter}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Áp dụng Quý {tempQuarter}/{tempQuarterYear}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Theo Năm */}
          {activeTab === 'year' && (
            <div className="p-4 space-y-3.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Chọn năm tài chính:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {yearsOptions.map((y) => {
                  const isSelected = tempYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setTempYear(y)}
                      className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Năm {y}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyYear}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Áp dụng Năm {tempYear}
                </button>
              </div>
            </div>
          )}

          {/* Tab 5: Tùy chỉnh ngày (Start Date - End Date) */}
          {activeTab === 'custom' && (
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Từ ngày (Start Date):</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Đến ngày (End Date):</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Áp dụng khoảng ngày
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
