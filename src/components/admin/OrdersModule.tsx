'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Download, X, Check, Copy, ChevronLeft, ChevronRight,
  Package, RefreshCw, Truck, CheckCircle2, XCircle, Clock, RotateCcw,
  QrCode, Building2, Sparkles, ExternalLink
} from 'lucide-react';
import { adminApi, type AdminOrderDto, type AdminOrderDetailDto } from '@/lib/api/adminApi';
import { useResizableColumns, ResizeHandle } from '@/hooks/useResizableColumns';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Pending:   { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400' },
  Confirmed: { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400' },
  Shipping:  { label: 'Đang giao',    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400' },
  Completed: { label: 'Hoàn thành',   color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' },
  Cancelled: { label: 'Đã hủy',       color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400' },
};

const statusStep: Record<string, number> = {
  Pending: 0, Confirmed: 1, Shipping: 2, Completed: 3, Cancelled: -1,
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, color: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Skeleton Row ────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
      <td key={i} className="py-4 px-5">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
        {i === 1 && <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2 mt-1.5" />}
      </td>
    ))}
  </tr>
);

// ─── Detail Modal ────────────────────────────────────────────────────────────

import { VIETNAMESE_BANKS } from '@/lib/constants/banks';

interface DetailModalProps {
  orderId: string;
  onClose: () => void;
  onRefresh: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ orderId, onClose, onRefresh }) => {
  const [detail, setDetail] = useState<AdminOrderDetailDto | null>(null);
  const [refund, setRefund] = useState<any | null>(null);
  const [customBank, setCustomBank] = useState('MB');
  const [customAccount, setCustomAccount] = useState('');
  const [customName, setCustomName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [shippingProvider, setShippingProvider] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.getOrderDetail(orderId).then(d => {
        setDetail(d);
        setShippingProvider(d.shippingProvider || '');
        setTrackingNumber(d.trackingNumber || '');
      }),
      adminApi.getRefundByOrder(orderId).then(r => {
        setRefund(r);
        if (r) {
          if (r.bankCode) setCustomBank(r.bankCode);
          if (r.accountNumber) setCustomAccount(r.accountNumber);
          if (r.accountName) setCustomName(r.accountName);
        }
      }).catch(() => setRefund(null)),
    ]).catch(() => setDetail(null)).finally(() => setLoading(false));
  }, [orderId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    setSaving(true);
    try {
      await action();
      showToast(successMsg);
      onRefresh();
      // Reload refund if applicable
      adminApi.getRefundByOrder(orderId).then(setRefund).catch(() => {});
      setTimeout(onClose, 1200);
    } catch (e: any) {
      showToast('Lỗi: ' + (e?.response?.data?.message || e.message || 'Thao tác thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const handleProcessRefund = async (action: 'Approve' | 'Reject') => {
    if (!refund) return;
    const finalBankRef = bankRef.trim() || `FT${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
    setSaving(true);
    try {
      if (customAccount.trim() && (customAccount !== refund.accountNumber || customBank !== refund.bankCode || customName !== refund.accountName)) {
        await adminApi.updateRefundBankInfo(orderId, {
          bankCode: customBank,
          accountNumber: customAccount.trim(),
          accountName: customName.trim(),
        });
      }

      await adminApi.processRefund(refund.id, action, finalBankRef, adminNote);
      showToast(action === 'Approve' ? 'Đã duyệt và xác nhận hoàn tiền thành công!' : 'Đã từ chối yêu cầu hoàn tiền.');
      onRefresh();
      const updated = await adminApi.getRefundByOrder(orderId);
      setRefund(updated);
    } catch (e: any) {
      showToast('Lỗi: ' + (e?.response?.data?.message || e.message || 'Thao tác hoàn tiền thất bại'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
              CHI TIẾT ĐƠN HÀNG
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              #PH{orderId.substring(0, 5).toUpperCase()}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {toast}
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        ) : !detail ? (
          <div className="p-8 text-center text-sm text-slate-500">Không thể tải chi tiết đơn hàng.</div>
        ) : (
          <div className="p-5 space-y-4 text-xs">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Trạng thái</span>
              <StatusBadge status={detail.status} />
            </div>

            {/* Customer info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
              <div className="font-bold text-slate-400 uppercase text-[10px]">Thông tin giao hàng</div>
              <div className="flex justify-between"><span className="text-slate-500">Khách hàng:</span><span className="font-bold text-slate-900 dark:text-white">{detail.shippingFullName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">SĐT:</span><span className="font-mono">{detail.shippingPhone}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Địa chỉ:</span>
                <span className="text-right max-w-[60%] text-slate-700 dark:text-slate-300">
                  {[detail.shippingStreetAddress, detail.shippingWard, detail.shippingDistrict, detail.shippingProvince].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="font-bold text-slate-400 uppercase text-[10px]">Sản phẩm ({detail.items.length})</div>
              {detail.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{item.productName}</div>
                    <div className="text-slate-500">x{item.quantity} × {item.unitPrice.toLocaleString('vi-VN')} ₫</div>
                  </div>
                  <div className="font-extrabold text-slate-900 dark:text-white shrink-0">
                    {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
              <div className="flex justify-between text-slate-500"><span>Tạm tính:</span><span>{detail.subtotal.toLocaleString('vi-VN')} ₫</span></div>
              <div className="flex justify-between text-slate-500"><span>Phí vận chuyển:</span><span>{detail.shippingFee.toLocaleString('vi-VN')} ₫</span></div>
              <div className="flex justify-between font-extrabold text-slate-900 dark:text-white text-sm border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Tổng cộng:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{detail.totalAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            {/* Shipping update */}
            {(detail.status === 'Confirmed' || detail.status === 'Shipping' || detail.status === 'Pending') && (
              <div className="space-y-2.5 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    Cập nhật vận chuyển
                  </span>
                  {(detail.trackingUrl || trackingNumber) && (
                    <a
                      href={
                        detail.trackingUrl ||
                        (shippingProvider === 'GHTK'
                          ? `https://i.ghtk.vn/${trackingNumber}`
                          : shippingProvider === 'GHN'
                          ? `https://donhang.ghn.vn/?order_code=${trackingNumber}`
                          : shippingProvider === 'VIETTELPOST'
                          ? `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?code=${trackingNumber}`
                          : shippingProvider === 'JANDT'
                          ? `https://jtexpress.vn/vi/tracking?billcode=${trackingNumber}`
                          : shippingProvider === 'VNPOST'
                          ? `http://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=${trackingNumber}`
                          : shippingProvider === 'SPX'
                          ? `https://spx.vn/track?tracking_number=${trackingNumber}`
                          : `https://google.com/search?q=${trackingNumber}`)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Tra cứu thử</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <select
                    value={shippingProvider}
                    onChange={(e) => setShippingProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Chọn đơn vị vận chuyển --</option>
                    <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
                    <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                    <option value="VIETTELPOST">Viettel Post</option>
                    <option value="JANDT">J&T Express</option>
                    <option value="VNPOST">VNPost (Bưu điện Việt Nam)</option>
                    <option value="SPX">Shopee Express (SPX)</option>
                    <option value="HOATOC">Giao hàng hỏa tốc nội thành (AhaMove/Grab)</option>
                    <option value="OTHER">Đơn vị vận chuyển khác</option>
                  </select>

                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Nhập mã vận đơn (VD: S22.10892345, GHN892173...)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:border-emerald-500"
                  />
                </div>

                <button
                  disabled={saving || !shippingProvider || !trackingNumber}
                  onClick={() =>
                    handleAction(
                      () => adminApi.updateOrderShipping(detail.id, shippingProvider, trackingNumber),
                      'Đã cập nhật thông tin vận chuyển và link tra cứu cho khách!'
                    )
                  }
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu & Cập nhật vận đơn cho khách'}</span>
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              {detail.status === 'Pending' && (
                <button
                  disabled={saving}
                  onClick={() => handleAction(() => adminApi.confirmOrder(detail.id), 'Đã xác nhận đơn hàng!')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xác nhận đơn
                </button>
              )}
              {detail.status === 'Shipping' && (
                <button
                  disabled={saving}
                  onClick={() => handleAction(() => adminApi.completeOrder(detail.id), 'Đã hoàn thành đơn hàng!')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xác nhận giao thành công
                </button>
              )}
              {(detail.status === 'Pending' || detail.status === 'Confirmed') && (
                <button
                  disabled={saving}
                  onClick={() => handleAction(() => adminApi.cancelOrder(detail.id, 'Admin hủy'), 'Đã hủy đơn hàng!')}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Hủy đơn hàng
                </button>
              )}
            </div>

            {detail.status === 'Cancelled' && detail.cancelReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-medium">
                <span className="font-bold">Lý do hủy: </span>{detail.cancelReason}
              </div>
            )}

            {/* Refund Management Card for Cancelled & Paid Orders (CHỈ HIỆN KHI ĐƠN HÀNG ĐÃ BỊ HỦY) */}
            {detail.status === 'Cancelled' && refund && (() => {
              const effectiveBank = customBank || (refund.bankCode && refund.bankCode !== '970422' ? refund.bankCode : 'MB');
              const effectiveAccount = customAccount.trim() || (refund.accountNumber && refund.accountNumber !== '2281072020614' ? refund.accountNumber.trim() : '');
              const effectiveName = customName.trim() || refund.accountName?.trim() || '';
              const refundContent = `HOANTIEN PH${orderId.substring(0, 5).toUpperCase()}`;
              const qrUrl = effectiveAccount
                ? `https://img.vietqr.io/image/${effectiveBank}-${effectiveAccount}-compact2.png?amount=${refund.amount || 0}&addInfo=${encodeURIComponent(refundContent)}&accountName=${encodeURIComponent(effectiveName)}`
                : null;

              return (
                <div className="p-4 bg-gradient-to-b from-amber-50/80 to-amber-100/40 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-800/40 pb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <QrCode className="w-4 h-4 text-amber-500" />
                      <span>Hoàn tiền nhanh qua VietQR</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      (refund.status === 'Completed' || refund.status === 3)
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        : (refund.status === 'Rejected' || refund.status === 2)
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                        : (refund.status === 'WaitingForBankInfo' || refund.status === 4 || !effectiveAccount)
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-400 animate-pulse font-black'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
                    }`}>
                      {(refund.status === 'Completed' || refund.status === 3)
                        ? 'ĐÃ HOÀN TIỀN'
                        : (refund.status === 'Rejected' || refund.status === 2)
                        ? 'ĐÃ TỪ CHỐI'
                        : (refund.status === 'WaitingForBankInfo' || refund.status === 4 || !effectiveAccount)
                        ? 'CHỜ KHÁCH BỔ SUNG STK'
                        : 'SẴN SÀNG QUÉT MÃ HOÀN TIỀN'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between items-center bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-amber-200/50 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Số tiền cần hoàn trả:</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 text-base">
                        {refund.amount?.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    {refund.reason && (
                      <div className="flex justify-between text-[11px] px-1">
                        <span className="text-slate-500">Lý do hủy:</span>
                        <span className="italic text-slate-600 dark:text-slate-400">{refund.reason}</span>
                      </div>
                    )}
                  </div>

                  {(refund.status !== 'Completed' && refund.status !== 3 && refund.status !== 'Rejected' && refund.status !== 2) && (
                    <div className="space-y-3 pt-1">
                      {/* Ngân hàng & STK Nhận */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                            Thông tin tài khoản nhận
                          </span>
                          {!effectiveAccount ? (
                            <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">Khách chưa gửi STK (Admin có thể điền giúp)</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">✓ Đã có STK khách hàng</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ngân hàng</label>
                            <select
                              value={customBank}
                              onChange={e => setCustomBank(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none"
                            >
                              {VIETNAMESE_BANKS.map(b => (
                                <option key={b.code} value={b.code}>
                                  {b.code} - {b.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Số tài khoản (STK) *</label>
                            <input
                              type="text"
                              value={customAccount}
                              onChange={e => setCustomAccount(e.target.value.replace(/\s+/g, ''))}
                              placeholder="Nhập số tài khoản khách..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên chủ tài khoản (Tùy chọn)</label>
                          <input
                            type="text"
                            value={customName}
                            onChange={e => setCustomName(e.target.value.toUpperCase())}
                            placeholder="VD: NGUYEN VAN A"
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase outline-none"
                          />
                        </div>
                      </div>

                      {/* Khung Mã QR VietQR */}
                      {qrUrl ? (
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-2.5">
                          <div className="text-center">
                            <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200/80">
                              <img
                                src={qrUrl}
                                alt="VietQR Hoàn tiền"
                                className="w-48 h-auto mx-auto object-contain"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                              Mở App ngân hàng của bạn ➔ <strong className="text-emerald-600 dark:text-emerald-400">Quét mã QR</strong> ➔ Tiền & Nội dung đã được điền sẵn chuẩn xác 100%!
                            </p>
                          </div>

                          {/* Quick copy buttons */}
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyText('stk', effectiveAccount)}
                              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                            >
                              {copiedKey === 'stk' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>Sao chép STK</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText('amount', (refund.amount || 0).toString())}
                              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                            >
                              {copiedKey === 'amount' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>Số tiền</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText('content', refundContent)}
                              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                            >
                              {copiedKey === 'content' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>Nội dung</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                          Nhập <strong>Số tài khoản (STK)</strong> ở trên để hiển thị mã VietQR chuyển khoản hoàn tiền ngay lập tức.
                        </div>
                      )}

                      {/* Xử lý duyệt */}
                      <div className="space-y-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">
                              Mã giao dịch đối soát (FT Code)
                            </label>
                            <span className="text-[10px] text-slate-400 italic">Để trống = Tự động sinh mã FT</span>
                          </div>
                          <input
                            type="text"
                            value={bankRef}
                            onChange={e => setBankRef(e.target.value)}
                            placeholder={`VD: FT${orderId.substring(0, 5).toUpperCase()}${Date.now().toString().slice(-4)}`}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Ghi chú kế toán (Tùy chọn)
                          </label>
                          <input
                            type="text"
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            placeholder="Ghi chú đối soát..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleProcessRefund('Approve')}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác nhận đã chuyển khoản</span>
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleProcessRefund('Reject')}
                            className="px-3 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(refund.status === 'Completed' || refund.status === 3) && (
                    <div className="p-3 bg-emerald-100/60 dark:bg-emerald-950/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1.5 border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center gap-1 font-bold text-xs text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Đã hoàn tất chuyển khoản hoàn tiền</span>
                      </div>
                      <div><strong>Mã giao dịch ngân hàng:</strong> <span className="font-mono">{refund.bankTransactionReference || 'N/A'}</span></div>
                      <div><strong>Ngày xử lý:</strong> {refund.processedAt ? new Date(refund.processedAt).toLocaleString('vi-VN') : '—'}</div>
                      {refund.adminNote && <div><strong>Ghi chú:</strong> {refund.adminNote}</div>}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TAB_STATUSES: { id: string; label: string; status?: string }[] = [
  { id: 'all',       label: 'Tất cả' },
  { id: 'Pending',   label: 'Chờ xác nhận' },
  { id: 'Confirmed', label: 'Đã xác nhận' },
  { id: 'Shipping',  label: 'Đang giao' },
  { id: 'Completed', label: 'Hoàn thành' },
  { id: 'Cancelled', label: 'Đã hủy' },
];

export const OrdersModule: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { widths, totalWidth, activeResizingKey, startResize } = useResizableColumns({
    storageKey: 'pickle_col_widths_orders',
    defaultWidths: {
      code: 150,
      customer: 170,
      products: 260,
      status: 130,
      payment: 140,
      shipping: 150,
      total: 130,
      actions: 150,
    },
    minWidths: {
      code: 110,
      customer: 130,
      products: 180,
      status: 100,
      payment: 110,
      shipping: 110,
      total: 100,
      actions: 120,
    },
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getOrders({
        status: activeTab !== 'all' ? activeTab : undefined,
        keyword: searchQuery || undefined,
        page,
        pageSize,
      });
      setOrders(result.items);
      setTotal(result.totalItems);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page on tab/search change
  useEffect(() => { setPage(1); }, [activeTab, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Theo dõi đơn hàng
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và cập nhật trạng thái các đơn hàng. Tổng: <strong>{total}</strong> đơn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); }}
              placeholder="Tên khách hàng, SĐT..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-400"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab filter */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
        {TAB_STATUSES.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold shadow-md'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
                <th style={{ width: widths.code }} className="relative py-4 px-5 select-none">
                  Mã đơn hàng
                  <ResizeHandle onMouseDown={(e) => startResize('code', e)} isResizing={activeResizingKey === 'code'} />
                </th>
                <th style={{ width: widths.customer }} className="relative py-4 px-5 select-none">
                  Khách hàng
                  <ResizeHandle onMouseDown={(e) => startResize('customer', e)} isResizing={activeResizingKey === 'customer'} />
                </th>
                <th style={{ width: widths.products || 260 }} className="relative py-4 px-5 select-none">
                  Sản phẩm
                  <ResizeHandle onMouseDown={(e) => startResize('products', e)} isResizing={activeResizingKey === 'products'} />
                </th>
                <th style={{ width: widths.status }} className="relative py-4 px-5 select-none">
                  Trạng thái
                  <ResizeHandle onMouseDown={(e) => startResize('status', e)} isResizing={activeResizingKey === 'status'} />
                </th>
                <th style={{ width: widths.payment }} className="relative py-4 px-5 select-none">
                  Thanh toán
                  <ResizeHandle onMouseDown={(e) => startResize('payment', e)} isResizing={activeResizingKey === 'payment'} />
                </th>
                <th style={{ width: widths.shipping }} className="relative py-4 px-5 select-none">
                  Vận chuyển
                  <ResizeHandle onMouseDown={(e) => startResize('shipping', e)} isResizing={activeResizingKey === 'shipping'} />
                </th>
                <th style={{ width: widths.total }} className="relative py-4 px-5 text-right select-none">
                  Tổng tiền
                  <ResizeHandle onMouseDown={(e) => startResize('total', e)} isResizing={activeResizingKey === 'total'} />
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
                    <button onClick={fetchOrders} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400 font-medium">
                    Không có đơn hàng nào.
                  </td>
                </tr>
              ) : (
                orders.map(ord => {
                  const items = (ord.items && ord.items.length > 0)
                    ? ord.items
                    : (ord.firstItemName ? [{
                        productName: ord.firstItemName,
                        imageUrl: ord.firstItemImage || '/images/paddle.png',
                        productImage: ord.firstItemImage || '/images/paddle.png',
                        unitPrice: ord.totalAmount || 0,
                        quantity: ord.itemCount || 1,
                      }] : []);

                  // Tìm sản phẩm đại diện có giá trị cao nhất: unitPrice * quantity
                  const sortedItems = [...items].sort((a, b) => {
                    const valA = (Number(a.unitPrice) || 0) * (Number(a.quantity) || 1);
                    const valB = (Number(b.unitPrice) || 0) * (Number(b.quantity) || 1);
                    return valB - valA;
                  });
                  const representativeItem = sortedItems[0];
                  const otherProductsCount = Math.max(0, items.length - 1);
                  const displayedAvatars = items.slice(0, 3);
                  const remainingAvatarsCount = Math.max(0, items.length - 3);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {ord.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{ord.customerPhone}</div>
                      </td>
                      <td className="py-4 px-5">
                        {representativeItem ? (
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Stacked avatars */}
                            <div className="flex items-center shrink-0">
                              {displayedAvatars.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className={`relative ${idx > 0 ? '-ml-2.5 sm:-ml-2' : ''} ${idx === 2 ? 'hidden sm:block' : ''}`}
                                  style={{ zIndex: 10 - idx }}
                                  title={item.productName}
                                >
                                  <img
                                    src={item.productImage || item.imageUrl || '/images/paddle.png'}
                                    alt={item.productName}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = '/images/paddle.png';
                                    }}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover bg-white dark:bg-slate-800 ring-2 ring-white dark:ring-slate-900 shadow-2xs"
                                  />
                                </div>
                              ))}
                              {remainingAvatarsCount > 0 && (
                                <div
                                  className="relative -ml-2.5 sm:-ml-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-[10px] font-extrabold shadow-2xs shrink-0"
                                  style={{ zIndex: 5 }}
                                  title={`Còn ${remainingAvatarsCount} sản phẩm khác`}
                                >
                                  +{remainingAvatarsCount}
                                </div>
                              )}
                            </div>

                            {/* Representative product name & subline */}
                            <div className="min-w-0 flex-1">
                              <div
                                className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]"
                                title={representativeItem.productName}
                              >
                                {representativeItem.productName}
                              </div>
                              {otherProductsCount > 0 && (
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                                  và {otherProductsCount} sản phẩm khác
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Chưa có</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{ord.paymentMethod}</div>
                        <div className="text-[11px] text-slate-400">{ord.paymentStatus}</div>
                      </td>
                      <td className="py-4 px-5">
                        {ord.shippingProvider ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{ord.shippingProvider}</div>
                            {ord.trackingNumber && (
                              <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px] mt-0.5">
                                <span>{ord.trackingNumber}</span>
                                <button onClick={() => handleCopy(ord.trackingNumber!)} className="hover:text-slate-600">
                                  {copiedId === ord.trackingNumber ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right font-extrabold text-slate-900 dark:text-white">
                        {ord.totalAmount.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Hoàn tiền nếu đơn bị Hủy và thanh toán bằng PayOS */}
                          {ord.status === 'Cancelled' &&
                            (ord.paymentMethod?.toLowerCase().includes('payos') || ord.paymentStatus === 'Paid') && (
                              <button
                                onClick={() => setSelectedOrderId(ord.id)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                                title="Xử lý hoàn tiền cho đơn hàng thanh toán qua PayOS"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Hoàn tiền</span>
                              </button>
                          )}
                        <button
                          onClick={() => setSelectedOrderId(ord.id)}
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all shrink-0"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && total > pageSize && (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Trang {page}/{totalPages} • {total} đơn hàng</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                      pg === page ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-600'
                    }`}>{pg}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrderId && (
        <DetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
};
