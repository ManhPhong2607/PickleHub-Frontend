'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Clock,
  User,
  Layers,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Globe,
  Tag,
  FileJson,
  Shield,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import type { AdminAuditLogDto } from '@/lib/api/adminApi';

interface AuditLogDetailModalProps {
  log: AdminAuditLogDto | null;
  onClose: () => void;
}

// Map friendly Vietnamese labels for common metadata properties
const FIELD_LABELS: Record<string, string> = {
  productId: 'Mã sản phẩm (ID)',
  productName: 'Tên sản phẩm',
  slug: 'Đường dẫn (Slug)',
  price: 'Giá bán',
  originalPrice: 'Giá niêm yết (Gốc)',
  categoryId: 'Mã danh mục',
  categoryName: 'Danh mục',
  brandId: 'Mã thương hiệu',
  brandName: 'Thương hiệu',
  inventoryItemId: 'Mã mục kho',
  productVariantId: 'Mã biến thể',
  skuSnapshot: 'Mã SKU',
  quantityImported: 'Số lượng nhập',
  quantityBefore: 'Tồn kho trước khi nhập',
  quantityAfter: 'Tồn kho sau khi nhập',
  oldThreshold: 'Ngưỡng cảnh báo cũ',
  newThreshold: 'Ngưỡng cảnh báo mới',
  orderId: 'Mã đơn hàng',
  orderCode: 'Mã đơn (Code)',
  oldStatus: 'Trạng thái cũ',
  newStatus: 'Trạng thái mới',
  trackingNumber: 'Mã vận đơn',
  customerId: 'Mã khách hàng',
  customerEmail: 'Email khách hàng',
  isBlocked: 'Khóa tài khoản',
  reason: 'Lý do thực hiện',
  note: 'Ghi chú',
  key: 'Khóa cấu hình',
  oldValue: 'Giá trị cũ',
  newValue: 'Giá trị mới',
  totalAmount: 'Tổng tiền đơn hàng',
  email: 'Email tài khoản',
  role: 'Vai trò',
  ipAddress: 'Địa chỉ IP',
  userAgent: 'Trình duyệt / Thiết bị',
  updatedByEmail: 'Người cập nhật',
  createdByEmail: 'Người tạo',
  importedByEmail: 'Người nhập kho',
  actorEmail: 'Người thực hiện',
};

// Map action type badge styling
export function getActionBadgeInfo(action: string) {
  const act = action.toLowerCase();
  if (act.includes('create') || act.includes('import') || act.includes('register')) {
    return {
      label: 'Tạo mới',
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }
  if (act.includes('update') || act.includes('status') || act.includes('threshold') || act.includes('publish') || act.includes('restor')) {
    return {
      label: 'Cập nhật',
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      dotColor: 'bg-blue-500',
    };
  }
  if (act.includes('block') || act.includes('cancel') || act.includes('delete') || act.includes('hide') || act.includes('hidden')) {
    return {
      label: 'Khóa / Hủy / Ẩn',
      className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dotColor: 'bg-rose-500',
    };
  }
  if (act.includes('login') || act.includes('password') || act.includes('unblock')) {
    return {
      label: 'Bảo mật / Auth',
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-500',
    };
  }
  return {
    label: action,
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
    dotColor: 'bg-slate-400',
  };
}

// Map entity route for direct link
export function getEntityRoute(entityType: string, entityId?: string | null): string | null {
  if (!entityId) return null;
  switch (entityType.toLowerCase()) {
    case 'product':
      return `/admin/products?search=${entityId}`;
    case 'order':
      return `/admin/orders?search=${entityId}`;
    case 'inventoryitem':
      return `/admin/inventory?search=${entityId}`;
    case 'customer':
      return `/admin/customers?search=${entityId}`;
    default:
      return null;
  }
}

// Format values for human readability
function formatValueDisplay(key: string, val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Có / Đã kích hoạt' : 'Không / Vô hiệu';
  if (typeof val === 'number') {
    if (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount')) {
      return `${val.toLocaleString('vi-VN')}₫`;
    }
    return val.toLocaleString('vi-VN');
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!log) return null;

  // Safe JSON parser
  let parsedMetadata: Record<string, any> | null = null;
  if (log.metadata) {
    try {
      if (typeof log.metadata === 'string') {
        parsedMetadata = JSON.parse(log.metadata);
      } else if (typeof log.metadata === 'object') {
        parsedMetadata = log.metadata;
      }
    } catch {
      parsedMetadata = null;
    }
  }

  // Extract IP & UserAgent if available
  const ipAddress = parsedMetadata?.ipAddress || null;
  const userAgent = parsedMetadata?.userAgent || null;
  const reason = parsedMetadata?.reason || null;
  const note = parsedMetadata?.note || null;

  // Check for explicit Before/After diff patterns
  let diffPair: { fieldName: string; before: any; after: any } | null = null;

  if (parsedMetadata) {
    if ('oldValue' in parsedMetadata || 'newValue' in parsedMetadata) {
      diffPair = {
        fieldName: parsedMetadata.key ? `Cấu hình: ${parsedMetadata.key}` : 'Giá trị',
        before: parsedMetadata.oldValue,
        after: parsedMetadata.newValue,
      };
    } else if ('oldStatus' in parsedMetadata || 'newStatus' in parsedMetadata) {
      diffPair = {
        fieldName: 'Trạng thái đơn hàng',
        before: parsedMetadata.oldStatus,
        after: parsedMetadata.newStatus,
      };
    } else if ('quantityBefore' in parsedMetadata || 'quantityAfter' in parsedMetadata) {
      diffPair = {
        fieldName: `Tồn kho SKU (${parsedMetadata.skuSnapshot || 'Kho'})`,
        before: parsedMetadata.quantityBefore,
        after: parsedMetadata.quantityAfter,
      };
    } else if ('oldThreshold' in parsedMetadata || 'newThreshold' in parsedMetadata) {
      diffPair = {
        fieldName: `Ngưỡng cảnh báo (${parsedMetadata.skuSnapshot || 'SKU'})`,
        before: parsedMetadata.oldThreshold,
        after: parsedMetadata.newThreshold,
      };
    }
  }

  // Filter out system metadata for clean property table
  const ignoredKeys = new Set([
    'occurredAt', 'createdAt', 'updatedAt', 'actorUserId', 'actorId',
    'importedByUserId', 'createdByUserId', 'updatedByUserId', 'ipAddress',
    'userAgent', 'reason', 'note', 'oldValue', 'newValue', 'oldStatus',
    'newStatus', 'quantityBefore', 'quantityAfter', 'oldThreshold', 'newThreshold'
  ]);

  const cleanProperties = parsedMetadata
    ? Object.entries(parsedMetadata).filter(([k]) => !ignoredKeys.has(k))
    : [];

  const handleCopyJson = () => {
    const content = log.metadata
      ? (typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2))
      : JSON.stringify(log, null, 2);

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeInfo = getActionBadgeInfo(log.action);
  const entityLink = getEntityRoute(log.entityType, log.entityId);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                  Chi tiết nhật ký thao tác
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeInfo.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.dotColor}`} />
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ID Log: <span className="font-mono">{log.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">

          {/* Description Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Mô tả hành động
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                {log.description}
              </p>
            </div>
          </div>

          {/* Diff Comparison Card (If Old/New pair exists) */}
          {diffPair && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                  So sánh thay đổi ({diffPair.fieldName})
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Diff Viewer</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before Box */}
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                      Trước thay đổi
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                      Cũ
                    </span>
                  </div>
                  <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-100 dark:border-rose-900/40 text-sm font-bold font-mono text-rose-600 dark:text-rose-400 break-words">
                    {formatValueDisplay('', diffPair.before)}
                  </div>
                </div>

                {/* After Box */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Sau thay đổi
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      Mới
                    </span>
                  </div>
                  <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 break-words">
                    {formatValueDisplay('', diffPair.after)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reason / Note Alert (if available) */}
          {(reason || note) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reason ? 'Lý do thay đổi' : 'Ghi chú bổ sung'}</span>
              </div>
              <p className="text-xs font-medium pl-5.5">
                {reason || note}
              </p>
            </div>
          )}

          {/* Event Properties Grid */}
          {cleanProperties.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Thuộc tính chi tiết ({cleanProperties.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {cleanProperties.map(([k, val]) => (
                  <div
                    key={k}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {FIELD_LABELS[k] || k}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white text-right break-all">
                      {formatValueDisplay(k, val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Metadata Table */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Thông tin phiên thực thi
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Actor Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span>Người thực hiện (Actor)</span>
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div>Email: <strong className="text-slate-900 dark:text-white">{log.actorEmail}</strong></div>
                  <div>Vai trò: <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">{log.actorRole}</span></div>
                  {log.actorId && (
                    <div className="text-[11px] font-mono truncate">ID: {log.actorId}</div>
                  )}
                </div>
              </div>

              {/* Target Entity Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Đối tượng tác động (Entity)</span>
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div>Module: <strong className="text-slate-900 dark:text-white">{log.entityType}</strong></div>
                  <div>
                    Entity ID:{' '}
                    {log.entityId ? (
                      <span className="font-mono text-slate-800 dark:text-slate-200">{log.entityId}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  {entityLink && (
                    <Link
                      href={entityLink}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline pt-0.5"
                    >
                      <span>Mở trang quản trị đối tượng</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Time & Date */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Thời gian thực hiện</span>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                  {new Date(log.occurredAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  ISO: {log.occurredAt}
                </div>
              </div>

              {/* Network Context */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Globe className="w-4 h-4 text-cyan-500" />
                  <span>Môi trường & Mạng</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>IP: <strong className="text-slate-900 dark:text-white font-mono">{ipAddress || 'Internal / Service'}</strong></div>
                  <div className="truncate text-[11px]" title={userAgent || 'Backend MassTransit Consumer'}>
                    Agent: {userAgent ? userAgent.substring(0, 35) + '...' : 'MassTransit Event Bus'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Raw JSON Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <FileJson className="w-4 h-4" />
                <span>{showRawJson ? 'Ẩn mã JSON gốc' : 'Xem mã JSON payload gốc'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép JSON'}</span>
              </button>
            </div>

            {showRawJson && (
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto max-h-56 scrollbar-thin border border-slate-800">
                {log.metadata
                  ? (typeof log.metadata === 'string' ? JSON.stringify(JSON.parse(log.metadata), null, 2) : JSON.stringify(log.metadata, null, 2))
                  : JSON.stringify(log, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
