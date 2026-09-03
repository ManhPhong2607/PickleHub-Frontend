'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Plus, Edit3, Trash2, RefreshCw, FolderTree, AlertCircle, X, Sliders, CheckCircle, Image as ImageIcon
} from 'lucide-react';
import { adminApi, AdminCategoryDto } from '@/lib/api/adminApi';
import { uploadImageToCloudinary } from '@/lib/utils/cloudinaryUpload';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { CatalogFilterBar } from '@/components/catalog/CatalogFilterBar';
import { CatalogAdvancedFilters } from '@/components/catalog/CatalogAdvancedFilters';
import { FilterChips } from '@/components/catalog/FilterChips';
import { useResizableColumns, ResizeHandle } from '@/hooks/useResizableColumns';

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'Vợt Pickleball': 'https://images.unsplash.com/photo-1617083934555-563d414f4e24?w=600&auto=format&fit=crop&q=80',
  'Bóng Pickleball': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&auto=format&fit=crop&q=80',
  'Giày Thể Thao': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
  'Túi & Balo': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  'Quần Áo': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80',
  'Phụ Kiện': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80',
};

const CATEGORY_CODES: Record<string, string> = {
  'Vợt Pickleball': 'CAT-01',
  'Bóng Pickleball': 'CAT-02',
  'Giày Thể Thao': 'CAT-03',
  'Túi & Balo': 'CAT-04',
  'Quần Áo': 'CAT-05',
  'Phụ Kiện': 'CAT-06',
};

export const CategoriesModule: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Scalable Catalog Filters Hook
  const {
    filters,
    searchInput,
    setSearch,
    setFilter,
    removeFilter,
    resetFilters,
    activeFiltersCount,
    filteredCategories,
  } = useCatalogFilters(categories);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryDto | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parentId: '' as string | null,
    imageUrl: '',
  });

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [schemaCategory, setSchemaCategory] = useState<AdminCategoryDto | null>(null);
  const [schemaFields, setSchemaFields] = useState<{ name: string; type: string }[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryDto | null>(null);

  const { widths, totalWidth, activeResizingKey, startResize } = useResizableColumns({
    storageKey: 'pickle_col_widths_categories',
    defaultWidths: {
      image: 70,
      name: 260,
      slug: 180,
      parent: 180,
      schema: 280,
      actions: 110,
    },
    minWidths: {
      image: 50,
      name: 160,
      slug: 120,
      parent: 120,
      schema: 180,
      actions: 90,
    },
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, products] = await Promise.all([
        adminApi.getCategories(true),
        adminApi.getProducts().catch(() => []),
      ]);

      // Compute real product count per category
      const productCountMap: Record<string, number> = {};
      products.forEach((p: any) => {
        if (p.categoryId) {
          productCountMap[p.categoryId] = (productCountMap[p.categoryId] || 0) + 1;
        }
        const matched = data.find((c: any) => c.name === p.category || c.id === p.categoryId);
        if (matched && matched.id !== p.categoryId) {
          productCountMap[matched.id] = (productCountMap[matched.id] || 0) + 1;
        }
      });

      const enriched = data.map((c: any) => ({
        ...c,
        imageUrl: c.url || c.imageUrl || DEFAULT_CATEGORY_IMAGES[c.name] || '/images/paddle.png',
        productCount: productCountMap[c.id] || 0,
        isActive: true,
        createdAt: c.createdAt,
      }));

      setCategories(enriched);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      parentId: null,
      imageUrl: '/images/paddle.png',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setIsCategoryModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: AdminCategoryDto) => {
    setEditingCategory(cat);
    const currentImg = cat.url || cat.imageUrl || DEFAULT_CATEGORY_IMAGES[cat.name] || '/images/paddle.png';
    setCategoryForm({
      name: cat.name,
      parentId: cat.parentId || null,
      imageUrl: currentImg,
    });
    setSelectedFile(null);
    setPreviewUrl(currentImg);
    setIsCategoryModalOpen(true);
  };

  // Handle File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Save Category (Create or Update with Cloudinary Image)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('Vui lòng nhập tên danh mục!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, {
          name: categoryForm.name.trim(),
          parentId: categoryForm.parentId || null,
        });

        // Upload new image to Cloudinary and update category in DB if a file was selected
        if (selectedFile) {
          setUploadingImage(true);
          try {
            await adminApi.uploadCategoryImage(editingCategory.id, selectedFile);
          } finally {
            setUploadingImage(false);
          }
        }

        showToast(`Đã cập nhật danh mục "${categoryForm.name}" thành công!`);
      } else {
        const created = await adminApi.createCategory({
          name: categoryForm.name.trim(),
          parentId: categoryForm.parentId || null,
        });

        // Upload image to Cloudinary for new category
        if (selectedFile && created?.id) {
          setUploadingImage(true);
          try {
            await adminApi.uploadCategoryImage(created.id, selectedFile);
          } finally {
            setUploadingImage(false);
          }
        }

        showToast(`Đã tạo danh mục mới "${categoryForm.name}" thành công!`);
      }

      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Không thể lưu danh mục'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      showToast(`Đã xóa danh mục "${deleteTarget.name}" thành công!`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      showToast('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Không thể xóa danh mục'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Attribute Schema Modal
  const handleOpenSchemaModal = (cat: AdminCategoryDto) => {
    setSchemaCategory(cat);
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(cat.attributeSchemaJson || '[]');
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      parsed = [];
    }
    setSchemaFields(parsed);
    setIsSchemaModalOpen(true);
  };

  // Save Attribute Schema
  const handleSaveSchema = async () => {
    if (!schemaCategory) return;
    setSubmitting(true);
    try {
      const jsonStr = JSON.stringify(schemaFields);
      await adminApi.updateCategoryAttributeSchema(schemaCategory.id, jsonStr);
      showToast(`Đã cập nhật bộ thuộc tính cho "${schemaCategory.name}" thành công!`);
      setIsSchemaModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast('Lỗi khi lưu schema: ' + (err?.response?.data?.message || err?.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 rounded-xl">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
              Quản lý Danh mục
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý cây danh mục sản phẩm, cấu hình schema thuộc tính biến thể và hình ảnh danh mục lưu trữ Cloudinary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục mới</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng số danh mục</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{categories.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh mục gốc (Root)</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {categories.filter((c) => !c.parentId).length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Có Schema thuộc tính</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {categories.filter((c) => c.attributeSchemaJson && c.attributeSchemaJson !== '[]').length}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ SCALABLE FILTER SYSTEM ═══ */}
      <div className="space-y-3">
        {/* Top Filter Bar */}
        <CatalogFilterBar
          searchInput={searchInput}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={setFilter}
          isAdvancedOpen={isAdvancedOpen}
          onToggleAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)}
          activeFiltersCount={activeFiltersCount}
          onRefresh={fetchCategories}
          loading={loading}
        />

        {/* Collapsible Advanced Filters Panel */}
        <CatalogAdvancedFilters
          isOpen={isAdvancedOpen}
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
        />

        {/* Active Filter Chips & Summary */}
        <FilterChips
          filters={filters}
          onRemoveFilter={removeFilter}
          onResetFilters={resetFilters}
          totalResults={filteredCategories.length}
          totalAll={categories.length}
        />
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400 animate-pulse">
            Đang tải dữ liệu danh mục từ Catalog Service...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs font-bold text-rose-500 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
            <p>{error}</p>
            <button
              onClick={fetchCategories}
              className="px-4 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-lg text-xs font-bold"
            >
              Thử lại
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center space-y-3 p-6">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Không tìm thấy danh mục phù hợp
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Không có danh mục nào khớp với bộ lọc hiện tại. Bạn có thể xóa bộ lọc hoặc tìm kiếm với từ khóa khác.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Xóa tất cả bộ lọc</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full scrollbar-thin">
            <table
              style={{ width: `${totalWidth}px`, minWidth: '100%' }}
              className="text-xs text-left table-fixed border-collapse"
            >
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th style={{ width: widths.image }} className="relative p-4 text-center select-none border-r border-slate-200 dark:border-slate-700">
                    Ảnh
                    <ResizeHandle onMouseDown={(e) => startResize('image', e)} isResizing={activeResizingKey === 'image'} />
                  </th>
                  <th style={{ width: widths.name }} className="relative p-4 select-none border-r border-slate-200 dark:border-slate-700">
                    Mã & Tên Danh mục
                    <ResizeHandle onMouseDown={(e) => startResize('name', e)} isResizing={activeResizingKey === 'name'} />
                  </th>
                  <th style={{ width: widths.slug }} className="relative p-4 select-none border-r border-slate-200 dark:border-slate-700">
                    Slug URL
                    <ResizeHandle onMouseDown={(e) => startResize('slug', e)} isResizing={activeResizingKey === 'slug'} />
                  </th>
                  <th style={{ width: widths.parent }} className="relative p-4 select-none border-r border-slate-200 dark:border-slate-700">
                    Danh mục Cha
                    <ResizeHandle onMouseDown={(e) => startResize('parent', e)} isResizing={activeResizingKey === 'parent'} />
                  </th>
                  <th style={{ width: widths.schema }} className="relative p-4 select-none border-r border-slate-200 dark:border-slate-700">
                    Thuộc tính Biến thể (Schema)
                    <ResizeHandle onMouseDown={(e) => startResize('schema', e)} isResizing={activeResizingKey === 'schema'} />
                  </th>
                  <th style={{ width: widths.actions }} className="relative p-4 text-right select-none">
                    Thao tác
                    <ResizeHandle onMouseDown={(e) => startResize('actions', e)} isResizing={activeResizingKey === 'actions'} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredCategories.map((category) => {
                  const catCode = CATEGORY_CODES[category.name] || 'CAT';
                  const img = category.imageUrl || DEFAULT_CATEGORY_IMAGES[category.name] || '/images/paddle.png';
                  const parentCat = categories.find((c) => c.id === category.parentId);

                  let schemaItems: { name: string; type: string }[] = [];
                  try {
                    schemaItems = JSON.parse(category.attributeSchemaJson || '[]');
                    if (!Array.isArray(schemaItems)) schemaItems = [];
                  } catch {
                    schemaItems = [];
                  }

                  return (
                    <tr key={category.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-center border-r border-slate-200 dark:border-slate-700">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mx-auto shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/paddle.png';
                            }}
                          />
                        </div>
                      </td>

                      <td className="p-4 border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[10px] rounded-md">
                            {catCode}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{category.name}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[10px] rounded-full border border-slate-200/60 dark:border-slate-700">
                            {category.productCount ?? 0} SP
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {category.id.substring(0, 8)}...</p>
                      </td>

                      <td className="p-4 border-r border-slate-200 dark:border-slate-700">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          /{category.slug}
                        </span>
                      </td>

                      <td className="p-4 border-r border-slate-200 dark:border-slate-700">
                        {parentCat ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-semibold">
                            <FolderTree className="w-3 h-3" />
                            {parentCat.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-semibold italic">Gốc (Root Category)</span>
                        )}
                      </td>

                      <td className="p-4 border-r border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {schemaItems.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Chưa cấu hình schema</span>
                          ) : (
                            schemaItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 text-[10px] font-bold rounded-md"
                              >
                                {item.name}
                              </span>
                            ))
                          )}
                          <button
                            onClick={() => handleOpenSchemaModal(category)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-md transition-colors"
                            title="Chỉnh sửa Schema thuộc tính biến thể"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(category)}
                            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Sửa danh mục & ảnh"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(category)}
                            className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ CREATE / EDIT CATEGORY MODAL ═══ */}
      {isCategoryModalOpen && (
        <div
          onClick={() => setIsCategoryModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 cursor-default"
          >
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 rounded-2xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                </h3>
                <p className="text-xs text-slate-500">Cập nhật thông tin danh mục, ảnh hiển thị và cây phân cấp</p>
              </div>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Vợt Pickleball, Giày Thể Thao..."
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">Danh mục cha (Tùy chọn)</label>
                <select
                  value={categoryForm.parentId || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value || null })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-xs"
                >
                  <option value="">-- Không có (Danh mục gốc) --</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Image Upload for Category */}
              <div className="space-y-2 p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <label className="text-emerald-900 dark:text-emerald-300 font-bold block flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Hình ảnh đại diện danh mục (Cloudinary)</span>
                </label>

                {previewUrl && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-700 shadow-sm mx-auto my-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                        Đang upload...
                      </div>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 dark:file:bg-emerald-900 dark:file:text-emerald-300 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Đã chọn file: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {submitting ? 'Đang lưu...' : (editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ ATTRIBUTE SCHEMA BUILDER MODAL ═══ */}
      {isSchemaModalOpen && schemaCategory && (
        <div
          onClick={() => setIsSchemaModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 cursor-default"
          >
            <button
              onClick={() => setIsSchemaModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Cấu hình Schema Biến thể: {schemaCategory.name}
                </h3>
                <p className="text-xs text-slate-500">Quy định các trường thuộc tính bắt buộc cho biến thể sản phẩm</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Danh sách trường thuộc tính ({schemaFields.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSchemaFields([...schemaFields, { name: '', type: 'string' }])}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm trường</span>
                </button>
              </div>

              {schemaFields.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  Chưa có trường thuộc tính nào. Bấm nút &quot;Thêm trường&quot; để tạo (VD: Color, Size, Weight...)
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {schemaFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <input
                        type="text"
                        placeholder="Tên thuộc tính (VD: Color, Size...)"
                        value={field.name}
                        onChange={(e) => {
                          const next = [...schemaFields];
                          next[index].name = e.target.value;
                          setSchemaFields(next);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const next = [...schemaFields];
                          next[index].type = e.target.value;
                          setSchemaFields(next);
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                      >
                        <option value="string">Text / Chuỗi</option>
                        <option value="number">Số (Number)</option>
                        <option value="select">Lựa chọn (Select)</option>
                      </select>
                      <button
                        onClick={() => setSchemaFields(schemaFields.filter((_, i) => i !== index))}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSchemaModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveSchema}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Lưu Schema thuộc tính'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Xác nhận xóa danh mục?
            </h3>
            <p className="text-xs text-slate-500">
              Bạn có chắc chắn muốn xóa danh mục <strong className="text-slate-900 dark:text-white">&quot;{deleteTarget.name}&quot;</strong>?
              Hệ thống sẽ tự động gỡ liên kết các danh mục con và chuyển giao an toàn các sản phẩm liên kết.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
