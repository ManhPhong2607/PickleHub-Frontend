'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp, TrendingDown,
  Calendar, ChevronRight, Plus, X, Package, ShieldCheck, Clock, Truck, CheckCircle2, XCircle,
  RefreshCw, Search, ArrowRight, Warehouse, Filter
} from 'lucide-react';
import {
  adminApi,
  OrderDashboardSummaryDto,
  CustomerDashboardSummaryDto,
  RevenueAnalyticsDto,
  OrderStatusDistributionDto,
  ProductInsightsResultDto,
  AdminOrderDto,
  AdminInventoryItemDto
} from '@/lib/api/adminApi';
import { RevenueAreaChart } from './charts/RevenueAreaChart';
import { TopProductsChart } from './charts/TopProductsChart';
import { OrderStatusDonutChart } from './charts/OrderStatusDonutChart';
import { ProductConversionSection } from './charts/ProductConversionSection';
import { LowStockAlertModal } from './LowStockAlertModal';
import { DatePeriodFilter, DatePeriodValue, computePeriod } from './common/DatePeriodFilter';
import { AnimatedNumber } from './common/AnimatedNumber';
import gsap from 'gsap';

export const DashboardModule: React.FC = () => {
  // ── FILTER & SETTINGS ──────────────────────────────────────────────────
  const [period, setPeriod] = useState<DatePeriodValue>(() => computePeriod('preset', { presetKey: '30days' }));
  const [stockThreshold, setStockThreshold] = useState<number>(15);
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders_conversion'>('analytics');

  const days = period.days;

  // ── DATA STATES ────────────────────────────────────────────────────────
  const [orderStats, setOrderStats] = useState<OrderDashboardSummaryDto>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalOrdersThisMonth: 0,
    revenueGrowthPercent: 0,
    ordersGrowthPercent: 0
  });
  const [customerStats, setCustomerStats] = useState<CustomerDashboardSummaryDto>({
    totalCustomers: 0,
    newThisMonth: 0,
    blockedCount: 0
  });

  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalyticsDto | null>(null);
  const [statusDistribution, setStatusDistribution] = useState<OrderStatusDistributionDto | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrderDto[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<AdminInventoryItemDto[]>([]);
  const [productInsights, setProductInsights] = useState<ProductInsightsResultDto | null>(null);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const cardsContainerRef = React.useRef<HTMLDivElement>(null);
  const hasAnimatedCardsRef = React.useRef<boolean>(false);

  // GSAP Stagger Entrance cho 4 metric cards (CHỈ CHẠY 1 LẦN khi mount, tự động clearProps sau khi xong để không bị ẩn thẻ)
  useEffect(() => {
    if (!cardsContainerRef.current || hasAnimatedCardsRef.current || statsLoading) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const cards = cardsContainerRef.current.children;
    if (cards && cards.length > 0) {
      hasAnimatedCardsRef.current = true;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.5,
          ease: 'power2.out',
          clearProps: 'all', // Xóa sạch inline styles sau khi diễn hoạt
        }
      );
    }
  }, [statsLoading]);

  // ── RECENT ORDERS FILTER STATES ────────────────────────────────────────
  const [orderSearchKeyword, setOrderSearchKeyword] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // ── FETCH DATA ─────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    setAnalyticsLoading(true);
    setStatsLoading(true);
    setRecentOrdersLoading(true);

    try {
      const [summaryRes, custRes, revRes, distRes, ordersRes] = await Promise.allSettled([
        adminApi.getOrderDashboardSummary(),
        adminApi.getCustomerDashboardSummary(),
        adminApi.getRevenueAnalytics({ startDate: period.startDate, endDate: period.endDate, days: period.days }),
        adminApi.getOrderStatusDistribution({ startDate: period.startDate, endDate: period.endDate, days: period.days }),
        adminApi.getOrders({ page: 1, pageSize: 10 }),
      ]);

      if (summaryRes.status === 'fulfilled') setOrderStats(summaryRes.value);
      if (custRes.status === 'fulfilled') setCustomerStats(custRes.value);
      if (revRes.status === 'fulfilled') setRevenueAnalytics(revRes.value);
      if (distRes.status === 'fulfilled') setStatusDistribution(distRes.value);
      if (ordersRes.status === 'fulfilled') setRecentOrders(ordersRes.value.items);
    } catch (err) {
      console.error('[DASHBOARD ERROR] Failed fetching order analytics:', err);
    } finally {
      setStatsLoading(false);
      setAnalyticsLoading(false);
      setRecentOrdersLoading(false);
    }
  };

  // Re-fetch when time range changes
  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Fetch Inventory (Real Stock) & Catalog
  useEffect(() => {
    setInventoryLoading(true);
    setCatalogLoading(true);

    Promise.allSettled([
      adminApi.getInventory(),
      adminApi.getProducts(),
      adminApi.getProductInsights()
    ]).then(([invRes, prodsRes, insightsRes]) => {
      if (invRes.status === 'fulfilled') {
        setInventoryList(invRes.value);
      }
      if (prodsRes.status === 'fulfilled') {
        setRawProducts(prodsRes.value);
      }
      if (insightsRes.status === 'fulfilled') {
        setProductInsights(insightsRes.value);
      }
    }).catch((err) => {
      console.error('[DASHBOARD ERROR] Failed fetching inventory/catalog:', err);
    }).finally(() => {
      setInventoryLoading(false);
      setCatalogLoading(false);
    });
  }, []);

  // ── INVENTORY & RESTOCK MODAL ──────────────────────────────────────────
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<any | null>(null);
  const [addQty, setAddQty] = useState<number>(20);
  const [restocking, setRestocking] = useState(false);

  const refreshInventoryData = () => {
    adminApi.getInventory().then((res) => {
      setInventoryList(res);
    }).catch(() => {});
  };

  // Group and sort low stock items from REAL inventory data
  const lowStockItems = useMemo(() => {
    return inventoryList
      .filter((item) => (item.quantity ?? 0) <= stockThreshold)
      .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
  }, [inventoryList, stockThreshold]);

  const outOfStockCount = useMemo(() => {
    return lowStockItems.filter(i => (i.quantity ?? 0) <= 0).length;
  }, [lowStockItems]);

  const nearOutOfStockCount = useMemo(() => {
    return lowStockItems.filter(i => (i.quantity ?? 0) > 0).length;
  }, [lowStockItems]);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    setRestocking(true);
    try {
      await adminApi.importStock({
        variantId: restockProduct.variantId || restockProduct.id,
        quantity: Number(addQty),
        note: 'Nhập kho nhanh từ Admin Dashboard'
      });
      // Refresh inventory
      const updatedInv = await adminApi.getInventory();
      setInventoryList(updatedInv);
      setRestockProduct(null);
    } catch (err) {
      console.error('Failed to restock:', err);
      // Local optimistic update
      setInventoryList(prev =>
        prev.map(p => (p.id === restockProduct.id || p.variantId === restockProduct.variantId)
          ? { ...p, quantity: (p.quantity ?? 0) + Number(addQty) }
          : p
        )
      );
      setRestockProduct(null);
    } finally {
      setRestocking(false);
    }
  };

  // ── BEST SELLER PRODUCTS LIST (Xử lý toàn bộ sản phẩm từ Catalog) ──────
  const topProductItems = useMemo(() => {
    if (!rawProducts || rawProducts.length === 0) return [];

    return rawProducts
      .map(p => {
        const soldCount = Number(p.soldCount ?? 0);
        const price = Number(p.effectivePrice ?? p.price ?? p.minPrice ?? 0);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug || p.id,
          image: p.image || p.thumbnailUrl || '/images/paddle.png',
          soldCount,
          revenue: soldCount * price,
          viewCount: Number(p.viewCount ?? 0)
        };
      })
      .sort((a, b) => b.soldCount - a.soldCount);
  }, [rawProducts]);

  // Conversion products for Step 6
  const conversionProducts = useMemo(() => {
    return rawProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug || p.id,
      image: p.image || '/images/paddle.png',
      sku: p.sku || 'SKU-N/A',
      viewCount: Number(p.viewCount ?? 0),
      soldCount: Number(p.soldCount ?? 0),
      category: p.category
    }));
  }, [rawProducts]);

  // ── FILTERED RECENT ORDERS ─────────────────────────────────────────────
  const filteredRecentOrders = useMemo(() => {
    return recentOrders.filter(ord => {
      // Keyword filter: orderNumber, customerName, customerPhone
      if (orderSearchKeyword.trim()) {
        const q = orderSearchKeyword.trim().toLowerCase();
        const matchNum = ord.orderNumber?.toLowerCase().includes(q);
        const matchName = ord.customerName?.toLowerCase().includes(q);
        const matchPhone = ord.customerPhone?.toLowerCase().includes(q);
        const matchItem = ord.firstItemName?.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchPhone && !matchItem) return false;
      }

      // Status filter
      if (orderStatusFilter !== 'all') {
        if (ord.status?.toLowerCase() !== orderStatusFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [recentOrders, orderSearchKeyword, orderStatusFilter]);

  // ── ORDER STATUS HELPER ────────────────────────────────────────────────
  const renderOrderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Hoàn thành</span>
          </span>
        );
      case 'shipping':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200/60 inline-flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>Đang giao</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200/60 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>Đã xác nhận</span>
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200/60 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Chờ xác nhận</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200/60 inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Revenue & Orders metrics calculations
  const displayRevenue = revenueAnalytics?.totalRevenue ?? orderStats.todayRevenue;
  const displayOrders = revenueAnalytics?.totalOrders ?? orderStats.todayOrders;
  const revenueGrowth = revenueAnalytics?.revenueGrowthPercent ?? orderStats.revenueGrowthPercent ?? 0;
  const ordersGrowth = revenueAnalytics?.ordersGrowthPercent ?? orderStats.ordersGrowthPercent ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* HEADER & TIME RANGE FILTER                                        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Tổng quan bảng điều khiển
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hệ thống kinh doanh và giám sát thời gian thực PickleHub E-Commerce
          </p>
        </div>

        {/* Global Time Range Filter Dropdown */}
        <div className="flex items-center gap-2">
          <DatePeriodFilter value={period} onChange={setPeriod} />

          <button
            onClick={fetchDashboardData}
            title="Làm mới dữ liệu"
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4 STAT CARDS                                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
            {/* 4 METRIC CARDS WITH REFINED VISUAL HIERARCHY & DATA-DRIVEN ANIMATIONS */}
      <div ref={cardsContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Revenue (Hero Metric) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-50/25 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm space-y-3 relative overflow-hidden group">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5" title={`Doanh thu (${period.label})`}>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Doanh thu ({period.label})
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              TRỌNG TÂM
            </span>
          </div>
          {statsLoading || analyticsLoading ? (
            <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <div className="font-display font-black text-3xl sm:text-[32px] text-slate-900 dark:text-white tracking-tight">
              <AnimatedNumber
                value={displayRevenue}
                formatter={(val) =>
                  val >= 1_000_000
                    ? `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M ₫`
                    : `${Math.round(val).toLocaleString('vi-VN')} ₫`
                }
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold ${
                revenueGrowth >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {revenueGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {revenueGrowth >= 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`}
              </span>
              <span className="text-slate-400 text-[11px] font-medium">so với kỳ trước</span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              Tháng này: {orderStats.totalOrdersThisMonth} đơn
            </span>
          </div>
        </div>

        {/* Metric 2: Orders */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5" title={`Đơn hàng (${period.label})`}>
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              Đơn hàng ({period.label})
            </span>
          </div>
          {statsLoading || analyticsLoading ? (
            <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <div className="font-display font-black text-3xl text-slate-900 dark:text-white">
              <AnimatedNumber
                value={displayOrders}
                formatter={(val) => Math.round(val).toLocaleString('vi-VN')}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold ${
                ordersGrowth >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {ordersGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {ordersGrowth >= 0 ? `+${ordersGrowth}%` : `${ordersGrowth}%`}
              </span>
              <span className="text-slate-400 text-[11px] font-medium">so với kỳ trước</span>
            </div>
            <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
              Chờ duyệt: {orderStats.pendingOrders}
            </span>
          </div>
        </div>

        {/* Metric 3: Customers */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Tổng khách hàng
            </span>
          </div>
          {statsLoading ? (
            <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <div className="font-display font-black text-3xl text-slate-900 dark:text-white">
              <AnimatedNumber
                value={customerStats.totalCustomers}
                formatter={(val) => Math.round(val).toLocaleString('vi-VN')}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <span>Mới tuần này: <strong className="text-emerald-600 dark:text-emerald-400">{customerStats.newThisMonth}</strong></span>
            </div>
            <span className="text-slate-400 text-[11px] font-medium">Khóa: {customerStats.blockedCount}</span>
          </div>
        </div>

        {/* Metric 4: Low Stock & Out of Stock Alert (Actionable Alert Card) */}
        <div
          onClick={() => setIsLowStockModalOpen(true)}
          className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border shadow-sm space-y-3 cursor-pointer transition-all group relative ${
            lowStockItems.length > 0
              ? 'border-rose-300 dark:border-rose-800/80 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
          title="Nhấp vào để xem chi tiết các sản phẩm cảnh báo và điều chỉnh ngưỡng"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center gap-1">
              Cảnh báo tồn kho
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            {lowStockItems.length > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                Cần chú ý
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                An toàn
              </span>
            )}
          </div>
          {inventoryLoading ? (
            <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <div className={`font-display font-black text-3xl ${
              lowStockItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              <AnimatedNumber
                value={lowStockItems.length}
                formatter={(val) => `${Math.round(val)}`}
              /> <span className="text-xs font-bold text-slate-400 font-sans">sản phẩm</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {outOfStockCount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 text-[11px] font-black flex items-center gap-1">
                🔴 {outOfStockCount} hết hàng
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                ✅ 0 hết hàng
              </span>
            )}
            <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold">
              🟡 {nearOutOfStockCount} sắp hết
            </span>
          </div>
        </div>
      </div>

            {/* ───────────────────────────────────────────────────────────────── */}
      {/* DASHBOARD SUB-TAB NAVIGATION                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Biểu đồ & Xu hướng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders_conversion')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'orders_conversion'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn hàng & Chuyển đổi</span>
            {orderStats.pendingOrders > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black">
                {orderStats.pendingOrders}
              </span>
            )}
          </button>
        </div>

        <span className="hidden sm:inline text-xs text-slate-400 font-medium">
          {activeTab === 'analytics'
            ? 'Theo dõi doanh thu, phân bổ đơn và top sản phẩm'
            : 'Quản lý đơn hàng phát sinh và hiệu suất chuyển đổi sản phẩm'}
        </span>
      </div>

      {/* ── TAB 1: BIỂU ĐỒ & XU HƯỚNG ──────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* ───────────────────────────────────────────────────────────────── */}
      {/* BIỂU ĐỒ DOANH THU THEO THỜI GIAN (AREA CHART FULL-WIDTH)           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <RevenueAreaChart
        timeline={revenueAnalytics?.timeline ?? []}
        totalRevenue={displayRevenue}
        totalOrders={displayOrders}
        growthPercent={revenueGrowth}
        days={days}
        periodLabel={period.label}
        loading={analyticsLoading}
      />

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2 CỘT BIỂU ĐỒ (TOP PRODUCTS REAL ORDERS & ORDER STATUS DONUT)     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Best Seller Products Bar Chart */}
        <TopProductsChart
          products={topProductItems}
          loading={analyticsLoading || catalogLoading}
        />

        {/* Order Status Donut Chart */}
        <OrderStatusDonutChart
          items={statusDistribution?.items ?? []}
          totalOrders={statusDistribution?.totalOrders ?? 0}
          days={days}
          periodLabel={period.label}
          loading={analyticsLoading}
        />
      </div>
        </div>
      )}

      {/* ── TAB 2: ĐƠN HÀNG GẦN ĐÂY & HIỆU SUẤT CHUYỂN ĐỔI ────────────── */}
      {activeTab === 'orders_conversion' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. ĐƠN HÀNG GẦN ĐÂY VỚI BỘ LỌC TÌM KIẾM & TRẠNG THÁI TIỆN LỢI      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
        
        {/* Header & Quick Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
              Đơn hàng gần đây
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Danh sách các đơn đặt hàng mới nhất phát sinh trên toàn hệ thống
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên, SĐT..."
                value={orderSearchKeyword}
                onChange={(e) => setOrderSearchKeyword(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-500 w-44 sm:w-56 transition-all"
              />
              {orderSearchKeyword && (
                <button
                  onClick={() => setOrderSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-2.5 py-1.5 text-xs font-bold">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="shipping">Đang giao</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <Link
              href="/admin/orders"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 shrink-0"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Table Content */}
        {recentOrdersLoading ? (
          <div className="space-y-3 py-4 animate-pulse">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : filteredRecentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
            {orderSearchKeyword || orderStatusFilter !== 'all'
              ? 'Không tìm thấy đơn hàng nào khớp với điều kiện lọc'
              : 'Chưa có đơn hàng nào phát sinh gần đây'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-extrabold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5 px-3">Mã đơn hàng</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Thời gian đặt</th>
                  <th className="py-2.5 px-3">Sản phẩm tiêu biểu</th>
                  <th className="py-2.5 px-3">Tổng tiền</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {filteredRecentOrders.slice(0, 8).map((ord) => {
                  const avatarChar = (ord.customerName || 'U').charAt(0).toUpperCase();
                  const formattedDate = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '—';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-black text-slate-900 dark:text-white">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-xs shrink-0">
                            {avatarChar}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-900 dark:text-white">{ord.customerName}</span>
                            <span className="text-[10px] text-slate-400 block">{ord.customerPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-medium">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <span className="truncate block font-medium text-slate-800 dark:text-slate-200" title={ord.firstItemName}>
                          {ord.firstItemName || 'Sản phẩm Pickleball'}
                          {ord.itemCount > 1 && <span className="text-[10px] text-slate-400 ml-1">+{ord.itemCount - 1} món</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-display font-black text-slate-900 dark:text-white">
                        {ord.totalAmount.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3.5 px-3">
                        {renderOrderStatusBadge(ord.status)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/admin/orders`}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-all inline-block"
                        >
                          Xem
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* PHÂN TÍCH VIEW COUNT VS SOLD COUNT & TỶ LỆ CHUYỂN ĐỔI             */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <ProductConversionSection
        products={conversionProducts}
        needsReviewList={productInsights?.needsReview ?? []}
        loading={catalogLoading}
      />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* QUICK RESTOCK MODAL                                               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {restockProduct && (
        <div
          onClick={() => setRestockProduct(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative cursor-default"
          >
            <button
              onClick={() => setRestockProduct(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-950 px-2.5 py-0.5 rounded-full">
                NHẬP BỔ SUNG TỒN KHO
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-snug">
                {restockProduct.productName || restockProduct.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {restockProduct.sku} · Tồn kho hiện tại: <span className="font-black text-rose-600">{restockProduct.quantity ?? restockProduct.stock ?? 0}</span> món
              </p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-600 dark:text-slate-300 font-bold">Số lượng nhập thêm vào kho</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-black text-base text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Xác nhận Nhập kho (+{addQty})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LOW STOCK ALERT & THRESHOLD MANAGEMENT MODAL ──────────────── */}
      <LowStockAlertModal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        inventoryList={inventoryList}
        stockThreshold={stockThreshold}
        onUpdateGlobalThreshold={(val) => setStockThreshold(val)}
        onRefreshInventory={refreshInventoryData}
      />

    </div>
  );
};
