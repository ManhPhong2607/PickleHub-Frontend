'use client';

import React from 'react';
import { QrCode } from 'lucide-react';

interface PayOSQRModalProps {
  isOpen: boolean;
  qrUrl: string;
  amount: number;
  onClose: () => void;
}

export const PayOSQRModal: React.FC<PayOSQRModalProps> = ({ isOpen, qrUrl, amount, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="font-display font-extrabold text-xl text-slate-900">Thanh toán PayOS QR</h3>
        <p className="text-xs text-slate-500">Mở ứng dụng Ngân hàng (MBBank, Vietcombank...) để quét mã thanh toán tự động</p>
        
        {/* QR Code Container */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
          <img src={qrUrl} alt="PayOS VietQR Code" className="w-44 h-44 mx-auto rounded-lg shadow-sm" />
        </div>

        <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl text-left border">
          <div className="flex justify-between">
            <span>Số tiền:</span>
            <span className="font-bold text-emerald-600">{amount.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="flex justify-between">
            <span>Nội dung chuyển:</span>
            <span className="font-mono font-bold text-slate-800">PKH 7C94E97A</span>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all">
          Đóng cửa sổ thanh toán
        </button>
      </div>
    </div>
  );
};
