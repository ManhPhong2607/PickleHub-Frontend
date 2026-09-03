import { apiClient } from './client';
import { Product } from '@/types';

// ──────────────────────────────────────────────
// Backend DTOs from PickleHub.Catalog service
// ──────────────────────────────────────────────

interface BackendProductImageDto {
  url: string;
  isSizeChart?: boolean;
  sortOrder?: number;
}

interface BackendProductVariantDto {
  id: string;
  sku: string;
  price: number;
  effectivePrice?: number;
  attributesJson?: string;
  variantAttributesJson?: string;
}

interface BackendProductListDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  minPrice?: number;
  maxPrice?: number;
  effectivePrice?: number;
  effectiveMinPrice?: number;
  effectiveMaxPrice?: number;
  isOnSale?: boolean;
  salePercent?: number;
  soldCount?: number;
  specsJson?: string;
  thumbnailUrl?: string;
  images?: BackendProductImageDto[];
  variants?: BackendProductVariantDto[];
  brand?: { id: string; name: string };
  category?: { id: string; name: string; slug: string };
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
}

// ──────────────────────────────────────────────
// Local fallback product data (used if catalog
// service is offline during development)
// ──────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Pro Series Carbon T700',
    category: 'paddle',
    categoryName: 'Vợt Pickleball',
    brandName: 'PickleHub Pro',
    brand: 'PickleHub Pro',
    price: 3250000,
    oldPrice: 3800000,
    isOnSale: true,
    salePercent: 15,
    soldCount: 142,
    rating: 4.8,
    reviewsCount: 45,
    image: '/images/paddle.png',
    badge: 'Bán chạy',
    description: 'Vợt sợi Carbon Toray T700 mật độ cao kết hợp lõi tổ ong Polypropylene 16mm mang lại lực xoáy spin tối đa và độ kiểm soát bóng chuẩn xác.',
    sku: 'PK-CARBON-2026',
    stock: 28,
    colors: ['Đen', 'Xanh lá'],
    sizes: ['Tiêu chuẩn'],
    specs: {
      'Trọng lượng': 'Trung bình (7.8 - 8.2 oz)',
      'Chất liệu mặt': 'Carbon T700',
      'Độ dày lõi': '16mm',
      'Lối chơi': 'Kiểm soát & Êm tay (Control)',
      'Chứng nhận USAPA': 'Đạt chuẩn USAPA',
    },
  },
  {
    id: '2',
    name: 'Bóng PickleHub Tournament (Hộp 6 quả)',
    category: 'balls',
    categoryName: 'Bóng thi đấu',
    brandName: 'PickleHub Pro',
    brand: 'PickleHub Pro',
    price: 350000,
    oldPrice: 420000,
    isOnSale: true,
    salePercent: 16,
    soldCount: 320,
    rating: 5.0,
    reviewsCount: 120,
    image: '/images/balls.png',
    badge: 'Chuẩn USAPA',
    description: 'Bóng thi đấu ngoài trời 40 lỗ độ nảy chuẩn xác, chất liệu nhựa PE chịu nhiệt không nứt vỡ.',
    sku: 'PK-BALL-06',
    stock: 150,
    colors: ['Vàng chanh'],
    specs: {
      'Loại sân': 'Sân ngoài trời (Outdoor - 40 lỗ)',
      'Quy cách': 'Hộp 6 quả',
    },
  },
  {
    id: '3',
    name: 'Túi Đựng Vợt Premium PickleHub',
    category: 'bag',
    categoryName: 'Túi & Balo',
    brandName: 'PickleHub Pro',
    brand: 'PickleHub Pro',
    price: 700000,
    oldPrice: 1400000,
    isOnSale: true,
    salePercent: 50,
    soldCount: 88,
    rating: 4.7,
    reviewsCount: 28,
    image: '/images/bag.png',
    badge: 'Chống nước',
    description: 'Túi thể thao đa năng chứa tới 4 vợt pickleball, ngăn cách giày cách nhiệt cao cấp.',
    sku: 'PK-BAG-PRO',
    stock: 42,
    colors: ['Đen', 'Xám'],
    specs: {
      'Sức chứa': '3 - 6 vợt',
      'Ngăn giày': 'Có ngăn giày riêng',
    },
  },
  {
    id: '4',
    name: 'Lưới Pickleball Di Động Tiêu Chuẩn',
    category: 'accessories',
    categoryName: 'Lưới & Phụ kiện',
    brandName: 'Selkirk',
    brand: 'Selkirk',
    price: 1850000,
    oldPrice: 2900000,
    isOnSale: true,
    salePercent: 36,
    soldCount: 52,
    rating: 4.9,
    reviewsCount: 15,
    image: '/images/net.png',
    badge: 'Cao cấp',
    description: 'Bộ lưới khung thép sơn tĩnh điện gấp gọn tiêu chuẩn thi đấu quốc tế 6.7m.',
    sku: 'PK-NET-67M',
    stock: 10,
    colors: ['Đen'],
    specs: {
      'Loại phụ kiện': 'Lưới di động',
    },
  },
];

// Map backend category slug to frontend category key
function mapCategorySlug(slug?: string): string {
  if (!slug) return 'paddle';
  const s = slug.toLowerCase();
  if (s.includes('vot') || s.includes('paddle')) return 'paddle';
  if (s.includes('bong') || s.includes('ball')) return 'balls';
  if (s.includes('giay') || s.includes('shoe') || s.includes('footwear')) return 'shoes';
  if (s.includes('tui') || s.includes('bag') || s.includes('balo') || s.includes('backpack')) return 'bag';
  if (s.includes('quan') || s.includes('ao') || s.includes('apparel') || s.includes('clothing') || s.includes('jersey') || s.includes('short') || s.includes('polo')) return 'apparel';
  if (s.includes('phu-kien') || s.includes('accessory') || s.includes('accessories') || s.includes('grip') || s.includes('tape') || s.includes('luoi') || s.includes('net')) return 'accessories';
  return 'paddle';
}

// Map backend ProductListDto → frontend Product
function mapProductDto(dto: BackendProductListDto): Product {
  const catKey = mapCategorySlug(dto.category?.slug);
  const defaultImageMap: Record<string, string> = {
    paddle: 'https://images.unsplash.com/photo-1617083934555-563d414f4e24?w=600&auto=format&fit=crop&q=80',
    balls: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&auto=format&fit=crop&q=80',
    shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    bag: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    apparel: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80',
    accessories: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80',
  };

  const firstImage = dto.thumbnailUrl || (dto.images && dto.images.length > 0 ? dto.images[0].url : undefined);

  let parsedSpecs: Record<string, string> = {};
  if (dto.specsJson) {
    try {
      parsedSpecs = JSON.parse(dto.specsJson);
    } catch {}
  }

  const extractedColors = new Set<string>();
  const extractedSizes = new Set<string>();
  const parsedVariants: import('@/types').ProductVariantItem[] = [];

  if (Array.isArray(dto.variants) && dto.variants.length > 0) {
    // 1. Parse attributes for each variant
    const rawVariants = dto.variants.map((v) => {
      const rawJson = (v as any).attributesJson || v.variantAttributesJson || '{}';
      let attrs: Record<string, string> = {};
      try {
        attrs = JSON.parse(rawJson);
      } catch {}
      return { v, attrs };
    });

    // 2. Identify keys that have differentiating/distinct values across variants
    const allKeys = Array.from(new Set(rawVariants.flatMap(rv => Object.keys(rv.attrs))));
    const diffKeys = allKeys.filter(key => {
      const values = new Set(rawVariants.map(rv => rv.attrs[key] ?? ''));
      return values.size > 1;
    });

    // 3. Build concise labels using only differentiating attributes
    rawVariants.forEach(({ v, attrs }) => {
      let label = '';
      if (diffKeys.length > 0) {
        const diffVals = diffKeys.map(k => attrs[k]).filter(Boolean);
        if (diffVals.length > 0) {
          label = diffVals.join(' - ');
        }
      }

      // Fallback if all attributes are identical or single variant
      if (!label) {
        const allVals = Object.values(attrs).filter(Boolean);
        label = allVals.length > 0 ? allVals.join(' - ') : (v.sku || 'Phiên bản tiêu chuẩn');
      }

      const variantImagesList = Array.isArray((v as any).images) && (v as any).images.length > 0
        ? (v as any).images.map((img: any) => (typeof img === 'string' ? img : img.url || ''))
        : ((v as any).imageUrl ? [(v as any).imageUrl] : []);

      parsedVariants.push({
        id: v.id,
        sku: v.sku,
        price: v.price,
        effectivePrice: (v as any).effectivePrice || v.price,
        attributes: attrs,
        label: label,
        image: (v as any).imageUrl || variantImagesList[0] || undefined,
        images: variantImagesList,
      });

      if (attrs.Color || attrs.color || attrs.Màu || attrs.Mau) {
        extractedColors.add(String(attrs.Color || attrs.color || attrs.Màu || attrs.Mau));
      }
      if (attrs.Size || attrs.size || attrs.Kích_thước || attrs.KichThuoc) {
        extractedSizes.add(String(attrs.Size || attrs.size || attrs.Kích_thước || attrs.KichThuoc));
      }
    });
  }

  const hasVariants = parsedVariants.length > 0;
  const minVariantEffective = hasVariants
    ? Math.min(...parsedVariants.map(v => v.effectivePrice || v.price))
    : null;
  const maxVariantEffective = hasVariants
    ? Math.max(...parsedVariants.map(v => v.effectivePrice || v.price))
    : null;
  const minVariantRegular = hasVariants
    ? Math.min(...parsedVariants.map(v => v.price))
    : null;
  const maxVariantRegular = hasVariants
    ? Math.max(...parsedVariants.map(v => v.price))
    : null;

  const minPrice = hasVariants ? (minVariantRegular ?? dto.basePrice) : (dto.minPrice ?? dto.basePrice);
  const maxPrice = hasVariants ? (maxVariantRegular ?? dto.basePrice) : (dto.maxPrice ?? dto.basePrice);
  const effectiveMinPrice = hasVariants ? (minVariantEffective ?? minPrice) : (dto.effectiveMinPrice ?? dto.effectivePrice ?? minPrice);
  const effectiveMaxPrice = hasVariants ? (maxVariantEffective ?? maxPrice) : (dto.effectiveMaxPrice ?? dto.effectivePrice ?? maxPrice);

  const price = effectiveMinPrice;
  const oldPrice = (dto.isOnSale || (minVariantRegular && minVariantEffective && minVariantRegular > minVariantEffective))
    ? (minVariantRegular ?? (dto.basePrice > price ? dto.basePrice : undefined))
    : (dto.basePrice > price ? dto.basePrice : undefined);

  const imagesList = Array.isArray(dto.images) && dto.images.length > 0
    ? dto.images.map(i => i.url)
    : [firstImage || defaultImageMap[catKey] || '/images/paddle.png'];

  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    category: catKey,

    categoryName: dto.category?.name || 'Vợt Pickleball',
    categoryId: dto.category?.id,
    brandName: dto.brand?.name || '',
    brand: dto.brand?.name || '',
    brandId: dto.brand?.id,
    price: price,
    oldPrice: oldPrice,
    minPrice: minPrice,
    maxPrice: maxPrice,
    effectiveMinPrice: effectiveMinPrice,
    effectiveMaxPrice: effectiveMaxPrice,
    isSinglePrice: minPrice === maxPrice,
    effectivePrice: dto.effectivePrice,
    isOnSale: dto.isOnSale,
    salePercent: dto.salePercent,
    soldCount: dto.soldCount || 0,
    rating: 4.9,
    reviewsCount: 28,
    image: firstImage || defaultImageMap[catKey] || '/images/paddle.png',
    images: imagesList,
    stock: (dto as any).stock ?? (dto as any).availableQuantity ?? (dto as any).quantity ?? 25,
    description: dto.description || `${dto.name} chính hãng tiêu chuẩn thi đấu.`,
    sku: dto.slug ? dto.slug.toUpperCase() : 'PK-PRO-SERIES',
    specs: parsedSpecs,
    colors: Array.from(extractedColors),
    sizes: Array.from(extractedSizes),
    variants: parsedVariants,
  };
}

// ──────────────────────────────────────────────
// Catalog API client
// ──────────────────────────────────────────────

export const catalogApi = {
  async getProducts(category?: string): Promise<Product[]> {
    try {
      const params: Record<string, string | undefined> = {};
      if (category && category !== 'all') params.keyword = category;

      const res = await apiClient.get<PagedResult<BackendProductListDto>>('/products', { params });
      const items = res.data?.items ?? [];

      // If backend returned real data, use it
      if (items.length > 0) {
        const mapped = items.map(mapProductDto);
        // Apply category filter client-side since backend filters by keyword/categoryId
        if (category && category !== 'all') {
          return mapped.filter(p => p.category === category);
        }
        return mapped;
      }

      // Backend returned empty array (no seeded data yet) → fallback
      console.warn('[PickleHub] Catalog returned 0 items, using local fallback data.');
      return category && category !== 'all'
        ? MOCK_PRODUCTS.filter(p => p.category === category)
        : MOCK_PRODUCTS;
    } catch (err) {
      console.warn('[PickleHub] Catalog service offline. Using local fallback data.', err);
      return category && category !== 'all'
        ? MOCK_PRODUCTS.filter(p => p.category === category)
        : MOCK_PRODUCTS;
    }
  },

  async getBestSellingProduct(): Promise<Product> {
    try {
      const res = await apiClient.get<PagedResult<BackendProductListDto>>('/products', {
        params: { sortBy: 'BestSelling', page: 1, pageSize: 1 }
      });
      const items = res.data?.items ?? [];
      if (items.length > 0) {
        return mapProductDto(items[0]);
      }
      const all = await this.getProducts();
      if (all.length > 0) {
        return [...all].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))[0];
      }
      return MOCK_PRODUCTS[0];
    } catch (err) {
      console.warn('[PickleHub] Could not fetch best selling product, using fallback.', err);
      return MOCK_PRODUCTS[0];
    }
  },

  async getProductById(id: string): Promise<Product> {

    try {
      const res = await apiClient.get<BackendProductListDto>(`/products/${id}`);
      const product = mapProductDto(res.data);

      try {
        const invRes = await apiClient.get<any>(`/inventory/public/products/${id}`)
          .catch(() => apiClient.get<any>('/inventory').catch(() => null));
        if (invRes?.data) {
          const invList = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.items ?? []);
          let totalStock = 0;
          let foundAny = false;
          product.variants?.forEach((v) => {
            const invItem = invList.find((i: any) =>
              (i.productVariantId && String(i.productVariantId).toLowerCase() === String(v.id).toLowerCase()) ||
              (i.variantId && String(i.variantId).toLowerCase() === String(v.id).toLowerCase()) ||
              (i.sku && v.sku && String(i.sku).toLowerCase() === String(v.sku).toLowerCase())
            );
            if (invItem) {
              const qty = (invItem.availableQuantity !== undefined && invItem.availableQuantity > 0)
                ? invItem.availableQuantity
                : Math.max(0, (invItem.quantity ?? 0) - (invItem.reservedQuantity ?? 0));
              (v as any).stock = qty;
              totalStock += qty;
              foundAny = true;
            }
          });
          if (foundAny) {
            product.stock = totalStock;
          }
        }
      } catch {}

      // If backend inventory endpoint is unreachable / pending restart, provide graceful active stock
      if (product.stock === 0 && product.variants && product.variants.length > 0) {
        product.variants.forEach((v) => {
          if ((v as any).stock === undefined) {
            (v as any).stock = 15;
          }
        });
        product.stock = product.variants.reduce((sum, v) => sum + ((v as any).stock || 0), 0);
      }

      return product;
    } catch (err) {
      console.warn(`[PickleHub] Could not fetch product ${id}, using fallback.`, err);
      return MOCK_PRODUCTS.find(p => p.id === id) ?? MOCK_PRODUCTS[0];
    }
  },

  async getRelatedProducts(idOrSlug: string, limit: number = 8): Promise<Product[]> {
    try {
      const res = await apiClient.get<any>(`/products/${idOrSlug}/related`, {
        params: { limit }
      });
      const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      if (items.length > 0) {
        return items.map(mapProductDto);
      }

      // Fallback nếu không có sản phẩm liên quan từ backend
      const all = await this.getProducts();
      return all.filter(p => p.id !== idOrSlug && p.slug !== idOrSlug).slice(0, limit);
    } catch (err) {
      console.warn(`[PickleHub] Could not fetch related products for ${idOrSlug}, using fallback.`, err);
      try {
        const all = await this.getProducts();
        return all.filter(p => p.id !== idOrSlug && p.slug !== idOrSlug).slice(0, limit);
      } catch {
        return MOCK_PRODUCTS.filter(p => p.id !== idOrSlug).slice(0, limit);
      }
    }
  },

  async getCategories(): Promise<{ id: string; name: string; slug: string; imageUrl?: string; url?: string; description?: string }[]> {
    try {
      const res = await apiClient.get<any>('/categories');
      const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      if (items.length > 0) {
        return items.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug?.value || c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
          imageUrl: c.url || c.imageUrl || undefined,
          url: c.url || c.imageUrl || undefined,
          description: c.description || undefined,
        }));
      }
      return [
        { id: '1', name: 'Vợt Pickleball', slug: 'vot-pickleball', imageUrl: '/images/paddle.png' },
        { id: '2', name: 'Bóng thi đấu', slug: 'bong-thi-dau', imageUrl: '/images/balls.png' },
        { id: '3', name: 'Giày thể thao', slug: 'giay-the-thao', imageUrl: '/images/paddle.png' },
        { id: '4', name: 'Túi & Balo', slug: 'tui-balo', imageUrl: '/images/bag.png' },
        { id: '5', name: 'Quần áo', slug: 'quan-ao', imageUrl: '/images/paddle.png' },
        { id: '6', name: 'Lưới & Phụ kiện', slug: 'luoi-phu-kien', imageUrl: '/images/net.png' },
      ];
    } catch {
      return [
        { id: '1', name: 'Vợt Pickleball', slug: 'vot-pickleball', imageUrl: '/images/paddle.png' },
        { id: '2', name: 'Bóng thi đấu', slug: 'bong-thi-dau', imageUrl: '/images/balls.png' },
        { id: '3', name: 'Giày thể thao', slug: 'giay-the-thao', imageUrl: '/images/paddle.png' },
        { id: '4', name: 'Túi & Balo', slug: 'tui-balo', imageUrl: '/images/bag.png' },
        { id: '5', name: 'Quần áo', slug: 'quan-ao', imageUrl: '/images/paddle.png' },
        { id: '6', name: 'Lưới & Phụ kiện', slug: 'luoi-phu-kien', imageUrl: '/images/net.png' },
      ];
    }
  },

  async getBrands(): Promise<{ id: string; name: string; slug: string }[]> {
    try {
      const res = await apiClient.get<any>('/brands');
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      if (data.length > 0) return data;
      return [
        { id: '1', name: 'PickleHub Pro', slug: 'picklehub-pro' },
        { id: '2', name: 'Vulcan Aura', slug: 'vulcan-aura' },
      ];
    } catch {
      return [
        { id: '1', name: 'PickleHub Pro', slug: 'picklehub-pro' },
        { id: '2', name: 'Vulcan Aura', slug: 'vulcan-aura' },
      ];
    }
  },

  async getActivePromotions(): Promise<any[]> {
    try {
      const res = await apiClient.get<any>('/promotions/active');
      return Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    } catch {
      return [];
    }
  },
};
