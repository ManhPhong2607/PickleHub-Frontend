'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Sparkles } from 'lucide-react';
import { blogApi, PostListDto } from '@/lib/api/blogApi';

export const BlogSection: React.FC = () => {
  const [posts, setPosts] = useState<PostListDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback data if backend is starting or offline
  const fallbackPosts: PostListDto[] = [
    {
      id: 'post-1',
      title: 'Hướng dẫn chọn vợt Pickleball chuẩn nhất cho người mới bắt đầu (2026)',
      slug: 'huong-dan-chon-vot-pickleball-cho-nguoi-moi-bat-dau',
      summary: 'Phân tích chi tiết độ dày lõi (13mm vs 16mm), chất liệu mặt Carbon T700 và trọng lượng vợt phù hợp với thể lực người Việt Nam.',
      categoryName: 'Kinh nghiệm chọn vợt',
      categorySlug: 'kinh-nghiem-chon-vot',
      coverImageUrl: '/images/paddle.png',
      publishedAt: '2026-08-10T00:00:00Z',
      viewCount: 342,
    },
    {
      id: 'post-2',
      title: 'Top 5 cây vợt Pickleball kiểm soát & tạo xoáy Spin cực hiểm năm 2026',
      slug: 'top-5-cay-vot-pickleball-kiem-soat-tao-xoay-spin-2026',
      summary: 'Đánh giá thực tế các dòng vợt được các tay vợt chuyên nghiệp săn đón nhất với công nghệ mặt nhám ma sát cao và USAPA Approved.',
      categoryName: 'Top Sản Phẩm',
      categorySlug: 'top-san-pham',
      coverImageUrl: '/images/paddle.png',
      publishedAt: '2026-08-08T00:00:00Z',
      viewCount: 512,
    },
    {
      id: 'post-3',
      title: 'Luật chơi Pickleball cơ bản & Chiến thuật đánh đôi dink bóng trên lưới',
      slug: 'luat-choi-pickleball-va-chien-thuat-danh-doi-dink-bong',
      summary: 'Tổng hợp quy tắc tính điểm, vùng Non-Volley Zone (Kitchen) và các mẹo kiểm soát nhịp đấu giúp bạn làm chủ trận đấu dễ dàng.',
      categoryName: 'Kỹ Thuật Thi Đấu',
      categorySlug: 'ky-thuat-thi-dau',
      coverImageUrl: '/images/balls.png',
      publishedAt: '2026-08-05T00:00:00Z',
      viewCount: 280,
    },
  ];

  useEffect(() => {
    blogApi
      .getPosts({ page: 1, pageSize: 3 })
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setPosts(res.items);
        } else {
          setPosts(fallbackPosts);
        }
      })
      .catch((err) => {
        console.warn('[BlogSection] Could not load live posts, using fallback:', err);
        setPosts(fallbackPosts);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const displayPosts = posts.length > 0 ? posts : fallbackPosts;

  return (
    <section className="py-20 bg-white dark:bg-slate-900 transition-colors border-b border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Góc chia sẻ & kinh nghiệm thi đấu
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Cập nhật luật chơi, kỹ thuật dink bóng và cẩm nang chọn thiết bị mới nhất
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Xem tất cả bài viết</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPosts.map((post) => {
            const postDate = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
              : 'Gần đây';

            return (
              <article
                key={post.id}
                className="group bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
              >
                <div className="space-y-3">
                  {/* Article Image Container */}
                  <Link href={`/blog/${post.slug}`} className="block relative h-48 bg-slate-100 dark:bg-slate-800 p-6 flex items-center justify-center overflow-hidden">
                    <span className="absolute top-3.5 left-3.5 z-10 px-2.5 py-0.5 rounded-full bg-slate-900/90 text-white font-bold text-[10px] backdrop-blur-md">
                      {post.categoryName}
                    </span>
                    <img
                      src={post.coverImageUrl || '/images/paddle.png'}
                      alt={post.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </Link>

                  {/* Content */}
                  <div className="p-6 space-y-2.5">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>{postDate}</span>
                    </div>

                    <Link href={`/blog/${post.slug}`} className="block">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-normal">
                      {post.summary}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>Đọc bài viết</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
};

