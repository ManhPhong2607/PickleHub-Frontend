'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, CheckCircle, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/lib/api/authApi';
import { LiquidPosterCanvas } from './LiquidPosterCanvas';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const switchTab = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setIsForgot(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Extract human-readable error string from backend response DTO
  const extractError = (err: any): string => {
    try {
      const data = err?.response?.data;
      if (typeof data === 'string') return data;
      if (typeof data?.error?.message === 'string') return data.error.message;
      if (typeof data?.message === 'string') return data.message;
      if (typeof data?.detail === 'string') return data.detail;
      if (typeof data?.error === 'string') return data.error;
      if (data?.error?.errors && typeof data.error.errors === 'object') {
        const first = Object.values(data.error.errors as Record<string, any>)[0];
        if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
        if (typeof first === 'string') return first;
      }
      if (data?.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors as Record<string, any>)[0];
        if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
        if (typeof first === 'string') return first;
      }
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        return 'Kết nối máy chủ bị quá thời gian chờ (Timeout). Vui lòng đảm bảo hệ thống Backend đang chạy và thử lại.';
      }
      if (err?.message === 'Network Error') return 'Không thể kết nối đến máy chủ API. Vui lòng kiểm tra API Gateway (5105) và Authen (5001).';
      if (typeof err?.message === 'string') return err.message;
    } catch {
      // fallback below
    }
    return 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại email và mật khẩu.';
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const msg = await authApi.forgotPassword(formData.email);
      setSuccessMsg(msg);
    } catch (err: any) {
      setErrorMsg(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn để nhận lại mail xác minh.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const msg = await authApi.resendVerification(formData.email);
      setSuccessMsg(msg);
    } catch (err: any) {
      setErrorMsg(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // POST /auth/login → { userId, email, role, accessToken, refreshToken }
        const res = await authApi.login({
          email: formData.email,
          password: formData.password,
        });
        await setAuth(res.user, res.token);
        onClose();
      } else {
        // POST /auth/register → { message, email }
        const res = await authApi.register({
          email: formData.email,
          password: formData.password,
        });
        const msg = typeof res?.message === 'string' ? res.message : 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để xác minh tài khoản.';
        setSuccessMsg(msg);
      }
    } catch (err: any) {
      setErrorMsg(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
    >
      {/* Outer Shell Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full h-[600px] shadow-2xl border border-slate-100 overflow-hidden relative font-sans"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 w-9 h-9 bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-full flex items-center justify-center transition-all shadow-sm hover:rotate-90 duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ------------------------------------------------------------- */}
        {/* 1. SIGN IN FORM (Left Side: left-0 w-1/2)                      */}
        {/* ------------------------------------------------------------- */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-full md:w-1/2 p-7 sm:p-10 flex flex-col justify-between transition-all duration-750 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
            isLogin
              ? 'translate-x-0 opacity-100 z-10 pointer-events-auto'
              : '-translate-x-full md:translate-x-0 opacity-0 pointer-events-none z-0'
          }`}
        >
          {/* Header Logo & Tabs */}
          <div className="space-y-4">
            <img
              src="/images/picklehub.png"
              alt="PickleHub Logo"
              className="h-10 w-auto object-contain"
            />
            {!isForgot && (
              <div className="flex items-center gap-6 border-b border-slate-100 text-sm font-bold pt-1">
                <button
                  type="button"
                  onClick={() => switchTab(true)}
                  className={`pb-2.5 transition-all relative ${
                    isLogin
                      ? 'text-emerald-600 border-b-2 border-emerald-600 font-extrabold'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => switchTab(false)}
                  className="pb-2.5 transition-all relative text-slate-400 hover:text-slate-600 font-medium"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="space-y-4 my-auto">
            {isForgot ? (
              /* Forgot Password View */
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Khôi phục mật khẩu
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Nhập email của bạn để nhận liên kết đặt lại mật khẩu an toàn qua Email.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email của bạn</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="VD: user@example.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setIsForgot(false)}
                  className="text-xs font-bold text-emerald-600 hover:underline block mx-auto pt-1"
                >
                  ← Quay lại Đăng nhập
                </button>
              </div>
            ) : (
              /* Standard Login View */
              <>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Chào mừng trở lại!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Đăng nhập để tiếp tục trải nghiệm mua sắm cùng PickleHub
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Nhập email của bạn"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Nhập mật khẩu của bạn"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMeLogin"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="rememberMeLogin" className="text-xs text-slate-600 font-medium cursor-pointer">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>

                  {/* Primary Emerald Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Bottom Switch Link */}
          {!isForgot && (
            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchTab(false)}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. SIGN UP FORM (Right Side: right-0 w-1/2)                    */}
        {/* ------------------------------------------------------------- */}
        <div
          className={`absolute top-0 bottom-0 right-0 w-full md:w-1/2 p-7 sm:p-10 flex flex-col justify-between transition-all duration-750 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
            !isLogin
              ? 'translate-x-0 opacity-100 z-10 pointer-events-auto'
              : 'translate-x-full md:translate-x-0 opacity-0 pointer-events-none z-0'
          }`}
        >
          {/* Header Logo & Tabs */}
          <div className="space-y-4">
            <img
              src="/images/picklehub.png"
              alt="PickleHub Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="flex items-center gap-6 border-b border-slate-100 text-sm font-bold pt-1">
              <button
                type="button"
                onClick={() => switchTab(true)}
                className="pb-2.5 transition-all relative text-slate-400 hover:text-slate-600 font-medium"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => switchTab(false)}
                className="pb-2.5 transition-all relative text-emerald-600 font-bold"
              >
                Đăng ký
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-4 my-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Tạo tài khoản mới
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tham gia cộng đồng PickleHub nhận ưu đãi mua sắm hấp dẫn
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold space-y-2">
                <p>{errorMsg}</p>
                {errorMsg.toLowerCase().includes('xác minh') && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all block w-full text-center"
                  >
                    Gửi lại email xác minh
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all block w-full text-center mt-1"
                >
                  Gửi lại email xác minh
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Nhập email của bạn"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Tạo mật khẩu an toàn"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Emerald Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản PickleHub'}
              </button>
            </form>
          </div>

          {/* Bottom Switch Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrorMsg('');
                }}
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. SLIDING POSTER OVERLAY PANEL WITH WEBGL LIQUID SHADER       */}
        {/* ------------------------------------------------------------- */}
        <div
          className={`hidden md:flex absolute top-0 bottom-0 w-1/2 p-8 flex-col justify-between overflow-hidden z-20 transition-all duration-750 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] shadow-2xl ${
            isLogin ? 'left-1/2 translate-x-0' : 'left-0 translate-x-0'
          }`}
        >
          {/* WebGL GLSL Interactive Wave Liquid Shader */}
          <LiquidPosterCanvas isLogin={isLogin} />

          {/* High-Res Bright Display Image overlaid with liquid wave */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={isLogin ? '/images/login_modal.png' : '/images/SignUp.png'}
              alt="PickleHub Display Graphic"
              className="w-full h-full object-cover opacity-90 brightness-110 contrast-105 transition-all duration-700 transform hover:scale-105"
            />
          </div>

          {/* Top Pill Badge */}
          <div className="relative z-10">
            <span className="inline-block px-3.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md border border-emerald-400/30">
              {isLogin ? 'PICKLEHUB PRO STORE' : 'GIA NHẬP CỘNG ĐỒNG'}
            </span>
          </div>

          {/* Text Content & Feature Badges */}
          <div className="relative z-10 space-y-5">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold leading-tight text-white transition-all duration-500">
                {isLogin
                  ? 'Tất cả những gì bạn cần cho Pickleball'
                  : 'Trải nghiệm mua sắm thiết bị chuyên nghiệp'}
              </h3>
              <p className="text-slate-200 text-xs leading-relaxed transition-all duration-500">
                {isLogin
                  ? 'Sản phẩm chất lượng cao, cộng đồng đam mê và dịch vụ tận tâm.'
                  : 'Đăng ký thành viên để nhận ngay ưu đãi 10% cho đơn hàng đầu tiên.'}
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 text-center shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold block text-white">Chính hãng</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 text-center shadow-sm">
                <Truck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold block text-white">Giao nhanh</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 text-center shadow-sm">
                <Headphones className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold block text-white">Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
