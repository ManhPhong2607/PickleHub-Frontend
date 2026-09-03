'use client';

import React from 'react';
import { Star, CheckCircle2, MessageSquare, Quote, ThumbsUp } from 'lucide-react';

interface ReviewItem {
  id: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  productName: string;
  productImage: string;
  verified: boolean;
}

export const SocialProofReviews: React.FC = () => {
  const reviews: ReviewItem[] = [
    {
      id: 'rev-1',
      author: 'Trần Hoàng Nam',
      role: 'Người chơi Pickleball Hà Nội',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      date: '2 ngày trước',
      content: 'Vợt Pro Series Carbon T700 quá ngon trong tầm giá! Mặt nhám Toray bám bóng cực tốt, đập smashes siêu đầm tay. Đã kiểm tra chuẩn USAPA thi đấu.',
      productName: 'Pro Series Carbon T700',
      productImage: '/images/paddle.png',
      verified: true,
    },
    {
      id: 'rev-2',
      author: 'Lê Minh Quân',
      role: 'HLV Pickleball Club',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      date: '1 tuần trước',
      content: 'Shop giao hàng rất hỏa tốc, đặt chiều qua sáng nay đã nhận được. Đóng gói 2 lớp nổ rất kỹ. Bóng thi đấu chuẩn 40 lỗ nảy rất đều.',
      productName: 'Bóng PickleHub Tournament (Hộp 6 quả)',
      productImage: '/images/balls.png',
      verified: true,
    },
    {
      id: 'rev-3',
      author: 'Nguyễn Thị Bích Ngọc',
      role: 'VĐV Giải Nghiệp Dư',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      date: '3 ngày trước',
      content: 'Túi đựng balo có ngăn cách nhiệt chứa được 4 cây vợt thoải mái, ngăn dưới chứa giày thoáng khí không bị hôi. Đáng tiền lắm mọi người!',
      productName: 'Balo PickleHub Tour Pro',
      productImage: '/images/bag.png',
      verified: true,
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors border-b border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Cộng đồng người chơi nói gì về PickleHub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Hơn 12,000+ người chơi và vận động viên trên cả nước đã tin tưởng lựa chọn
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-center px-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-display block">4.9/5</span>
              <div className="flex items-center justify-center gap-0.5 text-amber-400 my-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">1,850+ đánh giá</span>
            </div>

            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700" />

            <div className="text-center px-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display block">99.4%</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">Hài lòng</span>
              <span className="text-[10px] text-slate-400 font-medium">Chất lượng & dịch vụ</span>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
            >
              <div className="space-y-3">
                {/* Rating & Verified Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>

                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Đã mua hàng</span>
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                  "{rev.content}"
                </p>
              </div>

              {/* Author & Product Info */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.productImage}
                      alt={rev.productName}
                      className="w-9 h-9 object-contain bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {rev.productName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.avatar}
                      alt={rev.author}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {rev.author}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {rev.role}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {rev.date}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
