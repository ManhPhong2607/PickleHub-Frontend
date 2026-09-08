'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { adminApi, type AdminReviewDto, type AdminCustomerDto } from '@/lib/api/adminApi';
import { catalogApi } from '@/lib/api/catalogApi';
import type { Product } from '@/types';
import { uploadImageToCloudinary } from '@/lib/utils/cloudinaryUpload';
import { useResizableColumns, ResizeHandle } from '@/hooks/useResizableColumns';
import {
  Star, Eye, EyeOff, Trash2, MessageSquare, RefreshCw, X, ChevronLeft, ChevronRight,
  Search, Filter, Calendar, CheckCircle2, AlertTriangle, Image as ImageIcon, Send,
  CornerDownRight, Check, ShieldCheck, ShieldAlert, Sparkles, ExternalLink, ThumbsUp,
  User, Package, HelpCircle, ArrowUpDown, UploadCloud, Loader2, Link as LinkIcon, Paperclip,
  ChevronDown
} from 'lucide-react';

// ─── Star Rating Component ───────────────────────────────────────────────────
const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-0.5" title={`${rating} sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
          }`}
        />
      ))}
    </div>
  );
};

// ─── Skeleton Loading Row ─────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[1, 2, 3, 4, 5, 6, 7].map(i => (
      <td key={i} className="py-4 px-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
        {i === 1 && <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2 mt-1.5" />}
      </td>
    ))}
  </tr>
);

export const ReviewsModule: React.FC = () => {
  // ── Raw Data ──
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter States ──
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Product Autocomplete Combobox Filter
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const productComboboxRef = useRef<HTMLDivElement>(null);

  const [selectedRating, setSelectedRating] = useState<string>('all'); // 'all' | '5' | '4' | '3' | '2' | '1'
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all' | 'visible' | 'hidden'
  const [selectedReplyFilter, setSelectedReplyFilter] = useState<string>('all'); // 'all' | 'replied' | 'unreplied'
  const [selectedMediaFilter, setSelectedMediaFilter] = useState<string>('all'); // 'all' | 'with_images'
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all'); // 'all' | 'today' | '7days' | '30days' | 'custom'
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest'); // 'newest' | 'oldest' | 'rating_desc' | 'rating_asc' | 'helpful'

  // Quick preset tab
  const [activeTab, setActiveTab] = useState<'all' | 'unreplied' | 'with_images' | 'hidden'>('all');

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Modals & Action State ──
  const [viewingReview, setViewingReview] = useState<AdminReviewDto | null>(null);
  const [replyingReview, setReplyingReview] = useState<AdminReviewDto | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState('');
  const [uploadingReplyImage, setUploadingReplyImage] = useState(false);
  const [replyImageTab, setReplyImageTab] = useState<'upload' | 'url'>('upload');
  const [isDragOverReplyImage, setIsDragOverReplyImage] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  
  const [hidingReview, setHidingReview] = useState<AdminReviewDto | null>(null);
  const [hideReason, setHideReason] = useState('Spam / Quảng cáo không phù hợp');
  const [customHideReason, setCustomHideReason] = useState('');

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Resizable Table Columns ──
  const { widths, totalWidth, activeResizingKey, startResize } = useResizableColumns({
    storageKey: 'pickle_col_widths_reviews_v2',
    defaultWidths: {
      user: 190,
      product: 210,
      rating: 120,
      content: 340,
      status: 120,
      date: 120,
      actions: 140,
    },
    minWidths: {
      user: 140,
      product: 150,
      rating: 90,
      content: 200,
      status: 90,
      date: 90,
      actions: 110,
    },
  });

  // Load product list and customer list for filter and data enrichment
  useEffect(() => {
    catalogApi.getProducts().then(setProducts).catch(() => {});
    adminApi.getCustomers({ page: 1, pageSize: 1000 }).then(res => setCustomers(res.items)).catch(() => {});
  }, []);

  // Handle outside click for product combobox dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (productComboboxRef.current && !productComboboxRef.current.contains(e.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Map product metadata by ID
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id.toLowerCase(), p));
    return map;
  }, [products]);

  // Map customer metadata by User ID and Customer Profile ID
  const customerMap = useMemo(() => {
    const map = new Map<string, AdminCustomerDto>();
    customers.forEach(c => {
      if (c.userId) map.set(c.userId.toLowerCase(), c);
      if (c.id) map.set(c.id.toLowerCase(), c);
    });
    return map;
  }, [customers]);

  // Filtered products for combobox search
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return products;
    const term = productSearchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(term)) ||
      (p.brandName && p.brandName.toLowerCase().includes(term))
    );
  }, [products, productSearchTerm]);

  const selectedProductObj = useMemo(() => {
    if (selectedProductId === 'all') return null;
    return productMap.get(selectedProductId.toLowerCase()) || null;
  }, [selectedProductId, productMap]);

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Compute Date Filters
      let fromDate: string | undefined = undefined;
      let toDate: string | undefined = undefined;

      const now = new Date();
      if (dateRangeFilter === 'today') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (dateRangeFilter === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        fromDate = d.toISOString();
      } else if (dateRangeFilter === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        fromDate = d.toISOString();
      } else if (dateRangeFilter === 'custom') {
        if (customFromDate) fromDate = new Date(customFromDate).toISOString();
        if (customToDate) toDate = new Date(customToDate).toISOString();
      }

      // Compute parameters
      let isHiddenParam: boolean | undefined = undefined;
      if (activeTab === 'hidden' || selectedStatus === 'hidden') isHiddenParam = true;
      else if (selectedStatus === 'visible') isHiddenParam = false;

      let hasReplyParam: boolean | undefined = undefined;
      if (activeTab === 'unreplied' || selectedReplyFilter === 'unreplied') hasReplyParam = false;
      else if (selectedReplyFilter === 'replied') hasReplyParam = true;

      let hasImagesParam: boolean | undefined = undefined;
      if (activeTab === 'with_images' || selectedMediaFilter === 'with_images') hasImagesParam = true;

      const ratingParam = selectedRating !== 'all' ? parseInt(selectedRating, 10) : undefined;
      const productIdParam = selectedProductId !== 'all' ? selectedProductId : undefined;

      const result = await adminApi.getReviews({
        keyword: searchQuery || undefined,
        productId: productIdParam,
        rating: ratingParam,
        isHidden: isHiddenParam,
        hasReply: hasReplyParam,
        hasImages: hasImagesParam,
        fromDate,
        toDate,
        sortBy,
        page,
        pageSize,
      });

      // Enrich product name / thumbnail and customer name / email
      const enrichedItems = result.items.map(r => {
        const matchedProd = productMap.get(r.productId.toLowerCase());
        const matchedCust = customerMap.get(r.userId.toLowerCase());

        let finalUserName = r.userName;
        if (!finalUserName || finalUserName === 'Khách hàng' || finalUserName === '—') {
          if (matchedCust && matchedCust.fullName && matchedCust.fullName !== '—') {
            finalUserName = matchedCust.fullName;
          } else if (matchedCust && matchedCust.email && matchedCust.email !== '—') {
            finalUserName = matchedCust.email.split('@')[0];
          } else if (r.userEmail && r.userEmail !== '—') {
            finalUserName = r.userEmail.split('@')[0];
          } else {
            finalUserName = 'Khách hàng #' + r.userId.substring(0, 6);
          }
        }

        const finalUserEmail = (r.userEmail && r.userEmail !== '—')
          ? r.userEmail
          : (matchedCust?.email && matchedCust.email !== '—'
              ? matchedCust.email
              : (matchedCust?.phone && matchedCust.phone !== '—' ? matchedCust.phone : ''));

        return {
          ...r,
          userName: finalUserName,
          userEmail: finalUserEmail,
          productName: r.productName || matchedProd?.name || 'Sản phẩm PickleHub',
          productImage: r.productImage || matchedProd?.image || '/images/paddle.png',
        };
      });

      setReviews(enrichedItems);
      setTotal(result.totalItems);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải danh sách đánh giá từ Review Service.');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery, selectedProductId, selectedRating, selectedStatus, selectedReplyFilter,
    selectedMediaFilter, dateRangeFilter, customFromDate, customToDate, sortBy, activeTab,
    page, pageSize, productMap, customerMap
  ]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Debounced search
  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val);
      setPage(1);
    }, 350);
  };

  // Quick Tab Switching
  const handleTabChange = (tab: 'all' | 'unreplied' | 'with_images' | 'hidden') => {
    setActiveTab(tab);
    setPage(1);
    if (tab === 'unreplied') {
      setSelectedReplyFilter('unreplied');
      setSelectedStatus('all');
      setSelectedMediaFilter('all');
    } else if (tab === 'with_images') {
      setSelectedMediaFilter('with_images');
      setSelectedReplyFilter('all');
      setSelectedStatus('all');
    } else if (tab === 'hidden') {
      setSelectedStatus('hidden');
      setSelectedReplyFilter('all');
      setSelectedMediaFilter('all');
    } else {
      setSelectedReplyFilter('all');
      setSelectedStatus('all');
      setSelectedMediaFilter('all');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setLocalSearch('');
    setSelectedProductId('all');
    setProductSearchTerm('');
    setIsProductDropdownOpen(false);
    setSelectedRating('all');
    setSelectedStatus('all');
    setSelectedReplyFilter('all');
    setSelectedMediaFilter('all');
    setDateRangeFilter('all');
    setCustomFromDate('');
    setCustomToDate('');
    setSortBy('newest');
    setActiveTab('all');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedProductId !== 'all' || selectedRating !== 'all' ||
    selectedStatus !== 'all' || selectedReplyFilter !== 'all' || selectedMediaFilter !== 'all' ||
    dateRangeFilter !== 'all' || activeTab !== 'all';

  // ── Actions ──

  // Open Reply Modal
  const handleOpenReplyModal = (review: AdminReviewDto) => {
    setReplyingReview(review);
    setReplyImageTab('upload');
    setUploadingReplyImage(false);
    setIsDragOverReplyImage(false);
    // Parse if reply already has image format: [img]url[/img]
    const currentReply = review.sellerReply || '';
    const imgMatch = currentReply.match(/\[img\](.*?)\[\/img\]/);
    if (imgMatch) {
      setReplyImage(imgMatch[1]);
      setReplyText(currentReply.replace(/\[img\].*?\[\/img\]/, '').trim());
    } else {
      setReplyImage('');
      setReplyText(currentReply);
    }
  };

  // Upload local image from computer
  const handleReplyImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WebP, GIF)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa 10MB', 'error');
      return;
    }

    setUploadingReplyImage(true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      setReplyImage(uploadedUrl);
      showToast('Đã tải ảnh từ máy tính lên thành công!');
    } catch (err: any) {
      showToast('Lỗi khi tải ảnh: ' + (err?.message || 'Không thể upload ảnh'), 'error');
    } finally {
      setUploadingReplyImage(false);
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = '';
      }
    }
  };

  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleReplyImageUpload(e.target.files[0]);
    }
  };

  const handleReplyDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverReplyImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleReplyImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Submit Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview) return;

    setSubmitting(true);
    try {
      let finalReply = replyText.trim();
      if (replyImage.trim()) {
        finalReply += `\n[img]${replyImage.trim()}[/img]`;
      }

      await adminApi.replyReview(replyingReview.id, finalReply);
      showToast('Đã gửi phản hồi đánh giá thành công!');
      setReplyingReview(null);
      fetchReviews();
      if (viewingReview?.id === replyingReview.id) {
        setViewingReview({
          ...viewingReview,
          sellerReply: finalReply,
          sellerRepliedAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      showToast('Lỗi: ' + (e?.response?.data?.message || e.message || 'Không thể gửi phản hồi.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Hide Modal
  const handleOpenHideModal = (review: AdminReviewDto) => {
    if (review.isHidden) {
      // If currently hidden, unhide directly
      handleToggleHide(review, false);
    } else {
      // If currently visible, open modal to select reason
      setHidingReview(review);
      setHideReason('Spam / Quảng cáo không phù hợp');
      setCustomHideReason('');
    }
  };

  // Submit Hide with Reason
  const handleConfirmHide = async () => {
    if (!hidingReview) return;
    const finalReason = hideReason === 'Khác' ? customHideReason.trim() || 'Lý do khác' : hideReason;

    setSubmitting(true);
    try {
      await adminApi.hideReview(hidingReview.id, true, finalReason);
      showToast('Đã ẩn đánh giá khỏi cửa hàng!');
      setHidingReview(null);
      fetchReviews();
      if (viewingReview?.id === hidingReview.id) {
        setViewingReview({ ...viewingReview, isHidden: true, hideReason: finalReason });
      }
    } catch (e: any) {
      showToast('Lỗi: ' + (e?.response?.data?.message || e.message || 'Thao tác thất bại'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Direct toggle (used for unhiding)
  const handleToggleHide = async (review: AdminReviewDto, shouldHide: boolean) => {
    setSubmitting(true);
    try {
      await adminApi.hideReview(review.id, shouldHide);
      showToast(`Đã ${shouldHide ? 'ẨN' : 'BỎ ẨN'} đánh giá thành công!`);
      fetchReviews();
      if (viewingReview?.id === review.id) {
        setViewingReview({ ...viewingReview, isHidden: shouldHide });
      }
    } catch (e: any) {
      showToast('Lỗi: ' + (e?.response?.data?.message || e.message || 'Thao tác thất bại'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (review: AdminReviewDto) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không?')) return;
    setSubmitting(true);
    try {
      await adminApi.deleteReview(review.id);
      showToast('Đã xóa đánh giá thành công!');
      if (viewingReview?.id === review.id) setViewingReview(null);
      fetchReviews();
    } catch (e: any) {
      showToast('Lỗi: ' + (e?.response?.data?.message || e.message || 'Xóa thất bại'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── KPI Stats Calculations ──
  const stats = useMemo(() => {
    const totalCount = reviews.length;
    const avgRating = totalCount > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
      : '5.0';
    const unrepliedCount = reviews.filter(r => !r.sellerReply).length;
    const withImagesCount = reviews.filter(r => r.imageUrls && r.imageUrls.length > 0).length;
    const hiddenCount = reviews.filter(r => r.isHidden).length;

    return { totalCount, avgRating, unrepliedCount, withImagesCount, hiddenCount };
  }, [reviews]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Custom Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 text-white text-xs font-bold rounded-2xl shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-600 shadow-rose-600/20' : 'bg-emerald-600 shadow-emerald-600/20'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Quản lý đánh giá sản phẩm
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Xem nhận xét, kiểm duyệt ẩn/hiện, và gửi phản hồi chăm sóc khách hàng (kèm hình ảnh). Tổng: <strong>{total}</strong> đánh giá.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReviews}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shadow-sm"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng đánh giá</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{total}</span>
            <span className="text-xs text-slate-400 font-semibold">tất cả</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Điểm trung bình</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-500">{stats.avgRating}</span>
            <StarRating rating={Math.round(Number(stats.avgRating))} size="sm" />
          </div>
        </div>

        <div
          onClick={() => handleTabChange('unreplied')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
            activeTab === 'unreplied'
              ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Cần phản hồi</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.unrepliedCount}</span>
            <span className="text-[11px] font-bold text-amber-600">bài mới</span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('with_images')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
            activeTab === 'with_images'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Có hình ảnh</span>
            <ImageIcon className="w-3.5 h-3.5" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.withImagesCount}</span>
            <span className="text-[11px] font-bold text-emerald-600">ảnh thật</span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('hidden')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 col-span-2 sm:col-span-1 ${
            activeTab === 'hidden'
              ? 'bg-rose-500/10 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>Đã bị ẩn</span>
            <EyeOff className="w-3.5 h-3.5" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.hiddenCount}</span>
            <span className="text-[11px] font-bold text-rose-600">vi phạm</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'all', label: 'Tất cả đánh giá' },
            { id: 'unreplied', label: 'Chưa phản hồi' },
            { id: 'with_images', label: 'Có hình ảnh' },
            { id: 'hidden', label: 'Đã bị ẩn' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline px-2 py-1 flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Tìm theo nội dung, tên KH..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-medium transition-colors"
            />
          </div>

          {/* Product Search & Select Combobox */}
          <div ref={productComboboxRef} className="relative">
            <div
              onClick={() => setIsProductDropdownOpen(prev => !prev)}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                isProductDropdownOpen
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {selectedProductObj ? (
                  <>
                    <img
                      src={selectedProductObj.image || '/images/paddle.png'}
                      alt="p"
                      className="w-5 h-5 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                      onError={(e) => { (e.target as any).src = '/images/paddle.png'; }}
                    />
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs" title={selectedProductObj.name}>
                      {selectedProductObj.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium truncate text-xs">
                      Tất cả sản phẩm
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {selectedProductId !== 'all' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProductId('all');
                      setProductSearchTerm('');
                      setPage(1);
                    }}
                    className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Bỏ chọn sản phẩm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProductDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
              </div>
            </div>

            {/* Dropdown Suggestions List */}
            {isProductDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1.5 min-w-[280px] max-h-72 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
                {/* Search input inside dropdown */}
                <div className="relative shrink-0 px-1 pt-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="Gõ tên sản phẩm để tìm kiếm..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Suggestions List */}
                <div className="overflow-y-auto flex-1 space-y-1 pr-1 scrollbar-thin max-h-56">
                  {/* All products option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId('all');
                      setIsProductDropdownOpen(false);
                      setProductSearchTerm('');
                      setPage(1);
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors text-xs ${
                      selectedProductId === 'all'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span>Tất cả sản phẩm ({products.length})</span>
                    </div>
                    {selectedProductId === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>

                  {filteredProducts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Không tìm thấy sản phẩm nào phù hợp với "{productSearchTerm}"
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedProductId.toLowerCase() === p.id.toLowerCase();
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setIsProductDropdownOpen(false);
                            setPage(1);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors text-xs ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={p.image || '/images/paddle.png'}
                              alt={p.name}
                              className="w-7 h-7 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                              onError={(e) => { (e.target as any).src = '/images/paddle.png'; }}
                            />
                            <div className="min-w-0">
                              <span className="block text-xs font-semibold truncate" title={p.name}>
                                {p.name}
                              </span>
                              {p.price > 0 && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rating Star Filter */}
          <div className="relative">
            <select
              value={selectedRating}
              onChange={(e) => { setSelectedRating(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-medium transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tất cả số sao ⭐</option>
              <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
              <option value="4">4 Sao ⭐⭐⭐⭐</option>
              <option value="3">3 Sao ⭐⭐⭐</option>
              <option value="2">2 Sao ⭐⭐</option>
              <option value="1">1 Sao ⭐</option>
            </select>
            <Star className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={dateRangeFilter}
              onChange={(e) => { setDateRangeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-medium transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="custom">Tùy chọn khoảng ngày...</option>
            </select>
            <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-medium transition-colors appearance-none cursor-pointer"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="rating_desc">Sao cao đến thấp</option>
              <option value="rating_asc">Sao thấp đến cao</option>
              <option value="helpful">Hữu ích nhất</option>
            </select>
            <ArrowUpDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Custom Date Picker row when 'custom' selected */}
        {dateRangeFilter === 'custom' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
            <span className="font-bold text-slate-500">Từ ngày:</span>
            <input
              type="date"
              value={customFromDate}
              onChange={(e) => { setCustomFromDate(e.target.value); setPage(1); }}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
            />
            <span className="font-bold text-slate-500">Đến ngày:</span>
            <input
              type="date"
              value={customToDate}
              onChange={(e) => { setCustomToDate(e.target.value); setPage(1); }}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Main Reviews Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
            className="text-xs text-left table-fixed border-collapse"
          >
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th style={{ width: widths.user }} className="relative py-4 px-4 select-none border-r border-slate-100 dark:border-slate-800">
                  Khách hàng
                  <ResizeHandle onMouseDown={(e) => startResize('user', e)} isResizing={activeResizingKey === 'user'} />
                </th>
                <th style={{ width: widths.product }} className="relative py-4 px-4 select-none border-r border-slate-100 dark:border-slate-800">
                  Sản phẩm
                  <ResizeHandle onMouseDown={(e) => startResize('product', e)} isResizing={activeResizingKey === 'product'} />
                </th>
                <th style={{ width: widths.rating }} className="relative py-4 px-4 select-none border-r border-slate-100 dark:border-slate-800">
                  Đánh giá
                  <ResizeHandle onMouseDown={(e) => startResize('rating', e)} isResizing={activeResizingKey === 'rating'} />
                </th>
                <th style={{ width: widths.content }} className="relative py-4 px-4 select-none border-r border-slate-100 dark:border-slate-800">
                  Nội dung & Phản hồi
                  <ResizeHandle onMouseDown={(e) => startResize('content', e)} isResizing={activeResizingKey === 'content'} />
                </th>
                <th style={{ width: widths.status }} className="relative py-4 px-4 select-none border-r border-slate-100 dark:border-slate-800">
                  Trạng thái
                  <ResizeHandle onMouseDown={(e) => startResize('status', e)} isResizing={activeResizingKey === 'status'} />
                </th>
                <th style={{ width: widths.date }} className="relative py-4 px-4 select-none border-r border-slate-100 dark:border-slate-800">
                  Ngày gửi
                  <ResizeHandle onMouseDown={(e) => startResize('date', e)} isResizing={activeResizingKey === 'date'} />
                </th>
                <th style={{ width: widths.actions }} className="relative py-4 px-4 text-right select-none">
                  Thao tác
                  <ResizeHandle onMouseDown={(e) => startResize('actions', e)} isResizing={activeResizingKey === 'actions'} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="text-sm text-rose-600 font-bold mb-2">{error}</div>
                    <button onClick={fetchReviews} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400 font-medium">
                    Không tìm thấy đánh giá nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : reviews.map((rev) => (
                <tr
                  key={rev.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    rev.isHidden ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                  }`}
                >
                  {/* Customer */}
                  <td className="py-4 px-4 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-xs shrink-0">
                        {(rev.userName || 'K').charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {rev.userName || 'Khách hàng'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          {rev.userEmail || rev.userId.substring(0, 8) + '...'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Product */}
                  <td className="py-4 px-4 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={rev.productImage || '/images/paddle.png'}
                        alt={rev.productName || 'Product'}
                        className="w-9 h-9 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                        onError={(e) => { (e.target as any).src = '/images/paddle.png'; }}
                      />
                      <div className="truncate min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate hover:text-emerald-600 transition-colors" title={rev.productName}>
                          {rev.productName || 'Sản phẩm PickleHub'}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                            <ShieldCheck className="w-3 h-3" /> Đã mua hàng
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="py-4 px-4 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    <StarRating rating={rev.rating} />
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                      {rev.rating} trên 5 sao
                    </span>
                  </td>

                  {/* Content & Reply Snapshot */}
                  <td className="py-4 px-4 max-w-xs border-r border-slate-100 dark:border-slate-800">
                    <p className="text-slate-800 dark:text-slate-200 text-xs line-clamp-2" title={rev.comment}>
                      {rev.comment || <em className="text-slate-400">(Không có bình luận chữ)</em>}
                    </p>

                    {/* Customer attached thumbnails */}
                    {rev.imageUrls && rev.imageUrls.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                        {rev.imageUrls.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="review-img"
                            onClick={() => setLightboxImage(img)}
                            className="w-6 h-6 object-cover rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 transition-transform"
                          />
                        ))}
                        {rev.imageUrls.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-bold">+{rev.imageUrls.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Seller Reply Badge */}
                    {rev.sellerReply ? (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md w-fit">
                        <Check className="w-3 h-3" />
                        <span>Đã phản hồi</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
                        • Chưa phản hồi
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                      rev.isHidden
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    }`}>
                      {rev.isHidden ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Đã ẩn</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Hiển thị</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-4 text-slate-500 font-mono text-[11px] border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setViewingReview(rev)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenReplyModal(rev)}
                      className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                      title={rev.sellerReply ? "Sửa phản hồi" : "Phản hồi khách hàng"}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      disabled={submitting}
                      onClick={() => handleOpenHideModal(rev)}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        rev.isHidden
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={rev.isHidden ? "Bỏ ẩn đánh giá" : "Ẩn đánh giá"}
                    >
                      {rev.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      disabled={submitting}
                      onClick={() => handleDeleteReview(rev)}
                      className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors disabled:opacity-50"
                      title="Xóa đánh giá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && !error && total > 0 && (
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
            {/* Left info & Page Size Selector */}
            <div className="flex items-center gap-3">
              <span>
                Hiển thị <strong className="text-slate-800 dark:text-slate-200">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</strong> trong tổng số <strong className="text-slate-800 dark:text-slate-200">{total}</strong> đánh giá
              </span>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400">Hiển thị:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-transparent font-bold text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value={5} className="bg-white dark:bg-slate-900">5</option>
                  <option value={10} className="bg-white dark:bg-slate-900">10</option>
                  <option value={15} className="bg-white dark:bg-slate-900">15</option>
                  <option value={20} className="bg-white dark:bg-slate-900">20</option>
                  <option value={50} className="bg-white dark:bg-slate-900">50</option>
                </select>
              </div>
            </div>

            {/* Right pagination buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                  .map((pg, idx, arr) => {
                    const prevPg = arr[idx - 1];
                    return (
                      <React.Fragment key={pg}>
                        {prevPg && pg - prevPg > 1 && (
                          <span className="px-1 text-slate-400">...</span>
                        )}
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                            pg === page
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pg}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL 1: VIEW FULL REVIEW DETAIL ── */}
      {viewingReview && (
        <div
          onClick={() => setViewingReview(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 my-8 cursor-default"
          >
            <button
              onClick={() => setViewingReview(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Customer & Product info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center text-lg shrink-0">
                  {(viewingReview.userName || 'K').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {viewingReview.userName || 'Khách hàng'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono block">
                    {viewingReview.userEmail || `User ID: ${viewingReview.userId.substring(0, 8)}...`}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <StarRating rating={viewingReview.rating} size="md" />
                <span className="text-xs text-slate-500 font-mono block">
                  {viewingReview.createdAt ? new Date(viewingReview.createdAt).toLocaleString('vi-VN') : ''}
                </span>
              </div>
            </div>

            {/* Product Snapshot */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between gap-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={viewingReview.productImage || '/images/paddle.png'}
                  alt="prod"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white"
                />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Sản phẩm đánh giá</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                    {viewingReview.productName || 'Sản phẩm PickleHub'}
                  </span>
                  {viewingReview.isVerifiedPurchase && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Đã xác thực mua hàng từ đơn hàng
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Review Comment */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nội dung nhận xét</span>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {viewingReview.comment || <em className="text-slate-400">Khách hàng không để lại nhận xét bằng chữ.</em>}
              </div>
            </div>

            {/* Customer Images Gallery */}
            {viewingReview.imageUrls && viewingReview.imageUrls.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" /> Hình ảnh đính kèm ({viewingReview.imageUrls.length})
                </span>
                <div className="flex flex-wrap gap-3">
                  {viewingReview.imageUrls.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`review-img-${idx}`}
                      onClick={() => setLightboxImage(img)}
                      className="w-20 h-20 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Status Info */}
            {viewingReview.isHidden && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <span className="font-extrabold flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4" /> Đánh giá này đang bị ẩn khỏi Storefront
                </span>
                <p className="font-medium">Lý do ẩn: {viewingReview.hideReason || 'Vi phạm chính sách đánh giá'}</p>
              </div>
            )}

            {/* Seller Reply Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CornerDownRight className="w-4 h-4 text-emerald-600" />
                  Phản hồi từ Admin PickleHub
                </span>
                {viewingReview.sellerReply && (
                  <button
                    onClick={() => { setViewingReview(null); handleOpenReplyModal(viewingReview); }}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Chỉnh sửa phản hồi
                  </button>
                )}
              </div>

              {viewingReview.sellerReply ? (
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">PickleHub Official</span>
                    <span>{viewingReview.sellerRepliedAt ? new Date(viewingReview.sellerRepliedAt).toLocaleString('vi-VN') : ''}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed">
                    {viewingReview.sellerReply.replace(/\[img\].*?\[\/img\]/, '').trim()}
                  </p>
                  {/* If seller attached image */}
                  {viewingReview.sellerReply.includes('[img]') && (
                    <div className="pt-1">
                      <img
                        src={viewingReview.sellerReply.match(/\[img\](.*?)\[\/img\]/)?.[1] || ''}
                        alt="seller-reply-img"
                        onClick={() => setLightboxImage(viewingReview.sellerReply?.match(/\[img\](.*?)\[\/img\]/)?.[1] || '')}
                        className="max-h-36 rounded-xl border border-emerald-500/30 object-cover cursor-pointer hover:opacity-90"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Chưa có phản hồi nào cho đánh giá này.</span>
                  <button
                    onClick={() => { setViewingReview(null); handleOpenReplyModal(viewingReview); }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Viết phản hồi ngay
                  </button>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleOpenHideModal(viewingReview)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  viewingReview.isHidden
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {viewingReview.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{viewingReview.isHidden ? 'Bỏ ẩn đánh giá' : 'Ẩn đánh giá này'}</span>
              </button>

              <button
                onClick={() => setViewingReview(null)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: REPLY WITH IMAGE SUPPORT ── */}
      {replyingReview && (
        <div
          onClick={() => setReplyingReview(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 cursor-default"
          >
            <button
              onClick={() => setReplyingReview(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Phản hồi đánh giá của khách hàng
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đánh giá {replyingReview.rating}⭐ • {replyingReview.productName}
              </p>
            </div>

            {/* Customer comment snapshot */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-bold text-slate-400 block uppercase text-[10px]">Nhận xét của {replyingReview.userName || 'Khách hàng'}:</span>
              <p className="italic">"{replyingReview.comment || '(Không có nội dung)'}"</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nội dung phản hồi chính thức từ PickleHub <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Cảm ơn bạn đã tin tưởng PickleHub! Shop rất hân hạnh được hỗ trợ..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 font-medium resize-none transition-colors"
                />
              </div>

              {/* Image attachment in reply */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hình ảnh đính kèm phản hồi (Tùy chọn)</span>
                  </label>
                  
                  {/* Mode switcher: Upload vs URL */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setReplyImageTab('upload')}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                        replyImageTab === 'upload'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Từ máy tính</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyImageTab('url')}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                        replyImageTab === 'url'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Link URL</span>
                    </button>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={replyFileInputRef}
                  onChange={handleReplyFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                />

                {/* Tab 1: Upload from Computer */}
                {replyImageTab === 'upload' && (
                  <div>
                    {replyImage ? (
                      /* Preview Box when image already uploaded/selected */
                      <div className="relative p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={replyImage}
                            alt="reply-preview"
                            className="w-14 h-14 object-cover rounded-xl border border-emerald-500/40 shadow-sm shrink-0 bg-white"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 block truncate flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã đính kèm ảnh
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-xs">
                              {replyImage}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => replyFileInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Đổi ảnh
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyImage('')}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Dropzone / Upload trigger */
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverReplyImage(true); }}
                        onDragLeave={() => setIsDragOverReplyImage(false)}
                        onDrop={handleReplyDrop}
                        onClick={() => !uploadingReplyImage && replyFileInputRef.current?.click()}
                        className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
                          isDragOverReplyImage
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                            : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        } ${uploadingReplyImage ? 'pointer-events-none opacity-80' : ''}`}
                      >
                        {uploadingReplyImage ? (
                          <div className="flex flex-col items-center justify-center py-2 space-y-2">
                            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Đang tải ảnh lên Cloudinary...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-1.5">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Kéo thả ảnh vào đây hoặc <span className="text-emerald-600 underline">chọn từ máy tính</span>
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Hỗ trợ PNG, JPG, WebP, GIF (Tối đa 10MB)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Direct URL Input */}
                {replyImageTab === 'url' && (
                  <div className="space-y-2 animate-in fade-in">
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        value={replyImage}
                        onChange={(e) => setReplyImage(e.target.value)}
                        placeholder="https://res.cloudinary.com/... hoặc link ảnh bất kỳ"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium transition-colors"
                      />
                    </div>

                    {replyImage && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <div className="flex items-center gap-2">
                          <img
                            src={replyImage}
                            alt="preview"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                            onError={() => {}}
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Xem trước ảnh từ link</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyImage('')}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Đang gửi...' : 'Gửi phản hồi công khai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: HIDE REVIEW WITH REASON ── */}
      {hidingReview && (
        <div
          onClick={() => setHidingReview(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 cursor-default"
          >
            <button
              onClick={() => setHidingReview(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Ẩn bài đánh giá</h3>
                <p className="text-xs text-slate-500">Chọn lý do ẩn bài nhận xét này khỏi cửa hàng</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium">
              {[
                'Spam / Quảng cáo không phù hợp',
                'Ngôn từ thô tục, xúc phạm hoặc vi phạm tiêu chuẩn cộng đồng',
                'Thông tin sai sự thật về chất lượng sản phẩm',
                'Đánh giá nhầm đơn hàng của nhà cung cấp khác',
                'Khác',
              ].map((r) => (
                <label
                  key={r}
                  onClick={() => setHideReason(r)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    hideReason === r
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="hideReason"
                    checked={hideReason === r}
                    onChange={() => setHideReason(r)}
                    className="accent-emerald-600"
                  />
                  <span>{r}</span>
                </label>
              ))}

              {hideReason === 'Khác' && (
                <input
                  type="text"
                  value={customHideReason}
                  onChange={(e) => setCustomHideReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 mt-2"
                />
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHidingReview(null)}
                className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmHide}
                className="w-1/2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-60"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận ẩn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX FOR FULLSCREEN IMAGE PREVIEW ── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="fullscreen"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95"
          />
        </div>
      )}

    </div>
  );
};
