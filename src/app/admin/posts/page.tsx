'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Search, Filter, Edit, Trash2, CheckCircle2,
  Archive, Globe, Eye, Upload, Image as ImageIcon, X, ArrowUpRight,
  Sparkles, RefreshCw, Layers, Tag, Hash, AlignLeft, AlertCircle
} from 'lucide-react';
import { blogApi, PostListDto, PostCategoryDto, CreatePostDto, UpdatePostDto, PostDetailDto } from '@/lib/api/blogApi';

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
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

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
      const [postRes, catRes] = await Promise.all([
        blogApi.getAdminPosts({
          keyword: keyword.trim() || undefined,
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined,
          page,
          pageSize: 10,
        }),
        blogApi.getCategories(),
      ]);

      setPosts(postRes.items || []);
      setTotalItems(postRes.totalItems || 0);
      setCategories(catRes || []);
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
    });
    setCoverFile(null);
    setCoverPreview('');
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
      });
      setCoverPreview(postDetail.coverImageUrl || '');
      setCoverFile(null);
      setIsModalOpen(true);
    } catch (err) {
      alert('Không thể tải thông tin bài viết để chỉnh sửa.');
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
    if (!confirm('Bạn có chắc muốn lưu trữ bài viết này?')) return;
    try {
      await blogApi.archivePost(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu trữ bài viết.');
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
              <option value="Published">Đã xuất bản (Published)</option>
              <option value="Archived">Đã lưu trữ (Archived)</option>
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
                            {post.status === 'Published' ? 'Đã xuất bản' : post.status === 'Archived' ? 'Đã lưu trữ' : 'Bản nháp'}
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
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                              title="Xem trước bài viết trên web"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
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
                              title="Lưu trữ (Archive)"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-150">
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ảnh bìa bài viết</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCoverFile(e.target.files[0]);
                        setCoverPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />
                  {coverPreview && (
                    <div className="mt-2 flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Ảnh bìa được chọn</span>
                    </div>
                  )}
                </div>
              </div>

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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nội dung chi tiết (Hỗ trợ Markdown) *</label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Viết nội dung bài viết bằng Markdown..."
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
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
