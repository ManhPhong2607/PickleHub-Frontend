'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Search, Filter, Edit, Trash2, CheckCircle2,
  Archive, Globe, Eye, Upload, Image as ImageIcon, X, ArrowUpRight,
  Sparkles, RefreshCw, Layers, Tag, Hash, AlignLeft, AlertCircle,
  Video, Link2, ShoppingBag, ExternalLink, Calendar, User, Clock
} from 'lucide-react';
import { blogApi, PostListDto, PostCategoryDto, CreatePostDto, UpdatePostDto, PostDetailDto } from '@/lib/api/blogApi';
import { catalogApi } from '@/lib/api/catalogApi';
import BlogContentRenderer from '@/components/blog/BlogContentRenderer';

export default function AdminPostsPage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');

  // Posts State
  const [posts, setPosts] = useState<PostListDto[]>([]);
  const [categories, setCategories] = useState<PostCategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Available Products for related products picker
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');

  // Post Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePostDto>({
    title: '',
    categoryId: '',
    summary: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    relatedProductIds: [],
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  // Inline Media upload state & Textarea cursor tracking
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Preview Modal states
  const [previewPost, setPreviewPost] = useState<PostDetailDto | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // Category Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catFormData, setCatFormData] = useState<{
    name: string;
    description: string;
    displayOrder: number;
  }>({
    name: '',
    description: '',
    displayOrder: 0,
  });
  const [catSubmitting, setCatSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postRes, catRes, prodRes] = await Promise.all([
        blogApi.getAdminPosts({
          keyword: keyword.trim() || undefined,
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined,
          page,
          pageSize: 10,
        }),
        blogApi.getCategories(),
        catalogApi.getProducts(undefined, 100).catch(() => []),
      ]);

      setPosts(postRes.items || []);
      setTotalItems(postRes.totalItems || 0);
      setCategories(catRes || []);
      setAvailableProducts(prodRes || []);
      if (catRes && catRes.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: catRes[0].id }));
      }
    } catch (err) {
      console.error('[AdminPosts] Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, statusFilter, categoryFilter, page]);

  // ==========================================
  // Post Handlers
  // ==========================================
  const handleOpenCreate = () => {
    setEditingPostId(null);
    setFormData({
      title: '',
      categoryId: categories[0]?.id || '',
      summary: '',
      content: '',
      seoTitle: '',
      seoDescription: '',
      relatedProductIds: [],
    });
    setCoverFile(null);
    setCoverPreview('');
    setProductSearch('');
    cursorPositionRef.current = { start: 0, end: 0 };
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (id: string) => {
    try {
      const postDetail = await blogApi.getAdminPostById(id);
      setEditingPostId(id);
      setFormData({
        title: postDetail.title,
        categoryId: postDetail.categoryId,
        summary: postDetail.summary || '',
        content: postDetail.content,
        seoTitle: postDetail.seoTitle || '',
        seoDescription: postDetail.seoDescription || '',
        relatedProductIds: postDetail.relatedProductIds || [],
      });
      // Nếu bài viết đã gắn sẵn sản phẩm, nạp vào availableProducts nếu chưa có
      if (postDetail.relatedProducts && postDetail.relatedProducts.length > 0) {
        setAvailableProducts((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const toAdd = postDetail.relatedProducts!
            .filter((rp) => !prevIds.has(rp.id))
            .map((rp) => ({
              id: rp.id,
              name: rp.name,
              slug: rp.slug,
              price: rp.price || rp.effectivePrice || rp.basePrice || 0,
              image: rp.imageUrl || (rp as any).image || '/images/paddle.png',
              imageUrl: rp.imageUrl,
            }));
          return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
        });
      }
      setCoverPreview(postDetail.coverImageUrl || '');
      setCoverFile(null);
      setProductSearch('');
      cursorPositionRef.current = { start: postDetail.content.length, end: postDetail.content.length };
      setIsModalOpen(true);
    } catch (err) {
      console.error('[AdminPosts] Không thể tải chi tiết bài viết để chỉnh sửa:', err);
      const found = posts.find((p) => p.id === id);
      if (found) {
        setEditingPostId(id);
        const cat = categories.find((c) => c.name === found.categoryName);
        setFormData({
          title: found.title,
          categoryId: cat?.id || categories[0]?.id || '',
          summary: found.summary || '',
          content: '',
          seoTitle: '',
          seoDescription: '',
          relatedProductIds: [],
        });
        setCoverPreview(found.coverImageUrl || '');
        setCoverFile(null);
        setProductSearch('');
        setIsModalOpen(true);
      } else {
        alert('Không thể tải thông tin bài viết để chỉnh sửa.');
      }
    }
  };

  const handleOpenPreview = async (id: string) => {
    setLoadingPreview(true);
    try {
      const postDetail = await blogApi.getAdminPostById(id);
      setPreviewPost(postDetail);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('[AdminPosts] Không thể tải dữ liệu bài viết để xem trước:', err);
      const found = posts.find((p) => p.id === id);
      if (found) {
        setPreviewPost({
          id: found.id,
          title: found.title,
          slug: found.slug,
          summary: found.summary || '',
          content: '(Đang tải hoặc nội dung bài viết chưa sẵn sàng)',
          coverImageUrl: found.coverImageUrl,
          categoryId: '',
          categoryName: found.categoryName,
          status: found.status || 'Draft',
          publishedAt: found.publishedAt,
          authorId: '',
          viewCount: found.viewCount || 0,
        });
        setIsPreviewOpen(true);
      } else {
        alert('Không thể tải dữ liệu bài viết để xem trước.');
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.categoryId) {
      alert('Vui lòng điền đầy đủ Tiêu đề, Danh mục và Nội dung bài viết.');
      return;
    }

    setSubmitting(true);
    try {
      let savedPostId = editingPostId;
      if (editingPostId) {
        await blogApi.updatePost(editingPostId, formData);
      } else {
        const created = await blogApi.createPost(formData);
        savedPostId = created.id;
      }

      if (savedPostId && coverFile) {
        await blogApi.uploadCoverImage(savedPostId, coverFile);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bài viết.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm('Bạn có chắc muốn đăng công khai bài viết này?')) return;
    try {
      await blogApi.publishPost(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi publish bài viết.');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Bạn có chắc muốn ẩn bài viết này?')) return;
    try {
      await blogApi.archivePost(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi ẩn bài viết.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await blogApi.deletePost(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa bài viết.');
    }
  };

  // ==========================================
  // Cập nhật vị trí con trỏ trong ô nội dung
  // ==========================================
  const updateCursorPosition = () => {
    if (textareaRef.current) {
      cursorPositionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
    }
  };

  // Hàm chèn đoạn Markdown/HTML chính xác tại vị trí con trỏ
  const insertMediaSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    const currentContent = formData.content || '';
    const { start, end } = cursorPositionRef.current;

    // Đảm bảo đoạn mã chèn có khoảng cách dòng phù hợp
    const formattedSnippet = `\n\n${snippet.trim()}\n\n`;

    let newContent = '';
    let newCursorPos = 0;

    // Nếu con trỏ đang ở trong phạm vi văn bản
    if (start >= 0 && end >= start && start <= currentContent.length) {
      const before = currentContent.substring(0, start);
      const after = currentContent.substring(end);
      newContent = `${before}${formattedSnippet}${after}`;
      newCursorPos = start + formattedSnippet.length;
    } else {
      // Mặc định chèn vào cuối bài nếu chưa có vị trí con trỏ
      newContent = currentContent ? `${currentContent}${formattedSnippet}` : formattedSnippet.trim();
      newCursorPos = newContent.length;
    }

    setFormData((prev) => ({
      ...prev,
      content: newContent,
    }));

    // Focus lại vào textarea và đặt con trỏ ngay sau đoạn mã vừa chèn
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        cursorPositionRef.current = { start: newCursorPos, end: newCursorPos };
      }
    }, 50);
  };

  // ==========================================
  // Inline Media Handlers (Ảnh & Video)
  // ==========================================
  const handleUploadInlineMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const res = await blogApi.uploadInlineMedia(file);
      let snippet = '';
      if (res.resourceType === 'video' || file.type.startsWith('video/')) {
        snippet = `<video controls class="w-full rounded-2xl my-4 shadow-md" src="${res.url}"></video>`;
      } else {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        snippet = `![${nameWithoutExt}](${res.url})`;
      }

      // Chèn ngay tại vị trí con trỏ người dùng đã đặt
      insertMediaSnippet(snippet);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tải ảnh/video lên Cloudinary.');
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const handleInsertExternalMedia = () => {
    const url = prompt('Nhập URL hình ảnh hoặc URL video (YouTube / MP4):');
    if (!url || !url.trim()) return;
    const trimmed = url.trim();
    let snippet = '';

    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      snippet = trimmed;
    } else if (trimmed.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
      snippet = `<video controls class="w-full rounded-2xl my-4 shadow-md" src="${trimmed}"></video>`;
    } else {
      snippet = `![Hình ảnh minh họa](${trimmed})`;
    }

    // Chèn ngay tại vị trí con trỏ người dùng đã đặt
    insertMediaSnippet(snippet);
  };

  // ==========================================
  // Related Products Selection Handlers
  // ==========================================
  const toggleSelectProduct = (productId: string) => {
    const current = formData.relatedProductIds || [];
    if (current.includes(productId)) {
      setFormData({
        ...formData,
        relatedProductIds: current.filter((id) => id !== productId),
      });
    } else {
      if (current.length >= 6) {
        alert('Chỉ nên gắn tối đa 6 sản phẩm liên quan cho mỗi bài viết để tối ưu trải nghiệm người đọc.');
        return;
      }
      setFormData({
        ...formData,
        relatedProductIds: [...current, productId],
      });
    }
  };

  // ==========================================
  // Category Handlers
  // ==========================================
  const handleOpenCreateCategory = () => {
    setEditingCatId(null);
    setCatFormData({
      name: '',
      description: '',
      displayOrder: categories.length + 1,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: PostCategoryDto) => {
    setEditingCatId(cat.id);
    setCatFormData({
      name: cat.name,
      description: cat.description || '',
      displayOrder: cat.displayOrder || 0,
    });
    setIsCatModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name.trim()) {
      alert('Vui lòng nhập tên danh mục blog.');
      return;
    }

    setCatSubmitting(true);
    try {
      if (editingCatId) {
        await blogApi.updateCategory(editingCatId, catFormData);
      } else {
        await blogApi.createCategory(catFormData);
      }
      setIsCatModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục blog.');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"? Các bài viết thuộc danh mục này cần được chuyển sang danh mục khác trước khi xóa.`)) return;
    try {
      await blogApi.deleteCategory(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục này (có thể danh mục đang chứa bài viết).');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-500" />
            <span>Quản lý Blog & Danh mục</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Soạn thảo, quản lý bài viết hướng dẫn chọn vợt, mẹo thi đấu và phân loại chuyên mục Blog Pickleball.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {activeTab === 'posts' ? (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bài viết mới</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateCategory}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'posts'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Danh sách bài viết</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'posts' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {totalItems}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh mục Blog</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'categories' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {categories.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: POSTS MANAGEMENT                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Toolbar / Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tiêu đề bài viết..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 w-full sm:w-auto font-medium"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 w-full sm:w-auto font-medium"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Draft">Bản nháp (Draft)</option>
              <option value="Published">Công khai (Public)</option>
              <option value="Archived">Riêng tư (Private)</option>
            </select>
          </div>

          {/* Posts Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Đang tải danh sách bài viết...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có bài viết nào</p>
                <p className="text-xs text-slate-500">Hãy bấm nút "Tạo bài viết mới" để thêm blog đầu tiên.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Bài viết</th>
                      <th className="py-3.5 px-4">Danh mục</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4">Lượt xem</th>
                      <th className="py-3.5 px-4">Ngày đăng</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                              <img
                                src={post.coverImageUrl || '/images/paddle.png'}
                                alt={post.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div className="space-y-1 max-w-md">
                              <p className="font-extrabold text-slate-900 dark:text-white line-clamp-1">
                                {post.title}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                /{post.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            {post.categoryName}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                            post.status === 'Published'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : post.status === 'Archived'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {post.status === 'Published' ? 'Công khai' : post.status === 'Archived' ? 'Riêng tư' : 'Bản nháp'}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                          {post.viewCount || 0}
                        </td>

                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Bản nháp'}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* NÚT XEM TRƯỚC (PREVIEW MODAL) */}
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(post.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 transition-colors"
                              title="Xem trước bài viết (Preview Modal)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handlePublish(post.id)}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400"
                              title="Xuất bản (Publish)"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchive(post.id)}
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-600 dark:text-amber-400"
                              title="Riêng tư (Private)"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(post.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400"
                              title="Xóa bài viết"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATEGORIES MANAGEMENT                                              */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Danh mục nội dung Blog
                </h3>
                <p className="text-xs text-slate-400">
                  Phân loại bài viết theo chuyên mục giúp người dùng dễ dàng tra cứu kiến thức và mẹo thi đấu.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tên danh mục</th>
                    <th className="py-3.5 px-4">Slug (Đường dẫn)</th>
                    <th className="py-3.5 px-4">Thứ tự hiển thị</th>
                    <th className="py-3.5 px-4">Mô tả</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{cat.name}</span>
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                        {cat.slug}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                          {cat.displayOrder}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 max-w-sm font-medium line-clamp-1">
                        {cat.description || 'Chưa có mô tả'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            title="Chỉnh sửa danh mục"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT POST MODAL                                                  */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {editingPostId ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tiêu đề */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tiêu đề bài viết *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Hướng dẫn chọn vợt Pickleball chuẩn nhất..."
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Danh mục & Ảnh bìa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Danh mục bài viết *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ảnh bìa bài viết (Cover Image)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCoverFile(file);
                        setCoverPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-400 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {coverPreview && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Ảnh bìa đã chọn</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tóm tắt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tóm tắt ngắn (Summary)</label>
                <textarea
                  rows={2}
                  value={formData.summary || ''}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Tóm tắt 1-2 câu về nội dung bài viết..."
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* KHỐI NỘI DUNG VÀ TOOLBAR CHÈN MEDIA (ẢNH & VIDEO) VÀO VỊ TRÍ CON TRỎ */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nội dung chi tiết (Hỗ trợ Markdown & Media) *
                    </label>
                    <p className="text-[10px] text-slate-400 italic">
                      💡 Click chuột vào vị trí bất kỳ trong ô nội dung bên dưới, ảnh hoặc video sẽ được chèn chính xác tại điểm con trỏ đó.
                    </p>
                  </div>

                  {/* Thanh công cụ chèn Ảnh/Video */}
                  <div className="flex items-center gap-1.5">
                    {/* Input file ẩn cho media */}
                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/quicktime"
                      onChange={handleUploadInlineMedia}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingMedia}
                      onClick={() => {
                        updateCursorPosition();
                        mediaInputRef.current?.click();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Tải ảnh hoặc video từ máy tính và chèn vào đúng vị trí con trỏ chuột"
                    >
                      {uploadingMedia ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          <span>Đang upload...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <Video className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chèn Ảnh/Video vào con trỏ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateCursorPosition();
                        handleInsertExternalMedia();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Chèn link hình ảnh hoặc link YouTube/MP4 vào đúng vị trí con trỏ chuột"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Chèn Link/YouTube</span>
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={9}
                  required
                  value={formData.content}
                  onClick={updateCursorPosition}
                  onKeyUp={updateCursorPosition}
                  onSelect={updateCursorPosition}
                  onFocus={updateCursorPosition}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    updateCursorPosition();
                  }}
                  placeholder="Viết nội dung bài viết bằng Markdown... Bạn có thể click chuột vào bất kỳ đoạn nào trong bài rồi bấm nút 'Chèn Ảnh/Video' để chèn ảnh/video ngay tại đó."
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono outline-none focus:border-emerald-500 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              {/* KHỐI CHỌN SẢN PHẨM LIÊN QUAN (RELATED PRODUCTS) */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <label className="text-xs font-bold text-slate-900 dark:text-white">
                      Gắn sản phẩm liên quan giới thiệu trong bài
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Đã chọn: <strong className="text-emerald-600 font-bold">{(formData.relatedProductIds || []).length}</strong> sản phẩm
                  </span>
                </div>

                {/* Search input lọc sản phẩm */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm theo tên để gắn vào bài..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Danh sách chip sản phẩm đã chọn */}
                {(formData.relatedProductIds || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(formData.relatedProductIds || []).map((pId) => {
                      const prod = availableProducts.find((p) => p.id === pId);
                      return (
                        <span
                          key={pId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 shadow-sm"
                        >
                          <img
                            src={prod?.image || prod?.imageUrl || prod?.thumbnailUrl || prod?.images?.[0] || '/images/paddle.png'}
                            alt={prod?.name || ''}
                            className="w-4 h-4 object-cover rounded-md bg-slate-100 dark:bg-slate-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/paddle.png';
                            }}
                          />
                          <span className="truncate max-w-[150px]">{prod?.name || 'Sản phẩm đã chọn'}</span>
                          <button
                            type="button"
                            onClick={() => toggleSelectProduct(pId)}
                            className="p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-md text-emerald-700 dark:text-emerald-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Danh sách sản phẩm khả dụng để chọn */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/80">
                  {availableProducts
                    .filter((p) =>
                      productSearch.trim()
                        ? p.name.toLowerCase().includes(productSearch.toLowerCase())
                        : true
                    )
                    .slice(0, 15)
                    .map((p) => {
                      const isSelected = (formData.relatedProductIds || []).includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleSelectProduct(p.id)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                              : 'hover:bg-white dark:hover:bg-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <img
                              src={p.image || p.imageUrl || p.thumbnailUrl || p.images?.[0] || '/images/paddle.png'}
                              alt={p.name}
                              className="w-7 h-7 rounded-lg object-contain bg-slate-100 dark:bg-slate-800 p-0.5 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/paddle.png';
                              }}
                            />
                            <div className="truncate">
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-extrabold">
                                {(p.effectivePrice || p.price || p.basePrice || 0).toLocaleString('vi-VN')} ₫
                              </p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {isSelected ? 'Đã chọn' : '+ Thêm'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* SEO Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SEO Title</label>
                  <input
                    type="text"
                    value={formData.seoTitle || ''}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder="Tiêu đề hiển thị trên Google..."
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SEO Description</label>
                  <input
                    type="text"
                    value={formData.seoDescription || ''}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    placeholder="Mô tả tóm tắt cho công cụ tìm kiếm..."
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 active:scale-95 transition-all"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingPostId ? 'Lưu thay đổi' : 'Tạo bài viết'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW POST MODAL (XEM TRƯỚC BÀI VIẾT TẠI ADMIN)                          */}
      {/* ========================================================================= */}
      {isPreviewOpen && previewPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                  {previewPost.categoryName}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  previewPost.status === 'Published'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {previewPost.status === 'Published' ? 'Công khai' : previewPost.status === 'Archived' ? 'Riêng tư' : 'Bản nháp'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {previewPost.publishedAt ? new Date(previewPost.publishedAt).toLocaleDateString('vi-VN') : 'Chưa xuất bản'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/blog/${previewPost.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Mở bài viết trên trang web ngoài"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xem trang công khai</span>
                </Link>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cover Banner */}
            {previewPost.coverImageUrl && (
              <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 p-4 flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <img
                  src={previewPost.coverImageUrl}
                  alt={previewPost.title}
                  className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-md"
                />
              </div>
            )}

            {/* Title & Summary */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display leading-tight">
                {previewPost.title}
              </h1>
              {previewPost.summary && (
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 italic border-l-3 border-emerald-500 pl-4 py-1 leading-relaxed">
                  {previewPost.summary}
                </p>
              )}
            </div>

            {/* Rich Content Renderer */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <BlogContentRenderer content={previewPost.content} />
            </div>

            {/* Related Products Section in Preview */}
            {previewPost.relatedProducts && previewPost.relatedProducts.length > 0 && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-3xl p-5 sm:p-6 border border-emerald-200/60 dark:border-emerald-900/50 space-y-3 mt-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Sản phẩm được giới thiệu trong bài viết
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {previewPost.relatedProducts.map((p: any) => {
                    const displayPrice = p.effectivePrice || p.price || p.basePrice || 0;
                    return (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3"
                      >
                        <img
                          src={p.image || p.imageUrl || p.thumbnailUrl || p.images?.[0] || '/images/paddle.png'}
                          alt={p.name}
                          className="w-12 h-12 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-1 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/paddle.png';
                          }}
                        />
                        <div className="truncate space-y-0.5">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {p.name}
                          </h4>
                          <p className="font-extrabold text-xs text-emerald-600">
                            {displayPrice.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-200/80 dark:border-slate-800 pt-4">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all shadow-md"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT CATEGORY MODAL                                              */}
      {/* ========================================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                <span>{editingCatId ? 'Chỉnh sửa Danh mục Blog' : 'Thêm Danh mục Blog Mới'}</span>
              </h2>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  placeholder="Ví dụ: Tin tức giải đấu, Mẹo thi đấu..."
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thứ tự hiển thị</label>
                <input
                  type="number"
                  min={0}
                  value={catFormData.displayOrder}
                  onChange={(e) => setCatFormData({ ...catFormData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mô tả danh mục</label>
                <textarea
                  rows={3}
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Mô tả ngắn về danh mục bài viết này..."
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 active:scale-95 transition-all"
                >
                  {catSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingCatId ? 'Lưu thay đổi' : 'Tạo danh mục'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
