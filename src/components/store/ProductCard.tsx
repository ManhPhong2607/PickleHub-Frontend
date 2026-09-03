'use client';

import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/lib/store/useCartStore';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addItem } = useCartStore();

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between group">
      
      {/* Seamless Product Image Wrapper - mix-blend-multiply removes white backgrounds */}
      <div className="relative bg-white rounded-2xl p-4 min-h-[190px] flex items-center justify-center overflow-hidden mb-4">
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 bg-emerald-100/90 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10 font-sans tracking-wide">
            {product.badge}
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          style={{ mixBlendMode: 'multiply' }}
          className="w-36 h-36 object-contain transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product Info */}
      <div>
        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400" /> {product.rating}{' '}
          <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
        </div>
        <h4
          onClick={() => onSelect(product)}
          className="font-display font-bold text-base text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors cursor-pointer"
        >
          {product.name}
        </h4>
        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="font-display font-extrabold text-lg text-emerald-600">
            {product.price.toLocaleString('vi-VN')} ₫
          </span>
          {product.oldPrice && (
            <span className="text-xs text-slate-400 line-through">
              {product.oldPrice.toLocaleString('vi-VN')} ₫
            </span>
          )}
        </div>
      </div>

      {/* Add to Cart CTA */}
      <button
        onClick={() => addItem(product)}
        className="mt-5 w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 active:scale-95"
      >
        <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
      </button>

    </div>
  );
};
