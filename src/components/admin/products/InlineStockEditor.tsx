'use client';

import React, { useState } from 'react';
import { Check, X, Pencil } from 'lucide-react';

interface InlineStockEditorProps {
  stock: number;
  onSave: (newStock: number) => void;
}

export const InlineStockEditor: React.FC<InlineStockEditorProps> = React.memo(({ stock, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(stock));

  const handleOpen = () => {
    setValue(String(stock));
    setEditing(true);
  };

  const handleSave = () => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      onSave(num);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setValue(String(stock));
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  // Color-code based on stock level
  const stockColor =
    stock === 0
      ? 'text-rose-600 dark:text-rose-400'
      : stock < 10
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-emerald-600 dark:text-emerald-400';

  const dotColor =
    stock === 0
      ? 'bg-rose-500'
      : stock < 10
        ? 'bg-orange-500'
        : 'bg-emerald-500';

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-16 px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg outline-none text-center transition-all"
        />
        <button
          onClick={handleSave}
          className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors"
          title="Lưu"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Hủy"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      className={`group flex items-center gap-1.5 font-bold ${stockColor} hover:opacity-80 transition-all cursor-pointer`}
      title="Click để chỉnh sửa tồn kho"
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} ${stock === 0 ? 'animate-pulse' : ''}`} />
      <span>{stock}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
});

InlineStockEditor.displayName = 'InlineStockEditor';
