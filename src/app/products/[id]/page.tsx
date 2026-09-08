'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw,
  Zap, Layers, Check
} from 'lucide-react';
import { catalogApi } from '@/lib/api/catalogApi';
import { reviewApi } from '@/lib/api/reviewApi';
import { Product, ProductVariantItem, ReviewDto, ProductRatingSummary } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { customerApi } from '@/lib/api/customerApi';
import { VariantGroupSelector } from '@/components/common/VariantGroupSelector';
import { RelatedProductsSection } from '@/components/storefront/RelatedProductsSection';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [ratingSummary, setRatingSummary] = useState<ProductRatingSummary | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  function toValidGuid(str?: string): string {
    if (!str) return '00000000-0000-0000-0000-000000000001';
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (guidRegex.test(str)) return str;
    const hex = str.replace(/[^0-9a-fA-F]/g, '').padEnd(32, '0').substring(0, 32);
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }

  useEffect(() => {
    if (productId) {
      catalogApi.getProductById(productId).then((prod) => {
        setProduct(prod);
        setSelectedImage(prod.image || (prod.images && prod.images[0]) || '/images/paddle.png');
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
        }
      });

      const validId = toValidGuid(productId);
      reviewApi.getProductReviews(validId).then((revs) => {
        setReviews(revs);
      }).catch(() => {});

      reviewApi.getRatingSummary(validId).then((summary) => {
        setRatingSummary(summary);
      }).catch(() => {});

      setLoadingRelated(true);
      catalogApi.getRelatedProducts(productId, 4)
        .then((relProds) => {
          setRelatedProducts(relProds);
        })
        .catch(() => {})
        .finally(() => setLoadingRelated(false));
    }
  }, [productId]);

  useEffect(() => {
    if (user) {
      customerApi.getProfile().then(setCustomerProfile).catch(() => {});
    }
  }, [user]);

  if (!product) {
    return (
      <div className="py-24 text-center bg-slate-50 dark:bg-slate-950 min-h-screen">
        <p className="text-slate-500 animate-pulse text-sm font-bold">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  // Calculate dynamic rating from database reviews
  const totalReviews = reviews.length > 0 ? reviews.length : (ratingSummary?.totalReviews ?? 0);
  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : (ratingSummary?.averageRating ? Number(ratingSummary.averageRating.toFixed(1)) : 0);

  // Determine current active price & old price
  const activePrice = selectedVariant?.effectivePrice || selectedVariant?.price || product.price;
  const activeOldPrice = selectedVariant
    ? (selectedVariant.price > activePrice ? selectedVariant.price : (product.oldPrice && product.oldPrice > activePrice ? product.oldPrice : undefined))
    : (product.oldPrice && product.oldPrice > activePrice ? product.oldPrice : undefined);
  const currentSalePercent = (activeOldPrice && activeOldPrice > activePrice)
    ? Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100)
    : (product.salePercent || 0);

  const handleAddToCart = () => {
    const variantId = selectedVariant?.id || undefined;
    const variantLabel = selectedVariant?.label || undefined;
    addItem(product, variantId, variantLabel, activePrice, quantity);
  };

  const variantImages = (selectedVariant?.images && selectedVariant.images.length > 0)
    ? selectedVariant.images
    : (selectedVariant?.image ? [selectedVariant.image] : []);

  const galleryImages = variantImages.length > 0
    ? variantImages
    : ((product.images && product.images.length > 0) ? product.images : [product.image || '/images/paddle.png']);

  const handleVariantChange = (v: ProductVariantItem) => {
    setSelectedVariant(v);
    const vImgs = (v.images && v.images.length > 0) ? v.images : (v.image ? [v.image] : []);
    if (vImgs.length > 0) {
      setSelectedImage(vImgs[0]);
    }
  };

  const currentStock = (selectedVariant as any)?.stock !== undefined
    ? Number((selectedVariant as any).stock)
    : (product.stock > 0 ? product.stock : 0);

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang danh sách sản phẩm</span>
        </Link>

        {/* Top Product Section: Image Gallery + Detail Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          
          {/* Left Column: Image Gallery Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-8 flex items-center justify-center overflow-hidden">
              {currentSalePercent > 0 ? (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-md z-10">
                  Giảm {currentSalePercent}%
                </span>
              ) : product.badge ? (
                <span className="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-md z-10">
                  {product.badge}
                </span>
              ) : null}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage || product.image || '/images/paddle.png'}
                alt={product.name}
                className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/paddle.png';
                }}
              />
            </div>

            {/* Thumbnail Gallery Row */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, idx) => {
                  const isCurrent = selectedImage === imgUrl;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                        isCurrent
                          ? 'border-emerald-500 scale-105 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Specifications & Purchasing Controls */}
          <div className="lg:col-span-6 space-y-6">
            
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                {product.brandName ? `${product.brandName} • ` : ''}{product.categoryName || 'Pickleball'} • SKU: {product.sku || 'PK-PRO'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              {/* Dynamic Rating Summary from Database */}
              <div className="flex items-center gap-3 mt-3">
                {reviews.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {avgRating} ({totalReviews} đánh giá)
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center text-slate-300 dark:text-slate-700">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 italic">Chưa có đánh giá</span>
                  </>
                )}

                {/* Stock Status Badge */}
                {currentStock > 0 ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full font-bold">
                    Còn {currentStock} sản phẩm
                  </span>
                ) : (
                  <span className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full font-bold">
                    Hết hàng
                  </span>
                )}
              </div>
            </div>

            {/* Price Row */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block font-display">
                  {activePrice.toLocaleString('vi-VN')} ₫
                </span>
                {activeOldPrice && (
                  <span className="text-xs text-slate-400 line-through font-medium">
                    {activeOldPrice.toLocaleString('vi-VN')} ₫
                  </span>
                )}
              </div>
              {currentSalePercent > 0 ? (
                <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs">
                  Tiết kiệm {currentSalePercent}%
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl">
                  Chính hãng 100%
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              {product.description || `${product.name} chính hãng tiêu chuẩn thi đấu tại PickleHub.`}
            </p>

            {/* Dynamic Product Variants Grouped by Attributes (Color, Size, Weight...) */}
            {product.variants && product.variants.length > 0 ? (
              <div className="pt-2">
                <VariantGroupSelector
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onVariantChange={handleVariantChange}
                />
              </div>
            ) : null}

            {/* Purchasing Action: Quantity Counter + Add to Cart Button (Selkirk style) */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Quantity:</span>
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-800 text-xs h-11">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 h-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 font-bold text-slate-900 dark:text-white min-w-[20px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 h-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="flex-1 h-11 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{currentStock > 0 ? `Thêm vào giỏ hàng (${(activePrice * quantity).toLocaleString('vi-VN')} ₫)` : 'Hết hàng'}</span>
              </button>
            </div>

            {/* Service Guarantee Icons */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Freeship từ 500k</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Bảo hành 12 tháng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Đổi trả 7 ngày</span>
              </div>
            </div>

            {/* Product Specs Table if available in Database (Moved Below Buttons) */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Thông số kỹ thuật:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {Object.entries(product.specs).map(([k, val]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{k}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Customer Reviews & Moderated Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Đánh giá từ khách hàng ({reviews.length})
            </h3>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{avgRating} / 5.0</span>
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {reviews.map((rev) => {
                const isMyReview = user && (rev.userId === user.id || user.email === '');
                const authorName = rev.userName || (isMyReview ? (customerProfile?.fullName || user?.fullName || 'dũng') : 'Khách hàng PickleHub');
                return (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleString('vi-VN') : 'Gần đây'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{rev.comment}</p>
                    {rev.imageUrls && rev.imageUrls.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {rev.imageUrls.map((imgUrl, i) => (
                          <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Review image ${i + 1}`}
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {rev.sellerReply && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="font-bold block">Phản hồi từ PickleHub Admin:</span>
                        {rev.sellerReply}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              Chưa có đánh giá nào cho sản phẩm này. Khách hàng đã mua hàng có thể đánh giá trong phần Chi tiết đơn hàng.
            </div>
          )}
        </div>

        {/* Related Products Recommendations Section (Dưới phần đánh giá & kích thước nhỏ gọn) */}
        <RelatedProductsSection
          products={relatedProducts}
          loading={loadingRelated}
          categoryName={product.categoryName}
        />
      </div>
    </div>
  );
}
