'use client';

import React, { useState } from 'react';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';
import { paymentApi } from '@/lib/api/paymentApi';
import { cartOrderApi } from '@/lib/api/cartOrderApi';

import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  onOpenPayOS?: (qrUrl: string, amount: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenPayOS }) => {
  const router = useRouter();
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<'PayOS' | 'COD'>('PayOS');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const total = getSubtotal();

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity duration-300"
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display font-bold text-lg text-slate-900">Giỏ hàng của bạn</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Giỏ hàng của bạn đang trống</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3">
                <img src={item.product?.image || '/images/paddle.png'} alt={item.product?.name || 'Sản phẩm'} className="w-14 h-14 object-contain rounded-xl bg-slate-50 p-1 border" />
                <div className="flex-1">
                  <h5 className="font-bold text-xs text-slate-900">{item.product?.name || item.variantName || 'Sản phẩm'}</h5>
                  <span className="font-extrabold text-xs text-emerald-600">{item.price.toLocaleString('vi-VN')} ₫</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-slate-100 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-slate-100 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính</span>
              <span className="font-bold text-slate-900">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <span className="font-bold text-emerald-600">Miễn phí</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t">
              <span>Tổng tiền thanh toán</span>
              <span className="text-emerald-600">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phương thức thanh toán:</label>
            <div className="grid grid-cols-2 gap-2">
              <label
                onClick={() => setPaymentMethod('PayOS')}
                className={`p-2.5 rounded-xl flex items-center gap-2 cursor-pointer border-2 ${
                  paymentMethod === 'PayOS' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                }`}
              >
                <input type="radio" checked={paymentMethod === 'PayOS'} readOnly className="text-emerald-600" />
                <span className="text-xs font-bold">PayOS QR Code</span>
              </label>
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-2.5 rounded-xl flex items-center gap-2 cursor-pointer border-2 ${
                  paymentMethod === 'COD' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                }`}
              >
                <input type="radio" checked={paymentMethod === 'COD'} readOnly className="text-emerald-600" />
                <span className="text-xs font-bold">COD (Tiền mặt)</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Đang khởi tạo đơn...' : 'Tiến hành Thanh toán'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </>
  );
};
