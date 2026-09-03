'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  count: number;
  productName?: string;          // single-delete: show product name
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = React.memo(
  ({ isOpen, count, productName, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const isBulk = count > 1;
    const title = isBulk
      ? `Xóa ${count} sản phẩm đã chọn?`
      : `Xóa sản phẩm "${productName || ''}"?`;
    const description = isBulk
      ? `Bạn đang thực hiện xóa hàng loạt ${count} sản phẩm. Hành động này không thể hoàn tác.`
      : 'Sản phẩm sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.';

    return (
      <div
        onClick={onCancel}
        className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200 cursor-default"
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/50 shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97]"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ConfirmDeleteModal.displayName = 'ConfirmDeleteModal';
