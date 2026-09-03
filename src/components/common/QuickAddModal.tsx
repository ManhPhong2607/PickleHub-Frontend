'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, Plus, Minus, Loader2 } from 'lucide-react';
import { Product, ProductVariantItem } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { catalogApi } from '@/lib/api/catalogApi';
import { VariantGroupSelector } from './VariantGroupSelector';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { addItem } = useCartStore();
  const [currentProduct, setCurrentProduct] = useState<Product | null>(product);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && product) {
      setCurrentProduct(product);
      setQuantity(1);

      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        // If variants not yet loaded in list DTO, fetch detailed product
        setLoading(true);
        catalogApi.getProductById(product.id)
          .then((fullProd) => {
            setCurrentProduct(fullProd);
            if (fullProd.variants && fullProd.variants.length > 0) {
              setSelectedVariant(fullProd.variants[0]);
            } else {
              setSelectedVariant(null);
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentProduct) return null;

  const activePrice = selectedVariant?.effectivePrice || selectedVariant?.price || currentProduct.price;
  const activeOldPrice = currentProduct.oldPrice && currentProduct.oldPrice > activePrice ? currentProduct.oldPrice : undefined;

  const handleConfirmAddToCart = () => {
    const variantId = selectedVariant?.id || undefined;
    const variantLabel = selectedVariant?.label || undefined;
    addItem(currentProduct, variantId, variantLabel, activePrice, quantity);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Preview Header */}
        <div className="flex items-center gap-4 pr-6">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 shrink-0 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentProduct.image || '/images/paddle.png'}
              alt={currentProduct.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/paddle.png';
              }}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {currentProduct.brandName ? `${currentProduct.brandName} • ` : ''}{currentProduct.categoryName || 'Pickleball'}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {currentProduct.name}
            </h4>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                {activePrice.toLocaleString('vi-VN')} ₫
              </span>
              {activeOldPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {activeOldPrice.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Variant Selection */}
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Đang tải các tùy chọn phân loại...</span>
          </div>
        ) : currentProduct.variants && currentProduct.variants.length > 0 ? (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 max-h-56 overflow-y-auto pr-1">
            <VariantGroupSelector
              variants={currentProduct.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
            />
          </div>
        ) : null}

        {/* Quantity Selection */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Số lượng:
          </span>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-4 text-xs font-bold text-slate-900 dark:text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Confirm Add Button */}
        <div className="pt-2">
          <button
            onClick={handleConfirmAddToCart}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Thêm vào giỏ hàng ({(activePrice * quantity).toLocaleString('vi-VN')} ₫)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
