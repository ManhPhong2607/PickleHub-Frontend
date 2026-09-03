'use client';

import React, { useState, useEffect } from 'react';
import { X, History, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';
import { adminApi, type AdminInventoryMovementDto, type AdminInventoryItemDto } from '@/lib/api/adminApi';

export const MovementModal: React.FC<{
  item: AdminInventoryItemDto | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [movements, setMovements] = useState<AdminInventoryMovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMovements = async () => {
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      const typeParam = filterType === 'all' ? undefined : filterType;
      const res = await adminApi.getMovements(item.variantId, page, 15, typeParam);
      setMovements(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải lịch sử biến động.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [item, page, filterType]);

  if (!item) return null;

  const getTypeBadge = (type: string, change: number) => {
    switch (type) {
      case 'Import':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Nhập kho</span>;
      case 'Reserve':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Giữ chỗ</span>;
      case 'Release':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">Nhả giữ</span>;
      case 'Deduct':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">Xuất bán</span>;
      case 'CorrectionPositive':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">Kiểm kê (+)</span>;
      case 'CorrectionNegative':
      case 'Damaged':
      case 'Lost':
      case 'Expired':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Xuất hủy/hao hụt</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nhật ký biến động kho (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {item.productName} · <span className="text-emerald-600 font-semibold">{item.sku}</span>
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

        {/* Current State Summary */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tồn vật lý (Physical)</span>
            <p className="text-base font-black text-slate-900 dark:text-white tabular-nums">{item.quantity}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Đang giữ chỗ (Reserved)</span>
            <p className="text-base font-black text-amber-600 tabular-nums">{item.reservedQuantity}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Khả dụng (Available)</span>
            <p className="text-base font-black text-emerald-600 tabular-nums">{item.availableQuantity}</p>
          </div>
        </div>

        {/* Filter Row */}
        <div className="px-6 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Loại:</span>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none"
            >
              <option value="all">Tất cả biến động</option>
              <option value="Import">Nhập kho</option>
              <option value="Reserve">Giữ chỗ đơn pending</option>
              <option value="Release">Giải phóng giữ chỗ</option>
              <option value="Deduct">Xuất bán đơn confirmed</option>
              <option value="CorrectionPositive">Kiểm kê tăng (+)</option>
              <option value="CorrectionNegative">Kiểm kê giảm (-)</option>
            </select>
          </div>
          <button
            onClick={fetchMovements}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Tải lại"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Movement Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Đang tải lịch sử xuất nhập tồn...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa có biến động kho nào được ghi nhận cho SKU này.
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const isPositive = m.change > 0;
                return (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs transition-colors hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(m.type, m.change)}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {m.reason || 'Biến động tồn kho'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Bởi: {m.createdBy}</span>
                          <span>·</span>
                          <span>{new Date(m.createdAt).toLocaleString('vi-VN')}</span>
                          {m.referenceId && (
                            <>
                              <span>·</span>
                              <span className="font-mono">Ref: #{m.referenceId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right tabular-nums">
                      <div className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? `+${m.change}` : m.change}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Tồn: {m.physicalBefore} → {m.physicalAfter}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng {totalCount} bản ghi</span>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
