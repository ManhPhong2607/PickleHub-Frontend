'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    toggleSelectItem,
    toggleSelectAll,
    getSelectedSubtotal,
    getSelectedItemsCount,
    getTotalItems,
  } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const selectedCount = getSelectedItemsCount();
  const allSelected = items.length > 0 && items.every((i) => i.selected !== false);
  const subtotal = getSelectedSubtotal();
  const shippingFee: number = 0;
  const grandTotal = Math.max(0, subtotal + shippingFee - discount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'PH2026') {
      const disc = Math.round(subtotal * 0.1);
      setDiscount(disc);
      alert('Áp dụng mã giảm giá PH2026 thành công (-10%)!');
    } else {
      alert('Mã giảm giá không hợp lệ. Thử nhập "PH2026"');
    }
  };

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Giỏ hàng của bạn
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {selectedCount} / {getTotalItems()} sản phẩm được chọn thanh toán
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tiếp tục mua sắm</span>
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Items Table */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm overflow-x-auto space-y-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                        title="Chọn tất cả"
                      />
                    </th>
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3">Đơn giá</th>
                    <th className="p-3">Số lượng</th>
                    <th className="p-3">Thành tiền</th>
                    <th className="p-3 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {items.map((item) => {
                    const isSelected = item.selected !== false;
                    return (
                      <tr
                        key={item.id}
                        className={`transition-all ${
                          isSelected
                            ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                            : 'opacity-60 bg-slate-50/30 dark:bg-slate-900/30'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product.image || '/images/paddle.png'}
                              alt={item.product.name}
                              className="w-12 h-12 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 border p-1 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{item.product.name}</p>
                              {item.variantName && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{item.variantName}</span>
                              )}
                            </div>
                          </div>
                        </td>

                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {item.price.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="p-3">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 w-24">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Xóa toàn bộ giỏ hàng
                </button>
              </div>
            </div>

            {/* Right Summary & Checkout Column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  <span>Mã ưu đãi / Khuyến mãi</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Nhập mã (VD: PH2026)..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none uppercase text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Áp dụng
                  </button>
                </div>
              </form>

              {/* Order Calculation Box */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs font-semibold">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Tổng quan đơn hàng</h3>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Tạm tính:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{subtotal.toLocaleString('vi-VN')} ₫</span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Phí vận chuyển:</span>
                    <span>{shippingFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Miễn phí</span> : `${shippingFee.toLocaleString('vi-VN')} ₫`}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Giảm giá (Coupon):</span>
                      <span>-{discount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-900 dark:text-white">
                  <span className="font-extrabold text-sm">Tổng thanh toán:</span>
                  <span className="font-extrabold text-xl text-emerald-600 dark:text-emerald-400">{grandTotal.toLocaleString('vi-VN')} ₫</span>
                </div>

                <button
                  onClick={() => router.push('/checkout')}
                  disabled={selectedCount === 0}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
                >
                  <span>Tiến hành Đặt hàng ({selectedCount})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Giỏ hàng của bạn đang trống</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hãy chọn mua các sản phẩm Pickleball cao cấp chính hãng từ PickleHub.</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
