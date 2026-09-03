'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCircle2, Clock, Calendar, ArrowLeft, Filter, Trash2, CheckCheck, ExternalLink, ShieldCheck, Tag, ShoppingBag, X, QrCode
} from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { cartOrderApi } from '@/lib/api/cartOrderApi';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllRead, fetchNotifications, loading } = useNotificationStore();
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days' | 'older'>('all');

  // Modal Chi Tiết Đơn Hàng từ thông báo
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

  const filteredNotifications = notifications.filter((n) => {
    const time = new Date(n.createdAt).getTime();

    if (timeFilter === 'today') {
      return time >= startOfToday;
    }
    if (timeFilter === '7days') {
      return time >= sevenDaysAgo;
    }
    if (timeFilter === '30days') {
      return time >= thirtyDaysAgo;
    }
    if (timeFilter === 'older') {
      return time < thirtyDaysAgo;
    }
    return true; // 'all'
  });

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full">
                TRUNG TÂM THÔNG BÁO
              </span>
              {unreadCount > 0 && (
                <span className="text-xs bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
              Thông báo của bạn
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={() => markAllRead()}
                className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Đánh dấu tất cả đã đọc</span>
              </button>
            )}

            <button
              onClick={() => router.back()}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          </div>
        </div>

        {/* Time Filters Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-800 text-slate-400 shrink-0">
            <Filter className="w-4 h-4 text-emerald-500" />
            <span>Lọc theo thời gian:</span>
          </div>

          {[
            { id: 'all', label: 'Tất cả thông báo' },
            { id: 'today', label: 'Hôm nay' },
            { id: '7days', label: '7 ngày qua' },
            { id: '30days', label: '30 ngày qua' },
            { id: 'older', label: 'Cũ hơn' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                timeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-16 text-center text-xs font-medium text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Đang tải danh sách thông báo từ CSDL...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((n) => {
              const handleOpenOrderDetail = async () => {
                if (!n.isRead) markAsRead(n.id);

                const orderCodeMatch = n.content.match(/#?([A-Za-z0-9]{6,36})/);
                const code = orderCodeMatch ? orderCodeMatch[1] : '';

                setLoadingOrderDetails(true);
                setSelectedOrderDetails({
                  orderNumber: code ? `#${code}` : '#PH-ORDER',
                  createdAt: n.createdAt,
                  status: 'Pending',
                  paymentStatus: 'Pending',
                  paymentMethod: 'COD',
                  items: [],
                  totalAmount: 30000,
                });

                try {
                  const orders = await cartOrderApi.getMyOrders();
                  const matchedOrder = orders.find(
                    (o: any) =>
                      (o.orderNumber && o.orderNumber.toLowerCase().includes(code.toLowerCase())) ||
                      (o.id && o.id.toLowerCase().includes(code.toLowerCase()))
                  ) || orders[0];

                  if (matchedOrder) {
                    const full = await cartOrderApi.getMyOrderById(matchedOrder.id);
                    setSelectedOrderDetails(full || matchedOrder);
                  }
                } catch (err) {
                  console.warn('[Notifications] fetch order detail error:', err);
                } finally {
                  setLoadingOrderDetails(false);
                }
              };

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                    if (n.title.includes('Đặt hàng') || n.content.includes('đơn hàng') || n.action === 'VIEW_ORDER') {
                      handleOpenOrderDetail();
                    } else if (n.action && (n.action.startsWith('/') || n.action.startsWith('http'))) {
                      router.push(n.action);
                    }
                  }}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 shadow-sm hover:shadow-md ${
                    n.isRead
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                  }`}
                >
                <div className={`p-3 rounded-2xl shrink-0 ${
                  n.isRead 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{n.title}</span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.content}
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOrderDetail();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <span>Xem chi tiết ngay</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy thông báo nào trong thời gian này</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hãy thử chọn khoảng thời gian khác trên thanh lọc.
            </p>
          </div>
        )}

      </div>

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG TRỰC TIẾP */}
      {selectedOrderDetails && (
        <div
          onClick={() => setSelectedOrderDetails(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5 max-h-[90vh] overflow-y-auto cursor-default"
          >
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                  Chi tiết Đơn hàng {selectedOrderDetails.orderNumber || `#PH${(selectedOrderDetails.id || '').substring(0, 5).toUpperCase()}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingOrderDetails ? (
              <div className="py-12 text-center text-xs font-medium text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Đang tải thông tin đơn hàng...</p>
              </div>
            ) : (
              <>
                {/* Trạng thái đơn hàng */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs font-semibold">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Trạng thái giao hàng</span>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 font-bold">
                      {selectedOrderDetails.status === 'Completed' ? 'Đã hoàn thành' :
                       selectedOrderDetails.status === 'Shipping' ? 'Đang giao hàng' :
                       selectedOrderDetails.status === 'Cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                    </span>
                  </div>
                  {selectedOrderDetails.paymentMethod?.toUpperCase() !== 'COD' && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Trạng thái thanh toán</span>
                      <span className="inline-block mt-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold">
                        {selectedOrderDetails.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Thông tin giao hàng */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Thông tin giao hàng</span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Người nhận:</strong> {selectedOrderDetails.recipientName || selectedOrderDetails.customerName || 'Nguyễn Đình Quang Dũng'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Số điện thoại:</strong> {selectedOrderDetails.recipientPhone || selectedOrderDetails.customerPhone || '090 123 4567'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Địa chỉ giao hàng:</strong> {selectedOrderDetails.shippingAddress || '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM'}
                  </p>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Sản phẩm đã đặt ({selectedOrderDetails.items?.length || 1})
                  </h4>
                  <div className="space-y-2 border border-slate-200/80 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item: any, idx: number) => {
                        const itemName = item.productNameSnapshot || item.name || 'Sản phẩm Pickleball';
                        const itemImg = item.imageUrlSnapshot || item.image || '/images/paddle.png';
                        const itemPrice = item.unitPrice || item.price || 0;
                        return (
                          <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <img src={itemImg} alt="" className="w-12 h-12 object-contain bg-slate-50 dark:bg-slate-800 rounded-xl border p-1 shrink-0" />
                              <div>
                                <h5 className="font-bold text-slate-900 dark:text-white">{itemName}</h5>
                                <span className="text-slate-400 text-[11px]">
                                  Số lượng: {item.quantity} x {itemPrice.toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white font-mono">
                              {(itemPrice * item.quantity).toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <img src={selectedOrderDetails.firstItemImage || '/images/paddle.png'} alt="" className="w-12 h-12 object-contain bg-slate-50 dark:bg-slate-800 rounded-xl border p-1 shrink-0" />
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-white">
                              {selectedOrderDetails.firstItemName || 'Bóng PickleHub Tournament (Hộp 6 quả)'}
                            </h5>
                            <span className="text-slate-400 text-[11px]">Số lượng: 1 x 10.000 ₫</span>
                          </div>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          {selectedOrderDetails.totalAmount?.toLocaleString('vi-VN') || '10.000'} ₫
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tổng thanh toán */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Hình thức thanh toán:</span>
                    <strong className="text-white">{selectedOrderDetails.paymentMethod || 'COD'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Phí vận chuyển:</span>
                    <strong className="text-emerald-400">Miễn phí (0 ₫)</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="font-bold text-sm text-slate-300">Tổng thanh toán:</span>
                    <span className="text-xl font-black text-emerald-400 font-display">
                      {selectedOrderDetails.totalAmount ? selectedOrderDetails.totalAmount.toLocaleString('vi-VN') : '30.000'} ₫
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
