'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen, Search, Clock, ArrowRight, Layers, Tag,
  ChevronLeft, ChevronRight, Sparkles, Filter, Newspaper, TrendingUp
} from 'lucide-react';
import { blogApi, PostListDto, PostCategoryDto } from '@/lib/api/blogApi';

function BlogListContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [posts, setPosts] = useState<PostListDto[]>([]);
  const [categories, setCategories] = useState<PostCategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [keyword, setKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 9;

  // Fallback posts for instant render while microservice starts
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
    {
      id: 'post-4',
      title: 'Bí quyết bảo quản vợt và vệ sinh mặt vợt Carbon luôn giữ độ nhám tối đa',
      slug: 'bi-quyet-bao-quan-va-ve-sinh-mat-vot-carbon',
      summary: 'Hướng dẫn sử dụng thanh cao su tẩy mặt vợt, bảo vệ viền Edge Guard và bảo quản vợt trong túi chuyên dụng tránh ẩm mốc.',
      categoryName: 'Kinh nghiệm chọn vợt',
      categorySlug: 'kinh-nghiem-chon-vot',
      coverImageUrl: '/images/paddle.png',
      publishedAt: '2026-08-03T00:00:00Z',
      viewCount: 195,
    },
    {
      id: 'post-5',
      title: 'So sánh bóng Pickleball thi đấu trong nhà (Indoor) và ngoài trời (Outdoor)',
      slug: 'so-sanh-bong-pickleball-indoor-va-outdoor',
      summary: 'Sự khác biệt cốt lõi về số lỗ (26 lỗ vs 40 lỗ), trọng lượng, độ nảy và độ bền khi chơi trên các bề mặt sân khác nhau.',
      categoryName: 'Top Sản Phẩm',
      categorySlug: 'top-san-pham',
      coverImageUrl: '/images/balls.png',
      publishedAt: '2026-08-01T00:00:00Z',
      viewCount: 420,
    },
  ];

  // Fetch Categories
  useEffect(() => {
    blogApi.getCategories().then((cats) => setCategories(cats)).catch(() => {});
  }, []);

  // Fetch Posts
  useEffect(() => {
    setLoading(true);
    const catSlug = selectedCategory === 'all' ? undefined : selectedCategory;
    blogApi
      .getPosts({
        keyword: keyword.trim() || undefined,
        categorySlug: catSlug,
        page: currentPage,
        pageSize,
      })
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setPosts(res.items);
          setTotalItems(res.totalItems || res.items.length);
        } else if (!keyword.trim() && selectedCategory === 'all') {
          setPosts(fallbackPosts);
          setTotalItems(fallbackPosts.length);
        } else {
          setPosts([]);
          setTotalItems(0);
        }
      })
      .catch((err) => {
        console.warn('[BlogPage] Could not load posts from API, fallback to local data:', err);
        setPosts(fallbackPosts);
        setTotalItems(fallbackPosts.length);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, keyword, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Featured post is the first post if on page 1 with no search filter
  const featuredPost = (currentPage === 1 && !keyword.trim() && selectedCategory === 'all' && posts.length > 0)
    ? posts[0]
    : null;

  const gridPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="py-10 sm:py-14 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Hero Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 dark:text-white leading-tight">
            Kiến thức & kinh nghiệm Pickleball
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
            Hướng dẫn chọn vợt chuyên sâu, đánh giá thiết bị và chiến thuật thi đấu từ các chuyên gia
          </p>
        </div>

        {/* Toolbar: Categories Tabs + Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả bài viết
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm kiếm bài viết, hướng dẫn..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

        </div>

        {/* Featured Post Card (Hero Highlight) */}
        {featuredPost && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/80 rounded-3xl border border-emerald-500/30 overflow-hidden shadow-2xl p-6 sm:p-10 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
            <div className="lg:col-span-7 space-y-4 z-10">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow-sm">
                  {featuredPost.categoryName}
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bài viết nổi bật
                </span>
              </div>

              <Link href={`/blog/${featuredPost.slug}`} className="block group">
                <h2 className="text-2xl sm:text-3xl font-black font-display text-white group-hover:text-emerald-400 transition-colors leading-snug">
                  {featuredPost.title}
                </h2>
              </Link>

              <p className="text-sm text-slate-300 font-medium leading-relaxed line-clamp-3">
                {featuredPost.summary}
              </p>

              <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
                <span>{featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</span>
              </div>

              <div className="pt-3">
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg transition-all active:scale-95"
                >
                  <span>Đọc bài viết chi tiết</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative h-64 sm:h-80 bg-slate-800/60 rounded-2xl p-6 flex items-center justify-center border border-slate-700/60 overflow-hidden">
              <img
                src={featuredPost.coverImageUrl || '/images/paddle.png'}
                alt={featuredPost.title}
                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Đang tải danh sách bài viết...</p>
          </div>
        ) : gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => {
              const postDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
                : 'Gần đây';

              return (
                <article
                  key={post.id}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Cover Image */}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block relative h-52 bg-slate-100 dark:bg-slate-800 p-6 flex items-center justify-center overflow-hidden"
                    >
                      <span className="absolute top-3.5 left-3.5 z-10 px-3 py-1 rounded-full bg-slate-900/90 text-white font-extrabold text-[10px] backdrop-blur-md">
                        {post.categoryName}
                      </span>
                      <img
                        src={post.coverImageUrl || '/images/paddle.png'}
                        alt={post.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </Link>

                    {/* Body */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span>{postDate}</span>
                      </div>

                      <Link href={`/blog/${post.slug}`} className="block">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Đọc tiếp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Newspaper className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy bài viết phù hợp</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục bài viết khác.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setKeyword(''); setCurrentPage(1); }}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Xem tất cả bài viết
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BlogListContent />
    </Suspense>
  );
}
