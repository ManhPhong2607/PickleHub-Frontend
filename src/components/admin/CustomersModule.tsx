'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, type AdminCustomerDto } from '@/lib/api/adminApi';
import { useResizableColumns, ResizeHandle } from '@/hooks/useResizableColumns';
import {
  Users, Lock, Unlock, Eye, Search, RefreshCw, ChevronLeft, ChevronRight, X,
  Crown, Sparkles, Award, ShieldCheck, User, MapPin, Phone, Mail, Calendar,
  CreditCard, TrendingUp, CheckCircle2, AlertTriangle, Building
} from 'lucide-react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[1, 2, 3, 4, 5, 6, 7].map(i => (
      <td key={i} className="py-4 px-5">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
        {i === 1 && <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2 mt-1.5" />}
      </td>
    ))}
  </tr>
);

export const CustomersModule: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomerDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDto | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [toast, setToast] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getCustomers({
        keyword: searchQuery || undefined,
        page,
        pageSize,
      });
      setCustomers(result.items);
      setTotal(result.totalItems);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page]);

  const { widths, totalWidth, activeResizingKey, startResize } = useResizableColumns({
    storageKey: 'pickle_col_widths_customers_v2',
    defaultWidths: {
      name: 210,
      email: 210,
      phone: 130,
      tier: 170,
      spent: 150,
      date: 130,
      status: 130,
      actions: 170,
    },
    minWidths: {
      name: 150,
      email: 150,
      phone: 100,
      tier: 130,
      spent: 110,
      date: 100,
      status: 100,
      actions: 140,
    },
  });

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { setPage(1); }, [searchQuery]);

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(val), 300);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleOpenDetail = async (customer: AdminCustomerDto) => {
    setSelectedCustomer(customer);
    setCustomerDetail(customer);
    setLoadingDetail(true);
    try {
      const detail = await adminApi.getCustomerDetail(customer.id);
      setCustomerDetail(detail);
    } catch (err) {
      console.warn('[CustomersModule] Could not load customer detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleBlock = async (customer: AdminCustomerDto) => {
    setBlocking(true);
    try {
      const newVal = !customer.isBlocked;
      await adminApi.toggleBlockCustomer(customer.id, newVal);
      showToast(`Đã ${newVal ? 'KHÓA' : 'MỞ KHÓA'} tài khoản ${customer.fullName}!`);
      fetchCustomers();
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer({ ...customer, isBlocked: newVal });
      }
      if (customerDetail?.id === customer.id) {
        setCustomerDetail({ ...customerDetail, isBlocked: newVal });
      }
    } catch (e: any) {
      showToast('Lỗi: ' + (e?.response?.data?.message || e.message || 'Thao tác thất bại'));
    } finally {
      setBlocking(false);
    }
  };

  const renderTierBadge = (tierName?: string, discountPercent?: number) => {
    const name = tierName || 'Thành viên mới';
    if (name.toLowerCase().includes('champion')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          Champion ({discountPercent ?? 15}%)
        </span>
      );
    }
    if (name.toLowerCase().includes('ace')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-400/40">
          <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          Ace ({discountPercent ?? 10}%)
        </span>
      );
    }
    if (name.toLowerCase().includes('rally')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-400/40">
          <Award className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          Rally ({discountPercent ?? 7}%)
        </span>
      );
    }
    if (name.toLowerCase().includes('rookie')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          Rookie ({discountPercent ?? 5}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <User className="w-3 h-3 text-slate-400 shrink-0" />
        Thành viên mới
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xl animate-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Quản lý khách hàng
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Xem hồ sơ, cấp bậc thành viên, chi tiêu và thực hiện Khóa / Mở khóa. Tổng: <strong>{total}</strong> khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
          <button onClick={fetchCustomers} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors" title="Làm mới">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
            className="text-xs text-left table-fixed border-collapse"
          >
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th style={{ width: widths.name }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Họ và tên
                  <ResizeHandle onMouseDown={(e) => startResize('name', e)} isResizing={activeResizingKey === 'name'} />
                </th>
                <th style={{ width: widths.email }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Email
                  <ResizeHandle onMouseDown={(e) => startResize('email', e)} isResizing={activeResizingKey === 'email'} />
                </th>
                <th style={{ width: widths.phone }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  SĐT
                  <ResizeHandle onMouseDown={(e) => startResize('phone', e)} isResizing={activeResizingKey === 'phone'} />
                </th>
                <th style={{ width: widths.tier }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Cấp bậc Loyalty
                  <ResizeHandle onMouseDown={(e) => startResize('tier', e)} isResizing={activeResizingKey === 'tier'} />
                </th>
                <th style={{ width: widths.spent }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Tổng chi tiêu
                  <ResizeHandle onMouseDown={(e) => startResize('spent', e)} isResizing={activeResizingKey === 'spent'} />
                </th>
                <th style={{ width: widths.date }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Ngày tham gia
                  <ResizeHandle onMouseDown={(e) => startResize('date', e)} isResizing={activeResizingKey === 'date'} />
                </th>
                <th style={{ width: widths.status }} className="relative py-4 px-5 select-none border-r border-slate-100 dark:border-slate-800">
                  Trạng thái
                  <ResizeHandle onMouseDown={(e) => startResize('status', e)} isResizing={activeResizingKey === 'status'} />
                </th>
                <th style={{ width: widths.actions }} className="relative py-4 px-5 text-right select-none">
                  Thao tác
                  <ResizeHandle onMouseDown={(e) => startResize('actions', e)} isResizing={activeResizingKey === 'actions'} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="text-sm text-rose-600 font-bold mb-2">{error}</div>
                    <button onClick={fetchCustomers} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">Thử lại</button>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400 font-medium">Không tìm thấy khách hàng nào.</td>
                </tr>
              ) : customers.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-5 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                        {cust.fullName.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white truncate">{cust.fullName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-700 dark:text-slate-300 truncate border-r border-slate-100 dark:border-slate-800">{cust.email}</td>
                  <td className="py-4 px-5 font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{cust.phone || cust.phoneNumber || '—'}</td>
                  <td className="py-4 px-5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    {renderTierBadge(cust.loyaltyTierName || cust.currentTierName, cust.loyaltyDiscountPercent || cust.currentDiscountPercent)}
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    {(cust.totalSpent ?? 0).toLocaleString('vi-VN')}₫
                  </td>
                  <td className="py-4 px-5 text-slate-500 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="py-4 px-5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      cust.isBlocked ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    }`}>
                      {cust.isBlocked ? 'Đã bị khóa' : 'Đang hoạt động'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleOpenDetail(cust)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hồ sơ</span>
                    </button>
                    <button
                      disabled={blocking}
                      onClick={() => handleToggleBlock(cust)}
                      className={`px-3 py-1.5 font-bold rounded-xl transition-all inline-flex items-center gap-1 ${
                        cust.isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      } disabled:opacity-60`}>
                      {cust.isBlocked ? <><Unlock className="w-3.5 h-3.5" /><span>Mở</span></> : <><Lock className="w-3.5 h-3.5" /><span>Khóa</span></>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && total > pageSize && (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Trang {page}/{totalPages} • {total} khách hàng</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return <button key={pg} onClick={() => setPage(pg)} className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${pg === page ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{pg}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Customer Profile Detail Modal */}
      {selectedCustomer && (
        <div
          onClick={() => setSelectedCustomer(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 my-8 cursor-default"
          >
            <button onClick={() => setSelectedCustomer(null)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black flex items-center justify-center text-2xl shadow-lg shadow-emerald-600/20 shrink-0">
                {(customerDetail?.fullName || selectedCustomer.fullName).charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {customerDetail?.fullName || selectedCustomer.fullName}
                  </h3>
                  {renderTierBadge(customerDetail?.currentTierName || selectedCustomer.loyaltyTierName, customerDetail?.currentDiscountPercent || selectedCustomer.loyaltyDiscountPercent)}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    (customerDetail?.isBlocked ?? selectedCustomer.isBlocked)
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}>
                    {(customerDetail?.isBlocked ?? selectedCustomer.isBlocked) ? 'Đã khóa' : 'Hoạt động'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Tham gia: {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                  {selectedCustomer.userId && (
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      ID: {selectedCustomer.userId.substring(0, 8)}...
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Loyalty & Financial Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white space-y-4 shadow-xl border border-amber-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Thông tin Cấp bậc Loyalty & Chi tiêu
                </span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {customerDetail?.currentDiscountPercent ?? selectedCustomer.loyaltyDiscountPercent ?? 0}% Chiết khấu
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tổng chi tiêu</span>
                  <span className="text-base font-extrabold text-white block">
                    {(customerDetail?.totalSpent ?? selectedCustomer.totalSpent ?? 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">HubPoints tích lũy</span>
                  <span className="text-base font-extrabold text-amber-400 block">
                    {Math.floor((customerDetail?.totalSpent ?? selectedCustomer.totalSpent ?? 0) / 1000).toLocaleString('vi-VN')} Pts
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hạng tiếp theo</span>
                  <span className="text-base font-extrabold text-emerald-400 block">
                    {customerDetail?.nextTierName || 'Hạng tối đa'}
                  </span>
                </div>
              </div>

              {/* Progress to next tier */}
              {customerDetail?.nextTierName && customerDetail?.nextTierMinSpend && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-amber-400">Tiến trình đến {customerDetail.nextTierName}</span>
                    <span className="text-slate-300">
                      {(customerDetail.totalSpent ?? 0).toLocaleString('vi-VN')}₫ / {customerDetail.nextTierMinSpend.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round(((customerDetail.totalSpent ?? 0) / customerDetail.nextTierMinSpend) * 100))}%`
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Cần chi tiêu thêm <strong className="text-white font-bold">{(customerDetail.amountNeededForNextTier ?? 0).toLocaleString('vi-VN')}₫</strong> để mở khóa ưu đãi hạng mới.
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Địa chỉ Email
                </span>
                <p className="font-bold text-slate-900 dark:text-white break-all">{selectedCustomer.email}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1 border border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Số điện thoại
                </span>
                <p className="font-bold text-slate-900 dark:text-white font-mono">{selectedCustomer.phone || selectedCustomer.phoneNumber || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Saved Delivery Addresses */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Sổ địa chỉ nhận hàng ({customerDetail?.addresses?.length ?? 0})
              </h4>

              {loadingDetail ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-400 animate-pulse">
                  Đang tải thông tin địa chỉ...
                </div>
              ) : (customerDetail?.addresses && customerDetail.addresses.length > 0) ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {customerDetail.addresses.map((addr: any) => (
                    <div key={addr.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{addr.fullName} • <span className="font-mono text-slate-500">{addr.phoneNumber}</span></span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
                  Khách hàng chưa lưu địa chỉ nhận hàng nào.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                disabled={blocking}
                onClick={() => handleToggleBlock(selectedCustomer)}
                className={`w-full py-3.5 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                  (customerDetail?.isBlocked ?? selectedCustomer.isBlocked)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                }`}
              >
                {(customerDetail?.isBlocked ?? selectedCustomer.isBlocked) ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Mở khóa tài khoản khách hàng</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Khóa tài khoản khách hàng này</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
