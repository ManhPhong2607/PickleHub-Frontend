'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { PayOSQRModal } from '@/components/checkout/PayOSQRModal';
import { Star, CheckCircle, Edit3, ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';

export default function ProductDetailPage() {
  const { addItem } = useCartStore();
  const [payOSModal, setPayOSModal] = useState({ isOpen: false, qrUrl: '', amount: 0 });
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState('/images/paddle.png');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Back to store */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại cửa hàng</span>
        </Link>
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Gallery Image */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex items-center justify-center min-h-[380px] sm:min-h-[420px]">
              <span className="absolute top-4 left-4 bg-rose-500 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase">
                HOT SALE -15%
              </span>
              <img src={mainImg} alt="Pro Series Carbon T700" className="w-72 sm:w-80 h-auto object-contain transition-transform duration-300" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {['/images/paddle.png', '/images/balls.png', '/images/bag.png', '/images/net.png'].map((src) => (
                <button
                  key={src}
                  onClick={() => setMainImg(src)}
                  className={`border-2 rounded-2xl p-2 bg-white hover:opacity-90 transition-all ${
                    mainImg === src ? 'border-emerald-600' : 'border-slate-200'
                  }`}
                >
                  <img src={src} alt="Thumb" className="w-full h-14 sm:h-16 object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Detail Info */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md">Carbon T700</span>
                <div className="flex items-center text-amber-400 text-xs font-bold gap-1">
                  <Star className="w-4 h-4 fill-amber-400" /> 4.8 <span className="text-slate-400 font-normal">(45 đánh giá)</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">Pro Series Carbon T700</h1>
              <p className="text-xs text-slate-500 mt-1">Mã sản phẩm: <span className="font-mono text-slate-700">PK-CARBON-2026</span></p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-display font-extrabold text-emerald-600">3,250,000 ₫</span>
              <span className="text-sm text-slate-400 line-through">3,800,000 ₫</span>
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">Tiết kiệm 550.000 ₫</span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Dòng vợt sợi Carbon Toray T700 mật độ cao kết hợp lõi tổ ong Polypropylene 16mm mang lại lực xoáy spin tối đa, độ kiểm soát bóng chuẩn xác từng milimet.
            </p>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 text-center font-bold text-sm">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg"><Plus className="w-4 h-4" /></button>
                </div>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Còn 28 sản phẩm</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => addItem({ id: '1', name: 'Pro Series Carbon T700', price: 3250000, image: '/images/paddle.png', category: 'paddle', description: '', rating: 5, reviewsCount: 10, stock: 28 }, 'var-1', 'Bản Tiêu Chuẩn', 3250000, qty)}
                  className="py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ hàng
                </button>
                <button
                  onClick={() => setPayOSModal({ isOpen: true, qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021238580010A000000727012800069704180114000000000000000208QRIBFTTA5303704540732500005802VN5909PickleHub', amount: 3250000 })}
                  className="py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30"
                >
                  Mua ngay thanh toán PayOS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Summary Section (Rule FR-26) */}
        <div className="border-t border-slate-200 pt-12 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900">Đánh giá từ khách hàng đã mua</h3>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5">
              <Edit3 className="w-4 h-4" /> Viết đánh giá
            </button>
          </div>

          <div className="grid md:grid-cols-12 gap-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm items-center">
            <div className="md:col-span-4 text-center md:border-r border-slate-100 pr-4">
              <div className="font-display font-extrabold text-5xl text-slate-900">4.8</div>
              <div className="flex items-center justify-center text-amber-400 my-2">
                <Star className="w-5 h-5 fill-amber-400" /><Star className="w-5 h-5 fill-amber-400" /><Star className="w-5 h-5 fill-amber-400" /><Star className="w-5 h-5 fill-amber-400" /><Star className="w-5 h-5 fill-amber-400" />
              </div>
              <p className="text-xs text-slate-500">Dựa trên 45 đánh giá thực tế từ đơn hàng đã hoàn tất</p>
            </div>
            <div className="md:col-span-8 space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-3">
                <span className="w-12">5 sao</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full w-[85%]" />
                </div>
                <span className="w-8 text-right font-bold">38</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CartDrawer onOpenPayOS={(qrUrl, amount) => setPayOSModal({ isOpen: true, qrUrl, amount })} />
      <PayOSQRModal isOpen={payOSModal.isOpen} qrUrl={payOSModal.qrUrl} amount={payOSModal.amount} onClose={() => setPayOSModal({ isOpen: false, qrUrl: '', amount: 0 })} />
    </div>
  );
}
