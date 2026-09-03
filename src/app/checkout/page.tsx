'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Phone, User, CreditCard, QrCode, ShieldCheck, Truck, CheckCircle2, ArrowLeft, Plus, Check, X
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cartOrderApi } from '@/lib/api/cartOrderApi';
import { customerApi, CustomerAddressDto } from '@/lib/api/customerApi';
import { systemApi } from '@/lib/api/systemApi';
import { vietnamProvincesApi, ProvinceOption, DistrictOption, WardOption } from '@/lib/api/vietnamProvincesApi';
import { SearchableSelect, SelectOption } from '@/components/common/SearchableSelect';
import { PayOSModal } from '@/components/storefront/PayOSModal';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, clearSelected, restoreCart, getSubtotal, getSelectedSubtotal, getSelectedItems } = useCartStore();
  const { user, setAuthModalOpen } = useAuthStore();

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [pendingCartBackup, setPendingCartBackup] = useState<any[]>([]);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  
  // Dynamic Open API Vietnam Administrative Divisions State
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // 3 ô Tỉnh/Thành, Quận/Huyện, Phường/Xã tự động ĐỂ TRỐNG (empty string) ban đầu
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PayOS' | 'COD'>('PayOS');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [confirmedTotalAmount, setConfirmedTotalAmount] = useState<number>(0);
  const [isPayOSModalOpen, setIsPayOSModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentQrCode, setPaymentQrCode] = useState<string>('');

  // Toast & Modal Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const showToast = (title: string, message: string, type: 'success' | 'error' = 'error') => {
    setToast({ type, title, message });
  };

  const [shippingFee, setShippingFee] = useState<number>(0);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [realOrders, setRealOrders] = useState<any[]>([]);

  // Tải phí vận chuyển từ System Service (shipping_fee_default)
  useEffect(() => {
    systemApi.getShippingFee().then((fee) => setShippingFee(fee));
  }, []);

  // Tải thông tin Loyalty & Lịch sử đơn hàng để tính chiết khấu hạng thành viên
  useEffect(() => {
    if (user) {
      customerApi.getLoyalty().then((data) => setLoyaltyData(data)).catch(() => {});
      cartOrderApi.getMyOrders().then((orders) => setRealOrders(orders)).catch(() => {});
    }
  }, [user]);

  // Tính tổng chi tiêu thực tế từ các đơn hàng đã Hoàn thành trong CSDL
  const completedOrdersTotalSpent = React.useMemo(() => {
    return realOrders
      .filter((o) => {
        const s = (o.status ?? '').toString().toLowerCase();
        return s === 'completed' || s === '4' || s === 'hoàn thành' || s === 'hoanthanh';
      })
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [realOrders]);

  const effectiveLoyalty = React.useMemo(() => {
    const rawSpent = loyaltyData?.totalSpent ?? 0;
    const totalSpent = Math.max(rawSpent, completedOrdersTotalSpent);
    const allTiers = (loyaltyData?.allTiers && loyaltyData.allTiers.length > 0)
      ? loyaltyData.allTiers
      : [
          { id: 'a1000000-0000-0000-0000-000000000001', name: 'Rookie', minSpend: 3000000, discountPercent: 5 },
          { id: 'a1000000-0000-0000-0000-000000000002', name: 'Rally', minSpend: 8000000, discountPercent: 7 },
          { id: 'a1000000-0000-0000-0000-000000000003', name: 'Ace', minSpend: 20000000, discountPercent: 10 },
          { id: 'a1000000-0000-0000-0000-000000000004', name: 'Champion', minSpend: 50000000, discountPercent: 15 },
        ];

    const sortedTiers = [...allTiers].sort((a, b) => a.minSpend - b.minSpend);
    const currentTier = [...sortedTiers].reverse().find((t) => totalSpent >= t.minSpend);

    return {
      totalSpent,
      currentTierName: currentTier?.name || loyaltyData?.currentTierName || (totalSpent > 0 ? 'Thành viên' : null),
      currentDiscountPercent: currentTier?.discountPercent || loyaltyData?.currentDiscountPercent || 0,
    };
  }, [loyaltyData, completedOrdersTotalSpent]);

  const selectedItems = getSelectedItems();
  const subtotal = getSelectedSubtotal();
  const loyaltyDiscountPercent = effectiveLoyalty.currentDiscountPercent || 0;
  const loyaltyDiscountAmount = loyaltyDiscountPercent > 0 ? Math.round(subtotal * (loyaltyDiscountPercent / 100)) : 0;
  const grandTotal = Math.max(0, subtotal - loyaltyDiscountAmount) + shippingFee;

  // Tải danh sách 63 Tỉnh / Thành từ Open API (provinces.open-api.vn)
  useEffect(() => {
    setLoadingProvinces(true);
    vietnamProvincesApi
      .getProvinces()
      .then((data) => setProvinces(data))
      .finally(() => setLoadingProvinces(false));
  }, []);

  const handleProvinceChange = (opt: SelectOption | null, customText?: string) => {
    const provName = opt ? opt.label : customText || '';
    setProvince(provName);
    setDistrict('');
    setWard('');
    setDistricts([]);
    setWards([]);

    if (opt && typeof opt.value === 'number') {
      setLoadingDistricts(true);
      vietnamProvincesApi
        .getDistricts(opt.value)
        .then((data) => setDistricts(data))
        .finally(() => setLoadingDistricts(false));
    }
  };

  const handleDistrictChange = (opt: SelectOption | null, customText?: string) => {
    const distName = opt ? opt.label : customText || '';
    setDistrict(distName);
    setWard('');
    setWards([]);

    if (opt && typeof opt.value === 'number') {
      setLoadingWards(true);
      vietnamProvincesApi
        .getWards(opt.value)
        .then((data) => setWards(data))
        .finally(() => setLoadingWards(false));
    }
  };

  const handleWardChange = (opt: SelectOption | null, customText?: string) => {
    const wardName = opt ? opt.label : customText || '';
    setWard(wardName);
  };

  // Map sang định dạng SelectOption
  const provinceSelectOptions: SelectOption[] = provinces.map((p) => ({ label: p.name, value: p.code }));
  const districtSelectOptions: SelectOption[] = districts.map((d) => ({ label: d.name, value: d.code }));
  const wardSelectOptions: SelectOption[] = wards.map((w) => ({ label: w.name, value: w.code }));

  // Đồng bộ thông tin user & Tải danh sách địa chỉ đã lưu khi user thay đổi
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.fullName || '');
      if (!phone) setPhone(user.phoneNumber || '');

      customerApi
        .getMyAddresses()
        .then((list) => {
          setSavedAddresses(list);
          if (list.length > 0) {
            const def = list.find((a) => a.isDefault) || list[0];
            setSelectedAddressId(def.id);
            setFullName(def.fullName);
            setPhone(def.phoneNumber);
            setProvince(def.province);
            setDistrict(def.district);
            setWard(def.ward);
            setStreetAddress(def.streetAddress);
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
          }
        })
        .catch((err) => {
          console.warn('[Checkout] Fetch saved addresses warning:', err);
          setUseNewAddress(true);
        });
    }
  }, [user]);

  const handleSelectSavedAddress = (addr: CustomerAddressDto) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    setFullName(addr.fullName);
    setPhone(addr.phoneNumber);
    setProvince(addr.province);
    setDistrict(addr.district);
    setWard(addr.ward);
    setStreetAddress(addr.streetAddress);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Yêu cầu đăng nhập', 'Bạn phải đăng nhập để mua hàng!');
      setAuthModalOpen(true, 'login');
      return;
    }

    if (!fullName || !phone) {
      showToast('Thông tin chưa đầy đủ', 'Vui lòng nhập đầy đủ họ tên và số điện thoại người nhận!');
      return;
    }

    if (useNewAddress || savedAddresses.length === 0) {
      if (!province || !district || !ward || !streetAddress) {
        showToast('Địa chỉ chưa hoàn tất', 'Vui lòng chọn hoặc điền đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và Số nhà/Tên đường!');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let finalAddressId = selectedAddressId;

      // Nếu chưa chọn địa chỉ đã lưu hoặc chọn tạo địa chỉ mới → Tự động tạo địa chỉ mới trong CSDL Customer Service
      if (useNewAddress || !finalAddressId || finalAddressId === '00000000-0000-0000-0000-000000000000') {
        const newAddressObj = await customerApi.addAddress({
          fullName,
          phoneNumber: phone,
          province,
          district,
          ward,
          streetAddress,
          isDefault: savedAddresses.length === 0,
        });
        finalAddressId = newAddressObj.id;
        setSelectedAddressId(newAddressObj.id);
      }

      // Lưu lại giá trị giỏ hàng và tổng tiền trước khi gọi checkout
      const currentTotal = grandTotal;
      const currentSelected = [...getSelectedItems()];
      setPendingCartBackup(currentSelected);

      // Gọi API Checkout với AddressId chuẩn GUID từ CSDL
      const order = await cartOrderApi.checkout({
        addressId: finalAddressId,
        paymentMethod,
        note,
      });

      const newId = order.id || order.orderId || `PH-${Math.floor(10000 + Math.random() * 90000)}`;
      const realTotal = (order as any).totalAmount || (order as any).TotalAmount || currentTotal;
      
      setConfirmedTotalAmount(realTotal);
      setCreatedOrderId(newId);

      // Xoá các món đã chọn trong giỏ hàng vì đơn hàng đã tạo thành công
      clearSelected();

      if (paymentMethod === 'PayOS') {
        const realPaymentUrl = (order as any).paymentUrl || (order as any).PaymentUrl || '';
        const realQrCode = (order as any).qrCode || (order as any).QrCode || '';
        setPaymentUrl(realPaymentUrl);
        setPaymentQrCode(realQrCode);
        setIsPayOSModalOpen(true);
      } else {
        showToast('Đặt hàng thành công!', 'Đơn hàng COD của bạn đã được khởi tạo và đang được xử lý.', 'success');
        setTimeout(() => {
          router.push('/orders');
        }, 1800);
      }
    } catch (err: any) {
      console.warn('[Checkout] Checkout error:', err);
      if (err.response?.status === 401) {
        showToast('Chưa đăng nhập', 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập để hoàn tất thanh toán!');
        setAuthModalOpen(true, 'login');
      } else {
        const errorDetail = err?.response?.data?.error?.errors 
          ? Object.values(err.response.data.error.errors).flat().join(', ')
          : err?.response?.data?.message || err.message;
        showToast('Đặt hàng không thành công', errorDetail || 'Không thể tạo đơn hàng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
              Thanh toán đơn hàng
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Nhập địa chỉ nhận hàng và chọn phương thức thanh toán an toàn
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Giỏ hàng</span>
          </button>
        </div>

        {!user ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 max-w-lg mx-auto shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bạn cần đăng nhập để mua hàng</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Vui lòng đăng nhập tài khoản PickleHub của bạn để tiếp tục chọn địa chỉ nhận hàng và tiến hành thanh toán đơn hàng.
            </p>
            <button
              onClick={() => setAuthModalOpen(true, 'login')}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : items.length > 0 || createdOrderId ? (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Form: Shipping Info & Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Shipping Address Box */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Thông tin địa chỉ giao hàng</h3>
                  </div>
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseNewAddress(!useNewAddress);
                        if (!useNewAddress) {
                          setProvince('');
                          setDistrict('');
                          setWard('');
                          setStreetAddress('');
                        }
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{useNewAddress ? 'Chọn địa chỉ đã lưu' : 'Thêm địa chỉ mới'}</span>
                    </button>
                  )}
                </div>

                {/* Danh sách địa chỉ đã lưu trong CSDL */}
                {savedAddresses.length > 0 && !useNewAddress ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-medium">Chọn một địa chỉ nhận hàng từ CSDL:</p>
                    <div className="grid grid-cols-1 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 text-xs font-semibold ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                  {addr.fullName}
                                </span>
                                <span className="text-slate-500 font-mono">({addr.phoneNumber})</span>
                                {addr.isDefault && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 font-medium">
                                {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Form nhập thông tin địa chỉ mới với 3 ô địa chính động từ Open API */
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Họ và tên người nhận *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nhập họ tên..."
                          className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Số điện thoại *</label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Nhập số điện thoại..."
                          className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Tỉnh/Thành *</label>
                        <SearchableSelect
                          value={province}
                          onChange={handleProvinceChange}
                          options={provinceSelectOptions}
                          placeholder="Chọn Tỉnh/Thành..."
                          loading={loadingProvinces}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Quận/Huyện *</label>
                        <SearchableSelect
                          value={district}
                          onChange={handleDistrictChange}
                          options={districtSelectOptions}
                          placeholder="Chọn Quận/Huyện..."
                          disabled={!province}
                          loading={loadingDistricts}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Phường/Xã *</label>
                        <SearchableSelect
                          value={ward}
                          onChange={handleWardChange}
                          options={wardSelectOptions}
                          placeholder="Chọn Phường/Xã..."
                          disabled={!district}
                          loading={loadingWards}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Số nhà, Tên đường chi tiết *</label>
                      <input
                        type="text"
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="Số nhà, tên đường..."
                        className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-xs pt-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Ghi chú cho đơn hàng (Tùy chọn)</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Giao giờ hành chính, gọi trước khi giao..."
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Phương thức thanh toán</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PayOS Option */}
                  <label
                    onClick={() => setPaymentMethod('PayOS')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'PayOS'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                        Thanh toán PayOS QR
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium leading-tight block mt-0.5">
                        Quét mã QR Ngân hàng / Ví điện tử tự động xác nhận trong 5 giây.
                      </span>
                    </div>
                  </label>

                  {/* COD Option */}
                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'COD'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium leading-tight block mt-0.5">
                        Thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Form: Order Summary & Place Order Button */}
            <div className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 sticky top-24">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Tóm tắt đơn hàng ({selectedItems.length})
              </h3>

              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {selectedItems.map((item: any) => {
                  const itemName = item.product?.name || item.name || item.productNameSnapshot || 'Sản phẩm';
                  const itemImage = item.product?.image || item.image || item.imageUrlSnapshot || '/images/paddle.png';
                  const itemPrice = item.price ?? item.unitPrice ?? item.product?.price ?? 0;

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={itemImage} alt={itemName} className="w-10 h-10 object-contain rounded-lg border bg-slate-50 p-1" />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{itemName}</h4>
                          <span className="text-slate-400 font-medium">x{item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-white">{itemPrice.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                {loyaltyDiscountAmount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 items-center">
                    <span className="flex items-center gap-1 font-bold">
                      ⭐ Ưu đãi hạng {effectiveLoyalty.currentTierName} (-{loyaltyDiscountPercent}%):
                    </span>
                    <span className="font-black text-amber-600 dark:text-amber-400">-{loyaltyDiscountAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Phí giao hàng:</span>
                  <span className="font-bold text-emerald-600">
                    {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} ₫`}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">Tổng thanh toán:</span>
                  {loyaltyDiscountAmount > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold block">Đã tiết kiệm {loyaltyDiscountAmount.toLocaleString('vi-VN')} ₫</span>
                  )}
                </div>
                <span className="text-xl font-black text-emerald-600">{grandTotal.toLocaleString('vi-VN')} ₫</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 animate-spin" />
                    <span>Đang khởi tạo đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Xác nhận Đặt hàng ngay</span>
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          <div className="py-16 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Giỏ hàng của bạn đang trống!</h2>
            <button
              onClick={() => router.push('/products')}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}

      </div>

      {/* PayOS Modal */}
      {createdOrderId && (
        <PayOSModal
          isOpen={isPayOSModalOpen}
          onClose={() => {
            setIsPayOSModalOpen(false);
            showToast('Đơn hàng đã được tạo thành công!', 'Đơn hàng đang ở trạng thái Chờ thanh toán. Bạn có thể mở Lịch sử đơn hàng để quét mã QR thanh toán bất kỳ lúc nào.', 'success');
            setTimeout(() => {
              router.push('/orders');
            }, 1200);
          }}
          onSwitchToCOD={async () => {
            setIsPayOSModalOpen(false);
            const cancelId = createdOrderId;
            setCreatedOrderId('');
            if (cancelId) {
              await cartOrderApi.cancelMyOrder(cancelId, 'Khách chuyển sang phương thức COD').catch(() => {});
            }
            if (pendingCartBackup && pendingCartBackup.length > 0) {
              await restoreCart(pendingCartBackup);
            }
            setPaymentMethod('COD');
            showToast('Đã đổi sang COD', 'Phương thức thanh toán đã chuyển thành COD (Nhận hàng rồi thanh toán). Bấm Xác nhận Đặt hàng để hoàn tất.', 'success');
          }}
          onPaymentSuccess={() => {
            setIsPayOSModalOpen(false);
            clearSelected();
            setPendingCartBackup([]);
            router.push('/orders');
          }}
          orderId={createdOrderId}
          totalAmount={confirmedTotalAmount || grandTotal}
          checkoutUrl={paymentUrl}
          qrCode={paymentQrCode}
        />
      )}

      {/* Modern Product Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm w-full">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800/80 text-white'
                : 'bg-rose-950/90 border-rose-800/80 text-white'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 rotate-45" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <h4 className="font-extrabold text-xs leading-snug">{toast.title}</h4>
              <p className="text-[11px] opacity-90 leading-relaxed font-medium">{toast.message}</p>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
