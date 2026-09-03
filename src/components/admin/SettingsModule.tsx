'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  adminApi,
  type AdminPromotionSummaryDto,
  type AdminPromotionDetailDto,
  type AdminSystemConfigDto,
  type AdminSiteAnnouncementDto
} from '@/lib/api/adminApi';
import { catalogApi } from '@/lib/api/catalogApi';
import type { Product } from '@/types';
import {
  Settings, Megaphone, Calendar, Save, Plus, Edit3, Trash2, CheckCircle, Tag, Layers,
  Image as ImageIcon, Upload, RefreshCw, Sparkles, Percent, SlidersHorizontal, Eye,
  CheckCircle2, Clock, AlertCircle, Search, X, ChevronRight, ArrowRight, ShieldCheck,
  Flame, Zap, Gift, ExternalLink, HelpCircle, Power
} from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/utils/cloudinaryUpload';

const DEFAULT_BRAND_LOGOS: Record<string, string> = {
  'Selkirk': 'https://images.unsplash.com/photo-1617083934555-563d414f4e24?w=200&auto=format&fit=crop&q=80',
  'Joola': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=200&auto=format&fit=crop&q=80',
  'Franklin': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&auto=format&fit=crop&q=80',
  'PickleHub Pro': 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=200&auto=format&fit=crop&q=80',
  'CRBN': 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=200&auto=format&fit=crop&q=80',
  'Asics': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80',
  'K-Swiss': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=80',
  'Babolat': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80',
  'Dura': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&auto=format&fit=crop&q=80',
};

export const SettingsModule: React.FC = () => {
  // ── SPA Tab State ──
  const [activeTab, setActiveTab] = useState<'general' | 'brands' | 'promotions'>('general');

  // ── Toast Notification ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── TAB 1: System Configs State (Database PickleHub.System) ──
  const [configsList, setConfigsList] = useState<AdminSystemConfigDto[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [savingConfigs, setSavingConfigs] = useState(false);

  const [formConfigs, setFormConfigs] = useState({
    low_stock_threshold: '10',
    shipping_fee_default: '30000',
    order_cancel_deadline_hours: '24',
    hotline: '1900 1234',
    email_cs: 'cs@picklehub.vn',
  });

  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const data = await adminApi.getConfigs();
      setConfigsList(data);
      // Map known keys to form
      const configMap: Record<string, string> = {};
      data.forEach((c) => {
        configMap[c.key.toLowerCase()] = c.value;
      });

      setFormConfigs({
        low_stock_threshold: configMap['low_stock_threshold'] || '10',
        shipping_fee_default: configMap['shipping_fee_default'] || '30000',
        order_cancel_deadline_hours: configMap['order_cancel_deadline_hours'] || '24',
        hotline: configMap['hotline'] || '1900 1234',
        email_cs: configMap['email_cs'] || 'cs@picklehub.vn',
      });
    } catch (err) {
      console.error('[CONFIGS FETCH ERROR]', err);
    } finally {
      setLoadingConfigs(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfigs(true);
    try {
      // Upsert each key-value to backend database
      await Promise.all([
        adminApi.upsertConfig('low_stock_threshold', formConfigs.low_stock_threshold, 'Ngưỡng cảnh báo tồn kho'),
        adminApi.upsertConfig('shipping_fee_default', formConfigs.shipping_fee_default, 'Phí vận chuyển mặc định (₫)'),
        adminApi.upsertConfig('order_cancel_deadline_hours', formConfigs.order_cancel_deadline_hours, 'Hạn tự hủy đơn của khách (Giờ)'),
        adminApi.upsertConfig('hotline', formConfigs.hotline, 'Hotline CSKH'),
        adminApi.upsertConfig('email_cs', formConfigs.email_cs, 'Email CSKH'),
      ]);
      await fetchConfigs();
      showToast('Đã lưu cấu hình tham số hệ thống vào Database thành công!');
    } catch (err: any) {
      alert('Lỗi lưu cấu hình: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    } finally {
      setSavingConfigs(false);
    }
  };

  // ── TAB 2: Brands State (Database PickleHub.Catalog) ──
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string>('');
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [brandSubmitting, setBrandSubmitting] = useState(false);

  const fetchBrands = () => {
    setLoadingBrands(true);
    adminApi.getBrands()
      .then(setBrands)
      .catch((err) => console.error('[BRANDS FETCH ERROR]', err))
      .finally(() => setLoadingBrands(false));
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase();
    return brands.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q))
    );
  }, [brands, brandSearch]);

  const handleBrandFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogoFile(file);
      setBrandLogoPreview(URL.createObjectURL(file));

      setUploadingBrandLogo(true);
      try {
        const cloudUrl = await uploadImageToCloudinary(file);
        setBrandLogoPreview(cloudUrl);
      } catch {
        // Fallback
      } finally {
        setUploadingBrandLogo(false);
      }
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    setBrandSubmitting(true);
    try {
      await adminApi.createBrand({
        name: newBrandName.trim(),
        description: newBrandDesc || `Thương hiệu dụng cụ Pickleball ${newBrandName.trim()}`,
      });
      setNewBrandName('');
      setNewBrandDesc('');
      setBrandLogoFile(null);
      setBrandLogoPreview('');
      fetchBrands();
      showToast(`Đã thêm thương hiệu "${newBrandName.trim()}" vào Database!`);
    } catch (err: any) {
      alert('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Không thể tạo thương hiệu'));
    } finally {
      setBrandSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${name}" khỏi cơ sở dữ liệu?`)) {
      try {
        await adminApi.deleteBrand(id);
        fetchBrands();
        showToast(`Đã xóa thương hiệu "${name}" thành công!`);
      } catch (err: any) {
        alert('Lỗi khi xóa: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
      }
    }
  };

  // ── TAB 3: Promotions & Announcements State (Database) ──
  const [promotions, setPromotions] = useState<AdminPromotionSummaryDto[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [announcements, setAnnouncements] = useState<AdminSiteAnnouncementDto[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Create Promotion Modal State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoForm, setPromoForm] = useState({
    name: '',
    description: '',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    isActive: true,
    priority: 1,
  });
  const [selectedProductDiscounts, setSelectedProductDiscounts] = useState<{ productId: string; discountPercent: number }[]>([]);
  
  // Detailed Product Filters for Promotion Modal
  const [promoSearchProd, setPromoSearchProd] = useState('');
  const [promoCatFilter, setPromoCatFilter] = useState('ALL');
  const [promoBrandFilter, setPromoBrandFilter] = useState('ALL');
  const [promoPriceFilter, setPromoPriceFilter] = useState('ALL');
  const [promoStockFilter, setPromoStockFilter] = useState('ALL');
  const [bulkDiscountInput, setBulkDiscountInput] = useState<number>(15);

  // View Promotion Detail Modal
  const [viewingPromo, setViewingPromo] = useState<AdminPromotionDetailDto | null>(null);
  const [loadingPromoDetail, setLoadingPromoDetail] = useState(false);

  // Add Announcement Form State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCtaLink, setNewAnnCtaLink] = useState('/products');
  const [newAnnStartDate, setNewAnnStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newAnnEndDate, setNewAnnEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [newAnnImageUrl, setNewAnnImageUrl] = useState('');
  const [newAnnImageFile, setNewAnnImageFile] = useState<File | null>(null);
  const [newAnnImagePreview, setNewAnnImagePreview] = useState('');
  const [uploadingAnnImage, setUploadingAnnImage] = useState(false);
  const [annSubmitting, setAnnSubmitting] = useState(false);

  const fetchPromotions = () => {
    setLoadingPromotions(true);
    adminApi.getPromotions(1, 50)
      .then((res) => setPromotions(res.items))
      .catch((err) => console.error('[PROMOTIONS FETCH ERROR]', err))
      .finally(() => setLoadingPromotions(false));
  };

  const fetchAnnouncements = () => {
    setLoadingAnnouncements(true);
    adminApi.getAnnouncements()
      .then(setAnnouncements)
      .catch((err) => console.error('[ANNOUNCEMENTS FETCH ERROR]', err))
      .finally(() => setLoadingAnnouncements(false));
  };

  useEffect(() => {
    fetchPromotions();
    fetchAnnouncements();
    catalogApi.getProducts().then(setProducts).catch(() => {});
    catalogApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleOpenCreatePromoModal = () => {
    setPromoForm({
      name: '',
      description: '',
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      isActive: true,
      priority: 1,
    });
    setSelectedProductDiscounts([]);
    setPromoSearchProd('');
    setPromoCatFilter('ALL');
    setPromoBrandFilter('ALL');
    setPromoPriceFilter('ALL');
    setPromoStockFilter('ALL');
    setBulkDiscountInput(15);
    setIsPromoModalOpen(true);
  };

  const filteredPromoProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Text search
      if (promoSearchProd.trim()) {
        const q = promoSearchProd.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }

      // 2. Category filter
      if (promoCatFilter !== 'ALL') {
        const catName = p.categoryName || p.category || '';
        const catId = p.categoryId || '';
        if (catName !== promoCatFilter && catId !== promoCatFilter) return false;
      }

      // 3. Brand filter
      if (promoBrandFilter !== 'ALL') {
        const bName = p.brandName || p.brand || '';
        const bId = p.brandId || '';
        if (bName !== promoBrandFilter && bId !== promoBrandFilter) return false;
      }

      // 4. Price filter
      if (promoPriceFilter !== 'ALL') {
        const price = p.price || 0;
        if (promoPriceFilter === 'UNDER_1M' && price >= 1000000) return false;
        if (promoPriceFilter === '1M_3M' && (price < 1000000 || price > 3000000)) return false;
        if (promoPriceFilter === '3M_5M' && (price < 3000000 || price > 5000000)) return false;
        if (promoPriceFilter === 'OVER_5M' && price <= 5000000) return false;
      }

      // 5. Stock filter
      if (promoStockFilter !== 'ALL') {
        const stock = p.stock || 0;
        if (promoStockFilter === 'IN_STOCK' && stock <= 0) return false;
        if (promoStockFilter === 'OUT_OF_STOCK' && stock > 0) return false;
      }

      return true;
    });
  }, [products, promoSearchProd, promoCatFilter, promoBrandFilter, promoPriceFilter, promoStockFilter]);

  const handleToggleProductInPromo = (productId: string, defaultDiscount = 15) => {
    setSelectedProductDiscounts((prev) => {
      const exists = prev.find((p) => p.productId === productId);
      if (exists) {
        return prev.filter((p) => p.productId !== productId);
      } else {
        return [...prev, { productId, discountPercent: defaultDiscount }];
      }
    });
  };

  const handleUpdateProductDiscount = (productId: string, discount: number) => {
    setSelectedProductDiscounts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, discountPercent: discount } : p))
    );
  };

  const handleSelectAllFiltered = () => {
    const defaultDiscount = bulkDiscountInput > 0 ? bulkDiscountInput : 15;
    setSelectedProductDiscounts((prev) => {
      const currentSelectedMap = new Map(prev.map((item) => [item.productId, item.discountPercent]));
      filteredPromoProducts.forEach((p) => {
        if (!currentSelectedMap.has(p.id)) {
          currentSelectedMap.set(p.id, defaultDiscount);
        }
      });
      return Array.from(currentSelectedMap.entries()).map(([productId, discountPercent]) => ({
        productId,
        discountPercent,
      }));
    });
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredPromoProducts.map((p) => p.id));
    setSelectedProductDiscounts((prev) => prev.filter((item) => !filteredIds.has(item.productId)));
  };

  const handleApplyBulkDiscount = () => {
    if (bulkDiscountInput <= 0 || bulkDiscountInput > 99) {
      alert('Vui lòng nhập mức giảm giá hợp lệ từ 1% đến 99%');
      return;
    }
    setSelectedProductDiscounts((prev) =>
      prev.map((item) => ({ ...item, discountPercent: bulkDiscountInput }))
    );
    showToast(`Đã áp dụng giảm ${bulkDiscountInput}% cho tất cả ${selectedProductDiscounts.length} sản phẩm đang chọn!`);
  };

  const handleCreatePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.name.trim()) return;

    setPromoSubmitting(true);
    try {
      await adminApi.createPromotion({
        name: promoForm.name.trim(),
        description: promoForm.description || undefined,
        startsAt: new Date(promoForm.startsAt).toISOString(),
        endsAt: new Date(promoForm.endsAt).toISOString(),
        isActive: promoForm.isActive,
        priority: Number(promoForm.priority) || 1,
        items: selectedProductDiscounts.length > 0 ? selectedProductDiscounts : undefined,
      });
      setIsPromoModalOpen(false);
      fetchPromotions();
      showToast(`Đã lưu chương trình khuyến mãi "${promoForm.name}" vào Database!`);
    } catch (err: any) {
      alert('Lỗi tạo khuyến mãi: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleDeletePromotion = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa chương trình khuyến mãi "${name}" khỏi Database?`)) {
      try {
        await adminApi.deletePromotion(id);
        fetchPromotions();
        showToast(`Đã xóa chương trình khuyến mãi "${name}"!`);
      } catch (err: any) {
        alert('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
      }
    }
  };

  const handleViewPromotionDetail = async (id: string) => {
    setLoadingPromoDetail(true);
    try {
      const detail = await adminApi.getPromotionById(id);
      setViewingPromo(detail);
    } catch (err: any) {
      alert('Không thể tải chi tiết khuyến mãi: ' + (err?.message || ''));
    } finally {
      setLoadingPromoDetail(false);
    }
  };

  const handleToggleAnnouncement = async (ann: AdminSiteAnnouncementDto) => {
    try {
      await adminApi.updateAnnouncement(ann.id, {
        title: ann.title,
        content: ann.content,
        isActive: !ann.isActive,
        startsAt: ann.startsAt,
        endsAt: ann.endsAt,
        imageUrl: ann.imageUrl,
        imagePublicId: ann.imagePublicId,
        ctaLink: ann.ctaLink,
      });
      fetchAnnouncements();
      showToast('Đã cập nhật trạng thái thông báo trong Database.');
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const handleAnnImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewAnnImageFile(file);
      const localPreview = URL.createObjectURL(file);
      setNewAnnImagePreview(localPreview);

      setUploadingAnnImage(true);
      try {
        const uploadRes = await adminApi.uploadAnnouncementImage(file);
        if (uploadRes && uploadRes.url) {
          setNewAnnImageUrl(uploadRes.url);
          setNewAnnImagePreview(uploadRes.url);
        }
      } catch (err) {
        console.warn('[Announcements] Image upload error:', err);
      } finally {
        setUploadingAnnImage(false);
      }
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim()) return;

    setAnnSubmitting(true);
    try {
      await adminApi.createAnnouncement({
        title: newAnnTitle.trim(),
        content: newAnnContent.trim() || newAnnTitle.trim(),
        ctaLink: newAnnCtaLink.trim() || '/products',
        imageUrl: newAnnImageUrl.trim() || null,
        startsAt: newAnnStartDate ? new Date(newAnnStartDate).toISOString() : null,
        endsAt: newAnnEndDate ? new Date(newAnnEndDate).toISOString() : null,
        isActive: true,
      });
      setNewAnnTitle('');
      setNewAnnContent('');
      setNewAnnImageUrl('');
      setNewAnnImageFile(null);
      setNewAnnImagePreview('');
      fetchAnnouncements();
      showToast('Đã thêm thông báo / Banner Ưu đãi vào Database!');
    } catch (err: any) {
      alert('Lỗi thêm thông báo: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    } finally {
      setAnnSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa thông báo "${title}" khỏi Database?`)) {
      try {
        await adminApi.deleteAnnouncement(id);
        fetchAnnouncements();
        showToast('Đã xóa thông báo khỏi Database.');
      } catch (err: any) {
        alert('Lỗi xóa: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
          Cài đặt chung
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Dữ liệu kết nối trực tiếp với PostgreSQL Microservices (System Service, Catalog Service & Database)
        </p>
      </div>

      {/* SPA Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-thin">
        {[
          { id: 'general', label: 'Cấu hình chung', icon: SlidersHorizontal },
          { id: 'brands', label: 'Thương hiệu (Brands)', icon: Tag },
          { id: 'promotions', label: 'Khuyến mãi & Banners', icon: Sparkles },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3.5 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all relative whitespace-nowrap ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 1: CẤU HÌNH CHUNG (SYSTEM KEY-VALUE CONFIGS FROM DATABASE) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Tham số quy định hệ thống (Database Key-Value)</h3>
                  <p className="text-xs text-slate-500">Cấu hình lưu trong database PostgreSQL của System Service (Port 5004)</p>
                </div>
              </div>
              <button
                onClick={fetchConfigs}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                title="Tải lại từ Database"
              >
                <RefreshCw className={`w-4 h-4 ${loadingConfigs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <form onSubmit={handleSaveConfigs} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Low stock threshold */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Ngưỡng cảnh báo tồn kho (low_stock_threshold)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">Cảnh báo khi số lượng sản phẩm trong kho dưới ngưỡng này</p>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formConfigs.low_stock_threshold}
                    onChange={(e) => setFormConfigs({ ...formConfigs, low_stock_threshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Shipping Fee Default */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Phí vận chuyển mặc định (shipping_fee_default)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">Phí giao hàng tính mặc định khi checkout (₫)</p>
                  <input
                    type="number"
                    required
                    step={1000}
                    value={formConfigs.shipping_fee_default}
                    onChange={(e) => setFormConfigs({ ...formConfigs, shipping_fee_default: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Order cancel deadline */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Hạn tự hủy đơn của khách (order_cancel_deadline_hours)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">Số giờ tối đa cho phép khách tự hủy đơn sau khi đặt (Giờ)</p>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formConfigs.order_cancel_deadline_hours}
                    onChange={(e) => setFormConfigs({ ...formConfigs, order_cancel_deadline_hours: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Hotline CSKH */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Hotline CSKH</label>
                  <p className="text-[11px] text-slate-400 mb-2">Số tổng đài hỗ trợ người mua hàng</p>
                  <input
                    type="text"
                    required
                    value={formConfigs.hotline}
                    onChange={(e) => setFormConfigs({ ...formConfigs, hotline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Email CSKH */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Email CSKH</label>
                  <p className="text-[11px] text-slate-400 mb-2">Địa chỉ hộp thư nhận phản hồi & khiếu nại</p>
                  <input
                    type="email"
                    required
                    value={formConfigs.email_cs}
                    onChange={(e) => setFormConfigs({ ...formConfigs, email_cs: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  />
                </div>

              </div>

              <div>
                <button
                  type="submit"
                  disabled={savingConfigs}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingConfigs ? 'Đang lưu vào DB...' : 'Lưu cấu hình tham số'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 2: THƯƠNG HIỆU (BRANDS CATALOG FROM DATABASE) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'brands' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 rounded-2xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Quản lý Thương hiệu (Brands Database)</h3>
                  <p className="text-xs text-slate-500">Tạo và quản lý các hãng dụng cụ Pickleball đối tác lưu trong PostgreSQL Catalog</p>
                </div>
              </div>
              <button
                onClick={fetchBrands}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors self-start sm:self-auto"
                title="Tải lại danh sách Brands"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBrands ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Add Brand Form */}
            <form onSubmit={handleAddBrand} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                Thêm thương hiệu mới vào CSDL
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Tên thương hiệu (VD: Selkirk, CRBN)..."
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-purple-500 font-semibold"
                />
                <input
                  type="text"
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  placeholder="Mô tả thương hiệu..."
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={brandSubmitting || uploadingBrandLogo}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{brandSubmitting ? 'Đang lưu DB...' : 'Thêm thương hiệu'}</span>
                </button>
              </div>

              {/* Brand Logo Upload Input */}
              <div className="flex items-center gap-3 pt-1 text-xs">
                {brandLogoPreview && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-purple-200 dark:border-purple-800 shrink-0 bg-white">
                    <img src={brandLogoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    {uploadingBrandLogo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[8px] text-white font-bold">
                        Up...
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBrandFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-100 dark:file:bg-purple-950 file:text-purple-700 dark:file:text-purple-300 hover:file:bg-purple-200 cursor-pointer"
                />
              </div>
            </form>

            {/* Brands Search */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Tìm kiếm thương hiệu theo tên..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-purple-500 font-medium"
              />
            </div>

            {/* Brands Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 w-14 text-center">Logo</th>
                    <th className="p-3.5">Tên thương hiệu</th>
                    <th className="p-3.5">Slug URL</th>
                    <th className="p-3.5">Mô tả</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {loadingBrands ? 'Đang tải danh sách từ CSDL...' : 'Chưa có thương hiệu nào phù hợp trong CSDL.'}
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((brand) => {
                      const logo = DEFAULT_BRAND_LOGOS[brand.name] || '/images/paddle.png';
                      return (
                        <tr key={brand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
                          <td className="p-3 text-center">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mx-auto bg-white flex items-center justify-center">
                              <img
                                src={logo}
                                alt={brand.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as any).src = '/images/paddle.png'; }}
                              />
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">{brand.name}</td>
                          <td className="p-3.5 font-mono text-purple-600 dark:text-purple-400 font-bold">{brand.slug}</td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400">{brand.description}</td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleDeleteBrand(brand.id, brand.name)}
                              title="Xóa thương hiệu"
                              className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-xl transition-all inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 3: KHUYẾN MÃI & BANNERS (PROMOTIONS & SITE ANNOUNCEMENTS) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'promotions' && (
        <div className="space-y-8 animate-in fade-in">
          
          {/* 1. BACKEND PROMOTION CAMPAIGNS FROM DATABASE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-2xl">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Chương trình Khuyến mãi (Database Promotion Campaigns)</h3>
                  <p className="text-xs text-slate-500">Giảm giá theo chiến dịch lưu trong cơ sở dữ liệu Catalog Service</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPromotions}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                  title="Tải lại danh sách khuyến mãi"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingPromotions ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleOpenCreatePromoModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo khuyến mãi</span>
                </button>
              </div>
            </div>

            {/* Promotion Cards / Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Tên chương trình</th>
                    <th className="p-3.5">Thời gian hiệu lực</th>
                    <th className="p-3.5">Độ ưu tiên</th>
                    <th className="p-3.5">Số sản phẩm áp dụng</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {loadingPromotions ? 'Đang tải danh sách từ CSDL...' : 'Chưa có chương trình khuyến mãi nào trong Database.'}
                      </td>
                    </tr>
                  ) : (
                    promotions.map((promo) => {
                      const now = new Date();
                      const start = new Date(promo.startsAt);
                      const end = new Date(promo.endsAt);
                      const isOngoing = promo.isCurrentlyRunning && promo.isActive;
                      const isUpcoming = now < start;
                      const isExpired = now > end;

                      return (
                        <tr key={promo.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                              {promo.name}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">
                            <div>{start.toLocaleDateString('vi-VN')} {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-slate-400">đến {end.toLocaleDateString('vi-VN')} {end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                            Cấp {promo.priority}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold">
                              {promo.productCount} sản phẩm
                            </span>
                          </td>
                          <td className="p-3.5">
                            {isOngoing ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                Đang diễn ra
                              </span>
                            ) : isUpcoming ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Sắp diễn ra
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Đã kết thúc
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                                Tạm dừng
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleViewPromotionDetail(promo.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
                              title="Xem chi tiết & danh sách sản phẩm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePromotion(promo.id, promo.name)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                              title="Xóa khuyến mãi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. SITE ANNOUNCEMENTS / BANNERS / MARQUEE FROM DATABASE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-2xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Banners & Dòng chữ chạy Trang chủ (Site Announcements DB)</h3>
                  <p className="text-xs text-slate-500">Lưu trữ trong bảng SiteAnnouncements của System Service (Port 5004)</p>
                </div>
              </div>
              <button
                onClick={fetchAnnouncements}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                title="Tải lại từ Database"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAnnouncements ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Add Announcement Form */}
            <form onSubmit={handleAddAnnouncement} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                Thêm thông báo / Banner Ưu đãi mới vào CSDL
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  required
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="Tiêu đề thông báo / Slogan (VD: GIẢM 20% VỢT JOOLA)..."
                  className="sm:col-span-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-semibold"
                />
                <input
                  type="text"
                  value={newAnnCtaLink}
                  onChange={(e) => setNewAnnCtaLink(e.target.value)}
                  placeholder="Đường dẫn nút (mặc định: /products)..."
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center">
                <input
                  type="text"
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  placeholder="Nội dung chi tiết chương trình ưu đãi..."
                  className="sm:col-span-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium"
                />

                {/* Image Upload Input */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 rounded-xl cursor-pointer transition-colors text-slate-600 dark:text-slate-300">
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-bold text-[11px] truncate">
                      {uploadingAnnImage ? 'Đang tải ảnh...' : newAnnImageFile ? newAnnImageFile.name : 'Tải ảnh Banner'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAnnImageChange}
                      className="hidden"
                    />
                  </label>

                  {newAnnImagePreview && (
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={newAnnImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setNewAnnImageUrl('');
                          setNewAnnImageFile(null);
                          setNewAnnImagePreview('');
                        }}
                        className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                        title="Xóa ảnh"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={annSubmitting || uploadingAnnImage}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1 disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{annSubmitting ? 'Đang lưu...' : 'Lưu'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Announcements List */}
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {loadingAnnouncements ? 'Đang tải dữ liệu từ CSDL...' : 'Chưa có thông báo nào trong Database.'}
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {ann.imageUrl ? (
                        <img
                          src={ann.imageUrl}
                          alt={ann.title}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center shrink-0">
                          <Megaphone className="w-5 h-5" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            ann.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {ann.isActive ? 'Đang bật' : 'Đã tắt'}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                        </div>
                        {ann.content && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">{ann.content}</p>
                        )}
                        {ann.ctaLink && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Link: {ann.ctaLink}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleAnnouncement(ann)}
                        className={`px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 ${
                          ann.isActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{ann.isActive ? 'Bật' : 'Tắt'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Xóa thông báo khỏi Database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE PROMOTION MODAL */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {isPromoModalOpen && (
        <div
          onClick={() => setIsPromoModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 my-8 cursor-default"
          >
            <button
              onClick={() => setIsPromoModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Tạo chương trình khuyến mãi mới</h3>
                <p className="text-xs text-slate-400">Thiết lập thời gian & chọn sản phẩm áp dụng chiết khấu lưu vào PostgreSQL</p>
              </div>
            </div>

            <form onSubmit={handleCreatePromotionSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tên chương trình khuyến mãi *</label>
                <input
                  type="text"
                  required
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  placeholder="Ví dụ: Siêu Hội Vợt Selkirk 2026 - Giảm tới 25%"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Mô tả chương trình</label>
                <textarea
                  rows={2}
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="Mô tả quyền lợi và đối tượng áp dụng..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={promoForm.startsAt}
                    onChange={(e) => setPromoForm({ ...promoForm, startsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={promoForm.endsAt}
                    onChange={(e) => setPromoForm({ ...promoForm, endsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Mức ưu tiên (Priority)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={promoForm.priority}
                    onChange={(e) => setPromoForm({ ...promoForm, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Product selector for promotion with Detailed Multi-filter */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                
                {/* Header & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-lg">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Chọn sản phẩm áp dụng chiết khấu
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold ml-2">
                        ({selectedProductDiscounts.length} sản phẩm đã chọn)
                      </span>
                    </div>
                  </div>

                  {/* Batch Discount Shortcut */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 pl-1.5">Gán % đồng loạt:</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={bulkDiscountInput}
                      onChange={(e) => setBulkDiscountInput(Number(e.target.value))}
                      className="w-12 px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-xs text-emerald-600 outline-none"
                    />
                    <span className="text-xs font-bold text-emerald-600">%</span>
                    <button
                      type="button"
                      onClick={handleApplyBulkDiscount}
                      disabled={selectedProductDiscounts.length === 0}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-[10px] rounded-lg transition-colors shadow-sm"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                {/* Multi-Dimensional Filter Bar */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  
                  {/* Row 1: Search & Category & Brand */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={promoSearchProd}
                        onChange={(e) => setPromoSearchProd(e.target.value)}
                        placeholder="Tìm theo tên SP, SKU..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    {/* Category Filter */}
                    <select
                      value={promoCatFilter}
                      onChange={(e) => setPromoCatFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium text-slate-700 dark:text-slate-200"
                    >
                      <option value="ALL">📁 Tất cả danh mục</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    {/* Brand Filter */}
                    <select
                      value={promoBrandFilter}
                      onChange={(e) => setPromoBrandFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium text-slate-700 dark:text-slate-200"
                    >
                      <option value="ALL">🏷️ Tất cả thương hiệu</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>

                  </div>

                  {/* Row 2: Price Range & Stock Status & Batch Select Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    
                    {/* Price Range Filter */}
                    <select
                      value={promoPriceFilter}
                      onChange={(e) => setPromoPriceFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium text-slate-700 dark:text-slate-200"
                    >
                      <option value="ALL">💰 Mọi mức giá</option>
                      <option value="UNDER_1M">Dưới 1.000.000₫</option>
                      <option value="1M_3M">1.000.000₫ - 3.000.000₫</option>
                      <option value="3M_5M">3.000.000₫ - 5.000.000₫</option>
                      <option value="OVER_5M">Trên 5.000.000₫</option>
                    </select>

                    {/* Stock Status Filter */}
                    <select
                      value={promoStockFilter}
                      onChange={(e) => setPromoStockFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium text-slate-700 dark:text-slate-200"
                    >
                      <option value="ALL">📦 Tất cả tồn kho</option>
                      <option value="IN_STOCK">Còn hàng (&gt; 0)</option>
                      <option value="OUT_OF_STOCK">Hết hàng (= 0)</option>
                    </select>

                    {/* Select All / Deselect All Action Buttons */}
                    <div className="sm:col-span-2 flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-xl transition-colors border border-emerald-500/30 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Chọn tất cả ({filteredPromoProducts.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllFiltered}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 font-bold text-[11px] rounded-xl transition-colors"
                      >
                        Bỏ chọn
                      </button>
                    </div>

                  </div>

                </div>

                {/* Product List Result Area */}
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 p-2 space-y-2 scrollbar-thin bg-slate-50/40 dark:bg-slate-900/40">
                  {filteredPromoProducts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Không tìm thấy sản phẩm nào khớp với bộ lọc.
                    </div>
                  ) : (
                    filteredPromoProducts.map((p) => {
                      const item = selectedProductDiscounts.find((d) => d.productId === p.id);
                      const isSelected = !!item;
                      const currentDiscount = item?.discountPercent || bulkDiscountInput || 15;
                      const discountedPrice = Math.round(p.price * (1 - currentDiscount / 100));

                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all border ${
                            isSelected
                              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/40 shadow-sm'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div
                            onClick={() => handleToggleProductInPromo(p.id, bulkDiscountInput || 15)}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <CheckCircle className="w-3 h-3" />}
                            </div>
                            <img
                              src={p.image || '/images/paddle.png'}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                              onError={(e) => { (e.target as any).src = '/images/paddle.png'; }}
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                                {p.brand && (
                                  <span className="px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded font-semibold">
                                    {p.brand}
                                  </span>
                                )}
                                {p.category && (
                                  <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                    {p.category}
                                  </span>
                                )}
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {p.price?.toLocaleString('vi-VN')}₫
                                </span>
                                <span className={p.stock > 0 ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                                  (Kho: {p.stock})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Discount input and calculated price */}
                          {isSelected && (
                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">Giảm:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={item?.discountPercent || 15}
                                  onChange={(e) => handleUpdateProductDiscount(p.id, Number(e.target.value))}
                                  className="w-12 px-1 py-0.5 bg-slate-50 dark:bg-slate-800 border border-emerald-500 rounded-lg text-center font-extrabold text-xs text-emerald-600 outline-none"
                                />
                                <span className="font-bold text-xs text-emerald-600">%</span>
                              </div>

                              <div className="text-right border-l border-slate-100 dark:border-slate-800 pl-2">
                                <span className="text-[9px] text-slate-400 block font-medium">Giá sau giảm</span>
                                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  {discountedPrice.toLocaleString('vi-VN')}₫
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={promoSubmitting}
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{promoSubmitting ? 'Đang lưu vào DB...' : 'Kích hoạt Khuyến mãi'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: VIEW PROMOTION DETAIL MODAL */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {viewingPromo && (
        <div
          onClick={() => setViewingPromo(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 my-8 cursor-default"
          >
            <button
              onClick={() => setViewingPromo(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                Chi tiết chương trình khuyến mãi (Từ Database)
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                {viewingPromo.name}
              </h3>
              {viewingPromo.description && (
                <p className="text-xs text-slate-500">{viewingPromo.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Bắt đầu:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {new Date(viewingPromo.startsAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Kết thúc:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {new Date(viewingPromo.endsAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* List of discounted products */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Danh sách sản phẩm áp dụng ({viewingPromo.items?.length || 0})
              </span>
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                {(!viewingPromo.items || viewingPromo.items.length === 0) ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Chương trình áp dụng cho toàn bộ danh mục sản phẩm.
                  </div>
                ) : (
                  viewingPromo.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={item.thumbnailUrl || '/images/paddle.png'}
                          alt={item.productName}
                          className="w-7 h-7 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.productName || `Product #${item.productId.substring(0, 8)}`}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg font-bold font-mono shrink-0">
                        -{item.discountPercent}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingPromo(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
