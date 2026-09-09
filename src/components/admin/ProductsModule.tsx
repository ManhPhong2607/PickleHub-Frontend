'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, X, ChevronLeft, ChevronRight, RefreshCw, Image as ImageIcon,
  RotateCcw, Trash2, CheckCircle2, AlertCircle, Check, Sparkles,
  Tag, Percent, Layers, Calendar, Clock, AlertTriangle, Eye, Pencil, Upload
} from 'lucide-react';
import { adminApi, type AdminCategoryDto } from '@/lib/api/adminApi';
import { uploadImageToCloudinary } from '@/lib/utils/cloudinaryUpload';

import type { AdminProduct, FilterState, ProductStatus, SortOption, ProductPromotionSummary } from './products/types';
import { DEFAULT_FILTERS, PAGE_SIZE_OPTIONS, formatVND } from './products/types';
import { FilterBar } from './products/FilterBar';
import { ProductsTable } from './products/ProductsTable';
import { BulkActionBar } from './products/BulkActionBar';
import { ConfirmDeleteModal } from './products/ConfirmDeleteModal';
import { PromotionQuickPreviewModal } from './products/PromotionQuickPreviewModal';
import { AssignPromotionModal } from './products/AssignPromotionModal';
import { StorefrontPreviewModal } from './products/StorefrontPreviewModal';

// ─── Helpers: Filter & Sort Engine ───
function applyFiltersAndSort(
  products: AdminProduct[],
  filters: FilterState,
  search: string
): AdminProduct[] {
  let result = [...products];

  // 1. Text search (name, sku, category, brand)
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  // 2. Category filter
  if (filters.category) {
    result = result.filter((p) => p.category === filters.category);
  }

  // 3. Brand filter
  if (filters.brand) {
    result = result.filter((p) => p.brand === filters.brand);
  }

  // 4. Base Price range
  if (filters.priceMin) {
    const min = Number(filters.priceMin);
    if (!isNaN(min)) result = result.filter((p) => p.price >= min);
  }
  if (filters.priceMax) {
    const max = Number(filters.priceMax);
    if (!isNaN(max)) result = result.filter((p) => p.price <= max);
  }

  // 5. Product status (active / draft)
  if (filters.productStatus !== 'all') {
    result = result.filter((p) => p.status === filters.productStatus);
  }

  // 6. Has Promotion filter ('all' | 'has_promo' | 'no_promo')
  if (filters.hasPromotion === 'has_promo') {
    result = result.filter(
      (p) => p.isOnSale || (p.activePromotion && p.activePromotion.status === 'Active')
    );
  } else if (filters.hasPromotion === 'no_promo') {
    result = result.filter(
      (p) => !p.isOnSale && (!p.activePromotion || p.activePromotion.status !== 'Active')
    );
  }

  // 7. Promotion status ('all' | 'Active' | 'Scheduled' | 'Expired')
  if (filters.promoStatus !== 'all') {
    result = result.filter((p) => p.activePromotion?.status === filters.promoStatus);
  }

  // 8. Effective Price range (min / max)
  if (filters.effectivePriceMin) {
    const minEff = Number(filters.effectivePriceMin);
    if (!isNaN(minEff)) {
      result = result.filter((p) => {
        const eff = p.effectivePrice ?? p.price;
        return eff >= minEff;
      });
    }
  }
  if (filters.effectivePriceMax) {
    const maxEff = Number(filters.effectivePriceMax);
    if (!isNaN(maxEff)) {
      result = result.filter((p) => {
        const eff = p.effectivePrice ?? p.price;
        return eff <= maxEff;
      });
    }
  }

  // 9. Sort
  const sortFns: Record<string, (a: AdminProduct, b: AdminProduct) => number> = {
    name_asc: (a, b) => a.name.localeCompare(b.name, 'vi'),
    name_desc: (a, b) => b.name.localeCompare(a.name, 'vi'),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    created_desc: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
    created_asc: (a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''),
  };
  const fn = sortFns[filters.sortBy];
  if (fn) result.sort(fn);

  return result;
}

// ─── Main Component ───
export const ProductsModule: React.FC = () => {
  // ── Data state ──
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // ── Filters & search ──
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // ── Selection (Bulk Actions) ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Create / Edit Modal State ──
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productEditTab, setProductEditTab] = useState<'general' | 'price_promotion'>('general');
  const [timePivotDate, setTimePivotDate] = useState<string>('');

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    price: 0,
    image: '',
    status: 'active' as ProductStatus,
  });
  const [productSelectedFile, setProductSelectedFile] = useState<File | null>(null);
  const [productPreviewUrl, setProductPreviewUrl] = useState('');
  const [uploadingProductImg, setUploadingProductImg] = useState(false);

  // ── Variant Modal State ──
  const [variantModalProduct, setVariantModalProduct] = useState<AdminProduct | null>(null);
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [baseVariantId, setBaseVariantId] = useState<string>('');
  const [variantForm, setVariantForm] = useState({
    sku: '',
    price: 0,
    imageUrl: '',
  });
  const [variantDynamicAttrs, setVariantDynamicAttrs] = useState<Record<string, string>>({});
  const [variantSelectedFiles, setVariantSelectedFiles] = useState<File[]>([]);
  const [variantPreviewUrls, setVariantPreviewUrls] = useState<string[]>([]);
  const [variantExistingImages, setVariantExistingImages] = useState<any[]>([]);
  const [uploadingVariantImg, setUploadingVariantImg] = useState(false);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  // ── Promotion Modals State ──
  const [quickPreviewModal, setQuickPreviewModal] = useState<{
    isOpen: boolean;
    product: AdminProduct | null;
    promo: ProductPromotionSummary | null;
  }>({ isOpen: false, product: null, promo: null });

  const [assignPromoModal, setAssignPromoModal] = useState<{
    isOpen: boolean;
    products: AdminProduct[];
  }>({ isOpen: false, products: [] });

  const [storefrontPreviewModal, setStorefrontPreviewModal] = useState<{
    isOpen: boolean;
    product: AdminProduct | null;
  }>({ isOpen: false, product: null });

  // ── Categories & Brands for Select ──
  const [dbCategories, setDbCategories] = useState<AdminCategoryDto[]>([]);
  const [dbBrands, setDbBrands] = useState<{ id: string; name: string }[]>([]);

  // ── Confirm Delete Modal State ──
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemsToDelete: AdminProduct[];
    isBulk: boolean;
  }>({ isOpen: false, itemsToDelete: [], isBulk: false });

  // ── Show toast helper ──
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch Initial Data ──
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getProducts();
      setAllProducts(data);
      return data;
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi tải danh sách sản phẩm');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuxData = useCallback(async () => {
    try {
      const [cats, brs] = await Promise.all([
        adminApi.getCategories(true),
        adminApi.getBrands(),
      ]);
      setDbCategories(cats);
      setDbBrands(brs.map((b) => ({ id: b.id, name: b.name })));
    } catch (e) {
      console.error('Fetch categories/brands error:', e);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchAuxData();
  }, [fetchProducts, fetchAuxData]);

  // ── Filtered & Sorted Products ──
  const filteredProducts = useMemo(() => {
    return applyFiltersAndSort(allProducts, filters, searchQuery);
  }, [allProducts, filters, searchQuery]);

  // ── Reset to page 1 on filter change ──
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  // ── Pagination Calculation ──
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(safeCurrentPage * pageSize, filteredProducts.length);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  // ── Selection Handlers ──
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = paginatedProducts.map((p) => p.id);
      const allOnPageSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginatedProducts]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── Delete Handlers ──
  const handleRequestDeleteSingle = useCallback((product: AdminProduct) => {
    setDeleteModalState({
      isOpen: true,
      itemsToDelete: [product],
      isBulk: false,
    });
  }, []);

  const handleRequestDeleteBulk = useCallback(() => {
    const items = allProducts.filter((p) => selectedIds.has(p.id));
    if (items.length === 0) return;
    setDeleteModalState({
      isOpen: true,
      itemsToDelete: items,
      isBulk: true,
    });
  }, [allProducts, selectedIds]);

  const handleConfirmDelete = async () => {
    const { itemsToDelete } = deleteModalState;
    setDeleteModalState({ isOpen: false, itemsToDelete: [], isBulk: false });
    if (!itemsToDelete || itemsToDelete.length === 0) return;

    const deleteIds = new Set(itemsToDelete.map((i) => i.id));

    // Optimistically update UI
    setAllProducts((prev) => prev.filter((p) => !deleteIds.has(p.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      deleteIds.forEach((id) => next.delete(id));
      return next;
    });

    try {
      for (const item of itemsToDelete) {
        await adminApi.deleteProduct(item.id);
      }
      showToast(
        itemsToDelete.length === 1
          ? `Đã xóa sản phẩm "${itemsToDelete[0].name}" thành công!`
          : `Đã xóa thành công ${itemsToDelete.length} sản phẩm!`,
        'success'
      );
    } catch (err: any) {
      console.error('Delete product failed:', err);
      showToast('Lỗi khi xóa sản phẩm trên máy chủ: ' + (err?.response?.data?.message || err?.message), 'error');
      await fetchProducts();
    }
  };

  // ── Bulk Status / Category Changes ──
  const handleBulkSetActive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await adminApi.bulkUpdateProductStatus(ids, 'active');
      showToast(`Đã kích hoạt ${ids.length} sản phẩm thành công!`);
      await fetchProducts();
      handleDeselectAll();
    } catch (err: any) {
      showToast('Lỗi khi kích hoạt sản phẩm: ' + (err?.response?.data?.message || err?.message), 'error');
    }
  };

  const handleBulkSetDraft = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await adminApi.bulkUpdateProductStatus(ids, 'draft');
      showToast(`Đã chuyển ${ids.length} sản phẩm sang bản nháp!`);
      await fetchProducts();
      handleDeselectAll();
    } catch (err: any) {
      showToast('Lỗi khi chuyển bản nháp: ' + (err?.response?.data?.message || err?.message), 'error');
    }
  };

  const handleBulkSetHidden = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await adminApi.bulkUpdateProductStatus(ids, 'hidden');
      showToast(`Đã ẩn ${ids.length} sản phẩm khỏi cửa hàng!`);
      await fetchProducts();
      handleDeselectAll();
    } catch (err: any) {
      showToast('Lỗi khi ẩn sản phẩm: ' + (err?.response?.data?.message || err?.message), 'error');
    }
  };

  const handleBulkChangeCategory = async (categoryName: string, categoryId?: string) => {
    const count = selectedIds.size;
    setAllProducts((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, category: categoryName, categoryId } : p
      )
    );
    showToast(`Đã đổi danh mục ${count} sản phẩm sang "${categoryName}"!`);
    handleDeselectAll();
  };

  // ── Unlink Promotion Handler ──
  const handleUnlinkPromo = async (promotionId: string, productId: string) => {
    try {
      await adminApi.removeProductFromPromotion(promotionId, productId);
      showToast('Đã gỡ sản phẩm khỏi chương trình khuyến mãi thành công!');
      await fetchProducts();
    } catch (err: any) {
      showToast('Lỗi khi gỡ khuyến mãi: ' + (err?.response?.data?.message || err?.message), 'error');
    }
  };

  // ── Create / Edit Product Modal Handlers ──
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setProductEditTab('general');
    setProductForm({
      name: '',
      description: '',
      categoryId: dbCategories[0]?.id || '',
      brandId: dbBrands[0]?.id || '',
      price: 1000000,
      image: '',
      status: 'active',
    });
    setProductSelectedFile(null);
    setProductPreviewUrl('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: AdminProduct) => {
    setEditingProduct(product);
    setProductEditTab('general');
    setTimePivotDate('');

    // Safely match categoryId
    const matchedCategory = dbCategories.find(
      (c) => c.id === product.categoryId || (product.category && c.name?.toLowerCase() === product.category?.toLowerCase())
    );
    const categoryId = product.categoryId || matchedCategory?.id || dbCategories[0]?.id || '';

    // Safely match brandId
    const matchedBrand = dbBrands.find(
      (b) => b.id === product.brandId || (product.brand && b.name?.toLowerCase() === product.brand?.toLowerCase())
    );
    const brandId = product.brandId || matchedBrand?.id || dbBrands[0]?.id || '';

    // Normalize status to 'active' | 'draft' | 'hidden'
    const rawStatus = (product.status || '').toLowerCase();
    const normalizedStatus: ProductStatus =
      (rawStatus === 'draft' || rawStatus === '0') ? 'draft'
      : (rawStatus === 'hidden' || rawStatus === '2' || rawStatus === 'archived') ? 'hidden'
      : 'active';

    setProductForm({
      name: product.name,
      description: product.description || '',
      categoryId,
      brandId,
      price: product.price,
      image: product.image,
      status: normalizedStatus,
    });
    setProductSelectedFile(null);
    setProductPreviewUrl(product.image);
    setIsProductModalOpen(true);
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductSelectedFile(file);
      setProductPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name?.trim()) {
      showToast('Tên sản phẩm không được để trống.', 'error');
      return;
    }

    if (!productForm.categoryId) {
      showToast('Vui lòng chọn danh mục cho sản phẩm.', 'error');
      return;
    }

    if (!productForm.brandId) {
      showToast('Vui lòng chọn thương hiệu cho sản phẩm.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, {
          name: productForm.name.trim(),
          description: productForm.description,
          categoryId: productForm.categoryId,
          brandId: productForm.brandId,
          basePrice: productForm.price,
          status: productForm.status,
        });

        if (productSelectedFile) {
          setUploadingProductImg(true);
          try {
            await adminApi.uploadProductImage(editingProduct.id, productSelectedFile);
          } catch (uploadErr) {
            console.warn('Image upload error:', uploadErr);
          }
          setUploadingProductImg(false);
        }

        showToast('Cập nhật sản phẩm thành công!');
      } else {
        const created = await adminApi.createProduct({
          name: productForm.name.trim(),
          description: productForm.description,
          categoryId: productForm.categoryId,
          brandId: productForm.brandId,
          basePrice: productForm.price,
          status: productForm.status,
          images: [],
        });

        if (productSelectedFile && created?.id) {
          setUploadingProductImg(true);
          try {
            await adminApi.uploadProductImage(created.id, productSelectedFile);
          } catch (uploadErr) {
            console.warn('Image upload error:', uploadErr);
          }
          setUploadingProductImg(false);
        }

        showToast('Thêm sản phẩm mới thành công!');
      }

      setIsProductModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      console.error('[SAVE PRODUCT ERROR]', err);
      const errData = err?.response?.data;
      let errorMsg = '';
      if (errData?.errors && typeof errData.errors === 'object') {
        errorMsg = Object.entries(errData.errors)
          .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
      } else {
        errorMsg = errData?.detail || errData?.message || errData?.title || err?.message || 'Có lỗi xảy ra khi lưu sản phẩm';
      }
      showToast('Lỗi khi lưu sản phẩm: ' + errorMsg, 'error');
    } finally {
      setSubmitting(false);
      setUploadingProductImg(false);
    }
  };

  // Category attribute schema for currently opened variant modal
  const variantCategorySchema = useMemo<{ name: string; type?: string }[]>(() => {
    if (!variantModalProduct) return [];
    const cat = dbCategories.find(
      (c) => c.id === variantModalProduct.categoryId || c.name === variantModalProduct.category
    );
    if (!cat?.attributeSchemaJson) return [];
    try {
      const parsed = JSON.parse(cat.attributeSchemaJson);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) =>
            typeof item === 'string'
              ? { name: item, type: 'string' }
              : { name: item.name || '', type: item.type || 'string' }
          )
          .filter((f: any) => Boolean(f.name));
      }
    } catch {
      return [];
    }
    return [];
  }, [variantModalProduct, dbCategories]);

  // Selected base variant for smart attribute inheritance
  const baseVariant = useMemo(() => {
    if (!variantsList || variantsList.length === 0) return null;
    if (baseVariantId) {
      return variantsList.find((v) => v.id === baseVariantId) || variantsList[0];
    }
    return variantsList[0];
  }, [variantsList, baseVariantId]);

  const baseVariantAttrs = useMemo<Record<string, string>>(() => {
    if (!baseVariant?.attributesJson) return {};
    try {
      const parsed =
        typeof baseVariant.attributesJson === 'string'
          ? JSON.parse(baseVariant.attributesJson)
          : baseVariant.attributesJson;
      const res: Record<string, string> = {};
      Object.entries(parsed).forEach(([k, v]) => {
        if (k !== 'ImageUrl' && Boolean(k)) res[k] = String(v);
      });
      return res;
    } catch {
      return {};
    }
  }, [baseVariant]);

  const handleSelectBaseVariant = (vId: string) => {
    setBaseVariantId(vId);
    const target = variantsList.find((v) => v.id === vId);
    if (target?.attributesJson) {
      try {
        const parsed =
          typeof target.attributesJson === 'string'
            ? JSON.parse(target.attributesJson)
            : target.attributesJson;
        const nextAttrs: Record<string, string> = {};
        (variantCategorySchema.length > 0 ? variantCategorySchema : [{ name: 'Color' }, { name: 'Size' }]).forEach((s) => {
          nextAttrs[s.name] = parsed[s.name] ? String(parsed[s.name]) : '';
        });
        setVariantDynamicAttrs(nextAttrs);
      } catch {}
    }
  };

  // ── Variant Handlers ──
  const handleOpenVariantsModal = async (product: AdminProduct) => {
    setVariantModalProduct(product);
    setLoadingVariants(true);
    setVariantSelectedFiles([]);
    setVariantPreviewUrls([]);
    setVariantExistingImages([]);

    const cat = dbCategories.find(
      (c) => c.id === product.categoryId || c.name === product.category
    );
    let schema: { name: string; type?: string }[] = [];
    try {
      const parsed = JSON.parse(cat?.attributeSchemaJson || '[]');
      if (Array.isArray(parsed)) {
        schema = parsed
          .map((item: any) =>
            typeof item === 'string'
              ? { name: item, type: 'string' }
              : { name: item.name || '', type: item.type || 'string' }
          )
          .filter((f: any) => Boolean(f.name));
      }
    } catch {}

    setVariantForm({
      sku: `${product.sku}-V1`,
      price: product.price,
      imageUrl: '',
    });

    try {
      const vars = await adminApi.getProductVariants(product.id);
      setVariantsList(vars);
      if (vars.length > 0) {
        setBaseVariantId(vars[0].id);
        setVariantForm((prev) => ({
          ...prev,
          sku: `${product.sku}-V${vars.length + 1}`,
          price: vars[0].price || product.price,
        }));

        try {
          const parsed =
            typeof vars[0].attributesJson === 'string'
              ? JSON.parse(vars[0].attributesJson)
              : vars[0].attributesJson || {};
          const initialAttrs: Record<string, string> = {};
          if (schema.length > 0) {
            schema.forEach((s) => {
              initialAttrs[s.name] = parsed[s.name] ? String(parsed[s.name]) : '';
            });
          } else {
            initialAttrs['Color'] = parsed['Color'] ? String(parsed['Color']) : '';
            initialAttrs['Size'] = parsed['Size'] ? String(parsed['Size']) : '';
          }
          setVariantDynamicAttrs(initialAttrs);
        } catch {
          const initialAttrs: Record<string, string> = {};
          schema.forEach((s) => { initialAttrs[s.name] = ''; });
          setVariantDynamicAttrs(initialAttrs);
        }
      } else {
        setBaseVariantId('');
        const initialAttrs: Record<string, string> = {};
        if (schema.length > 0) {
          schema.forEach((s) => { initialAttrs[s.name] = ''; });
        } else {
          initialAttrs['Color'] = '';
          initialAttrs['Size'] = '';
        }
        setVariantDynamicAttrs(initialAttrs);
      }
    } catch (e) {
      setVariantsList([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleVariantFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const currentTotal = variantExistingImages.length + variantSelectedFiles.length;
      const allowedCount = Math.max(0, 7 - currentTotal);
      if (newFiles.length > allowedCount) {
        showToast(`Mỗi biến thể chỉ được tối đa 7 ảnh mẫu (còn lại ${allowedCount} chỗ trống).`, 'error');
      }
      const filesToAdd = newFiles.slice(0, allowedCount);
      const newPreviews = filesToAdd.map((f) => URL.createObjectURL(f));

      setVariantSelectedFiles((prev) => [...prev, ...filesToAdd]);
      setVariantPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setVariantSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setVariantPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteExistingVariantImage = async (imageId: string) => {
    if (!variantModalProduct) return;
    if (!confirm('Bạn có chắc muốn xóa ảnh mẫu này khỏi biến thể?')) return;
    setUploadingVariantImg(true);
    try {
      await adminApi.removeProductImage(variantModalProduct.id, imageId);
      showToast('Đã xóa ảnh mẫu thành công!');
      const vars = await adminApi.getProductVariants(variantModalProduct.id);
      setVariantsList(vars);
      if (editingVariantId) {
        const currentVar = vars.find((v) => v.id === editingVariantId);
        setVariantExistingImages(currentVar?.images || []);
      }
    } catch (err: any) {
      showToast('Lỗi khi xóa ảnh: ' + (err?.response?.data?.message || err?.message), 'error');
    } finally {
      setUploadingVariantImg(false);
    }
  };

  const handleReplaceExistingVariantImage = async (imageId: string, file: File) => {
    if (!variantModalProduct) return;
    setUploadingVariantImg(true);
    try {
      await adminApi.replaceProductImage(variantModalProduct.id, imageId, file);
      showToast('Đã thay thế ảnh mẫu thành công!');
      const vars = await adminApi.getProductVariants(variantModalProduct.id);
      setVariantsList(vars);
      if (editingVariantId) {
        const currentVar = vars.find((v) => v.id === editingVariantId);
        setVariantExistingImages(currentVar?.images || []);
      }
    } catch (err: any) {
      showToast('Lỗi khi thay thế ảnh: ' + (err?.response?.data?.message || err?.message), 'error');
    } finally {
      setUploadingVariantImg(false);
      setReplacingImageId(null);
    }
  };

  const handleStartEditVariant = (v: any) => {
    setEditingVariantId(v.id);
    setVariantForm({
      sku: v.sku,
      price: v.price || 0,
      imageUrl: v.imageUrl || '',
    });
    setVariantExistingImages(v.images || (v.imageUrl ? [{ id: v.id, url: v.imageUrl }] : []));
    setVariantSelectedFiles([]);
    setVariantPreviewUrls([]);
    try {
      const parsed = typeof v.attributesJson === 'string' ? JSON.parse(v.attributesJson) : v.attributesJson || {};
      const newAttrs: Record<string, string> = {};
      variantCategorySchema.forEach((s) => {
        newAttrs[s.name] = parsed[s.name] ? String(parsed[s.name]) : '';
      });
      if (variantCategorySchema.length === 0) {
        newAttrs['Color'] = parsed['Color'] ? String(parsed['Color']) : '';
        newAttrs['Size'] = parsed['Size'] ? String(parsed['Size']) : '';
      }
      setVariantDynamicAttrs(newAttrs);
    } catch {
      // fallback
    }
  };

  const handleCancelEditVariant = () => {
    setEditingVariantId(null);
    setVariantExistingImages([]);
    setVariantSelectedFiles([]);
    setVariantPreviewUrls([]);
    if (!variantModalProduct) return;
    setVariantForm({
      sku: `${variantModalProduct.sku}-V${variantsList.length + 1}`,
      price: variantModalProduct.price || 0,
      imageUrl: '',
    });
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantModalProduct) return;
    setSubmitting(true);
    try {
      // Merge: lấy giá trị user đã nhập/sửa, nếu để trống thì tự động kế thừa từ baseVariantAttrs
      const schemaList =
        variantCategorySchema.length > 0
          ? variantCategorySchema
          : [{ name: 'Color' }, { name: 'Size' }];

      const mergedAttrs: Record<string, string> = {};
      schemaList.forEach((s) => {
        const userVal = variantDynamicAttrs[s.name]?.trim();
        const inheritedVal = baseVariantAttrs[s.name]?.trim() || '';
        mergedAttrs[s.name] = userVal || inheritedVal || '';
      });

      if (editingVariantId) {
        // UPDATE existing variant
        await adminApi.updateProductVariant(variantModalProduct.id, editingVariantId, {
          sku: variantForm.sku,
          attributesJson: JSON.stringify(mergedAttrs),
          price: variantForm.price,
        });

        if (variantSelectedFiles.length > 0) {
          setUploadingVariantImg(true);
          try {
            await adminApi.uploadProductImages(
              variantModalProduct.id,
              variantSelectedFiles,
              editingVariantId
            );
          } catch (uploadErr: any) {
            console.warn('Variant images upload failed:', uploadErr);
            showToast('Lỗi tải ảnh biến thể: ' + (uploadErr?.response?.data?.message || uploadErr?.message), 'error');
          }
          setUploadingVariantImg(false);
        }

        showToast(`Đã cập nhật biến thể "${variantForm.sku}" thành công!`);
        setEditingVariantId(null);
        setVariantExistingImages([]);
      } else {
        // CREATE new variant
        const createdVariant = await adminApi.addProductVariant(variantModalProduct.id, {
          sku: variantForm.sku,
          attributesJson: JSON.stringify(mergedAttrs),
          price: variantForm.price,
        });

        if (variantSelectedFiles.length > 0 && createdVariant?.id) {
          setUploadingVariantImg(true);
          try {
            await adminApi.uploadProductImages(
              variantModalProduct.id,
              variantSelectedFiles,
              createdVariant.id
            );
          } catch (uploadErr: any) {
            console.warn('Variant images upload failed:', uploadErr);
            showToast('Lỗi tải ảnh biến thể: ' + (uploadErr?.response?.data?.message || uploadErr?.message), 'error');
          }
          setUploadingVariantImg(false);
        }

        showToast(`Đã thêm biến thể cho sản phẩm "${variantModalProduct.name}"`);
      }

      const vars = await adminApi.getProductVariants(variantModalProduct.id);
      setVariantsList(vars);
      setVariantSelectedFiles([]);
      setVariantPreviewUrls([]);
      setVariantExistingImages([]);

      setVariantForm({
        sku: `${variantModalProduct.sku}-V${vars.length + 1}`,
        price: variantForm.price,
        imageUrl: '',
      });
    } catch (err: any) {
      showToast('Lỗi khi lưu biến thể: ' + (err?.response?.data?.message || err?.message), 'error');
    } finally {
      setSubmitting(false);
      setUploadingVariantImg(false);
    }
  };

  const handleRemoveVariant = async (variantId: string) => {
    if (!variantModalProduct) return;
    if (!confirm('Bạn có chắc muốn xóa biến thể này?')) return;
    setSubmitting(true);
    try {
      await adminApi.removeProductVariant(variantModalProduct.id, variantId);
      showToast('Đã xóa biến thể thành công!');
      const vars = await adminApi.getProductVariants(variantModalProduct.id);
      setVariantsList(vars);
    } catch (err: any) {
      showToast('Lỗi khi xóa biến thể: ' + (err?.response?.data?.message || err?.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Selected products for bulk action
  const selectedProducts = useMemo(() => {
    return allProducts.filter((p) => selectedIds.has(p.id));
  }, [allProducts, selectedIds]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}


      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Quản lý Sản phẩm
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý kho hàng, thông tin niêm yết, giá bán, lịch khuyến mãi và cấu hình biến thể.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors shadow-xs"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm mới</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={allProducts.length}
        filteredCount={filteredProducts.length}
        categories={dbCategories}
        brands={dbBrands}
      />

      {/* Products Table */}
      <ProductsTable
        products={paginatedProducts}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onEdit={handleOpenEditModal}
        onDelete={handleRequestDeleteSingle}
        onManageVariants={handleOpenVariantsModal}
        onOpenPromotionPreview={(prod, promo) =>
          setQuickPreviewModal({ isOpen: true, product: prod, promo })
        }
        onApplyPromotion={(prod) =>
          setAssignPromoModal({ isOpen: true, products: [prod] })
        }
        onOpenStorefrontPreview={(prod) =>
          setStorefrontPreviewModal({ isOpen: true, product: prod })
        }
        loading={loading}
        error={error}
        onRetry={fetchProducts}
        sortBy={filters.sortBy}
        onSortChange={(sort) => setFilters((prev) => ({ ...prev, sortBy: sort }))}
        onResetFilters={() => {
          setFilters(DEFAULT_FILTERS);
          setSearchQuery('');
        }}
      />

      {/* Pagination Footer */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold">
          
          <div className="text-slate-500 dark:text-slate-400">
            Hiển thị <strong className="text-slate-900 dark:text-white">{startIdx}</strong> -{' '}
            <strong className="text-slate-900 dark:text-white">{endIdx}</strong> trong{' '}
            <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> sản phẩm
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        categories={dbCategories}
        onDelete={handleRequestDeleteBulk}
        onChangeCategory={handleBulkChangeCategory}
        onSetActive={handleBulkSetActive}
        onSetDraft={handleBulkSetDraft}
        onSetHidden={handleBulkSetHidden}
        onApplyPromo={() => setAssignPromoModal({ isOpen: true, products: selectedProducts })}
        onDeselectAll={handleDeselectAll}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        count={deleteModalState.itemsToDelete.length}
        productName={deleteModalState.itemsToDelete[0]?.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, itemsToDelete: [], isBulk: false })}
      />

      {/* Promotion Quick Preview Modal */}
      <PromotionQuickPreviewModal
        isOpen={quickPreviewModal.isOpen}
        onClose={() => setQuickPreviewModal({ isOpen: false, product: null, promo: null })}
        product={quickPreviewModal.product}
        promotion={quickPreviewModal.promo}
        onUnlink={handleUnlinkPromo}
        onOpenStorefrontPreview={(prod) =>
          setStorefrontPreviewModal({ isOpen: true, product: prod })
        }
      />


      {/* Storefront Preview Modal */}
      <StorefrontPreviewModal
        isOpen={storefrontPreviewModal.isOpen}
        onClose={() => setStorefrontPreviewModal({ isOpen: false, product: null })}
        product={storefrontPreviewModal.product}
      />

      {/* Create / Edit Modal with "Giá & Khuyến Mãi" Tab */}
      {isProductModalOpen && (
        <div
          onClick={() => setIsProductModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <p className="text-xs text-slate-500">Cập nhật thông tin chi tiết, giá bán và khuyến mãi</p>
            </div>

            {/* Modal Tabs */}
            {editingProduct && (
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setProductEditTab('general')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    productEditTab === 'general'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Thông tin chung
                </button>
                <button
                  type="button"
                  onClick={() => setProductEditTab('price_promotion')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    productEditTab === 'price_promotion'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Giá & Khuyến mãi</span>
                  {editingProduct.promotions && editingProduct.promotions.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                      {editingProduct.promotions.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* TAB 1: General Info */}
            {productEditTab === 'general' && (
              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 block font-bold">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="VD: Vợt Pickleball Selkirk Vanguard Power Air Invikta..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 block font-bold">Mô tả sản phẩm</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Nhập thông tin giới thiệu, thông số nổi bật của sản phẩm..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-xs font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 block font-bold">Danh mục *</label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold"
                    >
                      {dbCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 block font-bold">Thương hiệu *</label>
                    <select
                      value={productForm.brandId}
                      onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold"
                    >
                      {dbBrands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 block font-bold">Giá niêm yết (VND) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 block font-bold">Trạng thái sản phẩm *</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as ProductStatus })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold cursor-pointer"
                  >
                    <option value="active">🟢 Kích hoạt (Active - Đang bán trên cửa hàng)</option>
                    <option value="draft">⚪ Bản nháp (Draft)</option>
                    <option value="hidden">🟠 Đang ẩn (Hidden - Ẩn khỏi cửa hàng)</option>
                  </select>
                </div>

                {/* Cloudinary Image Upload */}
                <div className="space-y-2 p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                  <label className="text-emerald-900 dark:text-emerald-300 font-bold block flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Hình ảnh sản phẩm (Cloudinary)</span>
                  </label>

                  {(productPreviewUrl || productForm.image) && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-700 shadow-sm mx-auto my-2 bg-white p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={productPreviewUrl || productForm.image}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      {uploadingProductImg && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                          Đang tải...
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 dark:file:bg-emerald-900 dark:file:text-emerald-300 cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingProductImg}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {submitting ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Giá & Khuyến Mãi (Price & Promotion Management) */}
            {productEditTab === 'price_promotion' && editingProduct && (
              <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">

                {/* Promotions List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Chương Trình Khuyến Mãi Đang Gán ({editingProduct.promotions?.length || 0})
                    </label>
                    <button
                      type="button"
                      onClick={() => setAssignPromoModal({ isOpen: true, products: [editingProduct] })}
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-[11px] hover:bg-emerald-100 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Gán thêm KM</span>
                    </button>
                  </div>

                  {!editingProduct.promotions || editingProduct.promotions.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      Sản phẩm này chưa được áp dụng chương trình khuyến mãi nào.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {editingProduct.promotions.map((promo) => {
                        const isPrimary = editingProduct.activePromotion?.promotionId === promo.promotionId;

                        return (
                          <div key={promo.promotionId} className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">{promo.promotionName}</span>
                                {isPrimary && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black">
                                    Đang áp dụng (P:{promo.priority})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                <span>Giảm: <strong className="text-rose-600">-{promo.discountPercent}%</strong></span>
                                <span>•</span>
                                <span>Hiệu lực: {new Date(promo.startsAt).toLocaleDateString('vi-VN')} → {new Date(promo.endsAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Gỡ khuyến mãi "${promo.promotionName}" khỏi sản phẩm này?`)) {
                                  await handleUnlinkPromo(promo.promotionId, editingProduct.id);
                                  setIsProductModalOpen(false);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
                            >
                              Gỡ
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Final Price Preview & Time Pivot */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Xem trước giá bán cuối cùng (Preview Final Price)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Giá niêm yết</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {formatVND(editingProduct.price)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Giá bán hiện tại</span>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatVND(editingProduct.effectivePrice ?? editingProduct.price)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">Quy tắc ưu tiên (Priority):</div>
                    <p>Hệ thống tự động chọn chương trình có mức ưu tiên cao nhất tại từng thời điểm.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {variantModalProduct && (
        <div
          onClick={() => setVariantModalProduct(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <button
              onClick={() => setVariantModalProduct(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Biến thể: {variantModalProduct.name}
              </h3>
              <p className="text-xs text-slate-500">Cấu hình màu sắc, kích thước, giá và upload ảnh mẫu theo từng SKU</p>
            </div>

            {/* Existing Variants Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Danh sách biến thể hiện tại ({variantsList.length})
              </span>

              {loadingVariants ? (
                <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Đang tải biến thể...</div>
              ) : variantsList.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  Chưa có biến thể nào được tạo.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {variantsList.map((v) => {
                    const varImages = v.images && v.images.length > 0
                      ? v.images
                      : (v.imageUrl ? [{ id: v.id, url: v.imageUrl }] : []);
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {varImages.length > 0 ? (
                            <div className="flex items-center -space-x-2 shrink-0">
                              {varImages.slice(0, 3).map((img: any, idx: number) => (
                                <img
                                  key={img.id || idx}
                                  src={img.url}
                                  alt="Variant sample"
                                  className="w-9 h-9 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 shadow-xs"
                                />
                              ))}
                              {varImages.length > 3 && (
                                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center border border-white dark:border-slate-800 shadow-xs">
                                  +{varImages.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] text-slate-400 font-bold shrink-0">
                              No img
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white block">{v.sku}</span>
                              {varImages.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                                  {varImages.length} ảnh mẫu
                                </span>
                              )}
                            </div>
                            {(() => {
                              try {
                                const parsed = typeof v.attributesJson === 'string' ? JSON.parse(v.attributesJson) : v.attributesJson || {};
                                const entries = Object.entries(parsed).filter(([k]) => k !== 'ImageUrl' && Boolean(k));
                                if (entries.length === 0) return <span className="text-[11px] text-slate-400">Không có thuộc tính</span>;
                                return (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {entries.map(([key, val]) => (
                                      <span
                                        key={key}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs"
                                      >
                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{key}:</span> {String(val)}
                                      </span>
                                    ))}
                                  </div>
                                );
                              } catch {
                                return <span className="text-[11px] text-slate-400">{v.attributesJson}</span>;
                              }
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {Number(v.price).toLocaleString('vi-VN')} đ
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditVariant(v)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                              title="Chỉnh sửa biến thể & quản lý ảnh mẫu"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                              title="Xóa biến thể"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add/Edit Variant Form */}
            <form onSubmit={handleAddVariant} className={`space-y-3.5 p-4 rounded-2xl border text-xs font-semibold transition-colors ${
              editingVariantId
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/80 shadow-md'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                    {editingVariantId ? (
                      <>
                        <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Chỉnh sửa biến thể: <span className="font-mono text-emerald-600 dark:text-emerald-400">{variantForm.sku}</span></span>
                      </>
                    ) : (
                      'Thêm biến thể mới'
                    )}
                  </span>
                  {variantModalProduct && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      {variantModalProduct.category}
                    </span>
                  )}
                </div>

                {editingVariantId && (
                  <button
                    type="button"
                    onClick={handleCancelEditVariant}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-colors"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>

              {/* Base Variant Inheritance Header */}
              {variantsList.length > 0 && (
                <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                      Biến thể gốc:
                    </span>
                    <select
                      value={baseVariantId || variantsList[0]?.id || ''}
                      onChange={(e) => handleSelectBaseVariant(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200 outline-none text-[11px]"
                    >
                      {variantsList.map((v, idx) => (
                        <option key={v.id} value={v.id}>
                          {v.sku} {idx === 0 ? '(Gốc mặc định)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium italic">
                    💡 Chỉ cần sửa thuộc tính muốn đổi, các ô khác tự kế thừa theo mẫu gốc
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Mã SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SKU-V1"
                    value={variantForm.sku}
                    onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Giá bán (VND) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    placeholder="VD: 890000"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Category Attributes */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Thuộc tính theo danh mục ({variantCategorySchema.length > 0 ? variantCategorySchema.length : 2} thuộc tính)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {(variantCategorySchema.length > 0 ? variantCategorySchema : [
                    { name: 'Color', type: 'string' },
                    { name: 'Size', type: 'string' }
                  ]).map((attr) => {
                    const currentVal = variantDynamicAttrs[attr.name] ?? '';
                    const inheritedVal = baseVariantAttrs[attr.name] ?? '';
                    const isChanged = Boolean(currentVal && currentVal !== inheritedVal);

                    return (
                      <div key={attr.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                            {attr.name} {variantsList.length === 0 ? '*' : ''}
                          </label>
                          {variantsList.length > 0 && isChanged && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              ✏️ Tùy chỉnh
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required={variantsList.length === 0 && !inheritedVal}
                          placeholder={
                            inheritedVal
                              ? `Kế thừa: "${inheritedVal}"`
                              : `VD: ${
                                  attr.name.toLowerCase() === 'size' ? 'S, M, L, XL, 16mm...' :
                                  attr.name.toLowerCase() === 'color' ? 'Xanh Navy, Đen, Trắng...' :
                                  attr.name.toLowerCase() === 'gender' ? 'Nam, Nữ, Unisex...' :
                                  attr.name.toLowerCase() === 'material' ? 'Recycled Dry-Fit, Carbon...' :
                                  `Nhập ${attr.name}...`
                                }`
                          }
                          value={currentVal}
                          onChange={(e) =>
                            setVariantDynamicAttrs((prev) => ({
                              ...prev,
                              [attr.name]: e.target.value,
                            }))
                          }
                          className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl outline-none font-semibold text-xs transition-colors ${
                            isChanged
                              ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/20'
                              : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Existing Variant Images Section (when editing) */}
              {editingVariantId && variantExistingImages.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Ảnh mẫu hiện có ({variantExistingImages.length}/7 ảnh)
                    </label>
                    <span className="text-[10px] text-slate-400">Có thể thay thế hoặc xóa từng ảnh</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {variantExistingImages.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className="group relative aspect-square rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1"
                      >
                        <img src={img.url} alt="Variant sample" className="w-full h-full object-contain" />
                        
                        {/* Hover Overlay with Replace and Delete Actions */}
                        <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                          <label className="cursor-pointer px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold flex items-center gap-0.5">
                            <Upload className="w-2.5 h-2.5" />
                            <span>Thay</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleReplaceExistingVariantImage(img.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingVariantImage(img.id)}
                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[9px] font-bold flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Image File Upload & Previews */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Tải lên ảnh mẫu mới (Chọn nhiều file, tối đa 7 ảnh/biến thể)
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Đã chọn: {variantSelectedFiles.length} file
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn ảnh từ máy tính (nhiều ảnh)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleVariantFilesChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 italic">PNG, JPG, WEBP</span>
                </div>

                {/* Previews of newly selected files */}
                {variantPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
                    {variantPreviewUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 overflow-hidden p-1 shadow-xs"
                      >
                        <img src={url} alt="Preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black hover:bg-rose-700 shadow-sm"
                          title="Bỏ chọn file này"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-200/60 dark:border-slate-700/60 gap-2">
                <button
                  type="submit"
                  disabled={submitting || uploadingVariantImg}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {uploadingVariantImg ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang xử lý ảnh lên Cloudinary...</span>
                    </>
                  ) : editingVariantId ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi biến thể</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm biến thể mới</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Promotion Modal - Rendered last so it sits on top of all modals */}
      <AssignPromotionModal
        isOpen={assignPromoModal.isOpen}
        onClose={() => setAssignPromoModal({ isOpen: false, products: [] })}
        products={assignPromoModal.products}
        onSuccess={async () => {
          showToast('Đã áp dụng khuyến mãi thành công!');
          const freshData = await fetchProducts();
          handleDeselectAll();
          if (editingProduct && freshData && freshData.length > 0) {
            const updated = freshData.find((p) => p.id === editingProduct.id);
            if (updated) {
              setEditingProduct(updated);
            }
          }
        }}
      />

    </div>
  );
};
