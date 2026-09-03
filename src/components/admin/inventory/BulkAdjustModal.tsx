'use client';

import React, { useState } from 'react';
import { X, Layers, AlertCircle, Check } from 'lucide-react';
import { adminApi, type AdminInventoryItemDto } from '@/lib/api/adminApi';

export const BulkAdjustModal: React.FC<{
  selectedItems: AdminInventoryItemDto[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}> = ({ selectedItems, onClose, onSuccess }) => {
  const [actionType, setActionType] = useState<'import' | 'decrease' | 'threshold'>('import');
  const [value, setValue] = useState<number>(10);
  const [reason, setReason] = useState<string>('Nhập hàng bổ sung hàng loạt');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0) {
      setError('Giá trị phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (actionType === 'threshold') {
        // Bulk update threshold
        await Promise.all(
          selectedItems.map((item) => adminApi.updateInventoryThreshold(item.variantId, value))
        );
      } else {
        // Bulk adjust
        const delta = actionType === 'import' ? value : -value;
        const payload = selectedItems.map((item) => ({
          productVariantId: item.variantId,
          delta,
          reason: reason || (actionType === 'import' ? 'Nhập hàng loạt' : 'Hao hụt hàng loạt'),
        }));
        await adminApi.bulkAdjust(payload);
      }
      onSuccess(selectedItems.length);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi thực hiện thao tác hàng loạt.');
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
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 overflow-hidden cursor-default"
      >
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Thao tác kho hàng loạt
              </h3>
              <p className="text-xs text-slate-500">
                Áp dụng cho <span className="font-bold text-emerald-600">{selectedItems.length} SKU</span> đã chọn
              </p>
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
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Tabs */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">Chọn loại thao tác</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setActionType('import'); setReason('Nhập hàng bổ sung hàng loạt'); }}
                className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all ${
                  actionType === 'import'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                + Nhập kho (+N)
              </button>
              <button
                type="button"
                onClick={() => { setActionType('decrease'); setReason('Xuất kho / Hao hụt hàng loạt'); }}
                className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all ${
                  actionType === 'decrease'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                − Giảm kho (-N)
              </button>
              <button
                type="button"
                onClick={() => { setActionType('threshold'); }}
                className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all ${
                  actionType === 'threshold'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                ≤ Đổi ngưỡng
              </button>
            </div>
          </div>

          {/* Value Input */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">
              {actionType === 'threshold' ? 'Mức cảnh báo tồn thấp mới' : 'Số lượng áp dụng cho mỗi SKU'} *
            </label>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm text-slate-900 dark:text-white tabular-nums focus:bg-white"
            />
          </div>

          {/* Reason Input */}
          {actionType !== 'threshold' && (
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">Lý do điều chỉnh</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs focus:bg-white"
                placeholder="Ghi chú thao tác..."
              />
            </div>
          )}

          {/* Selected items quick preview list */}
          <div className="space-y-1.5">
            <label className="text-slate-500 font-medium block text-[11px]">Danh sách các SKU được áp dụng:</label>
            <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40 space-y-1">
              {selectedItems.map((it) => (
                <div key={it.id} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span className="truncate max-w-[280px]">{it.productName} ({it.sku})</span>
                  <span className="tabular-nums font-mono">Tồn: {it.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang thực hiện...' : 'Áp dụng cho tất cả'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
