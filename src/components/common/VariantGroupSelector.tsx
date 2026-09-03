'use client';

import React, { useMemo, useEffect } from 'react';
import { ProductVariantItem } from '@/types';
import { Check } from 'lucide-react';

interface VariantGroupSelectorProps {
  variants: ProductVariantItem[];
  selectedVariant: ProductVariantItem | null;
  onVariantChange: (variant: ProductVariantItem) => void;
  className?: string;
}

// Color dictionary mapping Vietnamese & English color names to Hex colors
const COLOR_MAP: Record<string, string> = {
  'đen': '#111827',
  'den': '#111827',
  'black': '#111827',
  'carbon': '#1f2937',
  'winter berry': '#111827',
  'trắng': '#FFFFFF',
  'trang': '#FFFFFF',
  'white': '#FFFFFF',
  'hồng': '#F472B6',
  'hong': '#F472B6',
  'pink': '#F472B6',
  'berry': '#E879F9',
  'đỏ': '#EF4444',
  'do': '#EF4444',
  'red': '#EF4444',
  'xanh navy': '#1E3A8A',
  'navy': '#1E3A8A',
  'xanh dương': '#3B82F6',
  'xanh duong': '#3B82F6',
  'blue': '#3B82F6',
  'xanh lá': '#10B981',
  'xanh la': '#10B981',
  'green': '#10B981',
  'vàng': '#F59E0B',
  'vang': '#F59E0B',
  'yellow': '#F59E0B',
  'gold': '#D97706',
  'cam': '#F97316',
  'orange': '#F97316',
  'tím': '#8B5CF6',
  'tim': '#8B5CF6',
  'purple': '#8B5CF6',
  'bạc': '#CBD5E1',
  'bac': '#CBD5E1',
  'silver': '#CBD5E1',
  'xám': '#64748B',
  'xam': '#64748B',
  'gray': '#64748B',
  'grey': '#64748B',
  'nâu': '#78350F',
  'nau': '#78350F',
  'brown': '#78350F',
  'trong suốt': 'rgba(240, 240, 240, 0.8)',
  'transparent': 'rgba(240, 240, 240, 0.8)',
};

function resolveColorHex(val: string): string {
  if (!val) return '#94A3B8';
  const lower = val.toLowerCase().trim();
  
  // Direct match
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];

  // Keyword match
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }

  // If hex code provided
  if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) return val;

  return '#475569';
}

function isColorAttribute(attrKey: string): boolean {
  const lower = attrKey.toLowerCase();
  return lower === 'color' || lower === 'màu' || lower === 'màu sắc' || lower === 'mau' || lower === 'core';
}

export const VariantGroupSelector: React.FC<VariantGroupSelectorProps> = ({
  variants,
  selectedVariant,
  onVariantChange,
  className = '',
}) => {
  // 1. Discover all distinct attribute keys present across variants (ignoring ImageUrl or empty)
  const allAttributeKeys = useMemo(() => {
    if (!variants || variants.length === 0) return [];
    const keysSet = new Set<string>();
    variants.forEach((v) => {
      if (v.attributes && typeof v.attributes === 'object') {
        Object.keys(v.attributes).forEach((k) => {
          if (k && k !== 'ImageUrl' && k !== 'imageUrl') {
            keysSet.add(k);
          }
        });
      }
    });
    return Array.from(keysSet);
  }, [variants]);

  // 2. Discover all unique values per attribute key
  const attributeOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    allAttributeKeys.forEach((key) => {
      const valSet = new Set<string>();
      variants.forEach((v) => {
        const val = v.attributes?.[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          valSet.add(String(val).trim());
        }
      });
      map[key] = Array.from(valSet);
    });
    return map;
  }, [allAttributeKeys, variants]);

  // 3. Filter attribute keys to ONLY those that have MORE THAN 1 OPTION (> 1 unique value)
  // Các thuộc tính có 1 giá trị duy nhất (giống nhau ở tất cả biến thể) sẽ tự động ẩn đi
  const selectableAttributeKeys = useMemo(() => {
    return allAttributeKeys.filter((key) => (attributeOptions[key]?.length ?? 0) > 1);
  }, [allAttributeKeys, attributeOptions]);

  // 4. Current active selected attributes object
  const currentSelectedAttrs = useMemo<Record<string, string>>(() => {
    if (selectedVariant?.attributes) {
      const res: Record<string, string> = {};
      allAttributeKeys.forEach((k) => {
        res[k] = String(selectedVariant.attributes[k] || '');
      });
      return res;
    }
    // Fallback to first variant's attributes
    if (variants.length > 0 && variants[0].attributes) {
      const res: Record<string, string> = {};
      allAttributeKeys.forEach((k) => {
        res[k] = String(variants[0].attributes[k] || '');
      });
      return res;
    }
    return {};
  }, [selectedVariant, variants, allAttributeKeys]);

  // Auto-select initial variant if not selected yet
  useEffect(() => {
    if (!selectedVariant && variants.length > 0) {
      onVariantChange(variants[0]);
    }
  }, [selectedVariant, variants, onVariantChange]);

  // 5. Handle selecting a value for a specific attribute group
  const handleSelectAttributeValue = (attrKey: string, attrVal: string) => {
    const nextAttrs = { ...currentSelectedAttrs, [attrKey]: attrVal };

    // Find exact match across selectable keys (or all keys)
    let matched = variants.find((v) => {
      if (!v.attributes) return false;
      return selectableAttributeKeys.every((k) => {
        return String(v.attributes[k] || '').trim() === String(nextAttrs[k] || '').trim();
      });
    });

    // If exact combo doesn't exist, find closest matching variant with attrKey = attrVal
    if (!matched) {
      matched = variants.find((v) => {
        return String(v.attributes?.[attrKey] || '').trim() === attrVal.trim();
      });
    }

    if (matched) {
      onVariantChange(matched);
    }
  };

  // 6. Check if a specific attribute option is available with other current selections
  const isOptionAvailable = (attrKey: string, val: string): boolean => {
    return variants.some((v) => {
      if (!v.attributes) return false;
      if (String(v.attributes[attrKey] || '').trim() !== val.trim()) return false;
      return true;
    });
  };

  // If no selectable attribute keys have > 1 distinct options:
  if (selectableAttributeKeys.length === 0) {
    if (variants.length <= 1) return null;
    return (
      <div className={`space-y-2.5 ${className}`}>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          Phiên bản / Phân loại:
        </span>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const isSelected = selectedVariant?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onVariantChange(v)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{v.label || v.sku}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {selectableAttributeKeys.map((attrKey) => {
        const options = attributeOptions[attrKey] || [];
        if (options.length <= 1) return null;

        const isColor = isColorAttribute(attrKey);
        const currentVal = currentSelectedAttrs[attrKey] || options[0];

        return (
          <div key={attrKey} className="space-y-2.5">
            {/* Header: Label + Selected Value */}
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {attrKey}:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {currentVal}
              </span>
            </div>

            {/* Options List */}
            <div className="flex flex-wrap items-center gap-2.5">
              {options.map((optVal) => {
                const isSelected = currentVal.trim() === optVal.trim();
                const available = isOptionAvailable(attrKey, optVal);

                // ── COLOR SWATCH RENDERING (ROUNDED SQUIRCLE WITH COLOR FILL) ──
                if (isColor) {
                  const hex = resolveColorHex(optVal);
                  const isWhiteOrLight = hex.toLowerCase() === '#ffffff' || hex === '#fff' || hex.includes('255,255,255');

                  return (
                    <button
                      key={optVal}
                      type="button"
                      disabled={!available}
                      onClick={() => handleSelectAttributeValue(attrKey, optVal)}
                      className={`relative w-9 h-9 rounded-xl transition-all duration-200 flex items-center justify-center p-0.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-md'
                          : 'hover:scale-105 border border-slate-300/80 dark:border-slate-700'
                      }`}
                      title={`${attrKey}: ${optVal}`}
                      aria-label={`${attrKey}: ${optVal}`}
                    >
                      <span
                        className={`w-full h-full rounded-[10px] shadow-inner block ${
                          isWhiteOrLight ? 'border border-slate-200 dark:border-slate-700' : ''
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                      {isSelected && (
                        <span className={`absolute inset-0 flex items-center justify-center ${
                          isWhiteOrLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          <Check className="w-4 h-4 drop-shadow-md stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                }

                // ── PILL BUTTON RENDERING (SIZE, WEIGHT, THICKNESS, ETC.) ──
                return (
                  <button
                    key={optVal}
                    type="button"
                    disabled={!available}
                    onClick={() => handleSelectAttributeValue(attrKey, optVal)}
                    className={`min-w-[48px] px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 flex items-center justify-center cursor-pointer select-none ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm scale-102'
                        : available
                        ? 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500'
                        : 'opacity-30 border-dashed border-slate-300 text-slate-400 line-through cursor-not-allowed'
                    }`}
                  >
                    <span>{optVal}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
