'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Clock, User, Eye, BookOpen, Share2,
  Tag, Sparkles, ChevronRight, CheckCircle2, ShieldCheck, ShoppingBag
} from 'lucide-react';
import { blogApi, PostDetailDto, PostListDto } from '@/lib/api/blogApi';
import { catalogApi } from '@/lib/api/catalogApi';
import BlogContentRenderer from '@/components/blog/BlogContentRenderer';

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  const [post, setPost] = useState<PostDetailDto | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<PostListDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [fallbackProducts, setFallbackProducts] = useState<any[]>([]);

  // Fallback map if backend is not yet populated
  const fallbackDetails: Record<string, Partial<PostDetailDto>> = {
    'huong-dan-chon-vot-pickleball-cho-nguoi-moi-bat-dau': {
      title: 'Hướng dẫn chọn vợt Pickleball chuẩn nhất cho người mới bắt đầu (2026)',
      categoryName: 'Kinh nghiệm chọn vợt',
      summary: 'Phân tích chi tiết độ dày lõi (13mm vs 16mm), chất liệu mặt Carbon T700 và trọng lượng vợt phù hợp với thể lực người Việt Nam.',
      coverImageUrl: '/images/paddle.png',
      publishedAt: '2026-08-10T00:00:00Z',
      viewCount: 342,
      content: `## 1. Tầm quan trọng của việc chọn đúng vợt Pickleball
Khi mới bước chân vào bộ môn Pickleball, việc lựa chọn một cây vợt phù hợp đóng vai trò quyết định đến 70% cảm giác bóng và sự tiến bộ trong kỹ năng của bạn. Một cây vợt quá nặng sẽ dễ gây chấn thương cổ tay (tennis elbow), trong khi vợt quá nhẹ lại khó tạo ra lực đánh uy lực.

## 2. Các yếu tố kỹ thuật cốt lõi cần lưu ý
* **Độ dày lõi vợt (Core Thickness)**:
  * **13mm - 14mm (Power / Tốc độ)**: Cho độ nảy cao, bóng rời mặt vợt nhanh, phù hợp lối đánh tấn công dồn ép đối thủ.
  * **16mm (Control / Kiểm soát)**: Hấp thụ lực tốt, diện tích điểm ngọt (Sweet Spot) lớn, giúp bạn dễ dàng thực hiện các pha dink bóng tinh tế và phòng thủ mềm mại.
* **Chất liệu bề mặt (Face Material)**:
  * **Carbon Toray T700 / Raw Carbon**: Mặt nhám ma sát cao tạo độ xoáy Spin bóng tối đa.
  * **Fiberglass (Sợi thủy tinh)**: Độ đàn hồi linh hoạt, cảm giác đánh đầm tay và bộc phát lực mạnh.
* **Trọng lượng (Weight)**:
  * Người chơi Việt Nam nên bắt đầu với trọng lượng trung bình từ **215g - 230g (7.6 - 8.1 oz)** để vừa đảm bảo tốc độ vung vợt vừa hạn chế mỏi cơ.

## 3. Lời khuyên từ chuyên gia PickleHub
Hãy bắt đầu với cây vợt lõi 16mm mặt Carbon để làm chủ cảm giác kiểm soát bóng trước khi nâng cấp lên các dòng vợt chuyên sâu về lực đẩy.`,
    },
    'top-5-cay-vot-pickleball-kiem-soat-tao-xoay-spin-2026': {
      title: 'Top 5 cây vợt Pickleball kiểm soát & tạo xoáy Spin cực hiểm năm 2026',
      categoryName: 'Top Sản Phẩm',
      summary: 'Đánh giá thực tế các dòng vợt được các tay vợt chuyên nghiệp săn đón nhất với công nghệ mặt nhám ma sát cao và USAPA Approved.',
      coverImageUrl: '/images/paddle.png',
      publishedAt: '2026-08-08T00:00:00Z',
      viewCount: 512,
      content: `## Đánh giá chi tiết Top 5 siêu phẩm tạo xoáy hàng đầu
Xu hướng thi đấu Pickleball hiện đại đòi hỏi khả năng tạo xoáy Spin cực cao để ép bóng chìm nhanh sát lưới và gây khó khăn cho đối thủ khi trả giao bóng.

### 1. PickleHub Pro Carbon T700 SpinMaster
* **Chất liệu**: Toray T700 Raw Carbon nhập khẩu.
* **Độ dày**: 16mm Polypropylene Honeycomb.
* **Đặc điểm nổi bật**: Độ nhám bề mặt được khắc laser nano, duy trì ma sát bền bỉ gấp 3 lần so với công nghệ phun cát truyền thống.

### 2. Joola Ben Johns Perseus CFS 16
Cây vợt huyền thoại mang lại độ chính xác tuyệt đối trong các pha dink bóng và reset bóng từ khu vực Baseline.

### 3. Selkirk Vanguard Power Air Invikta
Thiết kế khí động học không viền (Edgeless) độc quyền giúp tối ưu hóa tốc độ vung tay và phản xạ nhanh trên lưới.

### 4. CRBN 1X Power Series
Sự kết hợp hoàn hảo giữa sức mạnh bộc phát và cảm giác kiểm soát bóng chắc chắn.

### 5. Franklin Signature Pro Carbon
Mẫu vợt chuẩn thi đấu USAPA với mức giá cực kỳ dễ tiếp cận cho người chơi phong trào chất lượng cao.`,
    },
    'luat-choi-pickleball-va-chien-thuat-danh-doi-dink-bong': {
      title: 'Luật chơi Pickleball cơ bản & Chiến thuật đánh đôi dink bóng trên lưới',
      categoryName: 'Kỹ Thuật Thi Đấu',
      summary: 'Tổng hợp quy tắc tính điểm, vùng Non-Volley Zone (Kitchen) và các mẹo kiểm soát nhịp đấu giúp bạn làm chủ trận đấu dễ dàng.',
      coverImageUrl: '/images/balls.png',
      publishedAt: '2026-08-05T00:00:00Z',
      viewCount: 280,
      content: `## 1. Quy tắc cốt lõi cần nhớ trong Pickleball
* **Vùng Kitchen (Non-Volley Zone)**: Khu vực 2.13m tính từ lưới. Người chơi không được đứng trong vùng này để đánh bóng trực tiếp trên không (Volley).
* **Quy tắc 2 lần nảy bóng (Two-Bounce Rule)**: Đội giao bóng và đội nhận giao bóng đều phải để bóng nảy 1 lần trên mặt sân trước khi được phép đánh bóng qua lưới.
* **Cách tính điểm đánh đôi**: Điểm số luôn gồm 3 chữ số: *(Điểm đội giao - Điểm đội nhận - Người giao bóng 1 hay 2)*.

## 2. Nghệ thuật Dink bóng - Chìa khóa chiến thắng
Dink là cú đánh nhẹ đưa bóng rơi qua lưới và nằm gọn trong vùng Kitchen của đối phương:
1. Giữ đầu vợt luôn hướng lên trên, thả lỏng cổ tay.
2. Dùng lực nâng nhẹ nhàng từ cẳng tay và khớp vai, không dùng lực cổ tay vẩy bóng.
3. Nhắm bóng vào chân hoặc góc chéo sân để đối thủ không thể đập bóng (Smash).

## 3. Chiến thuật di chuyển đồng bộ
Luôn di chuyển tiến - lùi cùng nhịp với đồng đội tạo thành một 'bức tường chắn' vững chắc trên đường biên Kitchen line.`,
    },
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    blogApi
      .getPostBySlug(slug)
      .then(async (data) => {
        setPost(data);
        // Nếu backend chưa trả relatedProducts hoặc thiếu ảnh, fetch bổ sung từ Catalog API
        const hasMissingImages = !data.relatedProducts || data.relatedProducts.length === 0 ||
          data.relatedProducts.some((rp: any) => !rp.imageUrl && !rp.image);
        if (hasMissingImages && data.relatedProductIds && data.relatedProductIds.length > 0) {
          try {
            const allProducts = await catalogApi.getProducts(undefined, 100);
            const matched = allProducts.filter((p: any) => data.relatedProductIds?.includes(p.id));
            setFallbackProducts(matched);
          } catch (e) {
            console.warn('[BlogDetail] Error fetching fallback products:', e);
          }
        }
      })
      .catch((err) => {
        console.warn('[BlogDetail] Error fetching post by slug, fallback:', err);
        const fb = fallbackDetails[slug];
        if (fb) {
          setPost({
            id: 'fallback-id',
            title: fb.title || '',
            slug: slug,
            summary: fb.summary || '',
            content: fb.content || '',
            coverImageUrl: fb.coverImageUrl || '/images/paddle.png',
            categoryId: '',
            categoryName: fb.categoryName || 'Blog',
            status: 'Published',
            publishedAt: fb.publishedAt || new Date().toISOString(),
            authorId: '',
            viewCount: fb.viewCount || 100,
          });
        }
      })
      .finally(() => setLoading(false));

    blogApi
      .getRelatedPosts(slug, 3)
      .then((rel) => setRelatedPosts(rel))
      .catch(() => {});
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-28 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500">Đang tải bài viết...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không tìm thấy bài viết</h2>
        <p className="text-xs text-slate-500">Bài viết bạn tìm kiếm có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <Link href="/blog" className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
          Quay lại danh sách bài viết
        </Link>
      </div>
    );
  }

  const postDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Mới cập nhật';

  const displayRelatedProducts = useMemo(() => {
    if (!post?.relatedProducts || post.relatedProducts.length === 0) {
      return fallbackProducts;
    }
    return post.relatedProducts.map((rp) => {
      const fb = fallbackProducts.find((p) => p.id === rp.id);
      return {
        ...rp,
        image: rp.imageUrl || (rp as any).image || fb?.image || fb?.imageUrl || fb?.thumbnailUrl || fb?.images?.[0] || '/images/paddle.png',
        price: rp.price || fb?.price || (rp as any).effectivePrice || (rp as any).basePrice || 0,
      };
    });
  }, [post?.relatedProducts, fallbackProducts]);

  return (
    <div className="py-10 sm:py-14 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold flex-wrap">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-emerald-600 transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs">{post.title}</span>
        </div>

        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách blog</span>
        </Link>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
              {post.categoryName}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>{postDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{post.viewCount || 100} lượt xem</span>
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          {post.summary && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-emerald-500 pl-4 py-1">
              {post.summary}
            </p>
          )}

          {/* Social Share & Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span>Biên tập bởi đội ngũ chuyên gia <strong className="text-slate-800 dark:text-slate-200">PickleHub</strong></span>
            </div>

            <button
              onClick={handleShare}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Đã sao chép link!' : 'Chia sẻ'}</span>
            </button>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImageUrl && (
          <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 p-8 flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-md">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="max-h-full max-w-full object-contain drop-shadow-xl"
            />
          </div>
        )}

        {/* Article Body Content */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <BlogContentRenderer content={post.content} />
        </div>

        {/* Related Products Widget (if any) */}
        {displayRelatedProducts && displayRelatedProducts.length > 0 && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-3xl p-6 sm:p-8 border border-emerald-200/60 dark:border-emerald-900/50 space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Sản phẩm được đề xuất trong bài viết
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayRelatedProducts.map((p: any) => {
                const priceValue = p?.price ?? p?.effectivePrice ?? p?.basePrice ?? 0;
                const formattedPrice = Number(priceValue).toLocaleString('vi-VN');
                const productUrl = `/products/${p.id || p.slug}`;

                return (
                  <Link
                    key={p.id || p.slug || Math.random()}
                    href={productUrl}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex items-center gap-3 group"
                  >
                    <img
                      src={p.image || p.imageUrl || p.thumbnailUrl || p.images?.[0] || '/images/paddle.png'}
                      alt={p.name || 'Sản phẩm Pickleball'}
                      className="w-14 h-14 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-1 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/paddle.png';
                      }}
                    />
                    <div className="truncate space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-600">
                        {p.name}
                      </h4>
                      <p className="font-extrabold text-xs text-emerald-600">
                        {formattedPrice} ₫
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Prev / Next Post Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {post.previousPost ? (
            <Link
              href={`/blog/${post.previousPost.slug}`}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all space-y-1 group"
            >
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-500" />
                Bài viết trước
              </span>
              <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 line-clamp-1">
                {post.previousPost.title}
              </p>
            </Link>
          ) : (
            <div />
          )}

          {post.nextPost && (
            <Link
              href={`/blog/${post.nextPost.slug}`}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all space-y-1 text-right group"
            >
              <span className="text-[11px] font-bold text-slate-400 flex items-center justify-end gap-1">
                Bài viết tiếp theo
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
              </span>
              <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 line-clamp-1">
                {post.nextPost.title}
              </p>
            </Link>
          )}
        </div>

        {/* Related Posts Row */}
        {relatedPosts.length > 0 && (
          <div className="space-y-4 pt-8 border-t border-slate-200/80 dark:border-slate-800">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Bài viết cùng chủ đề
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500 transition-all space-y-3 group"
                >
                  <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={rel.coverImageUrl || '/images/paddle.png'}
                      alt={rel.title}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase">
                      {rel.categoryName}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
