// Backend API DTO Models for PickleHub Microservices Architecture

// 1. Catalog Service Models
export interface ProductVariantItem {
  id: string;
  sku: string;
  price: number;
  effectivePrice?: number;
  attributes: Record<string, string>;
  label: string;
  image?: string;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;

  categoryName?: string;
  categoryId?: string;
  brandName?: string;
  brand?: string;
  brandId?: string;
  price: number;
  oldPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  effectiveMinPrice?: number;
  effectiveMaxPrice?: number;
  isSinglePrice?: boolean;
  effectivePrice?: number;
  isOnSale?: boolean;
  salePercent?: number;
  soldCount?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  badge?: string;
  description?: string;
  sku?: string;
  stock: number;
  colors?: string[];
  sizes?: string[];
  specs?: Record<string, string>;
  variants?: ProductVariantItem[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  weight: string; // e.g. "7.8 oz"
  gripSize: string;
  price: number;
  stock: number;
}

// 2. Cart & Order Service Models
export interface CartItem {
  id: string;
  productVariantId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  weight?: string;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipping' | 'Completed' | 'Cancelled';

export interface OrderItem {
  id: string;
  productVariantId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: 'COD' | 'PayOS';
  trackingNumber?: string;
  items: OrderItem[];
  createdAt: string;
}

// 3. Payment Service Models
export interface PaymentRequest {
  orderId: string;
  amount: number;
  description?: string;
}

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  checkoutUrl: string;
  qrCodeUrl: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

// 4. Notification Service Models
export type NotificationType = 'Order' | 'Payment' | 'System' | 'Promotion';

export interface WebNotificationDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  referenceId?: string;
  action?: string;
  isRead: boolean;
  createdAt: string;
}

// 5. Review & Rating Service Models (FR-26)
export interface ProductRatingSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  starDistribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

export interface ReviewDto {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  isVerifiedPurchase: boolean;
  rating: number; // 1-5
  comment: string;
  imageUrls: string[];
  sellerReply?: string;
  repliedAt?: string;
  isHidden: boolean;
  createdAt: string;
}

// 6. Refund Request Models (PayOS Semi-Auto Refund)
export type RefundStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface RefundRequestDto {
  id: string;
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  status: RefundStatus | number;
  adminNote?: string;
  bankTransactionReference?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

// 7. Admin Dashboard Stats Model
export interface DashboardSummaryDto {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  activeCustomers: number;
}

// 7. Customer Profile & Saved Address Models
export interface CustomerProfile {
  id?: string;
  userId?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  avatarUrl?: string;
  hubPoints: number;
  membershipTier: 'Newborn' | 'Peace' | 'Priority' | 'Privé';
  totalSpent: number;
  isEmailVerified: boolean;
}

export interface SavedAddress {
  id: string;
  label?: string; // 'Nhà riêng' | 'Văn phòng' | 'Khác'
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface MembershipTierInfo {
  name: string;
  code: 'Newborn' | 'Peace' | 'Priority' | 'Privé';
  minPoints: number;
  maxPoints: number;
  description: string;
  badge?: string;
}

