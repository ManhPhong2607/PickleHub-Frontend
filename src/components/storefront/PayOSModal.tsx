'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, CheckCircle, XCircle, Copy, Loader2, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { cartOrderApi } from '@/lib/api/cartOrderApi';

interface PayOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  checkoutUrl?: string;
  qrCode?: string;
  onPaymentSuccess?: () => void;
  onPaymentFailed?: () => void;
  onSwitchToCOD?: () => void;
}

export const PayOSModal: React.FC<PayOSModalProps> = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  checkoutUrl = '',
  qrCode = '',
  onPaymentSuccess,
  onPaymentFailed,
  onSwitchToCOD,
}) => {
  const { addNotification } = useNotificationStore();
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  // Chuỗi dữ liệu QR Code chính xác (ưu tiên VietQR string hoặc link thanh toán PayOS)
  const qrData = qrCode || checkoutUrl || `https://pay.payos.vn/web/${orderId}`;

  useEffect(() => {
    if (!isOpen) {
      setPaymentStatus('pending');
    }
  }, [isOpen]);

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(totalAmount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleVerifySuccess = () => {
    if (paymentStatus === 'success') return;
    setPaymentStatus('success');
    
    addNotification(
      `Thanh toán thành công`,
      `Giao dịch PayOS số tiền ${totalAmount.toLocaleString('vi-VN')}₫ đã được xác nhận thành công!`,
      '/orders'
    );

    setTimeout(() => {
      if (onPaymentSuccess) onPaymentSuccess();
    }, 2500);
  };

  // Auto-polling: kiểm tra trạng thái thanh toán mỗi 2.5 giây
  useEffect(() => {
    if (!isOpen || paymentStatus !== 'pending') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await cartOrderApi.checkPaymentStatus(orderId);
        const st = (res?.status || '').toString().toUpperCase();
        if (res && (res.isPaid || st === 'PAID' || st === 'CONFIRMED' || st === 'COMPLETED')) {
          clearInterval(pollInterval);
          handleVerifySuccess();
        }
      } catch {
        // Keep polling silently
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [isOpen, paymentStatus, orderId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative text-center font-sans overflow-hidden cursor-default"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ===== PENDING: Hiển thị duy nhất Mã QR để quét thanh toán trực tiếp ===== */}
          {paymentStatus === 'pending' && (
            <div className="space-y-4 pt-1">
              
              {/* Header Info */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>CỔNG THANH TOÁN TỰ ĐỘNG PAYOS</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Quét mã QR để Thanh toán
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mở App ngân hàng hoặc Ví điện tử (MoMo, ZaloPay, VietQR) để quét mã
                </p>
              </div>

              {/* Khung Mã QR Center Stage */}
              <div className="relative p-5 bg-gradient-to-b from-emerald-500/10 via-slate-50 to-emerald-500/5 dark:from-emerald-950/30 dark:via-slate-800/40 dark:to-emerald-950/20 rounded-3xl border-2 border-emerald-500/30 inline-block shadow-lg">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md inline-block">
                  {qrCode && (qrCode.startsWith('http') || qrCode.startsWith('data:image')) ? (
                    <img src={qrCode} alt="VietQR PayOS" className="w-[210px] h-[210px] object-contain rounded-lg" />
                  ) : (
                    <QRCodeSVG
                      value={qrData}
                      size={210}
                      bgColor="#ffffff"
                      fgColor="#09090b"
                      level="H"
                      includeMargin={false}
                    />
                  )}
                </div>

                {/* Amount badge inside card */}
                <div className="mt-3 flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Số tiền:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {totalAmount.toLocaleString('vi-VN')} ₫
                    </span>
                    <button
                      onClick={handleCopyAmount}
                      title="Sao chép số tiền"
                      className="text-slate-400 hover:text-emerald-600 p-0.5"
                    >
                      {copiedAmount ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status indicator with Live Pulse */}
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 py-1">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <span>Đang chờ bạn quét mã thanh toán...</span>
              </div>

              {checkoutUrl && (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mở trang thanh toán PayOS / App Ngân hàng</span>
                </a>
              )}

              {onSwitchToCOD && (
                <button
                  type="button"
                  onClick={onSwitchToCOD}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-2xl transition-all border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Đổi sang thanh toán khi nhận hàng (COD)</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all"
              >
                Hủy / Đóng
              </button>
            </div>
          )}

          {/* ===== SUCCESS ===== */}
          {paymentStatus === 'success' && (
            <div className="py-8 space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20 animate-bounce">
                <CheckCircle className="w-12 h-12 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Thanh toán thành công!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Hệ thống đã tự động ghi nhận thanh toán PayOS cho đơn hàng của bạn.
                </p>
              </div>
            </div>
          )}

          {/* ===== FAILED ===== */}
          {paymentStatus === 'failed' && (
            <div className="py-8 space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-600/20">
                <XCircle className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">Thanh toán thất bại</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Không thể xử lý giao dịch. Vui lòng thử lại hoặc chọn phương thức COD.
                </p>
              </div>
              <button
                onClick={() => setPaymentStatus('pending')}
                className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Thử lại
              </button>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
