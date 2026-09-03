'use client';

import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertTriangle, Check } from 'lucide-react';
import { adminApi, type AdminInventoryItemDto } from '@/lib/api/adminApi';

export const AdjustModal: React.FC<{
  item: AdminInventoryItemDto | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ item, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
  const [quantity, setQuantity] = useState<number>(1);
  const [reasonCode, setReasonCode] = useState<string>('DAMAGED');
  const [customNote, setCustomNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const delta = adjustmentType === 'increase' ? quantity : -quantity;
  const newPhysical = item.quantity + delta;
  const newAvailable = Math.max(0, newPhysical - item.reservedQuantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Số lượng điều chỉnh phải lớn hơn 0.');
      return;
    }
    if (adjustmentType === 'decrease' && newPhysical < item.reservedQuantity) {
      setError(`Không thể giảm xuống dưới mức đang giữ chỗ (${item.reservedQuantity} SKU).`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const reasonText = customNote ? `[${reasonCode}] ${customNote}` : `[${reasonCode}] Điều chỉnh kho`;
      await adminApi.adjustStock(item.variantId, {
        delta,
        reason: reasonText,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể điều chỉnh tồn kho.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kiểm kê & Điều chỉnh kho
              </h3>
              <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product info banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.productName}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{item.variantName}</div>
          </div>

          {/* Type of Adjustment */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">Loại điều chỉnh</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('decrease')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  adjustmentType === 'decrease'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <span>− Xuất hủy / Hao hụt</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('increase')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  adjustmentType === 'increase'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <span>+ Điều chỉnh tăng</span>
              </button>
            </div>
          </div>

          {/* Reason Select */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">Lý do kiểm kê</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-semibold text-xs"
            >
              {adjustmentType === 'decrease' ? (
                <>
                  <option value="DAMAGED">Hàng hỏng / Lỗi sản xuất</option>
                  <option value="LOST">Hao hụt / Thất thoát khi kiểm kê</option>
                  <option value="EXPIRED">Hết hạn / Xuất mẫu dùng thử</option>
                  <option value="INTERNAL_USE">Xuất sử dụng nội bộ</option>
                  <option value="INVENTORY_AUDIT_MINUS">Sai lệch số liệu (Giảm)</option>
                </>
              ) : (
                <>
                  <option value="INVENTORY_AUDIT_PLUS">Tìm thấy hàng thừa khi kiểm kho</option>
                  <option value="RETURN_UNRECORDED">Khách hoàn trả chưa ghi nhận</option>
                  <option value="CORRECTION">Điều chỉnh bù số liệu</option>
                </>
              )}
            </select>
          </div>

          {/* Quantity Stepper */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">Số lượng điều chỉnh *</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-xs text-center tabular-nums"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Hiện tại</div>
              <div className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{item.quantity}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Điều chỉnh</div>
              <div className={`text-sm font-black tabular-nums ${adjustmentType === 'increase' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {adjustmentType === 'increase' ? `+${quantity}` : `-${quantity}`}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Sau kiểm kê</div>
              <div className="text-sm font-black text-blue-600 tabular-nums">{newPhysical}</div>
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">Ghi chú bổ sung</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="VD: Kiểm kê định kỳ ngày 18/08..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:bg-white text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang lưu...' : 'Xác nhận điều chỉnh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
