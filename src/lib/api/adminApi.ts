import { apiClient } from './client';

// ─── DTOs ─────────────────────────────────────────────────────────────────

export interface AdminProductDto {
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
  activePromotion?: any;
  promotions?: any[];
  variants?: AdminProductVariantDto[];
  stock: number;
  image: string;
  status: string;
  createdAt?: string;
  costPerUnit?: number;
  soldCount?: number;
  viewCount?: number;
  slug?: string;
}

export interface AdminProductImageDto {
  id: string;
  url: string;
  publicId?: string;
  variantId?: string | null;
  sortOrder?: number;
  isSizeChart?: boolean;
}

export interface AdminProductVariantDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  attributesJson: string;
  price: number;
  imageUrl?: string;
  images?: AdminProductImageDto[];
}

export interface AdminCategoryDto {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  attributeSchemaJson?: string;
  url?: string;
  publicId?: string;
  imageUrl?: string;
  productCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminInventoryItemDto {
  id: string;
  variantId: string;
  productId?: string;
  productName: string;
  variantName: string;
  sku: string;
  image?: string;
  category?: string;
  attributesJson?: string;
  quantity: number;          // Physical stock
  reservedQuantity: number;  // Reserved stock
  availableQuantity: number; // Available stock = Physical - Reserved
  lowStockThreshold: number;
  costPerUnit?: number;
  stockValue?: number;
  velocity?: 'fast' | 'normal' | 'slow';
  lastAdjustedAt?: string;
  isLowStock: boolean;
  updatedAt?: string;
}

export interface AdminInventoryMovementDto {
  id: string;
  productVariantId: string;
  change: number;
  physicalBefore: number;
  physicalAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  availableBefore: number;
  availableAfter: number;
  type: string;
  reason: string;
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface AdminOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  itemCount: number;
  firstItemName: string;
  firstItemImage?: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingProvider?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: string;
  createdAt: string;
}

export interface AdminOrderDetailDto {
  id: string;
  customerId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingStreetAddress: string;
  shippingProvider?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomerDto {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isBlocked: boolean;
  totalSpent?: number;
  loyaltyTierName?: string;
  currentTierName?: string;
  loyaltyDiscountPercent?: number;
  currentDiscountPercent?: number;
  nextTierName?: string | null;
  nextTierMinSpend?: number | null;
  amountNeededForNextTier?: number | null;
  addresses?: any[];
  createdAt: string;
}

export interface AdminReviewDto {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  productVariantId?: string;
  variantName?: string;
  orderId?: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  isHidden: boolean;
  hideReason?: string;
  sellerReply?: string;
  sellerRepliedAt?: string;
  imageUrls?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AdminBrandDto {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface AdminAuditLogDto {
  id: string;
  actorId?: string | null;
  actorRole: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: string | null;
  occurredAt: string;
  createdAt: string;
  // Compatibility helper fields
  timestamp?: string;
  adminEmail?: string;
  module?: string;
}

export interface GetAuditLogsParams {
  actorId?: string;
  actorRole?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}


export interface OrderDashboardSummaryDto {
  todayOrders: number;
  todayRevenue: number;
  yesterdayOrders?: number;
  yesterdayRevenue?: number;
  revenueGrowthPercent?: number;
  ordersGrowthPercent?: number;
  pendingOrders: number;
  totalOrdersThisMonth: number;
}

export interface DailyRevenuePointDto {
  date: string;
  formattedDate: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueAnalyticsDto {
  days: number;
  totalRevenue: number;
  totalOrders: number;
  previousPeriodRevenue: number;
  previousPeriodOrders: number;
  revenueGrowthPercent: number;
  ordersGrowthPercent: number;
  timeline: DailyRevenuePointDto[];
}

export interface OrderStatusItemDto {
  status: string;
  statusText: string;
  count: number;
  percentage: number;
  color: string;
}

export interface OrderStatusDistributionDto {
  days: number;
  totalOrders: number;
  items: OrderStatusItemDto[];
}

export interface ProductInsightItemDto {
  productId: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  viewCount: number;
  soldCount: number;
}

export interface ProductInsightsResultDto {
  needsReview: ProductInsightItemDto[];
  bestSellers: ProductInsightItemDto[];
  repeatBuys: ProductInsightItemDto[];
  slowMovers: ProductInsightItemDto[];
}

export interface TopSellingProductDto {
  productId: string;
  name: string;
  image: string;
  soldCount: number;
  revenue: number;
}

export interface CustomerDashboardSummaryDto {
  totalCustomers: number;
  newThisMonth: number;
  blockedCount: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
}

// ─── API ──────────────────────────────────────────────────────────────────

export const adminApi = {
  // ── PRODUCTS ──────────────────────────────────────────────────────────

  async getProducts(): Promise<AdminProductDto[]> {
    const res = await apiClient.get<any>('/admin/products');
    const items = res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
    return items.map((p: any) => {
      const minPrice = p.minPrice ?? p.basePrice ?? p.price ?? 0;
      const maxPrice = p.maxPrice ?? p.basePrice ?? p.price ?? 0;
      const effectiveMinPrice = p.effectiveMinPrice ?? (p.isOnSale ? p.effectivePrice : minPrice) ?? minPrice;
      const effectiveMaxPrice = p.effectiveMaxPrice ?? (p.isOnSale ? p.effectivePrice : maxPrice) ?? maxPrice;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku || `SKU-${p.id?.substring(0, 6)}`,
        description: p.description || '',
        category: p.category?.name || p.category || 'Vợt Pickleball',
        categoryId: p.category?.id || p.categoryId,
        brand: p.brand?.name || p.brand || '',
        brandId: p.brand?.id || p.brandId,
        price: minPrice,
            minPrice: minPrice,
        maxPrice: maxPrice,
        effectivePrice: effectiveMinPrice,
        effectiveMinPrice: effectiveMinPrice,
        effectiveMaxPrice: effectiveMaxPrice,
        isSinglePrice: minPrice === maxPrice,
        isOnSale: !!p.isOnSale,
        salePercent: p.salePercent ?? (p.activePromotion?.discountPercent ?? null),
        activePromotion: p.activePromotion ? {
          promotionId: p.activePromotion.promotionId,
          promotionName: p.activePromotion.promotionName,
          discountPercent: p.activePromotion.discountPercent,
          startsAt: p.activePromotion.startsAt,
          endsAt: p.activePromotion.endsAt,
          isActive: p.activePromotion.isActive,
          priority: p.activePromotion.priority,
          status: p.activePromotion.status || 'Active',
        } : null,
        promotions: (p.promotions || []).map((pr: any) => ({
          promotionId: pr.promotionId,
          promotionName: pr.promotionName,
          discountPercent: pr.discountPercent,
          startsAt: pr.startsAt,
          endsAt: pr.endsAt,
          isActive: pr.isActive,
          priority: pr.priority,
          status: pr.status || 'Active',
        })),
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          productId: v.productId || p.id,
          productName: p.name,
          sku: v.sku,
          attributesJson: v.attributesJson || v.variantAttributesJson || '{}',
          price: v.price,
          imageUrl: v.imageUrl,
        })),
        stock: p.totalStock ?? p.stock ?? 0,
        image: p.thumbnailUrl || p.image || '/images/paddle.png',
        status: (p.status === 0 || p.status === 'Draft' || p.status === 'draft')
          ? 'draft'
          : (p.status === 2 || p.status === 'Hidden' || p.status === 'hidden' || p.status === 'Archived' || p.status === 'archived')
          ? 'hidden'
          : 'active',
        createdAt: p.createdAt,
        soldCount: Number(p.soldCount ?? 0),
        viewCount: Number(p.viewCount ?? 0),
        slug: p.slug || p.id,
      };
    });
  },

  async getCategories(flat: boolean = true): Promise<AdminCategoryDto[]> {
    const res = await apiClient.get<any>(`/categories?flat=${flat}`);
    const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    return items.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      parentId: c.parentId || null,
      attributeSchemaJson: c.attributeSchemaJson || '[]',
      url: c.url,
      publicId: c.publicId,
      imageUrl: c.url || c.imageUrl || '/images/paddle.png',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },

  async createCategory(data: { name: string; parentId?: string | null }): Promise<AdminCategoryDto> {
    const res = await apiClient.post('/categories', data);
    return res.data;
  },

  async updateCategory(id: string, data: { name: string; parentId?: string | null }): Promise<AdminCategoryDto> {
    const res = await apiClient.put(`/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  async uploadCategoryImage(categoryId: string, file: File): Promise<AdminCategoryDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post(`/categories/${categoryId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async removeCategoryImage(categoryId: string): Promise<AdminCategoryDto> {
    const res = await apiClient.delete(`/categories/${categoryId}/image`);
    return res.data;
  },

  async updateCategoryAttributeSchema(id: string, attributeSchemaJson: string): Promise<any> {
    const res = await apiClient.put(`/categories/${id}/attribute-schema`, { attributeSchemaJson });
    return res.data;
  },

  async seedCatalog(): Promise<any> {
    const res = await apiClient.post('/catalog/seed');
    return res.data;
  },

  async createProduct(data: any): Promise<any> {
    const statusMap: Record<string, string> = {
      active: 'Active',
      published: 'Active',
      draft: 'Draft',
      hidden: 'Hidden',
      archived: 'Hidden',
    };
    const mappedStatus = data.status
      ? (statusMap[data.status.toString().toLowerCase()] || 'Active')
      : 'Active';

    const payload: any = {
      name: data.name,
      description: data.description || '',
      categoryId: data.categoryId,
      brandId: data.brandId,
      basePrice: data.basePrice ?? data.price,
      price: data.price ?? data.basePrice,
      sku: data.sku || undefined,
      specsJson: data.specsJson || '{}',
      status: mappedStatus,
    };

    const res = await apiClient.post('/products', payload);
    return res.data;
  },

  async updateProduct(id: string, data: any): Promise<void> {
    const statusMap: Record<string, string> = {
      active: 'Active',
      published: 'Active',
      draft: 'Draft',
      hidden: 'Hidden',
      archived: 'Hidden',
    };
    const mappedStatus = data.status
      ? (statusMap[data.status.toString().toLowerCase()] || 'Active')
      : undefined;

    const payload: any = {
      id,
      name: data.name,
      description: data.description || '',
      categoryId: data.categoryId,
      brandId: data.brandId,
      basePrice: data.basePrice ?? data.price,
      price: data.price ?? data.basePrice,
      specsJson: data.specsJson || '{}',
    };
    if (mappedStatus) {
      payload.status = mappedStatus;
    }

    await apiClient.put(`/products/${id}`, payload);
  },

  async bulkUpdateProductStatus(productIds: string[], status: string): Promise<any> {
    const statusMap: Record<string, string> = {
      active: 'Active',
      published: 'Active',
      draft: 'Draft',
      hidden: 'Hidden',
      archived: 'Hidden',
    };
    const mappedStatus = statusMap[status.toString().toLowerCase()] || status;
    const res = await apiClient.patch('/admin/products/bulk-status', {
      productIds,
      status: mappedStatus,
    });
    return res.data;
  },

  async uploadProductImages(
    productId: string,
    files: File[],
    variantId?: string,
    isSizeChart: boolean = false
  ): Promise<AdminProductImageDto[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (variantId) {
      formData.append('variantId', variantId);
    }
    if (isSizeChart) {
      formData.append('isSizeChart', 'true');
    }
    const res = await apiClient.post(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async uploadProductImage(productId: string, file: File, sortOrder: number = 0, variantId?: string): Promise<any> {
    return this.uploadProductImages(productId, [file], variantId);
  },

  async replaceProductImage(productId: string, imageId: string, file: File): Promise<AdminProductImageDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.put(`/products/${productId}/images/${imageId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async removeProductImage(productId: string, imageId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}/images/${imageId}`);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  // ── PRODUCT VARIANTS ──────────────────────────────────────────────────

  async getProductVariants(productId: string): Promise<AdminProductVariantDto[]> {
    const res = await apiClient.get<any>(`/products/${productId}/variants`);
    const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    return items.map((v: any) => ({
      id: v.id,
      productId: v.productId || productId,
      productName: v.productName || '',
      sku: v.sku,
      attributesJson: v.attributesJson || '{}',
      price: v.price,
      imageUrl: v.imageUrl,
      images: Array.isArray(v.images)
        ? v.images.map((img: any) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
            variantId: img.variantId,
            sortOrder: img.sortOrder,
            isSizeChart: img.isSizeChart,
          }))
        : (v.imageUrl ? [{ id: v.id, url: v.imageUrl, sortOrder: 0 }] : []),
    }));
  },

  async addProductVariant(productId: string, data: { sku: string; attributesJson: string; price: number }): Promise<AdminProductVariantDto> {
    const res = await apiClient.post(`/products/${productId}/variants`, data);
    return res.data;
  },

  async updateProductVariant(productId: string, variantId: string, data: { sku: string; attributesJson: string; price: number }): Promise<AdminProductVariantDto> {
    const res = await apiClient.put(`/products/${productId}/variants/${variantId}`, data);
    return res.data;
  },

  async removeProductVariant(productId: string, variantId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}/variants/${variantId}`);
  },

  // ── INVENTORY ─────────────────────────────────────────────────────────

  async getInventory(): Promise<AdminInventoryItemDto[]> {
    try {
      const [invRes, productsRes] = await Promise.all([
        apiClient.get<any>('/inventory', { params: { pageSize: 500 } }).catch(() => ({ data: [] })),
        apiClient.get<any>('/products', { params: { pageSize: 500 } }).catch(() => ({ data: [] })),
      ]);

      const rawInv = invRes.data;
      const invList: any[] = rawInv?.items ?? (Array.isArray(rawInv) ? rawInv : []);
      const invMap = new Map<string, any>();
      invList.forEach((i: any) => {
        const key = i.productVariantId || i.variantId || i.id;
        if (key) invMap.set(key, i);
        if (i.skuSnapshot) invMap.set(i.skuSnapshot, i);
        if (i.sku) invMap.set(i.sku, i);
      });

      const productsRaw = productsRes.data;
      const productList: any[] = Array.isArray(productsRaw) ? productsRaw : (productsRaw?.items ?? []);

      // Fetch variants for all products in parallel
      const variantPromises = productList.map(async (p) => {
        try {
          const vRes = await apiClient.get<any>(`/products/${p.id}/variants`);
          const vars: any[] = Array.isArray(vRes.data) ? vRes.data : (vRes.data?.items ?? []);
          return { product: p, variants: vars };
        } catch {
          return { product: p, variants: [] };
        }
      });

      const productVariantsResults = await Promise.all(variantPromises);
      const combinedItems: AdminInventoryItemDto[] = [];
      const handledVariantIds = new Set<string>();

      productVariantsResults.forEach(({ product, variants }) => {
        if (variants.length > 0) {
          variants.forEach((v: any) => {
            handledVariantIds.add(v.id);
            handledVariantIds.add(v.sku);
            const matchingInv = invMap.get(v.id) || invMap.get(v.sku);
            const qty = matchingInv?.quantity ?? matchingInv?.stock ?? 0;
            const threshold = matchingInv?.lowStockThreshold ?? matchingInv?.threshold ?? 5;

            const catName = typeof product.category === 'object' && product.category
              ? (product.category.name || 'Vợt Pickleball')
              : (typeof product.category === 'string' ? product.category : 'Vợt Pickleball');

            combinedItems.push({
              id: matchingInv?.id || v.id,
              variantId: v.id,
              productId: product.id,
              productName: product.name,
              variantName: v.sku || 'Mặc định',
              sku: v.sku || `SKU-${product.id?.substring(0, 6)}`,
              image: v.imageUrl || product.image || '/images/paddle.png',
              category: catName,
              attributesJson: v.attributesJson || '{}',
              quantity: qty,
              reservedQuantity: matchingInv?.reservedQuantity ?? 0,
              availableQuantity: qty - (matchingInv?.reservedQuantity ?? 0),
              lowStockThreshold: threshold,
              isLowStock: qty <= threshold,
              updatedAt: matchingInv?.updatedAt || v.updatedAt || product.createdAt,
            });
          });
        } else {
          // If product has no sub-variants, display base product as default variant
          const matchingInv = invMap.get(product.id) || invMap.get(product.sku);
          const qty = matchingInv?.quantity ?? matchingInv?.stock ?? 0;
          const threshold = matchingInv?.lowStockThreshold ?? 5;
          const catName = typeof product.category === 'object' && product.category
            ? (product.category.name || 'Vợt Pickleball')
            : (typeof product.category === 'string' ? product.category : 'Vợt Pickleball');

          combinedItems.push({
            id: matchingInv?.id || product.id,
            variantId: product.id,
            productId: product.id,
            productName: product.name,
            variantName: 'Bản tiêu chuẩn',
            sku: product.sku || `SKU-${product.id?.substring(0, 6)}`,
            image: product.image || '/images/paddle.png',
            category: catName,
            attributesJson: product.specsJson || '{}',
            quantity: qty,
            reservedQuantity: matchingInv?.reservedQuantity ?? 0,
            availableQuantity: qty - (matchingInv?.reservedQuantity ?? 0),
            lowStockThreshold: threshold,
            isLowStock: qty <= threshold,
            updatedAt: matchingInv?.updatedAt || product.createdAt,
          });
        }
      });

      // Also include any standalone inventory items not mapped
      invList.forEach((i: any) => {
        const id = i.productVariantId || i.variantId || i.id;
        if (id && !handledVariantIds.has(id) && !handledVariantIds.has(i.skuSnapshot)) {
          combinedItems.push({
            id: i.id || id,
            variantId: id,
            productName: i.productName || 'Sản phẩm kho',
            variantName: i.variantName || 'Mặc định',
            sku: i.skuSnapshot || i.sku || 'SKU-000',
            image: '/images/paddle.png',
            category: 'Phụ Kiện',
            attributesJson: '{}',
            quantity: i.quantity ?? 0,
            reservedQuantity: i.reservedQuantity ?? 0,
            availableQuantity: (i.quantity ?? 0) - (i.reservedQuantity ?? 0),
            lowStockThreshold: i.lowStockThreshold ?? 5,
            isLowStock: (i.quantity ?? 0) <= (i.lowStockThreshold ?? 5),
            updatedAt: i.updatedAt,
          });
        }
      });

      return combinedItems;
    } catch {
      return [];
    }
  },

  async getLowStockItems(): Promise<AdminInventoryItemDto[]> {
    const res = await apiClient.get<any>('/inventory/low-stock');
    const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    return items.map((i: any) => ({
      id: i.id || i.variantId,
      variantId: i.variantId || i.id,
      productName: i.productName || i.name || 'Sản phẩm',
      variantName: i.variantName || 'Mặc định',
      sku: i.sku || i.productSku || 'SKU-000',
      quantity: i.quantity ?? i.stock ?? 0,
      reservedQuantity: i.reservedQuantity ?? 0,
      availableQuantity: (i.quantity ?? i.stock ?? 0) - (i.reservedQuantity ?? 0),
      lowStockThreshold: i.lowStockThreshold ?? i.threshold ?? 10,
      isLowStock: true,
      updatedAt: i.updatedAt,
    }));
  },

  async importStock(data: { variantId: string; quantity: number; note?: string; productId?: string; skuSnapshot?: string }): Promise<void> {
    await apiClient.post('/inventory/import', {
      productVariantId: data.variantId,
      productId: data.productId || '00000000-0000-0000-0000-000000000000',
      skuSnapshot: data.skuSnapshot || '',
      quantity: data.quantity,
      note: data.note,
    });
  },

  async updateInventoryThreshold(variantId: string, threshold: number, productId?: string, skuSnapshot?: string, currentQuantity?: number): Promise<void> {
    await apiClient.patch(`/inventory/variants/${variantId}/threshold`, {
      threshold,
      productId,
      skuSnapshot,
      currentQuantity,
    });
  },

  async adjustStock(variantId: string, data: { delta: number; reason: string; referenceId?: string }): Promise<any> {
    const res = await apiClient.post(`/inventory/variants/${variantId}/adjust`, data);
    return res.data;
  },

  async bulkAdjust(adjustments: { productVariantId: string; delta: number; reason: string; referenceId?: string }[]): Promise<any> {
    const res = await apiClient.post('/inventory/bulk-adjust', { adjustments });
    return res.data;
  },

  async getMovements(variantId: string, page: number = 1, pageSize: number = 20, type?: string): Promise<{ items: AdminInventoryMovementDto[]; totalCount: number }> {
    const res = await apiClient.get<any>(`/inventory/variants/${variantId}/movements`, {
      params: { page, pageSize, type },
    });
    return res.data;
  },

  async reserveStock(variantId: string, data: { quantity: number; referenceId?: string; idempotencyKey?: string }): Promise<any> {
    const res = await apiClient.post(`/inventory/variants/${variantId}/reserve`, data, {
      headers: data.idempotencyKey ? { 'Idempotency-Key': data.idempotencyKey } : undefined,
    });
    return res.data;
  },

  async releaseStock(variantId: string, data: { quantity: number; referenceId?: string }): Promise<any> {
    const res = await apiClient.post(`/inventory/variants/${variantId}/release`, data);
    return res.data;
  },

  async exportInventoryExcel(params?: { startDate?: string; endDate?: string; periodLabel?: string }): Promise<Blob> {
    const res = await apiClient.get('/inventory/export-excel', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  async downloadInventoryTemplateExcel(): Promise<Blob> {
    const res = await apiClient.get('/inventory/import-template-excel', {
      responseType: 'blob',
    });
    return res.data;
  },

  async importInventoryExcel(file: File): Promise<{
    totalRowsProcessed: number;
    successCount: number;
    failedCount: number;
    failedRows?: { rowNumber: number; sku?: string; reason: string }[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/inventory/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // ── ORDERS ────────────────────────────────────────────────────────────

  async getOrders(params?: {
    status?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<AdminOrderDto>> {
    const res = await apiClient.get<any>('/admin/orders', { params });
    const raw = res.data;
    const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
    return {
      items: items.map((o: any) => ({
        id: o.id,
        orderNumber: `#PH${o.id.substring(0, 5).toUpperCase()}`,
        customerName: o.shippingFullName || '—',
        customerPhone: o.shippingPhone || '—',
        totalAmount: o.totalAmount,
        itemCount: o.itemCount ?? 1,
        firstItemName: o.firstItemName || '',
        firstItemImage: o.firstItemImage,
        paymentMethod: o.paymentMethod || 'COD',
        paymentStatus: o.paymentStatus || 'Pending',
        shippingProvider: o.shippingProvider,
        trackingNumber: o.trackingNumber,
        trackingUrl: o.trackingUrl,
        status: o.status,
        createdAt: o.createdAt,
      })),
      page: raw?.page ?? 1,
      pageSize: raw?.pageSize ?? 20,
      totalItems: raw?.totalItems ?? items.length,
    };
  },

  async getOrderDetail(id: string): Promise<AdminOrderDetailDto> {
    const res = await apiClient.get<any>(`/admin/orders/${id}`);
    const o = res.data;
    return {
      id: o.id,
      customerId: o.customerId,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      shippingFullName: o.shippingFullName,
      shippingPhone: o.shippingPhone,
      shippingProvince: o.shippingProvince,
      shippingDistrict: o.shippingDistrict,
      shippingWard: o.shippingWard,
      shippingStreetAddress: o.shippingStreetAddress,
      shippingProvider: o.shippingProvider,
      trackingNumber: o.trackingNumber,
      trackingUrl: o.trackingUrl,
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productNameSnapshot || i.productName || '—',
        imageUrl: i.imageUrlSnapshot || i.imageUrl,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      subtotal: o.subtotal,
      shippingFee: o.shippingFee,
      totalAmount: o.totalAmount,
      cancelledBy: o.cancelledBy,
      cancelReason: o.cancelReason,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  },

  async confirmOrder(id: string): Promise<void> {
    await apiClient.patch(`/admin/orders/${id}/confirm`);
  },

  async updateOrderShipping(id: string, shippingProvider: string, trackingNumber: string): Promise<void> {
    await apiClient.patch(`/admin/orders/${id}/shipping`, { shippingProvider, trackingNumber });
  },

  async completeOrder(id: string): Promise<void> {
    await apiClient.patch(`/admin/orders/${id}/complete`);
  },

  async cancelOrder(id: string, reason?: string): Promise<void> {
    await apiClient.patch(`/admin/orders/${id}/cancel`, { reason });
  },

  async getOrderDashboardSummary(): Promise<OrderDashboardSummaryDto> {
    const res = await apiClient.get<any>('/admin/orders/dashboard/summary');
    return res.data;
  },

  async getRevenueAnalytics(params?: { days?: number; startDate?: string; endDate?: string } | number): Promise<RevenueAnalyticsDto> {
    const queryParams = typeof params === 'number' ? { days: params } : (params || { days: 30 });
    const res = await apiClient.get<RevenueAnalyticsDto>('/admin/orders/dashboard/revenue-analytics', { params: queryParams });
    return res.data;
  },

  async getOrderStatusDistribution(params?: { days?: number; startDate?: string; endDate?: string } | number): Promise<OrderStatusDistributionDto> {
    const queryParams = typeof params === 'number' ? { days: params } : (params || { days: 30 });
    const res = await apiClient.get<OrderStatusDistributionDto>('/admin/orders/dashboard/status-distribution', { params: queryParams });
    return res.data;
  },

  async getProductInsights(): Promise<ProductInsightsResultDto> {
    const res = await apiClient.get<ProductInsightsResultDto>('/admin/products/insights');
    return res.data;
  },

  async getTopSellingProducts(params?: { days?: number; limit?: number; startDate?: string; endDate?: string } | number, limit: number = 8): Promise<TopSellingProductDto[]> {
    const queryParams = typeof params === 'number' ? { days: params, limit } : { limit, ...params };
    const res = await apiClient.get<TopSellingProductDto[]>('/admin/orders/dashboard/top-products', { params: queryParams });
    return res.data;
  },

  // ── CUSTOMERS ─────────────────────────────────────────────────────────

  async getCustomers(params?: {
    keyword?: string;
    isBlocked?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<AdminCustomerDto>> {
    const res = await apiClient.get<any>('/customers', { params });
    const raw = res.data;
    const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
    return {
      items: items.map((c: any) => ({
        id: c.id,
        userId: c.userId,
        fullName: c.fullName || '—',
        email: c.email || '—',
        phone: c.phoneNumber || c.phone || '—',
        phoneNumber: c.phoneNumber || c.phone,
        avatarUrl: c.avatarUrl,
        isBlocked: !!c.isBlocked,
        totalSpent: Number(c.totalSpent ?? 0),
        loyaltyTierName: c.loyaltyTierName || c.currentTierName || 'Thành viên mới',
        currentTierName: c.currentTierName || c.loyaltyTierName || 'Thành viên mới',
        loyaltyDiscountPercent: Number(c.loyaltyDiscountPercent ?? c.currentDiscountPercent ?? 0),
        currentDiscountPercent: Number(c.currentDiscountPercent ?? c.loyaltyDiscountPercent ?? 0),
        createdAt: c.createdAt || '',
      })),
      page: raw?.page ?? 1,
      pageSize: raw?.pageSize ?? 20,
      totalItems: raw?.totalItems ?? items.length,
    };
  },

  async getCustomerDetail(customerId: string): Promise<AdminCustomerDto> {
    const res = await apiClient.get<any>(`/customers/${customerId}/detail`);
    const c = res.data;
    return {
      id: c.id,
      userId: c.userId,
      fullName: c.fullName || '—',
      email: c.email || '—',
      phone: c.phoneNumber || c.phone || '—',
      phoneNumber: c.phoneNumber || c.phone,
      avatarUrl: c.avatarUrl,
      isBlocked: !!c.isBlocked,
      totalSpent: Number(c.totalSpent ?? 0),
      loyaltyTierName: c.currentTierName || c.loyaltyTierName || 'Thành viên mới',
      currentTierName: c.currentTierName || c.loyaltyTierName || 'Thành viên mới',
      loyaltyDiscountPercent: Number(c.currentDiscountPercent ?? c.loyaltyDiscountPercent ?? 0),
      currentDiscountPercent: Number(c.currentDiscountPercent ?? c.loyaltyDiscountPercent ?? 0),
      nextTierName: c.nextTierName,
      nextTierMinSpend: c.nextTierMinSpend ? Number(c.nextTierMinSpend) : undefined,
      amountNeededForNextTier: c.amountNeededForNextTier ? Number(c.amountNeededForNextTier) : undefined,
      addresses: c.addresses || [],
      createdAt: c.createdAt || '',
    };
  },

  async getCustomerDashboardSummary(): Promise<CustomerDashboardSummaryDto> {
    const res = await apiClient.get<any>('/customers/dashboard/summary');
    return res.data;
  },

  async toggleBlockCustomer(id: string, isBlocked: boolean): Promise<void> {
    await apiClient.patch(`/customers/${id}/block`, { isBlocked });
  },

  // ── REVIEWS ───────────────────────────────────────────────────────────

  async getReviews(params?: {
    keyword?: string;
    productId?: string;
    rating?: number;
    isHidden?: boolean;
    hasReply?: boolean;
    hasImages?: boolean;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: AdminReviewDto[]; totalItems: number; page: number; pageSize: number }> {
    const res = await apiClient.get<any>('/admin/reviews', { params });
    const raw = res.data;
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
    return {
      items: items.map((r: any) => ({
        id: r.id,
        userId: r.userId || '',
        userName: r.userName || r.customerName,
        userEmail: r.userEmail,
        productId: r.productId || '',
        productName: r.productName,
        productImage: r.productImage,
        productVariantId: r.productVariantId,
        variantName: r.variantName,
        orderId: r.orderId,
        rating: Number(r.rating || 5),
        comment: r.comment || '',
        isVerifiedPurchase: !!r.isVerifiedPurchase,
        helpfulCount: Number(r.helpfulCount || 0),
        isHidden: !!r.isHidden,
        hideReason: r.hideReason,
        sellerReply: r.sellerReply,
        sellerRepliedAt: r.sellerRepliedAt,
        imageUrls: Array.isArray(r.imageUrls) ? r.imageUrls : [],
        createdAt: r.createdAt || '',
        updatedAt: r.updatedAt,
      })),
      totalItems: raw?.totalItems ?? items.length,
      page: raw?.page ?? 1,
      pageSize: raw?.pageSize ?? (params?.pageSize || 20),
    };
  },

  async replyReview(id: string, reply: string): Promise<void> {
    await apiClient.patch(`/reviews/${id}/reply`, { reply });
  },

  async hideReview(id: string, isHidden: boolean, reason?: string): Promise<void> {
    await apiClient.patch(`/reviews/${id}/hide`, { isHidden, reason });
  },

  async deleteReview(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`);
  },

  // ── BRANDS ────────────────────────────────────────────────────────────

  async getBrands(): Promise<AdminBrandDto[]> {
    const res = await apiClient.get<any>('/brands');
    const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    return items.map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug || b.name.toLowerCase().replace(/\s+/g, '-'),
      description: b.description || `Thương hiệu ${b.name}`,
    }));
  },

  async createBrand(data: { name: string; description?: string }): Promise<void> {
    await apiClient.post('/brands', data);
  },

  async updateBrand(id: string, data: { name: string; description?: string }): Promise<void> {
    await apiClient.put(`/brands/${id}`, data);
  },

  async deleteBrand(id: string): Promise<void> {
    await apiClient.delete(`/brands/${id}`);
  },

  // ── AUDIT LOGS ────────────────────────────────────────────────────────

  async getAuditLogs(params?: GetAuditLogsParams): Promise<{ items: AdminAuditLogDto[]; totalItems: number; page: number; pageSize: number }> {
    const res = await apiClient.get<any>('/audit-logs', { params });
    const data = res.data;
    const rawItems = data?.items ?? (Array.isArray(data) ? data : []);
    const items: AdminAuditLogDto[] = rawItems.map((l: any) => ({
      id: l.id,
      actorId: l.actorId ?? null,
      actorRole: l.actorRole || 'System',
      actorEmail: l.actorEmail || l.adminEmail || 'system',
      action: l.action || '—',
      entityType: l.entityType || l.module || '—',
      entityId: l.entityId ?? null,
      description: l.description || l.action || '—',
      metadata: l.metadata ?? null,
      occurredAt: l.occurredAt || l.createdAt || new Date().toISOString(),
      createdAt: l.createdAt || new Date().toISOString(),
      // Helper compatibility fields
      timestamp: l.occurredAt
        ? new Date(l.occurredAt).toLocaleString('vi-VN')
        : (l.timestamp || '—'),
      adminEmail: l.actorEmail || l.adminEmail || 'system',
      module: l.entityType || l.module || '—',
    }));
    return {
      items,
      totalItems: data?.totalItems ?? items.length,
      page: data?.page ?? (params?.page || 1),
      pageSize: data?.pageSize ?? (params?.pageSize || 20),
    };
  },


  // ── REFUND REQUESTS (PayOS Semi-Auto Refund) ──────────────────────────

  async getRefundRequests(status?: string, page = 1, pageSize = 20): Promise<{ items: any[]; totalItems: number; totalPages: number }> {
    const res = await apiClient.get<any>('/payments/refunds', {
      params: { status, page, pageSize }
    });
    return {
      items: res.data?.items ?? [],
      totalItems: res.data?.totalItems ?? 0,
      totalPages: res.data?.totalPages ?? 1,
    };
  },

  async getRefundByOrder(orderId: string): Promise<any | null> {
    try {
      const res = await apiClient.get<any>(`/payments/refunds/order/${orderId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async updateRefundBankInfo(orderId: string, data: { bankCode: string; accountNumber: string; accountName: string }): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.put<any>(`/payments/refunds/order/${orderId}/bank-info`, data);
    return res.data;
  },

  async processRefund(id: string, action: 'Approve' | 'Reject', bankTransactionReference?: string, adminNote?: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<any>(`/payments/refunds/${id}/process`, {
      action,
      bankTransactionReference,
      adminNote,
    });
    return res.data;
  },

  // ── PROMOTIONS API ───────────────────────────────────────────────────

  async getPromotions(page = 1, pageSize = 50): Promise<{ items: AdminPromotionSummaryDto[]; totalItems: number }> {
    const res = await apiClient.get<any>('/admin/promotions', {
      params: { page, pageSize }
    });
    return {
      items: res.data?.items ?? [],
      totalItems: res.data?.totalItems ?? 0,
    };
  },

  async getPromotionById(id: string): Promise<AdminPromotionDetailDto> {
    const res = await apiClient.get<any>(`/admin/promotions/${id}`);
    return res.data;
  },

  async createPromotion(data: {
    name: string;
    description?: string;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    priority: number;
    items?: { productId: string; discountPercent: number }[];
  }): Promise<any> {
    const res = await apiClient.post('/admin/promotions', data);
    return res.data;
  },

  async updatePromotion(id: string, data: {
    name: string;
    description?: string;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    priority: number;
  }): Promise<any> {
    const res = await apiClient.put(`/admin/promotions/${id}`, data);
    return res.data;
  },

  async deletePromotion(id: string): Promise<void> {
    await apiClient.delete(`/admin/promotions/${id}`);
  },

  async addProductsToPromotion(
    id: string,
    items: { productId: string; discountPercent: number }[]
  ): Promise<{ promotion: any; successCount: number; conflictingProductIds: string[] }> {
    const res = await apiClient.post(`/admin/promotions/${id}/products`, items);
    return res.data;
  },

  async removeProductFromPromotion(id: string, productId: string): Promise<void> {
    await apiClient.delete(`/admin/promotions/${id}/products/${productId}`);
  },

  // ── SYSTEM CONFIGS (Key-Value) ──────────────────────────────────────

  async getConfigs(): Promise<AdminSystemConfigDto[]> {
    const res = await apiClient.get<any>('/system/configs');
    return Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
  },

  async getConfigByKey(key: string): Promise<AdminSystemConfigDto> {
    const res = await apiClient.get<any>(`/system/configs/${key}`);
    return res.data;
  },

  async upsertConfig(key: string, value: string, description?: string): Promise<AdminSystemConfigDto> {
    const res = await apiClient.put<any>(`/system/configs/${key}`, { value, description });
    return res.data;
  },

  // ── SITE ANNOUNCEMENTS / BANNERS ────────────────────────────────────

  async getAnnouncements(): Promise<AdminSiteAnnouncementDto[]> {
    const res = await apiClient.get<any>('/system/announcements');
    return Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
  },

  async getActiveAnnouncements(): Promise<AdminSiteAnnouncementDto[]> {
    const res = await apiClient.get<any>('/system/announcements/active');
    return Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
  },

  async createAnnouncement(data: {
    title: string;
    content: string;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    ctaLink?: string | null;
  }): Promise<AdminSiteAnnouncementDto> {
    const res = await apiClient.post<any>('/system/announcements', data);
    return res.data;
  },

  async updateAnnouncement(
    id: string,
    data: {
      title: string;
      content: string;
      isActive: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      imageUrl?: string | null;
      imagePublicId?: string | null;
      ctaLink?: string | null;
    }
  ): Promise<AdminSiteAnnouncementDto> {
    const res = await apiClient.put<any>(`/system/announcements/${id}`, data);
    return res.data;
  },

  async uploadAnnouncementImage(file: File): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ url: string; publicId: string }>(
      '/system/announcements/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await apiClient.delete(`/system/announcements/${id}`);
  },
};

export interface AdminSystemConfigDto {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}

export interface AdminSiteAnnouncementDto {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  isVisible?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  ctaLink?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminPromotionSummaryDto {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  isCurrentlyRunning: boolean;
  productCount: number;
}

export interface AdminPromotionItemDto {
  productId: string;
  productName: string;
  thumbnailUrl?: string;
  discountPercent: number;
}

export interface AdminPromotionDetailDto {
  id: string;
  name: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  isCurrentlyRunning: boolean;
  items: AdminPromotionItemDto[];
}

