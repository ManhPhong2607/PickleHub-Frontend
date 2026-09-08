export type ProductStatus = 'active' | 'draft' | string;

export type PromotionStatus = 'Active' | 'Scheduled' | 'Expired';

export interface ProductPromotionSummary {
  promotionId: string;
  promotionName: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  status: PromotionStatus;
}

export interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  categoryId?: string;
  brand: string;
  brandId?: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  effectivePrice?: number;
  effectiveMinPrice?: number;
  effectiveMaxPrice?: number;
  isSinglePrice?: boolean;
  isOnSale?: boolean;
  salePercent?: number | null;
  activePromotion?: ProductPromotionSummary | null;
  promotions?: ProductPromotionSummary[];
  image: string;
  status: ProductStatus;
  createdAt?: string;
  costPerUnit?: number;
  variants?: {
    id: string;
    sku: string;
    price: number;
    effectivePrice?: number;
    attributes?: Record<string, string>;
  }[];
}

export type StatusFilter = 'all' | 'active' | 'draft' | 'hidden';
export type PromoFilter = 'all' | 'has_promo' | 'no_promo';
export type PromoStatusFilter = 'all' | 'Active' | 'Scheduled' | 'Expired';

export type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'created_desc'
  | 'created_asc';

export interface FilterState {
  category: string;             // '' = tất cả
  brand: string;                // '' = tất cả
  priceMin: string;             // '' = không giới hạn
  priceMax: string;
  pricePreset: string;          // 'all' | 'under_500' | '500_1000' | '1000_2000' | 'over_2000'
  productStatus: StatusFilter;
  hasPromotion: PromoFilter;    // 'all' | 'has_promo' | 'no_promo'
  promoStatus: PromoStatusFilter; // 'all' | 'Active' | 'Scheduled' | 'Expired'
  effectivePriceMin: string;
  effectivePriceMax: string;
  sortBy: SortOption;
}

export type BulkActionType = 'delete' | 'change_category' | 'set_active' | 'set_draft' | 'apply_promo';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'created_desc', label: 'Mới nhất' },
  { value: 'created_asc', label: 'Cũ nhất' },
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'name_desc', label: 'Tên Z → A' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

export const DEFAULT_FILTERS: FilterState = {
  category: '',
  brand: '',
  priceMin: '',
  priceMax: '',
  pricePreset: 'all',
  productStatus: 'all',
  hasPromotion: 'all',
  promoStatus: 'all',
  effectivePriceMin: '',
  effectivePriceMax: '',
  sortBy: 'created_desc',
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const CATEGORIES = [
  'Vợt Pickleball',
  'Bóng Pickleball',
  'Giày Thể Thao',
  'Túi & Balo',
  'Quần Áo',
  'Phụ Kiện',
];

/** Status Style Definition */
export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export function getStatusStyle(status: string): StatusConfig {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'published':
      return {
        label: 'Kích hoạt',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'draft':
      return {
        label: 'Bản nháp',
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'hidden':
    case 'archived':
      return {
        label: 'Đang ẩn',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    default:
      return {
        label: status || 'Kích hoạt',
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

/** Format VND currency */
export function formatVND(value: number): string {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}
