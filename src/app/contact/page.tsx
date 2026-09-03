'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function ContactPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Tự động điền thông tin nếu người dùng đã đăng nhập
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.phoneNumber) setPhone(user.phoneNumber);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !message) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setIsSubmitted(true);
    addNotification(
      'Gửi liên hệ thành công',
      `Cảm ơn ${fullName}! Yêu cầu liên hệ của bạn đã được tiếp nhận. Đội ngũ PickleHub sẽ phản hồi trong 24h.`
    );

    setTimeout(() => {
      // Nếu đăng nhập thì giữ nguyên thông tin cá nhân, chỉ reset message
      if (!user) {
        setFullName('');
        setEmail('');
        setPhone('');
      }
      setMessage('');
      setIsSubmitted(false);
      alert('Cảm ơn bạn đã liên hệ với PickleHub! Chúng tôi sẽ phản hồi sớm nhất.');
    }, 1500);
  };

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            Liên hệ & hỗ trợ khách hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
            Gửi thắc mắc hoặc thông tin góp ý cho đội ngũ PickleHub. Chúng tôi luôn sẵn sàng đồng hành cùng bạn.
          </p>
        </div>

        {/* Main Grid: Info Cards & Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Side: Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Thông tin liên hệ PickleHub
              </h3>

              <div className="space-y-5 text-xs font-semibold">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ĐỊA CHỈ TRỤ SỞ</span>
                    <span className="text-slate-900 dark:text-white text-sm font-bold">
                      123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">HOTLINE TƯ VẤN</span>
                    <span className="text-slate-900 dark:text-white text-sm font-mono font-extrabold text-emerald-600">
                      090 123 4567 / (028) 3822 9999
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">EMAIL HỖ TRỢ</span>
                    <span className="text-slate-900 dark:text-white text-sm font-bold">
                      support@picklehub.vn
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">THỜI GIAN LÀM VIỆC</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      Thứ 2 — Chủ Nhật: 08:00 đến 21:00
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Guarantee Box */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl text-white shadow-lg space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                <h4 className="font-extrabold text-base">Cam kết phản hồi trong 24h</h4>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Mọi thắc mắc về đơn hàng, chính sách đại lý hoặc hỗ trợ bảo hành vợt sẽ được chuyên viên tư vấn trả lời nhanh nhất.
              </p>
            </div>
          </div>

          {/* Right Side: Interactive Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <span>Gửi tin nhắn trực tiếp</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Họ và tên của bạn *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Số điện thoại (Tùy chọn)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Nội dung tin nhắn *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc nội dung bạn cần hỗ trợ..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitted}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi thông tin...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi tin nhắn ngay</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
