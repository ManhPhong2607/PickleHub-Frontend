'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const {
    items,
    isOpen,
    setIsOpen,
    updateQuantity,
    removeItem,
    toggleSelectItem,
    toggleSelectAll,
    getSelectedSubtotal,
    getSelectedItemsCount,
    getTotalItems,
  } = useCartStore();

  const selectedSubtotal = getSelectedSubtotal();
  const selectedCount = getSelectedItemsCount();
  const allSelected = items.length > 0 && items.every((i) => i.selected !== false);

  const handleCheckoutClick = () => {
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Drawer Content Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-none">Giỏ hàng của bạn</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {items.length > 0 && (
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-600 dark:text-emerald-400 select-none">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                        />
                        <span>Chọn tất cả ({selectedCount}/{getTotalItems()})</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {items.length > 0 ? (
                items.map((item) => {
                  const isSelected = item.selected !== false;
                  return (
                    <div
                      key={item.id}
                      className={`pt-4 first:pt-0 flex items-center gap-3 transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600 shrink-0"
                      />

                      <img
                        src={item.product.image || '/images/paddle.png'}
                        alt={item.product.name}
                        className="w-14 h-14 object-contain rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{item.product.name}</h4>
                        {item.variantName && (
                          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{item.variantName}</p>
                        )}
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-1">
                          {item.price.toLocaleString('vi-VN')} ₫
                        </p>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-auto"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Giỏ hàng của bạn đang trống</p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/products');
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all active:scale-95"
                  >
                    Khám phá sản phẩm ngay
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer / Summary */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 space-y-4">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>Tạm tính ({selectedCount} món):</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {selectedSubtotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100/60 dark:bg-emerald-950/40 p-2.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Miễn phí vận chuyển cho đơn hàng từ 500.000 ₫</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs rounded-2xl text-center transition-all"
                  >
                    Xem chi tiết giỏ
                  </Link>

                  <button
                    onClick={handleCheckoutClick}
                    disabled={selectedCount === 0}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>Thanh toán ({selectedCount})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
