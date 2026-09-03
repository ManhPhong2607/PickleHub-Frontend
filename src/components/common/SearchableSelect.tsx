'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface SearchableSelectProps {
  value: string;
  onChange: (option: SelectOption | null, customText?: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    // Tìm option trùng với label
    const matched = options.find((opt) => opt.label.toLowerCase() === val.toLowerCase());
    if (matched) {
      onChange(matched, val);
    } else {
      onChange(null, val);
    }
    setIsOpen(true);
  };

  const handleSelectOption = (opt: SelectOption) => {
    setSearchQuery(opt.label);
    onChange(opt, opt.label);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          required={required}
          disabled={disabled || loading}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => !disabled && !loading && setIsOpen(true)}
          placeholder={loading ? 'Đang tải danh sách...' : placeholder}
          className={`w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border ${
            disabled || loading
              ? 'border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
              : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 cursor-text'
          } rounded-xl font-medium outline-none text-slate-900 dark:text-white pr-8 text-xs`}
        />
        {loading ? (
          <Loader2 className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform ${
              isOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        )}
      </div>

      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl space-y-0.5 p-1 text-xs">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelectOption(opt)}
                className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  value === opt.label
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-slate-400 italic">
              Không tìm thấy lựa chọn trùng khớp trong API
            </div>
          )}
        </div>
      )}
    </div>
  );
};
