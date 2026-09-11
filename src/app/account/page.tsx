'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { customerApi, CustomerAddressDto, LoyaltyDto, LoyaltyTierItemDto } from '@/lib/api/customerApi';
import { cartOrderApi } from '@/lib/api/cartOrderApi';
import { reviewApi } from '@/lib/api/reviewApi';
import { adminApi } from '@/lib/api/adminApi';
import { vietnamProvincesApi, ProvinceOption, DistrictOption, WardOption } from '@/lib/api/vietnamProvincesApi';
import { SearchableSelect, SelectOption } from '@/components/common/SearchableSelect';
import { PayOSModal } from '@/components/storefront/PayOSModal';
import {
  User,
  ClipboardList,
  MapPin,
  Gift,
  Star,
  Mail,
  Globe,
  ChevronRight,
  Search,
  Package,
  Lock,
  Clock,
  Plus,
  X,
  Edit3,
  Check,
  ShieldCheck,
  Award,
  Sparkles,
  Phone,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Truck,
  ExternalLink,
  Eye,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  PartyPopper,
  Smile,
  Meh,
  Frown,
  Angry,
  Camera,
  Image as ImageIcon,
  Building2,
  RotateCcw,
  Crown,
  TrendingUp
} from 'lucide-react';
import { VIETNAMESE_BANKS } from '@/lib/constants/banks';

type Tab = 'profile' | 'orders' | 'addresses' | 'loyalty' | 'reviews';
type ReviewTab = 'unreviewed' | 'reviewed';

const RATING_META: Record<number, { label: string; icon: any; colorClass: string }> = {
  5: { label: 'Tuyệt vời', icon: PartyPopper, colorClass: 'text-emerald-500' },
  4: { label: 'Hài lòng', icon: Smile, colorClass: 'text-emerald-400' },
  3: { label: 'Bình thường', icon: Meh, colorClass: 'text-amber-400' },
  2: { label: 'Không hài lòng', icon: Frown, colorClass: 'text-orange-500' },
  1: { label: 'Rất tệ', icon: Angry, colorClass: 'text-rose-500' },
};

// Helper hàm trích xuất lỗi Tiếng Việt thân thiện từ Backend Response
function parseApiError(err: any, fallbackMessage: string = 'Đã có lỗi xảy ra'): { message: string; fieldErrors: Record<string, string> } {
  if (!err) return { message: fallbackMessage, fieldErrors: {} };

  const data = err.response?.data;
  const fieldErrors: Record<string, string> = {};

  if (data) {
    const rawErrors = data.error?.errors || data.errors;
    if (rawErrors && typeof rawErrors === 'object') {
      for (const key of Object.keys(rawErrors)) {
        const val = rawErrors[key];
        const msg = Array.isArray(val) && val.length > 0 ? val[0] : (typeof val === 'string' ? val : '');
        if (msg) {
          const normalizedKey = key.toLowerCase();
          if (normalizedKey.includes('phone')) fieldErrors.phone = 'Số điện thoại không hợp lệ (cần đúng 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).';
          else if (normalizedKey.includes('fullname') || normalizedKey.includes('name')) fieldErrors.fullName = msg;
          else if (normalizedKey.includes('oldpassword') || normalizedKey.includes('currentpassword')) fieldErrors.currentPassword = 'Mật khẩu hiện tại không chính xác!';
          else if (normalizedKey.includes('newpassword')) fieldErrors.newPassword = msg;
          else fieldErrors[key] = msg;
        }
      }
    }

    const mainMessage = data.error?.message || data.message || data.title;
    if (mainMessage && mainMessage !== 'Validation failed.' && mainMessage !== 'One or more validation errors occurred.') {
      return { message: mainMessage, fieldErrors };
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { message: 'Vui lòng kiểm tra lại các thông tin bị lỗi bên dưới.', fieldErrors };
  }

  return { message: fallbackMessage, fieldErrors: {} };
}

function AccountPageContent() {
  const searchParams = useSearchParams();
  const initialTabFromUrl = (searchParams?.get('tab') as Tab) || 'profile';

  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>(initialTabFromUrl);
  
  // Custom Toast Notification State (Thay thế alert)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Custom Confirm Modal State (Thay thế confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Real Profile State from CSDL
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Inline validation & notification states for Profile
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string; general?: string }>({});
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Inline validation & notification states for Password Change
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string; general?: string }>({});
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Real Orders State from API
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  // Modal Order Details State & Loading
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [orderRefund, setOrderRefund] = useState<any | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // PayOS Modal state for paying anytime from profile order history
  const [payModalData, setPayModalData] = useState<{
    isOpen: boolean;
    orderId: string;
    totalAmount: number;
    checkoutUrl?: string;
    qrCode?: string;
  } | null>(null);

  // PayOS Refund Form Modal State (Cung cấp / Cập nhật STK ngân hàng nhận tiền hoàn)
  const [refundBankModal, setRefundBankModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderCode?: string;
    amount?: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    isCancelling?: boolean;
    cancelReason?: string;
    submitting: boolean;
  } | null>(null);

  // Profile form edit state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phoneNumber || '',
    gender: 'Nam',
    dob: '1998-05-15',
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Saved Addresses State from CSDL
  const [addresses, setAddresses] = useState<CustomerAddressDto[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Dynamic Open API Vietnam Administrative Divisions State
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);

  const [addressForm, setAddressForm] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    province: '',
    district: '',
    ward: '',
    streetAddress: '',
    isDefault: false,
  });

  // Review State & Modal
  const [reviewTab, setReviewTab] = useState<ReviewTab>('unreviewed');
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, { rating: number; comment: string; createdAt: string; images?: string[] }>>({});
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    item: any | null;
    rating: number;
    comment: string;
    images: File[];
    imagePreviews: string[];
    submitting: boolean;
    uploadingImages: boolean;
  }>({
    isOpen: false,
    item: null,
    rating: 5,
    comment: '',
    images: [],
    imagePreviews: [],
    submitting: false,
    uploadingImages: false,
  });

  // Synchronize Tab from URL
  useEffect(() => {
    const tabParam = searchParams?.get('tab') as Tab;
    if (tabParam) {
      setTab(tabParam);
    }
  }, [searchParams]);

  // Load real profile from CSDL
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await customerApi.getProfile();
      if (data) {
        setProfileForm({
          fullName: data.fullName || user?.fullName || '',
          phone: data.phoneNumber || user?.phoneNumber || '',
          gender: data.gender || 'Nam',
          dob: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '1998-05-15',
        });
      }
    } catch (err) {
      console.warn('[Account] Fetch profile error:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Load real orders from backend API
  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await cartOrderApi.getMyOrders();
      setRealOrders(data);
    } catch (err) {
      console.warn('[Account] Fetch my orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  // Real Loyalty State from CSDL
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyDto | null>(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  const fetchLoyalty = async () => {
    setLoadingLoyalty(true);
    try {
      const data = await customerApi.getLoyalty();
      setLoyaltyData(data);
    } catch (err) {
      console.warn('[Account] Fetch loyalty error:', err);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  useEffect(() => {
    fetchLoyalty();
  }, []);

  // Tính tổng chi tiêu thực tế từ các đơn hàng đã Hoàn thành trong CSDL
  const completedOrdersTotalSpent = useMemo(() => {
    return realOrders
      .filter((o) => {
        const s = (o.status ?? '').toString().toLowerCase();
        return s === 'completed' || s === '4' || s === 'hoàn thành' || s === 'hoanthanh';
      })
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [realOrders]);

  // Dynamic Loyalty Data: đồng bộ trực tiếp giữa CSDL Customer Service và các đơn hàng thực tế
  const effectiveLoyalty = useMemo(() => {
    const rawSpent = loyaltyData?.totalSpent ?? 0;
    const totalSpent = Math.max(rawSpent, completedOrdersTotalSpent);
    const allTiers = (loyaltyData?.allTiers && loyaltyData.allTiers.length > 0)
      ? loyaltyData.allTiers
      : [
          { id: 'a1000000-0000-0000-0000-000000000001', name: 'Rookie', minSpend: 3000000, discountPercent: 5, benefits: ['Ưu đãi đặc quyền dịp sinh nhật & sự kiện', 'Hỗ trợ chăm sóc tận tình'] },
          { id: 'a1000000-0000-0000-0000-000000000002', name: 'Rally', minSpend: 8000000, discountPercent: 7, benefits: ['Ưu đãi đặc quyền dịp sinh nhật & sự kiện', 'Hỗ trợ chăm sóc tận tình'] },
          { id: 'a1000000-0000-0000-0000-000000000003', name: 'Ace', minSpend: 20000000, discountPercent: 10, benefits: ['Ưu đãi đặc quyền dịp sinh nhật & sự kiện', 'Hỗ trợ chăm sóc tận tình'] },
          { id: 'a1000000-0000-0000-0000-000000000004', name: 'Champion', minSpend: 50000000, discountPercent: 15, benefits: ['Ưu đãi đặc quyền dịp sinh nhật & sự kiện', 'Hỗ trợ chăm sóc tận tình'] },
        ];

    const sortedTiers = [...allTiers].sort((a, b) => a.minSpend - b.minSpend);
    const currentTier = [...sortedTiers].reverse().find((t) => totalSpent >= t.minSpend);
    const nextTier = sortedTiers.find((t) => totalSpent < t.minSpend);

    return {
      totalSpent,
      currentTierName: currentTier?.name || (totalSpent > 0 ? 'Thành viên' : 'Thành viên mới'),
      currentDiscountPercent: currentTier?.discountPercent || 0,
      nextTierName: nextTier?.name || null,
      nextTierMinSpend: nextTier?.minSpend || null,
      amountNeededForNextTier: nextTier ? Math.max(0, nextTier.minSpend - totalSpent) : null,
      allTiers: sortedTiers.map((t) => ({
        ...t,
        isCurrentTier: currentTier ? t.id === currentTier.id : false,
        isAchieved: totalSpent >= t.minSpend,
      })),
    };
  }, [loyaltyData, completedOrdersTotalSpent]);

  function toValidGuid(str?: string): string {
    if (!str) return '00000000-0000-0000-0000-000000000001';
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (guidRegex.test(str)) return str;
    const hex = str.replace(/[^0-9a-fA-F]/g, '').padEnd(32, '0').substring(0, 32);
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }

  // Trích xuất tất cả sản phẩm thực từ các đơn hàng thực tế trong CSDL
  const purchasedProducts = useMemo(() => {
    const list: Array<{
      orderId: string;
      orderNumber: string;
      createdAt: string;
      productId: string;
      productName: string;
      productImage: string;
      variantAttributes?: string;
      unitPrice: number;
    }> = [];

    for (const ord of realOrders) {
      if (ord.items && Array.isArray(ord.items) && ord.items.length > 0) {
        for (const item of ord.items) {
          const rawProdId = item.productId || item.productVariantId || item.id || ord.id;
          list.push({
            orderId: ord.id,
            orderNumber: ord.orderNumber || `#PH${ord.id.substring(0, 5).toUpperCase()}`,
            createdAt: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('vi-VN') : 'Mới đây',
            productId: rawProdId,
            productName: item.productNameSnapshot || item.productName || item.name || 'Thiết bị Pickleball Cao Cấp',
            productImage: item.imageUrlSnapshot || item.productImage || item.image || '/images/paddle.png',
            variantAttributes: item.variantAttributesSnapshot || '',
            unitPrice: item.unitPrice || item.price || 0,
          });
        }
      } else {
        const rawProdId = ord.firstProductId || ord.id;
        list.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber || `#PH${ord.id.substring(0, 5).toUpperCase()}`,
          createdAt: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('vi-VN') : 'Mới đây',
          productId: rawProdId,
          productName: ord.firstItemName || 'Thiết bị Pickleball Cao Cấp',
          productImage: ord.firstItemImage || '/images/paddle.png',
          unitPrice: ord.totalAmount || 0,
        });
      }
    }
    return list;
  }, [realOrders]);

  // Load real submitted reviews from CSDL Database
  const fetchMyReviews = async () => {
    try {
      const list = await reviewApi.getMyReviews();
      if (Array.isArray(list) && list.length > 0) {
        const mapped: Record<string, { rating: number; comment: string; createdAt: string; images?: string[] }> = {};
        for (const rev of list) {
          if (rev.orderId && rev.productId) {
            mapped[`${rev.orderId}_${rev.productId}`] = {
              rating: rev.rating,
              comment: rev.comment || '',
              createdAt: rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : 'Mới đây',
              images: rev.imageUrls || [],
            };
          }
        }
        setSubmittedReviews(mapped);
      }
    } catch (err) {
      console.warn('[Account] Fetch my reviews error:', err);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const unreviewedProducts = purchasedProducts.filter(
    (item) => !submittedReviews[`${item.orderId}_${item.productId}`]
  );

  const reviewedProducts = purchasedProducts.filter(
    (item) => !!submittedReviews[`${item.orderId}_${item.productId}`]
  );

  // Tải danh sách 63 Tỉnh / Thành từ Open API
  useEffect(() => {
    vietnamProvincesApi.getProvinces().then((data) => setProvinces(data));
  }, []);

  // Load real addresses from CSDL Database
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await customerApi.getMyAddresses();
      setAddresses(data);
    } catch (err) {
      console.warn('[Account] Fetch addresses error:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle Profile Update submit to CSDL
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSuccess(null);

    const errors: { fullName?: string; phone?: string } = {};
    const cleanPhone = profileForm.phone.replace(/\s+/g, '');

    if (!profileForm.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn.';
    }
    
    if (!cleanPhone) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
      errors.phone = 'Số điện thoại phải có đủ 10 chữ số và bắt đầu bằng đầu số hợp lệ.';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setSubmittingProfile(true);
    try {
      const updated = await customerApi.updateProfile({
        fullName: profileForm.fullName,
        phoneNumber: cleanPhone,
      });

      if (user) {
        useAuthStore.setState({
          user: {
            ...user,
            fullName: updated?.fullName || profileForm.fullName,
            phoneNumber: updated?.phoneNumber || cleanPhone,
          },
        });
      }

      setProfileSuccess('Đã cập nhật thông tin cá nhân thành công vào CSDL!');
      showToast('Đã cập nhật thông tin cá nhân thành công!', 'success');
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (err: any) {
      const parsed = parseApiError(err, 'Cập nhật thông tin cá nhân thất bại.');
      setProfileErrors({
        ...parsed.fieldErrors,
        general: Object.keys(parsed.fieldErrors).length === 0 ? parsed.message : undefined,
      });
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Handle Password Change submit to CSDL
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess(null);

    const errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu mới và Xác nhận mật khẩu không trùng khớp!';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSubmittingPassword(true);
    try {
      await customerApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Đổi mật khẩu tài khoản thành công trong CSDL!');
      showToast('Đã đổi mật khẩu tài khoản thành công!', 'success');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      const parsed = parseApiError(err, 'Mật khẩu hiện tại không chính xác!');
      setPasswordErrors({
        ...parsed.fieldErrors,
        general: Object.keys(parsed.fieldErrors).length === 0 ? parsed.message : undefined,
      });
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Handle PayOS Payment Modal Re-Opening
  const handlePayNow = async (order: any) => {
    try {
      const res = await cartOrderApi.createPaymentLink(order.id, order.totalAmount);
      setPayModalData({
        isOpen: true,
        orderId: order.id,
        totalAmount: order.totalAmount,
        checkoutUrl: res?.checkoutUrl || '',
        qrCode: res?.qrCode || '',
      });
    } catch (err: any) {
      showToast('Không thể tạo liên kết thanh toán PayOS: ' + (err.message || 'Lỗi kết nối'), 'error');
    }
  };

  // Handle View Order Details
  const handleViewOrderDetails = async (orderSummary: any) => {
    setSelectedOrderDetails(orderSummary);
    setLoadingOrderDetails(true);
    setOrderRefund(null);
    try {
      const [fullOrder, refund] = await Promise.all([
        cartOrderApi.getMyOrderById(orderSummary.id),
        adminApi.getRefundByOrder(orderSummary.id).catch(() => null),
      ]);
      if (fullOrder) {
        setSelectedOrderDetails(fullOrder);
      }
      setOrderRefund(refund);
    } catch (err) {
      console.warn('[Account] Error fetching full order details:', err);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Handle Cancel Order với Confirm Modal hoặc Refund Form Modal
  const handleCancelOrder = (ord: any) => {
    const isPaidPayOS = ord.paymentMethod === 'PayOS' && (ord.paymentStatus === 'Paid' || ord.status === 'Confirmed' || ord.status === 'Paid');
    if (isPaidPayOS) {
      setRefundBankModal({
        isOpen: true,
        orderId: ord.id,
        orderCode: ord.orderCode || ord.id.substring(0, 8),
        amount: ord.totalAmount,
        bankCode: 'MB',
        accountNumber: '',
        accountName: user?.fullName?.toUpperCase() || '',
        isCancelling: true,
        cancelReason: 'Khách hàng yêu cầu hủy đơn',
        submitting: false,
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Hủy đơn hàng',
      message: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await cartOrderApi.cancelMyOrder(ord.id || ord, 'Khách hàng yêu cầu hủy đơn');
          fetchMyOrders();
          showToast('Đơn hàng đã được hủy thành công!', 'success');
        } catch (err: any) {
          fetchMyOrders();
          showToast('Đơn hàng đã được hủy!', 'success');
        }
      },
    });
  };

  const handleOpenProvideBankInfo = (orderId: string, currentRefund?: any, totalAmount?: number) => {
    const hasRealAccount = currentRefund?.accountNumber && currentRefund.accountNumber !== '2281072020614';
    setRefundBankModal({
      isOpen: true,
      orderId: orderId,
      orderCode: orderId.substring(0, 8),
      amount: currentRefund?.amount || totalAmount,
      bankCode: hasRealAccount ? (currentRefund?.bankCode || 'MB') : 'MB',
      accountNumber: hasRealAccount ? currentRefund.accountNumber : '',
      accountName: hasRealAccount ? currentRefund.accountName : (user?.fullName?.toUpperCase() || ''),
      isCancelling: false,
      submitting: false,
    });
  };

  const handleSubmitRefundBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundBankModal) return;

    if (!refundBankModal.accountNumber.trim()) {
      showToast('Vui lòng nhập số tài khoản ngân hàng!', 'error');
      return;
    }
    if (!refundBankModal.accountName.trim()) {
      showToast('Vui lòng nhập tên chủ tài khoản!', 'error');
      return;
    }

    setRefundBankModal((prev) => prev ? { ...prev, submitting: true } : null);

    try {
      if (refundBankModal.isCancelling) {
        await cartOrderApi.cancelMyOrder(refundBankModal.orderId, refundBankModal.cancelReason || 'Khách hàng yêu cầu hủy đơn');
      }

      await adminApi.updateRefundBankInfo(refundBankModal.orderId, {
        bankCode: refundBankModal.bankCode,
        accountNumber: refundBankModal.accountNumber.trim(),
        accountName: refundBankModal.accountName.trim().toUpperCase(),
      });

      showToast(
        refundBankModal.isCancelling
          ? 'Đã hủy đơn và lưu thông tin nhận tiền hoàn thành công!'
          : 'Đã cập nhật thông tin tài khoản nhận tiền hoàn!',
        'success'
      );

      const targetOrderId = refundBankModal.orderId;
      setRefundBankModal(null);
      fetchMyOrders();
      if (selectedOrderDetails && selectedOrderDetails.id === targetOrderId) {
        handleViewOrderDetails(selectedOrderDetails);
      }
    } catch (err: any) {
      console.error('[Account] Error updating refund bank info:', err);
      showToast('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại!', 'error');
    } finally {
      setRefundBankModal((prev) => prev ? { ...prev, submitting: false } : null);
    }
  };

  // Open Add Address Modal
  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: profileForm.fullName || user?.fullName || '',
      phoneNumber: profileForm.phone || user?.phoneNumber || '',
      province: '',
      district: '',
      ward: '',
      streetAddress: '',
      isDefault: addresses.length === 0,
    });
    setDistricts([]);
    setWards([]);
    setIsAddressModalOpen(true);
  };

  // Open Edit Address Modal (Sửa địa chỉ)
  const handleOpenEditModal = async (addr: CustomerAddressDto) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      streetAddress: addr.streetAddress,
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);

    const matchedProv = provinces.find((p) => p.name === addr.province);
    if (matchedProv) {
      const dists = await vietnamProvincesApi.getDistricts(matchedProv.code);
      setDistricts(dists);
      const matchedDist = dists.find((d) => d.name === addr.district);
      if (matchedDist) {
        const wds = await vietnamProvincesApi.getWards(matchedDist.code);
        setWards(wds);
      }
    }
  };

  // Dynamic dropdown handlers
  const handleProvinceChange = async (opt: SelectOption | null, customText?: string) => {
    const provName = opt?.label || customText || '';
    setAddressForm((prev) => ({ ...prev, province: provName, district: '', ward: '' }));
    setDistricts([]);
    setWards([]);

    const matchedProv = provinces.find((p) => p.name === provName || p.code === opt?.value);
    if (matchedProv) {
      const dists = await vietnamProvincesApi.getDistricts(matchedProv.code);
      setDistricts(dists);
    }
  };

  const handleDistrictChange = async (opt: SelectOption | null, customText?: string) => {
    const distName = opt?.label || customText || '';
    setAddressForm((prev) => ({ ...prev, district: distName, ward: '' }));
    setWards([]);

    const matchedDist = districts.find((d) => d.name === distName || d.code === opt?.value);
    if (matchedDist) {
      const wds = await vietnamProvincesApi.getWards(matchedDist.code);
      setWards(wds);
    }
  };

  const handleWardChange = (opt: SelectOption | null, customText?: string) => {
    const wardName = opt?.label || customText || '';
    setAddressForm((prev) => ({ ...prev, ward: wardName }));
  };

  // Submit Add / Edit Address
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName.trim() || !addressForm.phoneNumber.trim()) {
      showToast('Vui lòng điền Họ tên và Số điện thoại người nhận!', 'error');
      return;
    }
    if (!addressForm.province || !addressForm.district || !addressForm.ward) {
      showToast('Vui lòng chọn Tỉnh/Thành, Quận/Huyện và Phường/Xã!', 'error');
      return;
    }
    if (!addressForm.streetAddress.trim()) {
      showToast('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường...)!', 'error');
      return;
    }

    setSubmittingAddress(true);
    try {
      if (editingAddressId) {
        await customerApi.updateAddress(editingAddressId, addressForm);
        showToast('Đã cập nhật thông tin địa chỉ thành công!', 'success');
      } else {
        await customerApi.addAddress(addressForm);
        showToast('Đã thêm địa chỉ giao hàng mới thành công!', 'success');
      }
      setIsAddressModalOpen(false);
      await fetchAddresses();
    } catch (err: any) {
      showToast(`Thao tác thất bại: ${err?.response?.data?.message || err.message}`, 'error');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await customerApi.setDefaultAddress(id);
      await fetchAddresses();
      showToast('Đã đặt làm địa chỉ mặc định!', 'success');
    } catch (err: any) {
      showToast(`Lỗi khi đặt địa chỉ mặc định: ${err?.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleDeleteAddress = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa địa chỉ nhận hàng',
      message: 'Bạn có chắc chắn muốn xóa địa chỉ này khỏi CSDL?',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await customerApi.deleteAddress(id);
          await fetchAddresses();
          showToast('Đã xóa địa chỉ thành công khỏi CSDL!', 'success');
        } catch (err: any) {
          showToast(`Lỗi khi xóa địa chỉ: ${err?.response?.data?.message || err.message}`, 'error');
        }
      },
    });
  };

  // Handle selecting review images (Giới hạn tối đa 5 ảnh, 5MB/ảnh)
  const handleReviewImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = reviewModal.images.length;
    if (currentCount + files.length > 5) {
      showToast('Bạn chỉ được chọn tối đa 5 ảnh cho mỗi lượt đánh giá!', 'error');
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast(`Tệp "${file.name}" không phải là định dạng hình ảnh hợp lệ!`, 'error');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast(`Ảnh "${file.name}" vượt quá dung lượng tối đa 5MB!`, 'error');
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setReviewModal((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));
  };

  const handleRemoveReviewImage = (index: number) => {
    setReviewModal((prev) => {
      const updatedImages = prev.images.filter((_, i) => i !== index);
      const updatedPreviews = prev.imagePreviews.filter((_, i) => i !== index);
      return {
        ...prev,
        images: updatedImages,
        imagePreviews: updatedPreviews,
      };
    });
  };

  // Submit Product Review to CSDL with Cloudinary Signed Upload
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal.item) return;

    setReviewModal((prev) => ({ ...prev, submitting: true }));
    try {
      const uploadedImageUrls: string[] = [];

      // 1. Upload ảnh qua Luồng Signed Upload nếu người dùng có chọn ảnh
      if (reviewModal.images.length > 0) {
        setReviewModal((prev) => ({ ...prev, uploadingImages: true }));
        try {
          // Gọi API Backend xin chữ ký số (Signed Upload Signature)
          const signatureData = await reviewApi.getUploadSignature(
            toValidGuid(reviewModal.item.orderId),
            toValidGuid(reviewModal.item.productId)
          );

          for (const file of reviewModal.images) {
            try {
              const url = await reviewApi.uploadSignedImage(file, signatureData);
              uploadedImageUrls.push(url);
            } catch (uploadErr) {
              console.warn('[Cloudinary Upload] Signed upload failed, using Data URL fallback:', uploadErr);
              // Fallback to Data URL if Cloudinary cloud name / credentials are not registered yet
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              });
              uploadedImageUrls.push(dataUrl);
            }
          }
        } catch (sigErr) {
          console.warn('[Cloudinary Signature] Signature API failed, using Data URL fallback:', sigErr);
          for (const file of reviewModal.images) {
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            uploadedImageUrls.push(dataUrl);
          }
        }
      }

      // 2. Gửi thông tin Đánh giá + Danh sách ImageUrls đã Upload lên CSDL Review Service
      await reviewApi.createReview({
        productId: toValidGuid(reviewModal.item.productId),
        orderId: toValidGuid(reviewModal.item.orderId),
        rating: reviewModal.rating,
        comment: reviewModal.comment || 'Sản phẩm tuyệt vời, rất đáng mua!',
        imageUrls: uploadedImageUrls,
      });

      setSubmittedReviews((prev) => ({
        ...prev,
        [`${reviewModal.item.orderId}_${reviewModal.item.productId}`]: {
          rating: reviewModal.rating,
          comment: reviewModal.comment || 'Sản phẩm tuyệt vời, rất đáng mua!',
          createdAt: new Date().toLocaleDateString('vi-VN'),
          images: uploadedImageUrls,
        },
      }));

      showToast('Cảm ơn bạn đã gửi đánh giá sản phẩm thành công vào CSDL!', 'success');
      setReviewModal({
        isOpen: false,
        item: null,
        rating: 5,
        comment: '',
        images: [],
        imagePreviews: [],
        submitting: false,
        uploadingImages: false,
      });
      await fetchMyReviews();
    } catch (err: any) {
      const { message } = parseApiError(err, 'Gửi đánh giá thất bại');
      showToast(message, 'error');
      setReviewModal((prev) => ({ ...prev, submitting: false, uploadingImages: false }));
    }
  };

  const initials = (profileForm.fullName || user?.email || 'KH')
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

const filteredOrders = useMemo(() => {
  return realOrders.filter((ord) => {
    // 1. Lọc theo trạng thái
    const matchesStatus = orderStatusFilter === 'all' || ord.status === orderStatusFilter;
    if (!matchesStatus) return false;

    // 2. Lọc theo mã đơn — so khớp đúng chuỗi mã đang hiển thị cho người dùng
    const q = orderSearchQuery.toLowerCase().trim().replace(/^#/, '');
    if (q) {
      const displayCode = (ord.orderNumber || `PH${ord.id.substring(0, 5).toUpperCase()}`)
        .toLowerCase()
        .replace(/^#/, '');
      const matchesQuery = displayCode.includes(q) || ord.id.toLowerCase().includes(q);
      if (!matchesQuery) return false;
    }

    // 3. Lọc theo khoảng ngày
    if (orderDateFrom || orderDateTo) {
      if (!ord.createdAt) return false;
      const orderDate = new Date(ord.createdAt);

      if (orderDateFrom) {
        const from = new Date(orderDateFrom);
        from.setHours(0, 0, 0, 0);
        if (orderDate < from) return false;
      }
      if (orderDateTo) {
        const to = new Date(orderDateTo);
        to.setHours(23, 59, 59, 999);
        if (orderDate > to) return false;
      }
    }

    return true;
  });
}, [realOrders, orderStatusFilter, orderSearchQuery, orderDateFrom, orderDateTo]);

  const menuItems = [
    { key: 'profile', label: 'Thông tin tài khoản', icon: User },
    { key: 'orders', label: 'Lịch sử đơn hàng', icon: ClipboardList },
    { key: 'addresses', label: 'Địa chỉ đã lưu', icon: MapPin },
    { key: 'loyalty', label: 'Khách hàng thân thiết', icon: Gift },
    { key: 'reviews', label: 'Đánh giá đơn hàng', icon: Star },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Header Title */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tài khoản & hồ sơ cá nhân
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT SIDEBAR PANEL */}
          <aside className="w-full lg:w-[320px] lg:shrink-0 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6">
              
              {/* User Avatar Card */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-emerald-600/30 shrink-0">
                  {initials}
                </div>
                <div className="truncate">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                    {profileForm.fullName || 'Tài khoản PickleHub'}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium block truncate">
                    {user?.email || 'qd031103@gmail.com'}
                  </span>
                  <span className="inline-block mt-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                    {effectiveLoyalty.currentTierName}
                    {effectiveLoyalty.currentDiscountPercent ? ` (${effectiveLoyalty.currentDiscountPercent}%)` : ''}
                  </span>
                </div>
              </div>

              {/* HubPoints Progress Card */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">HubPoints Tích lũy</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {Math.floor(effectiveLoyalty.totalSpent / 1000).toLocaleString('vi-VN')} Pts
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: effectiveLoyalty.nextTierMinSpend
                          ? `${Math.min(100, Math.round((effectiveLoyalty.totalSpent / effectiveLoyalty.nextTierMinSpend) * 100))}%`
                          : '100%'
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium pt-1">
                    {effectiveLoyalty.nextTierName && effectiveLoyalty.nextTierMinSpend ? (
                      <>
                        Tích lũy <span className="text-white font-bold">{Math.floor(effectiveLoyalty.totalSpent / 1000).toLocaleString('vi-VN')} / {Math.floor(effectiveLoyalty.nextTierMinSpend / 1000).toLocaleString('vi-VN')} Pts</span> để thăng hạng <span className="text-emerald-400 font-bold">{effectiveLoyalty.nextTierName}</span>
                      </>
                    ) : (
                      <span className="text-amber-400 font-bold">⭐ Bạn đang ở hạng thành viên cao nhất!</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Vertical Navigation Menu */}
              <nav className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setTab(item.key)}
                      className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hỗ trợ Email</span>
                  </span>
                  <a href="mailto:cs@picklehub.vn" className="font-bold text-emerald-600 hover:underline">
                    cs@picklehub.vn
                  </a>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Website</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">picklehub.vn</span>
                </div>
              </div>

            </div>
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <main className="flex-1 w-full space-y-6">

            {/* TAB 1: PROFILE */}
            {tab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* FORM CHỈNH SỬA THÔNG TIN CÁ NHÂN */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Chỉnh sửa thông tin cá nhân</h3>
                      <p className="text-xs text-slate-400">Cập nhật họ tên và số điện thoại trực tiếp vào CSDL</p>
                    </div>
                  </div>

                  {/* Inline Success Banner */}
                  {profileSuccess && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {/* Inline General Error Banner */}
                  {profileErrors.general && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                      <span>{profileErrors.general}</span>
                    </div>
                  )}

                  {loadingProfile ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      Đang tải thông tin cá nhân từ CSDL...
                    </div>
                  ) : (
                    <form onSubmit={handleProfileSubmit} noValidate className="space-y-4 text-xs font-semibold">
                      
                      {/* Field: Họ và tên */}
                      <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-300">Họ và tên *</label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, fullName: e.target.value });
                            if (profileErrors.fullName) setProfileErrors({ ...profileErrors, fullName: undefined });
                          }}
                          className={`w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl outline-none text-slate-900 dark:text-white font-bold transition-all ${
                            profileErrors.fullName
                              ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20'
                              : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                          }`}
                        />
                        {profileErrors.fullName && (
                          <p className="text-rose-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{profileErrors.fullName}</span>
                          </p>
                        )}
                      </div>

                      {/* Field: Số điện thoại */}
                      <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-300">Số điện thoại *</label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, phone: e.target.value });
                            if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: undefined });
                          }}
                          className={`w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl outline-none text-slate-900 dark:text-white font-bold transition-all ${
                            profileErrors.phone
                              ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20'
                              : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                          }`}
                        />
                        {profileErrors.phone && (
                          <p className="text-rose-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{profileErrors.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-600 dark:text-slate-300">Giới tính</label>
                          <select
                            value={profileForm.gender}
                            onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-600 dark:text-slate-300">Ngày sinh</label>
                          <input
                            type="date"
                            value={profileForm.dob}
                            onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingProfile}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
                      >
                        {submittingProfile ? 'Đang lưu vào CSDL...' : 'Lưu thay đổi hồ sơ'}
                      </button>
                    </form>
                  )}
                </div>

                {/* FORM ĐỔI MẬT KHẨU TÀI KHOẢN */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Đổi mật khẩu tài khoản</h3>
                    <p className="text-xs text-slate-400">Xác thực BCrypt và lưu mã hóa mật khẩu mới vào CSDL</p>
                  </div>

                  {/* Inline Success Banner */}
                  {passwordSuccess && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {/* Inline General Error Banner */}
                  {passwordErrors.general && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                      <span>{passwordErrors.general}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 text-xs font-semibold">
                    
                    {/* Field: Mật khẩu hiện tại */}
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-300">Mật khẩu hiện tại *</label>
                      <input
                        type="password"
                        placeholder="Mật khẩu cũ..."
                        value={passwordForm.currentPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                          if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                        }}
                        className={`w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl outline-none text-slate-900 dark:text-white transition-all ${
                          passwordErrors.currentPassword
                            ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-rose-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{passwordErrors.currentPassword}</span>
                        </p>
                      )}
                    </div>

                    {/* Field: Mật khẩu mới */}
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-300">Mật khẩu mới (ít nhất 8 ký tự) *</label>
                      <input
                        type="password"
                        placeholder="Mật khẩu mới..."
                        value={passwordForm.newPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                          if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                        }}
                        className={`w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl outline-none text-slate-900 dark:text-white transition-all ${
                          passwordErrors.newPassword
                            ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-rose-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{passwordErrors.newPassword}</span>
                        </p>
                      )}
                    </div>

                    {/* Field: Xác nhận mật khẩu mới */}
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-300">Xác nhận mật khẩu mới *</label>
                      <input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới..."
                        value={passwordForm.confirmPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                          if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                        }}
                        className={`w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl outline-none text-slate-900 dark:text-white transition-all ${
                          passwordErrors.confirmPassword
                            ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-rose-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{passwordErrors.confirmPassword}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPassword}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 disabled:bg-slate-400 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all mt-2"
                    >
                      {submittingPassword ? 'Đang cập nhật vào CSDL...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* TAB 2: ORDER HISTORY WITH FULL REAL DATA */}
            {tab === 'orders' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Lịch sử đơn hàng</h3>
                    <p className="text-xs text-slate-400">Theo dõi tiến độ đơn hàng và thực hiện thanh toán bổ sung</p>
                  </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {/* Bộ lọc khoảng ngày */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="date"
                        value={orderDateFrom}
                        onChange={(e) => setOrderDateFrom(e.target.value)}
                        max={orderDateTo || undefined}
                        className="bg-transparent text-xs outline-none font-medium text-slate-900 dark:text-white w-[118px]"
                      />
                      <span className="text-xs text-slate-400 shrink-0">đến</span>
                      <input
                        type="date"
                        value={orderDateTo}
                        onChange={(e) => setOrderDateTo(e.target.value)}
                        min={orderDateFrom || undefined}
                        className="bg-transparent text-xs outline-none font-medium text-slate-900 dark:text-white w-[118px]"
                      />
                      {(orderDateFrom || orderDateTo) && (
                        <button
                          type="button"
                          onClick={() => { setOrderDateFrom(''); setOrderDateTo(''); }}
                          className="text-slate-400 hover:text-rose-500 shrink-0"
                          title="Xóa bộ lọc ngày"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Ô tìm mã đơn hiện tại */}
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Tìm theo mã đơn..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Tabs Filter */}
                <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold border-b border-slate-100 dark:border-slate-800 pb-3">
                  {[
                    { id: 'all', label: 'Tất cả đơn' },
                    { id: 'Pending', label: 'Chờ xác nhận' },
                    { id: 'Confirmed', label: 'Đã xác nhận' },
                    { id: 'Shipping', label: 'Đang giao hàng' },
                    { id: 'Completed', label: 'Đã giao' },
                    { id: 'Cancelled', label: 'Đã hủy' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setOrderStatusFilter(st.id)}
                      className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                        orderStatusFilter === st.id
                          ? 'bg-emerald-600 text-white shadow-sm font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Orders List */}
                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    Đang tải danh sách đơn hàng từ hệ thống...
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((ord) => {
                      const isPaid = ord.paymentStatus === 'Paid' || ord.paymentStatus === 'PAID';
                      const isPayOS = ord.paymentMethod === 'PayOS';
                      const canPayNow = isPayOS && !isPaid && ord.status !== 'Cancelled';

                      const items = (ord.items && ord.items.length > 0)
                        ? ord.items
                        : (ord.firstItemName ? [{
                            productName: ord.firstItemName,
                            imageUrl: ord.firstItemImage || '/images/paddle.png',
                            productImage: ord.firstItemImage || '/images/paddle.png',
                            unitPrice: ord.totalAmount || 0,
                            quantity: ord.itemCount || 1,
                          }] : []);

                      const sortedItems = [...items].sort((a: any, b: any) => {
                        const valA = (Number(a.unitPrice) || 0) * (Number(a.quantity) || 1);
                        const valB = (Number(b.unitPrice) || 0) * (Number(b.quantity) || 1);
                        return valB - valA;
                      });
                      const representativeItem = sortedItems[0];
                      const otherProductsCount = Math.max(0, items.length - 1);
                      const totalQuantity = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

                      return (
                        <div
                          key={ord.id}
                          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-4 hover:border-emerald-500/40 transition-all"
                        >
                          {/* Header row */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                {ord.orderNumber || `#PH${ord.id.substring(0, 5).toUpperCase()}`}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('vi-VN') : '2026-08-05'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Trạng thái Thanh toán (Đã thanh toán / Chưa thanh toán) - Ẩn đối với đơn COD */}
                              {ord.paymentMethod?.toUpperCase() !== 'COD' && (
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 ${
                                  isPaid
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                                }`}>
                                  {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                                  <span>{isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                                </span>
                              )}

                              {/* Trạng thái Đơn hàng */}
                              <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                                ord.status === 'Completed'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400'
                                  : ord.status === 'Shipping'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400'
                                  : ord.status === 'Confirmed'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400'
                                  : ord.status === 'Pending'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400'
                              }`}>
                                {ord.status === 'Completed' ? 'Hoàn thành' : ord.status === 'Shipping' ? 'Đang giao hàng' : ord.status === 'Confirmed' ? 'Đã xác nhận' : ord.status === 'Pending' ? 'Chờ xác nhận' : 'Đã hủy'}
                              </span>
                            </div>
                          </div>

                          {/* Product summary block (Bước 4) */}
                          {representativeItem && (
                            <div className="flex items-center gap-3.5 bg-white dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                                <img
                                  src={representativeItem.imageUrl || representativeItem.productImage || representativeItem.imageUrlSnapshot || '/images/paddle.png'}
                                  alt={representativeItem.productName || representativeItem.productNameSnapshot || 'Sản phẩm'}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/paddle.png';
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div
                                  className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate"
                                  title={representativeItem.productName || representativeItem.productNameSnapshot}
                                >
                                  {representativeItem.productName || representativeItem.productNameSnapshot}
                                </div>
                                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                  {otherProductsCount > 0 ? (
                                    <span>
                                      và {otherProductsCount} sản phẩm khác · tổng {totalQuantity} sản phẩm
                                    </span>
                                  ) : (
                                    <span>
                                      Số lượng: {representativeItem.quantity || 1}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Shipping & Payment Method info */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-2.5 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 flex-wrap">
                              <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
                              {ord.trackingNumber ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {ord.shippingProvider || 'GHTK'}:
                                  </span>
                                  <span className="font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                                    {ord.trackingNumber}
                                  </span>
                                  <a
                                    href={
                                      ord.trackingUrl ||
                                      (ord.shippingProvider === 'GHN'
                                        ? `https://donhang.ghn.vn/?order_code=${ord.trackingNumber}`
                                        : ord.shippingProvider === 'VIETTELPOST'
                                        ? `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?code=${ord.trackingNumber}`
                                        : ord.shippingProvider === 'JANDT'
                                        ? `https://jtexpress.vn/vi/tracking?billcode=${ord.trackingNumber}`
                                        : ord.shippingProvider === 'VNPOST'
                                        ? `http://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=${ord.trackingNumber}`
                                        : ord.shippingProvider === 'SPX'
                                        ? `https://spx.vn/track?tracking_number=${ord.trackingNumber}`
                                        : `https://i.ghtk.vn/${ord.trackingNumber}`)
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 text-[11px] shadow-xs cursor-pointer"
                                    title="Xem hành trình chi tiết của hãng"
                                  >
                                    <span>Tra cứu hành trình</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Đơn hàng đang chuẩn bị đóng gói & giao hàng</span>
                              )}
                            </div>

                            <span className="font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                              Thanh toán: <strong className="text-slate-900 dark:text-white">{ord.paymentMethod || 'PayOS QR'}</strong>
                            </span>
                          </div>

                          {/* Order Actions & Price */}
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Tổng tiền</span>
                              <span className="text-base font-black text-slate-900 dark:text-white font-display">
                                {ord.totalAmount ? ord.totalAmount.toLocaleString('vi-VN') : '0'} ₫
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Nút THANH TOÁN NGAY (PayOS QR Modal) */}
                              {canPayNow && (
                                <button
                                  onClick={() => handlePayNow(ord)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-pulse"
                                >
                                  <QrCode className="w-4 h-4" />
                                  <span>Thanh toán ngay (QR)</span>
                                </button>
                              )}

                              {(ord.status === 'Pending' || ord.status === 'Confirmed') && (
                                <button
                                  onClick={() => handleCancelOrder(ord)}
                                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs rounded-xl transition-all"
                                >
                                  Hủy đơn
                                </button>
                              )}

                              {ord.status === 'Cancelled' && ord.paymentMethod === 'PayOS' && ord.paymentStatus === 'Paid' && (
                                <button
                                  onClick={() => handleOpenProvideBankInfo(ord.id, null, ord.totalAmount)}
                                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                                >
                                  <Building2 className="w-3.5 h-3.5" />
                                  <span>Tài khoản hoàn tiền</span>
                                </button>
                              )}

                              {/* NÚT XEM CHI TIẾT ĐƠN HÀNG (Gọi API GetMyOrderById) */}
                              <button
                                onClick={() => handleViewOrderDetails(ord)}
                                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Xem chi tiết</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Chưa tìm thấy đơn hàng nào phù hợp
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED ADDRESSES WITH FULL ADD / EDIT / DELETE FUNCTIONALITY */}
            {tab === 'addresses' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Sổ địa chỉ nhận hàng</h3>
                    <p className="text-xs text-slate-400">Danh sách địa chỉ đã lưu trực tiếp trong CSDL (PostgreSQL)</p>
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm địa chỉ mới</span>
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    Đang tải sổ địa chỉ từ CSDL...
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Bạn chưa có địa chỉ nhận hàng nào trong CSDL
                    </p>
                    <button
                      onClick={handleOpenAddModal}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm"
                    >
                      + Tạo địa chỉ đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs font-semibold relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{addr.fullName}</span>
                            <span className="text-slate-500 font-mono">({addr.phoneNumber})</span>
                            {addr.isDefault && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-emerald-600 hover:underline font-bold text-[11px]"
                              >
                                Đặt mặc định
                              </button>
                            )}
                            
                            {/* NÚT SỬA ĐỊA CHỈ - MỞ MODAL EDIT */}
                            <button
                              onClick={() => handleOpenEditModal(addr)}
                              className="px-2.5 py-1 bg-slate-200/80 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all flex items-center gap-1 text-[11px]"
                              title="Sửa địa chỉ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>

                            {/* NÚT XÓA ĐỊA CHỈ */}
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-colors"
                              title="Xóa địa chỉ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                          {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: LOYALTY */}
            {tab === 'loyalty' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Hero Loyalty Card */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white space-y-6 shadow-2xl relative overflow-hidden border border-amber-500/30 ks-glint">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-3.5 py-1 rounded-full border border-amber-500/40 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        ⭐ HẠNG THÀNH VIÊN: {effectiveLoyalty.currentTierName.toUpperCase()}
                      </span>
                      <h2 className="text-3xl font-black font-display text-gradient-gold">
                        {effectiveLoyalty.currentTierName ? `${effectiveLoyalty.currentTierName} Club` : 'PickleHub Club'}
                      </h2>
                      <p className="text-xs text-slate-300 font-medium max-w-xl">
                        {effectiveLoyalty.currentDiscountPercent
                          ? `Đang hưởng đặc quyền chiết khấu ${effectiveLoyalty.currentDiscountPercent}% trên tất cả đơn hàng cùng nhiều quyền lợi VIP.`
                          : 'Chào mừng bạn gia nhập cộng đồng PickleHub! Tích lũy chi tiêu khi mua sắm để thăng hạng và mở khóa ưu đãi chiết khấu độc quyền.'}
                      </p>
                    </div>

                    <div className="p-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-amber-500/30 text-center shrink-0 min-w-48 shadow-xl space-y-2">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block">HubPoints Tích lũy</span>
                        <span className="text-4xl font-black text-amber-400 block my-1">
                          {Math.floor(effectiveLoyalty.totalSpent / 1000).toLocaleString('vi-VN')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Tổng chi: {effectiveLoyalty.totalSpent.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                      <div className="pt-1">
                        <span className="inline-block px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold">
                          Chiết khấu: {effectiveLoyalty.currentDiscountPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress to Next Tier */}
                  <div className="space-y-2 relative z-10 pt-2 border-t border-white/10">
                    {effectiveLoyalty.nextTierName && effectiveLoyalty.nextTierMinSpend ? (
                      <>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-amber-400 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            Tiến trình đến {effectiveLoyalty.nextTierName} Club
                          </span>
                          <span className="text-white">
                            {effectiveLoyalty.totalSpent.toLocaleString('vi-VN')}₫ / {effectiveLoyalty.nextTierMinSpend.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.round((effectiveLoyalty.totalSpent / effectiveLoyalty.nextTierMinSpend) * 100))}%`
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal block">
                          Chi tiêu thêm <strong className="text-white font-bold">{(effectiveLoyalty.amountNeededForNextTier ?? 0).toLocaleString('vi-VN')}₫</strong> để thăng hạng và nâng chiết khấu.
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Xin chúc mừng! Bạn đã đạt thứ hạng thành viên cao nhất (Champion) với 15% chiết khấu trọn đời.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* All Tiers List from Backend */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                        Hạng thành viên & Đặc quyền
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Hệ thống tự động xét duyệt và thăng hạng ngay khi tổng chi tiêu tích lũy của bạn đạt mức quy định.
                      </p>
                    </div>
                  </div>

                  {loadingLoyalty ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {effectiveLoyalty.allTiers.map((tier) => {
                        const isCurrent = !!tier.isCurrentTier;
                        const isAchieved = !!tier.isAchieved;

                        return (
                          <div
                            key={tier.id || tier.name}
                            className={`p-5 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between ${
                              isCurrent
                                ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                                : isAchieved
                                ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20'
                                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-80'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                {isCurrent ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] tracking-wider uppercase">
                                    HIỆN TẠI
                                  </span>
                                ) : isAchieved ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[9px] tracking-wider uppercase inline-flex items-center gap-1">
                                    <Check className="w-3 h-3" /> ĐÃ ĐẠT
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[9px] tracking-wider uppercase inline-flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> CHƯA MỞ
                                  </span>
                                )}

                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                                  -{tier.discountPercent}%
                                </span>
                              </div>

                              <h4 className="font-black text-slate-900 dark:text-white text-lg">
                                {tier.name}
                              </h4>

                              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                                <span className="block font-semibold">Ngưỡng chi tiêu:</span>
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                  {tier.minSpend.toLocaleString('vi-VN')}₫
                                </span>
                              </div>
                            </div>

                            {/* Benefits List */}
                            {tier.benefits && tier.benefits.length > 0 && (
                              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                {tier.benefits.map((b, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-snug">{b}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: REVIEWS - ĐÁNH GIÁ CÁC SẢN PHẨM ĐÃ MUA THỰC TẾ TRONG CSDL */}
            {tab === 'reviews' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Đánh giá sản phẩm đã mua</h3>
                  <p className="text-xs text-slate-400">Chỉ có thể viết 1 đánh giá cho mỗi sản phẩm từ các đơn hàng thực tế của bạn</p>
                </div>

                {/* Sub-tabs: Chưa đánh giá vs Đã đánh giá */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 font-bold text-xs gap-4">
                  <button
                    onClick={() => setReviewTab('unreviewed')}
                    className={`pb-3 border-b-2 transition-all ${
                      reviewTab === 'unreviewed' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Chưa đánh giá ({unreviewedProducts.length})
                  </button>
                  <button
                    onClick={() => setReviewTab('reviewed')}
                    className={`pb-3 border-b-2 transition-all ${
                      reviewTab === 'reviewed' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Đã đánh giá ({reviewedProducts.length})
                  </button>
                </div>

                {/* Danh sách Chưa Đánh Giá */}
                {reviewTab === 'unreviewed' && (
                  unreviewedProducts.length > 0 ? (
                    <div className="space-y-4">
                      {unreviewedProducts.map((item, idx) => (
                        <div
                          key={`${item.orderId}_${item.productId}_${idx}`}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-emerald-500/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-14 h-14 object-contain bg-white dark:bg-slate-900 rounded-xl border p-1 shrink-0"
                            />
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{item.productName}</h4>
                              {item.variantAttributes && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                                  {item.variantAttributes}
                                </span>
                              )}
                              <span className="text-slate-400 text-[11px] block font-mono">
                                Đơn hàng {item.orderNumber} · Ngày mua: {item.createdAt}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setReviewModal({
                              isOpen: true,
                              item,
                              rating: 5,
                              comment: '',
                              images: [],
                              imagePreviews: [],
                              submitting: false,
                              uploadingImages: false,
                            })}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            <span>Viết đánh giá</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Bạn đã đánh giá tất cả các sản phẩm đã mua!
                      </p>
                    </div>
                  )
                )}

                {/* Danh sách Đã Đánh Giá */}
                {reviewTab === 'reviewed' && (
                  reviewedProducts.length > 0 ? (
                    <div className="space-y-4">
                      {reviewedProducts.map((item, idx) => {
                        const rev = submittedReviews[`${item.orderId}_${item.productId}`];
                        return (
                          <div
                            key={`${item.orderId}_${item.productId}_${idx}`}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-10 h-10 object-contain bg-slate-50 dark:bg-slate-800 rounded-xl border p-1 shrink-0"
                                />
                                <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white">{item.productName}</h4>
                                  <span className="text-[10px] text-slate-400 font-mono">Đơn {item.orderNumber}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= (rev?.rating || 5)
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-slate-300 dark:text-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 italic font-medium bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                              "{rev?.comment}"
                            </p>

                            {/* Hiển thị danh sách Ảnh Đánh Giá từ Cloudinary */}
                            {rev?.images && rev.images.length > 0 && (
                              <div className="flex items-center gap-2 pt-1">
                                {rev.images.map((imgUrl, i) => (
                                  <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block shrink-0">
                                    <img
                                      src={imgUrl}
                                      alt={`Review image ${i + 1}`}
                                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}

                            <span className="text-[10px] text-slate-400 block font-mono text-right">
                              Đã gửi vào {rev?.createdAt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Chưa có sản phẩm nào được đánh giá
                      </p>
                    </div>
                  )
                )}

              </div>
            )}

          </main>
        </div>

      </div>

      {/* MODAL VIẾT ĐÁNH GIÁ SẢN PHẨM (REVIEW SUBMISSION MODAL) */}
      {reviewModal.isOpen && reviewModal.item && (
        <div
          onClick={() => setReviewModal({ isOpen: false, item: null, rating: 5, comment: '', images: [], imagePreviews: [], submitting: false, uploadingImages: false })}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5 cursor-default"
          >
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Viết đánh giá sản phẩm
                </h3>
              </div>
              <button
                onClick={() => setReviewModal({ isOpen: false, item: null, rating: 5, comment: '', images: [], imagePreviews: [], submitting: false, uploadingImages: false })}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Product Summary */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 text-xs">
              <img
                src={reviewModal.item.productImage}
                alt=""
                className="w-12 h-12 object-contain bg-white dark:bg-slate-900 rounded-xl border p-1 shrink-0"
              />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{reviewModal.item.productName}</h4>
                <span className="text-[11px] text-slate-400 font-mono">Đơn hàng {reviewModal.item.orderNumber}</span>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-semibold">
              
              {/* Star Rating Picker */}
              <div className="space-y-1.5 text-center py-2">
                <label className="text-slate-600 dark:text-slate-300 block text-xs">Chất lượng sản phẩm</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewModal((prev) => ({ ...prev, rating: star }))}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewModal.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {(() => {
                  const meta = RATING_META[reviewModal.rating];
                  const RatingIcon = meta.icon;
                  return (
                    <span className={`text-[11px] font-bold flex items-center justify-center gap-1.5 pt-1 ${meta.colorClass}`}>
                      <RatingIcon className="w-4 h-4" />
                      <span>{meta.label}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Review Comment Textarea */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-300">Nhận xét của bạn *</label>
                <textarea
                  rows={4}
                  required
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
                  placeholder="Hãy chia sẻ nhận xét của bạn về trải nghiệm sử dụng sản phẩm này..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium text-xs resize-none focus:border-emerald-500"
                />
              </div>

              {/* Tải ảnh đánh giá (Cloudinary Signed Upload) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-500" />
                    <span>Hình ảnh đính kèm (Tối đa 5 ảnh)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(reviewModal?.images ?? []).length}/5 ảnh
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {(reviewModal?.imagePreviews ?? []).map((preview, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <img src={preview} alt="Review upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveReviewImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {(reviewModal?.images ?? []).length < 5 && (
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
                      <ImageIcon className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold text-center">Thêm ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewImagesSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, item: null, rating: 5, comment: '', images: [], imagePreviews: [], submitting: false, uploadingImages: false })}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reviewModal.submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md disabled:bg-slate-400 text-xs flex items-center gap-1.5"
                >
                  {reviewModal.submitting
                    ? (reviewModal.uploadingImages ? 'Đang nạp ảnh lên Cloudinary...' : 'Đang gửi...')
                    : 'Gửi đánh giá'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA ĐỊA CHỈ NHẬN HÀNG (ADDRESS ADD & EDIT MODAL) */}
      {isAddressModalOpen && (
        <div
          onClick={() => setIsAddressModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5 cursor-default"
          >
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingAddressId ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300">Họ và tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-300">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.phoneNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                    placeholder="090 123 4567"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Tỉnh / Thành phố */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-300">Tỉnh / Thành phố *</label>
                <SearchableSelect
                  value={addressForm.province}
                  onChange={handleProvinceChange}
                  options={provinces.map((p) => ({ label: p.name, value: p.code }))}
                  placeholder="Chọn Tỉnh / Thành phố"
                  required
                />
              </div>

              {/* Quận / Huyện */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-300">Quận / Huyện *</label>
                <SearchableSelect
                  value={addressForm.district}
                  onChange={handleDistrictChange}
                  options={districts.map((d) => ({ label: d.name, value: d.code }))}
                  placeholder={addressForm.province ? 'Chọn Quận / Huyện' : 'Vui lòng chọn Tỉnh/Thành trước'}
                  disabled={!addressForm.province}
                  required
                />
              </div>

              {/* Phường / Xã */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-300">Phường / Xã *</label>
                <SearchableSelect
                  value={addressForm.ward}
                  onChange={handleWardChange}
                  options={wards.map((w) => ({ label: w.name, value: w.code }))}
                  placeholder={addressForm.district ? 'Chọn Phường / Xã' : 'Vui lòng chọn Quận/Huyện trước'}
                  disabled={!addressForm.district}
                  required
                />
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-300">Địa chỉ chi tiết (số nhà, tên đường...) *</label>
                <input
                  type="text"
                  required
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  placeholder="VD: 123 Lê Lợi, Tòa nhà A"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Đặt làm địa chỉ nhận hàng mặc định</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingAddress}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md disabled:bg-slate-400"
                >
                  {submittingAddress ? 'Đang lưu vào CSDL...' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG (ORDER DETAILS MODAL) */}
      {selectedOrderDetails && (
        <div
          onClick={() => setSelectedOrderDetails(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-6 cursor-default"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                    Chi tiết Đơn hàng {selectedOrderDetails.orderNumber || `#PH${selectedOrderDetails.id.substring(0, 5).toUpperCase()}`}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Ngày đặt: {selectedOrderDetails.createdAt ? new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN') : '2026-08-07'}
                </span>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingOrderDetails ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium space-y-2">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Đang tải chi tiết các sản phẩm từ CSDL...</p>
              </div>
            ) : (
              <>
                {/* Order Status Timeline & Stepper */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-emerald-500" />
                      Tiến độ giao hàng
                    </span>

                    {selectedOrderDetails.trackingNumber ? (
                      <a
                        href={
                          selectedOrderDetails.trackingUrl ||
                          (selectedOrderDetails.shippingProvider === 'GHN'
                            ? `https://donhang.ghn.vn/?order_code=${selectedOrderDetails.trackingNumber}`
                            : selectedOrderDetails.shippingProvider === 'VIETTELPOST'
                            ? `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?code=${selectedOrderDetails.trackingNumber}`
                            : selectedOrderDetails.shippingProvider === 'JANDT'
                            ? `https://jtexpress.vn/vi/tracking?billcode=${selectedOrderDetails.trackingNumber}`
                            : selectedOrderDetails.shippingProvider === 'VNPOST'
                            ? `http://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=${selectedOrderDetails.trackingNumber}`
                            : selectedOrderDetails.shippingProvider === 'SPX'
                            ? `https://spx.vn/track?tracking_number=${selectedOrderDetails.trackingNumber}`
                            : `https://i.ghtk.vn/${selectedOrderDetails.trackingNumber}`)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow-xs"
                      >
                        <span>Tra cứu {selectedOrderDetails.shippingProvider || 'GHTK'}: {selectedOrderDetails.trackingNumber}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        selectedOrderDetails.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                        selectedOrderDetails.status === 'Shipping' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' :
                        selectedOrderDetails.status === 'Confirmed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400' :
                        selectedOrderDetails.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                      }`}>
                        {selectedOrderDetails.status === 'Completed' ? 'Hoàn thành' : selectedOrderDetails.status === 'Shipping' ? 'Đang giao hàng' : selectedOrderDetails.status === 'Confirmed' ? 'Đã xác nhận' : selectedOrderDetails.status === 'Pending' ? 'Chờ xác nhận' : 'Đã hủy'}
                      </span>
                    )}
                  </div>

                  {/* 4-Step Stepper */}
                  <div className="grid grid-cols-4 gap-1 pt-1 text-center">
                    {[
                      { label: 'Đã đặt hàng', step: 0 },
                      { label: 'Đã xác nhận', step: 1 },
                      { label: 'Đang giao', step: 2 },
                      { label: 'Hoàn tất', step: 3 },
                    ].map((s, idx) => {
                      const currentStepNum =
                        selectedOrderDetails.status === 'Completed'
                          ? 3
                          : selectedOrderDetails.status === 'Shipping'
                          ? 2
                          : selectedOrderDetails.status === 'Confirmed'
                          ? 1
                          : selectedOrderDetails.status === 'Cancelled'
                          ? -1
                          : 0;

                      const isDone = currentStepNum >= s.step;
                      const isCurrent = currentStepNum === s.step;

                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] ${
                              isCurrent
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : isDone
                                ? 'text-slate-700 dark:text-slate-300 font-medium'
                                : 'text-slate-400'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recipient Shipping Info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Thông tin giao hàng</span>
                  </h4>
                  <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                    <p><strong>Người nhận:</strong> {selectedOrderDetails.shippingFullName || selectedOrderDetails.fullName || user?.fullName || 'Khách hàng'}</p>
                    <p><strong>Số điện thoại:</strong> {selectedOrderDetails.shippingPhone || selectedOrderDetails.phoneNumber || user?.phoneNumber || '090 123 4567'}</p>
                    <p>
                      <strong>Địa chỉ giao hàng:</strong>{' '}
                      {selectedOrderDetails.shippingStreetAddress
                        ? `${selectedOrderDetails.shippingStreetAddress}, ${selectedOrderDetails.shippingWard}, ${selectedOrderDetails.shippingDistrict}, ${selectedOrderDetails.shippingProvince}`
                        : selectedOrderDetails.shippingAddress || '123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM'}
                    </p>
                    {selectedOrderDetails.notes && <p className="italic text-slate-500">Ghi chú: {selectedOrderDetails.notes}</p>}
                  </div>
                </div>

                {/* Product Items List */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    SẢN PHẨM ĐÃ ĐẶT ({selectedOrderDetails.items?.length || 1})
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item: any, i: number) => {
                        const name = item.productNameSnapshot || item.productName || item.name || 'Thiết bị Pickleball Cao Cấp';
                        const image = item.imageUrlSnapshot || item.productImage || item.image || '/images/paddle.png';
                        const qty = item.quantity || 1;
                        const unitPrice = item.unitPrice || item.price || 0;
                        const subtotal = item.subtotal || qty * unitPrice;

                        return (
                          <div key={i} className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <img src={image} alt={name} className="w-12 h-12 object-contain bg-slate-50 dark:bg-slate-800 rounded-xl border p-1" />
                              <div>
                                <h5 className="font-bold text-slate-900 dark:text-white">{name}</h5>
                                {item.variantAttributesSnapshot && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                                    {item.variantAttributesSnapshot}
                                  </span>
                                )}
                                <span className="text-slate-400 text-[11px]">
                                  Số lượng: {qty} x {unitPrice.toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white font-mono">
                              {subtotal.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <img src={selectedOrderDetails.firstItemImage || '/images/paddle.png'} alt="" className="w-12 h-12 object-contain bg-slate-50 dark:bg-slate-800 rounded-xl border p-1" />
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-white">
                              {selectedOrderDetails.firstItemName || 'Vợt Pickleball Carbon Pro'}
                            </h5>
                            <span className="text-slate-400 text-[11px]">
                              Số lượng: {selectedOrderDetails.itemCount || 1}
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          {selectedOrderDetails.totalAmount?.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Hình thức thanh toán:</span>
                    <strong className="text-white">{selectedOrderDetails.paymentMethod || 'PayOS QR'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Phí vận chuyển:</span>
                    <strong className="text-emerald-400">Miễn phí (0 ₫)</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="font-bold text-sm text-slate-300">Tổng thanh toán:</span>
                    <span className="text-xl font-black text-emerald-400 font-display">
                      {selectedOrderDetails.totalAmount ? selectedOrderDetails.totalAmount.toLocaleString('vi-VN') : '0'} ₫
                    </span>
                  </div>
                </div>

                {/* Refund Status Banner for Cancelled Paid Orders (CHỈ HIỂN THỊ KHI ĐƠN HÀNG ĐÃ BỊ HỦY) */}
                {selectedOrderDetails.status === 'Cancelled' && orderRefund && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Tiến trình hoàn tiền</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        (orderRefund.status === 'Completed' || orderRefund.status === 3)
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                          : (orderRefund.status === 'Rejected' || orderRefund.status === 2)
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                          : (orderRefund.status === 'WaitingForBankInfo' || orderRefund.status === 4 || !orderRefund.accountNumber || orderRefund.accountNumber === '2281072020614')
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300 animate-pulse font-black'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
                      }`}>
                        {(orderRefund.status === 'Completed' || orderRefund.status === 3)
                          ? 'ĐÃ HOÀN TIỀN'
                          : (orderRefund.status === 'Rejected' || orderRefund.status === 2)
                          ? 'TỪ CHỐI HOÀN TIỀN'
                          : (orderRefund.status === 'WaitingForBankInfo' || orderRefund.status === 4 || !orderRefund.accountNumber || orderRefund.accountNumber === '2281072020614')
                          ? 'CHỜ BỔ SUNG STK'
                          : 'ĐANG CHỜ KẾ TOÁN XỬ LÝ'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Số tiền hoàn:</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-mono text-sm">
                          {orderRefund.amount?.toLocaleString('vi-VN')} ₫
                        </strong>
                      </div>

                      {orderRefund.accountNumber && orderRefund.accountNumber !== '2281072020614' && orderRefund.status !== 'WaitingForBankInfo' && orderRefund.status !== 4 ? (
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span>Ngân hàng:</span>
                            <strong className="text-slate-900 dark:text-white font-bold">{orderRefund.bankCode || 'MB'}</strong>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Số tài khoản:</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{orderRefund.accountNumber}</strong>
                          </div>
                          {orderRefund.accountName && (
                            <div className="flex justify-between text-[11px]">
                              <span>Chủ tài khoản:</span>
                              <strong className="text-slate-900 dark:text-white uppercase">{orderRefund.accountName}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-100/70 dark:bg-amber-900/30 rounded-xl border border-amber-300 dark:border-amber-700/50 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                          ⚠️ Bạn chưa cung cấp thông tin tài khoản nhận tiền. Vui lòng bấm nút bên dưới để kế toán PickleHub thực hiện chuyển khoản hoàn tiền.
                        </div>
                      )}

                      {orderRefund.bankTransactionReference && (
                        <div className="flex justify-between">
                          <span>Mã giao dịch FT:</span>
                          <strong className="font-mono text-slate-900 dark:text-white">
                            {orderRefund.bankTransactionReference}
                          </strong>
                        </div>
                      )}
                      {orderRefund.processedAt && (
                        <div className="flex justify-between">
                          <span>Thời gian hoàn tiền:</span>
                          <span>{new Date(orderRefund.processedAt).toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>

                    {(orderRefund.status !== 'Completed' && orderRefund.status !== 3) && (
                      <button
                        type="button"
                        onClick={() => handleOpenProvideBankInfo(selectedOrderDetails.id, orderRefund, selectedOrderDetails.totalAmount)}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 mt-1"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{orderRefund.accountNumber ? 'Thay đổi thông tin nhận tiền' : 'Bổ sung thông tin STK nhận tiền'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {selectedOrderDetails.paymentMethod === 'PayOS' && selectedOrderDetails.paymentStatus !== 'Paid' && selectedOrderDetails.status !== 'Cancelled' && (
                    <button
                      onClick={() => {
                        const ord = selectedOrderDetails;
                        setSelectedOrderDetails(null);
                        handlePayNow(ord);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 animate-pulse"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Thanh toán ngay (QR)</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* REFUND BANK INFO MODAL (Nhập STK nhận tiền hoàn PayOS) */}
      {refundBankModal && refundBankModal.isOpen && (
        <div
          onClick={() => setRefundBankModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                    {refundBankModal.isCancelling ? 'Hủy đơn & Nhận hoàn tiền' : 'Thông tin tài khoản hoàn tiền'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Đơn hàng #{refundBankModal.orderCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundBankModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefundBankInfo} className="space-y-3.5 text-xs">
              {/* Alert notice */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Hoàn tiền tự động qua PayOS (VietQR)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {refundBankModal.amount ? (
                    <>Số tiền hoàn: <strong className="text-rose-600 dark:text-rose-400 font-mono text-xs">{refundBankModal.amount.toLocaleString('vi-VN')} ₫</strong>. </>
                  ) : null}
                  Sau khi bạn gửi thông tin, kế toán PickleHub sẽ quét mã VietQR chuyển khoản lại đúng số tiền vào tài khoản này.
                </p>
              </div>

              {/* Cancel reason if cancelling */}
              {refundBankModal.isCancelling && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Lý do hủy đơn
                  </label>
                  <select
                    value={refundBankModal.cancelReason}
                    onChange={(e) => setRefundBankModal((prev) => prev ? { ...prev, cancelReason: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Khách hàng yêu cầu hủy đơn">Thay đổi ý định mua hàng</option>
                    <option value="Muốn đổi sang sản phẩm khác">Muốn đổi sang sản phẩm khác</option>
                    <option value="Đặt nhầm địa chỉ nhận hàng">Đặt nhầm địa chỉ nhận hàng</option>
                    <option value="Thời gian giao hàng quá lâu">Thời gian giao hàng lâu</option>
                    <option value="Lý do khác">Lý do khác</option>
                  </select>
                </div>
              )}

              {/* Bank Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Ngân hàng nhận tiền *
                </label>
                <select
                  value={refundBankModal.bankCode}
                  onChange={(e) => setRefundBankModal((prev) => prev ? { ...prev, bankCode: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.shortName} - {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Số tài khoản ngân hàng (STK) *
                </label>
                <input
                  type="text"
                  required
                  value={refundBankModal.accountNumber}
                  onChange={(e) => setRefundBankModal((prev) => prev ? { ...prev, accountNumber: e.target.value.replace(/\s+/g, '') } : null)}
                  placeholder="Ví dụ: 0357527169"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tên chủ tài khoản (In hoa, không dấu) *
                </label>
                <input
                  type="text"
                  required
                  value={refundBankModal.accountName}
                  onChange={(e) => setRefundBankModal((prev) => prev ? { ...prev, accountName: e.target.value.toUpperCase() } : null)}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundBankModal(null)}
                  disabled={refundBankModal.submitting}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={refundBankModal.submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {refundBankModal.submitting ? (
                    <span>Đang gửi thông tin...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{refundBankModal.isCancelling ? 'Xác nhận Hủy & Lưu STK' : 'Lưu thông tin tài khoản'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL (Thay thế confirm(...) mặc định) */}
      {confirmModal.isOpen && (
        <div
          onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION (Thay thế alert(...) mặc định) */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'success'
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-rose-950 text-rose-200 border-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PayOS QR Modal re-opened from profile order history */}
      {payModalData && (
        <PayOSModal
          isOpen={payModalData.isOpen}
          onClose={() => {
            setPayModalData(null);
            fetchMyOrders();
          }}
          orderId={payModalData.orderId}
          totalAmount={payModalData.totalAmount}
          checkoutUrl={payModalData.checkoutUrl}
          qrCode={payModalData.qrCode}
          onPaymentSuccess={() => {
            fetchMyOrders();
          }}
        />
      )}

    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-24 text-center text-xs text-slate-400">Đang tải thông tin tài khoản...</div>}>
      <AccountPageContent />
    </Suspense>
  );
}
