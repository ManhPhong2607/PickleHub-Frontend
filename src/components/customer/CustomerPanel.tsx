'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User, Package, MapPin, Award, Star as StarIcon, LogOut, CheckCircle,
  Edit3, Plus, Search, ShieldCheck, Heart, Settings, ShoppingBag,
  Sparkles, Gift, ChevronRight, Home, Building2, Truck, RefreshCw, X,
  Lock, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { customerApi } from '@/lib/api/customerApi';
import { authApi } from '@/lib/api/authApi';
import { CustomerProfile, SavedAddress, Order } from '@/types';

interface CustomerPanelProps {
  initialTab?: 'profile' | 'orders' | 'addresses' | 'membership' | 'reviews';
}

export const CustomerPanel: React.FC<CustomerPanelProps> = ({ initialTab = 'profile' }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'membership' | 'reviews'>(initialTab);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } else if (user.role === 'Admin') {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/dashboard';
      } else {
        router.push('/admin/dashboard');
      }
    }
  }, [user, router]);

  // Customer Data States
  const [profile, setProfile] = useState<CustomerProfile>({
    fullName: user?.fullName || 'Nguyễn Đình Quang Dũng',
    email: user?.email || 'qd@email.com',
    phoneNumber: '090 123 4567',
    birthDate: '1998-06-15',
    gender: 'Nam',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    hubPoints: 450,
    membershipTier: 'Newborn',
    totalSpent: 450000,
    isEmailVerified: true,
  });

  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: 'addr_1',
      label: 'Nhà riêng',
      fullName: user?.fullName || 'Nguyễn Văn A',
      phoneNumber: '090 123 4567',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Thành',
      streetAddress: '123 Đường Lê Lợi',
      isDefault: true,
    },
    {
      id: 'addr_2',
      label: 'Văn phòng',
      fullName: user?.fullName || 'Nguyễn Văn A',
      phoneNumber: '090 123 4567',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      streetAddress: 'Tòa nhà Bitexco, số 2 Hải Triều',
      isDefault: false,
    },
  ]);

  // Order Filters & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  // Review Tabs
  const [reviewTab, setReviewTab] = useState<'unreviewed' | 'reviewed'>('unreviewed');
  const [selectedReviewItem, setSelectedReviewItem] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Change Password Modal States & Handlers
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isPassSubmitting, setIsPassSubmitting] = useState<boolean>(false);
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!passForm.oldPassword) {
      setPassError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!passForm.newPassword || passForm.newPassword.length < 6) {
      setPassError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsPassSubmitting(true);
    try {
      await authApi.changePassword({
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      });
      setPassSuccess('Đổi mật khẩu thành công! Vui lòng nhớ mật khẩu mới cho lần đăng nhập sau.');
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPassSuccess(null);
      }, 2000);
    } catch (err: any) {
      let errMsg = 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!';
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (err.response.data.message) {
          errMsg = err.response.data.message;
        } else if (err.response.data.detail) {
          errMsg = err.response.data.detail;
        } else if (err.response.data.title) {
          errMsg = err.response.data.title;
        }
      }
      setPassError(errMsg);
    } finally {
      setIsPassSubmitting(false);
    }
  };

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Nhà riêng',
    fullName: user?.fullName || 'Nguyễn Văn A',
    phoneNumber: '090 123 4567',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    streetAddress: '',
    isDefault: false,
  });

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [editProfileData, setEditProfileData] = useState({
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber || '',
    birthDate: profile.birthDate || '',
    gender: profile.gender || 'Nam',
  });

  useEffect(() => {
    customerApi.getProfile().then((p) => {
      setProfile((prev) => ({ ...prev, ...p }));
      setEditProfileData({
        fullName: p.fullName || user?.fullName || 'Nguyễn Đình Quang Dũng',
        phoneNumber: p.phoneNumber || '090 123 4567',
        birthDate: p.birthDate || '1998-06-15',
        gender: p.gender || 'Nam',
      });
    });
    customerApi.getAddresses().then((addrs) => {
      if (addrs && addrs.length > 0) setAddresses(addrs);
    });
  }, [user]);

  // Handler: Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await customerApi.updateProfile(editProfileData);
    setProfile((prev) => ({ ...prev, ...editProfileData }));
    setIsProfileModalOpen(false);
  };

  // Handler: Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const added = await customerApi.addAddress(newAddr);
    setAddresses((prev) => [...prev, added]);
    setIsAddressModalOpen(false);
    setNewAddr({
      label: 'Nhà riêng',
      fullName: user?.fullName || 'Nguyễn Văn A',
      phoneNumber: '090 123 4567',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Thành',
      streetAddress: '',
      isDefault: false,
    });
  };

  // Handler: Set Default Address
  const handleSetDefaultAddress = async (id: string) => {
    await customerApi.setDefaultAddress(id);
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  // Reviewable products derived from completed orders (Empty by default for users with 0 orders)
  const [unreviewedProducts, setUnreviewedProducts] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      
      {/* Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 capitalize">
            {activeTab === 'profile' && 'Thông tin tài khoản'}
            {activeTab === 'orders' && 'Lịch sử đơn hàng'}
            {activeTab === 'addresses' && 'Địa chỉ đã lưu'}
            {activeTab === 'membership' && 'Khách hàng thân thiết'}
            {activeTab === 'reviews' && 'Đánh giá sản phẩm'}
          </span>
        </div>

        {/* Main Grid: Sidebar (Left) + Content Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR NAVIGATION (Matching Reference Images)                       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* User Profile Summary Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{profile.fullName}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
                </div>
              </div>

              {/* HubPoints Progress Bar */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {profile.membershipTier} Club
                  </span>
                  <span className="text-slate-600">{profile.hubPoints}/1000 HubPoints</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(profile.hubPoints / 1000) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">Thêm 550,000đ để lên hạng Peace Member</p>
              </div>
            </div>

            {/* Main Menu Links */}
            <div className="bg-white rounded-3xl p-2.5 border border-slate-200/80 shadow-sm space-y-1">
              {[
                { id: 'profile', label: 'Thông tin tài khoản', icon: User },
                { id: 'orders', label: 'Lịch sử đơn hàng', icon: Package },
                { id: 'addresses', label: 'Địa chỉ đã lưu', icon: MapPin },
                { id: 'membership', label: 'Khách hàng thân thiết', icon: Award },
                { id: 'reviews', label: 'Đánh giá đơn hàng', icon: StarIcon },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>

            {/* Left Promotion Banner Card */}
            <div className="relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white overflow-hidden shadow-lg border border-slate-800">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full inline-block mb-2">
                PROMOTION
              </span>
              <h4 className="font-extrabold text-sm leading-snug">
                Mua 2 tặng 1 bóng pickleball tiêu chuẩn
              </h4>
              <p className="text-[11px] text-slate-300 mt-1">Áp dụng cho mọi đơn hàng từ 1.500.000₫</p>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT CONTENT PANEL (Switches based on activeTab)                         */}
          {/* ========================================================================= */}
          <div className="lg:col-span-9 space-y-6">

            {/* ───────────────────────────────────────────────────────────────────── */}
            {/* TAB 1: PROFILE (Thông tin tài khoản - Image 3)                        */}
            {/* ───────────────────────────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-8 animate-in fade-in duration-200">
                
                {/* Profile Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Quản lý và cập nhật thông tin cá nhân của bạn</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-200"
                    >
                      <KeyRound className="w-4 h-4 text-slate-600" />
                      <span>Đổi mật khẩu</span>
                    </button>
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-emerald-200/60"
                    >
                      <Edit3 className="w-4 h-4 text-emerald-600" />
                      <span>Sửa thông tin</span>
                    </button>
                  </div>
                </div>

                {/* Profile Info Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-1 border-b border-slate-100 pb-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Họ và tên</label>
                    <p className="font-semibold text-sm text-slate-900">{profile.fullName}</p>
                  </div>

                  <div className="space-y-1 border-b border-slate-100 pb-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngày sinh</label>
                    <p className="font-semibold text-sm text-slate-900">{profile.birthDate || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="space-y-1 border-b border-slate-100 pb-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Giới tính</label>
                    <p className="font-semibold text-sm text-slate-900">{profile.gender || 'Nam'}</p>
                  </div>

                  <div className="space-y-1 border-b border-slate-100 pb-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</label>
                    <p className="font-semibold text-sm text-slate-900">{profile.phoneNumber || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="md:col-span-2 space-y-1 border-b border-slate-100 pb-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-sm text-slate-900">{profile.email}</p>
                      {profile.isEmailVerified && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> ĐÃ XÁC THỰC
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Hoạt động gần đây */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Đơn hàng mới nhất</span>
                        <Package className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500 font-mono">#PH99821</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block">Đã giao hàng</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Đánh giá mới nhất</span>
                        <StarIcon className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-xs text-slate-500">Vợt Elite Carbon Pro</p>
                      <div className="flex text-amber-400 text-xs">★★★★★</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Địa chỉ mặc định</span>
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-600 truncate">{addresses[0]?.streetAddress || '123 Đường Lê Lợi'}</p>
                      <span className="text-[10px] font-bold text-slate-500">{addresses[0]?.district || 'Quận 1, TP.HCM'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer security note & Red logout button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thông tin của bạn được bảo mật tuyệt đối tại PickleHub.</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>

              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────────── */}
            {/* TAB 2: ORDER HISTORY (Lịch sử đơn hàng - Image 2)                    */}
            {/* ───────────────────────────────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
                
                {/* Header & Status Tabs */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Lịch sử đơn hàng</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Theo dõi quá trình vận chuyển và trạng thái các đơn hàng của bạn</p>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-bold">
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'pending', label: 'Chờ xác nhận' },
                      { key: 'shipping', label: 'Đang giao hàng' },
                      { key: 'completed', label: 'Đã giao' },
                      { key: 'cancelled', label: 'Đã huỷ' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setOrderStatusFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                          orderStatusFilter === tab.key
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                {/* Empty State Vector Graphic (Matching Image 2) */}
                <div className="py-16 text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-emerald-50 rounded-full flex items-center justify-center border-2 border-dashed border-emerald-200">
                    <ShoppingBag className="w-10 h-10 text-emerald-600 stroke-[1.5]" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-sm text-slate-900">Bạn chưa có đơn hàng nào</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Bắt đầu mua sắm ngay để trải nghiệm những sản phẩm Pickleball cao cấp nhất cùng ưu đãi hấp dẫn từ PickleHub.
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
                  >
                    <span>Tiếp tục mua sắm</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────────── */}
            {/* TAB 3: MEMBERSHIP & LOYALTY (Khách hàng thân thiết - Image 1)       */}
            {/* ───────────────────────────────────────────────────────────────────── */}
            {activeTab === 'membership' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Dark Emerald Hero Banner */}
                <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white overflow-hidden shadow-xl border border-emerald-800/50">
                  <div className="grid md:grid-cols-12 gap-6 items-center relative z-10">
                    
                    <div className="md:col-span-7 space-y-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full inline-block">
                        Member Level
                      </span>
                      <h2 className="text-3xl font-extrabold tracking-tight">Newborn Club</h2>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Chào mừng bạn gia nhập cộng đồng PickleHub! Tích lũy điểm khi mua sắm để thăng hạng và mở khóa ưu đãi độc quyền.
                      </p>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-emerald-300">Tiến trình đến Peace Club</span>
                          <span>{profile.hubPoints} / 1,000 Points</span>
                        </div>
                        <div className="h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${(profile.hubPoints / 1000) * 100}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 italic">Chỉ tiêu thêm 550,000đ để thăng hạng.</p>
                      </div>
                    </div>

                    <div className="md:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center space-y-3">
                      <p className="text-xs font-semibold text-emerald-200">Điểm tích lũy hiện tại</p>
                      <div className="text-4xl font-extrabold text-white tracking-tight">{profile.hubPoints}</div>
                      <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 mx-auto">
                        <Gift className="w-4 h-4" />
                        <span>Đổi quà ngay</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Hạng thành viên Cards Grid */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Hạng thành viên</h3>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg">Danh sách</button>
                      <button className="px-3 py-1.5 bg-white text-slate-400 font-semibold text-xs rounded-lg hover:text-slate-700">So sánh quyền lợi</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Newborn', pts: '0 - 1,000 pts', desc: 'Gia nhập lần đầu', active: true },
                      { name: 'Peace', pts: '1,000 - 5,000 pts', desc: 'Thành viên thân thiết', active: false },
                      { name: 'Priority', pts: '5,000 - 15,000 pts', desc: 'Ưu tiên phục vụ', active: false },
                      { name: 'Privé', pts: '15,000+ pts', desc: 'Đặc quyền cao cấp', active: false },
                    ].map((tier) => (
                      <div
                        key={tier.name}
                        className={`p-5 rounded-2xl border transition-all relative ${
                          tier.active
                            ? 'bg-emerald-50/50 border-2 border-emerald-500 shadow-md'
                            : 'bg-white border-slate-200/80'
                        }`}
                      >
                        {tier.active && (
                          <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            HỆN TẠI
                          </span>
                        )}
                        <h4 className="font-bold text-base text-slate-900">{tier.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{tier.desc}</p>
                        <p className="text-xs font-bold text-emerald-700 mt-4">{tier.pts}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Đặc quyền của bạn Grid */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Đặc quyền của bạn</h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Hạng hiện tại</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: 'Tích lũy chi tiêu', desc: 'Tích lũy 1 điểm cho mỗi 1,000đ chi tiêu tại hệ thống PickleHub toàn quốc.', icon: ShoppingBag },
                      { title: 'Giảm 5% đơn hàng', desc: 'Ưu đãi giảm giá trực tiếp cho tất cả các sản phẩm bóng và phụ kiện.', icon: Gift },
                      { title: 'Ưu đãi sinh nhật', desc: 'Voucher quà tặng trị giá 100,000đ vào tháng sinh nhật của bạn.', icon: Sparkles },
                      { title: 'Miễn phí giao hàng', desc: 'Miễn phí giao hàng cho đơn hàng từ 1,000,000đ khu vực nội thành.', icon: Truck },
                    ].map((b, idx) => {
                      const Icon = b.icon;
                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-slate-900">{b.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 pt-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Đã kích hoạt
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────────── */}
            {/* TAB 4: SAVED ADDRESSES (Địa chỉ đã lưu - Image 5)                    */}
            {/* ───────────────────────────────────────────────────────────────────── */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header & Add Button */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Địa chỉ đã lưu</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Quản lý các địa chỉ nhận hàng để thanh toán nhanh chóng hơn.</p>
                    </div>
                    <button
                      onClick={() => setIsAddressModalOpen(true)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm địa chỉ mới</span>
                    </button>
                  </div>

                  {/* Address List */}
                  <div className="space-y-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-6 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                          addr.isDefault
                            ? 'bg-white border-2 border-emerald-500/80 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            {addr.label === 'Nhà riêng' ? <Home className="w-5 h-5 text-emerald-600" /> : <Building2 className="w-5 h-5 text-slate-600" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{addr.label || 'Địa chỉ'}</h4>
                              {addr.isDefault && (
                                <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                  MẶC ĐỊNH
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-700">
                              {addr.fullName} • <span className="text-slate-500 font-mono">{addr.phoneNumber}</span>
                            </p>
                            <p className="text-xs text-slate-600">
                              {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                            </p>
                          </div>
                        </div>

                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 transition-all shrink-0"
                          >
                            Thiết lập mặc định
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Map Preview & Delivery Banner (Image 5) */}
                  <div className="grid md:grid-cols-12 gap-6 pt-4">
                    <div className="md:col-span-7 bg-slate-100 rounded-2xl p-4 border border-slate-200/80 relative min-h-[160px] flex flex-col justify-between overflow-hidden">
                      <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-3 py-1 rounded-full self-start shadow-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" /> VỊ TRÍ HIỆN TẠI CỦA BẠN
                      </span>
                      <div className="text-xs text-slate-600 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-sm">
                        <p className="font-bold text-slate-900">Quận 1, TP. Hồ Chí Minh</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Sẵn sàng giao hàng siêu tốc trong 24h</p>
                      </div>
                    </div>

                    <div className="md:col-span-5 rounded-2xl p-6 bg-gradient-to-br from-emerald-950 to-slate-900 text-white space-y-3 flex flex-col justify-between border border-emerald-800">
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-400">Giao hàng nhanh</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          PickleHub cam kết giao hàng trong 24h đối với khu vực nội thành.
                        </p>
                      </div>
                      <button className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1">
                        <span>Tìm hiểu thêm</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────────── */}
            {/* TAB 5: ORDER REVIEWS (Đánh giá đơn hàng - Image 4)                   */}
            {/* ───────────────────────────────────────────────────────────────────── */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
                
                {/* Header */}
                <div className="space-y-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Đánh giá sản phẩm</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Quản lý các đánh giá sản phẩm bạn đã mua và nhận ưu đãi từ PickleHub.</p>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-6 border-b border-slate-100 text-xs font-bold">
                    <button
                      onClick={() => setReviewTab('unreviewed')}
                      className={`pb-3 transition-all relative ${
                        reviewTab === 'unreviewed'
                          ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Chưa đánh giá {unreviewedProducts.length > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] ml-1">
                          {unreviewedProducts.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setReviewTab('reviewed')}
                      className={`pb-3 transition-all relative ${
                        reviewTab === 'reviewed'
                          ? 'text-emerald-600 font-bold border-b-2 border-emerald-600'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Đã đánh giá
                    </button>
                  </div>
                </div>

                {/* Review Items List */}
                {reviewTab === 'unreviewed' ? (
                  unreviewedProducts.length > 0 ? (
                    <div className="space-y-4">
                      {unreviewedProducts.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-contain rounded-xl bg-slate-50 p-2 border border-slate-100 shrink-0"
                            />
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                              <p className="text-xs text-slate-500">{item.variant}</p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                <span>MÃ ĐƠN: <strong className="text-slate-700">{item.orderCode}</strong></span>
                                <span>•</span>
                                <span>Đã nhận {item.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                            <span className="font-extrabold text-sm text-emerald-700">
                              {item.price.toLocaleString('vi-VN')} ₫
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedReviewItem(item);
                                  setIsReviewModalOpen(true);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                              >
                                Viết đánh giá
                              </button>
                              <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all">
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                        <StarIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <h3 className="font-bold text-sm text-slate-900">Chưa có sản phẩm nào để đánh giá</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Bạn chưa mua sản phẩm nào hoặc chưa có đơn hàng nào hoàn thành. Chỉ các sản phẩm thuộc đơn hàng đã giao mới có thể viết đánh giá.
                        </p>
                      </div>
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        <span>Khám phá sản phẩm</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-900">Chưa có đánh giá nào đã hoàn thành</p>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PROFILE MODAL                                               */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative cursor-default"
          >
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Cập nhật thông tin cá nhân</h3>
              <p className="text-xs text-slate-500 mt-1">Chỉnh sửa thông tin hồ sơ của bạn</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editProfileData.fullName}
                  onChange={(e) => setEditProfileData({ ...editProfileData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                <input
                  type="text"
                  required
                  value={editProfileData.phoneNumber}
                  onChange={(e) => setEditProfileData({ ...editProfileData, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Ngày sinh</label>
                  <input
                    type="date"
                    value={editProfileData.birthDate}
                    onChange={(e) => setEditProfileData({ ...editProfileData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Giới tính</label>
                  <select
                    value={editProfileData.gender}
                    onChange={(e) => setEditProfileData({ ...editProfileData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
              >
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW ADDRESS MODAL                                            */}
      {/* ========================================================================= */}
      {isAddressModalOpen && (
        <div
          onClick={() => setIsAddressModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative cursor-default"
          >
            <button
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Thêm địa chỉ giao hàng mới</h3>
              <p className="text-xs text-slate-500 mt-1">Lưu địa chỉ để đặt hàng nhanh chóng hơn</p>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={newAddr.fullName}
                    onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={newAddr.phoneNumber}
                    onChange={(e) => setNewAddr({ ...newAddr, phoneNumber: e.target.value })}
                    placeholder="090 123 4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tỉnh / Thành</label>
                  <input
                    type="text"
                    required
                    value={newAddr.province}
                    onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Quận / Huyện</label>
                  <input
                    type="text"
                    required
                    value={newAddr.district}
                    onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Phường / Xã</label>
                  <input
                    type="text"
                    required
                    value={newAddr.ward}
                    onChange={(e) => setNewAddr({ ...newAddr, ward: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Địa chỉ cụ thể (Số nhà, tên đường)</label>
                <input
                  type="text"
                  required
                  value={newAddr.streetAddress}
                  onChange={(e) => setNewAddr({ ...newAddr, streetAddress: e.target.value })}
                  placeholder="Ví dụ: 123 Đường Lê Lợi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={newAddr.isDefault}
                  onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="chkDefault" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
              >
                Lưu địa chỉ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: WRITE REVIEW MODAL                                               */}
      {/* ========================================================================= */}
      {isReviewModalOpen && selectedReviewItem && (
        <div
          onClick={() => setIsReviewModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative cursor-default"
          >
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Viết đánh giá sản phẩm</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedReviewItem.name}</p>
            </div>

            <div className="space-y-4">
              {/* Star Rating Picker */}
              <div className="text-center space-y-2">
                <label className="text-xs font-bold text-slate-700">Đánh giá chất lượng sản phẩm</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <StarIcon
                        className={`w-8 h-8 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nội dung đánh giá</label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Hãy chia sẻ nhận xét của bạn về chất lượng sản phẩm, cảm giác cầm nắm, độ bền..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  alert('Cảm ơn bạn đã gửi đánh giá sản phẩm!');
                  setIsReviewModalOpen(false);
                  setReviewComment('');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CHANGE PASSWORD MODAL                                            */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div
          onClick={() => {
            setIsPasswordModalOpen(false);
            setPassError(null);
            setPassSuccess(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative cursor-default"
          >
            <button
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPassError(null);
                setPassSuccess(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h3>
                <p className="text-xs text-slate-500">Cập nhật mật khẩu mới cho tài khoản của bạn</p>
              </div>
            </div>

            {passError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={passForm.oldPassword}
                    onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                    placeholder="Nhập mật khẩu cũ của bạn"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={passForm.confirmPassword}
                    onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPassSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2 flex items-center justify-center gap-2"
              >
                {isPassSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Cập nhật mật khẩu</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
