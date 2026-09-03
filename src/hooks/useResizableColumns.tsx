'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

export type ColumnWidths = Record<string, number>;

export interface UseResizableColumnsOptions {
  storageKey?: string;
  defaultWidths: ColumnWidths;
  minWidths?: Record<string, number>;
  maxWidths?: Record<string, number>;
}

export function useResizableColumns({
  storageKey,
  defaultWidths,
  minWidths = {},
  maxWidths = {},
}: UseResizableColumnsOptions) {
  const [widths, setWidths] = useState<ColumnWidths>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultWidths, ...parsed };
        }
      } catch {
        // Ignore fallback
      }
    }
    return defaultWidths;
  });

  const resizingRef = useRef<{
    colKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const [activeResizingKey, setActiveResizingKey] = useState<string | null>(null);

  const startResize = useCallback(
    (colKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const currentWidth = widths[colKey] || defaultWidths[colKey] || 150;
      resizingRef.current = {
        colKey,
        startX: e.clientX,
        startWidth: currentWidth,
      };
      setActiveResizingKey(colKey);

      document.body.style.cursor = 'w-resize';
      document.body.style.userSelect = 'none';
    },
    [widths, defaultWidths]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;

      const { colKey, startX, startWidth } = resizingRef.current;
      const deltaX = e.clientX - startX;
      const minW = minWidths[colKey] ?? 50;
      const maxW = maxWidths[colKey] ?? 1000;
      const newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX));

      setWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        if (storageKey) {
          try {
            setWidths((current) => {
              localStorage.setItem(storageKey, JSON.stringify(current));
              return current;
            });
          } catch {
            // Ignore
          }
        }
        resizingRef.current = null;
        setActiveResizingKey(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [storageKey, minWidths, maxWidths]);

  const resetWidths = useCallback(() => {
    setWidths(defaultWidths);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }, [defaultWidths, storageKey]);

  const totalWidth = React.useMemo(() => {
    return Object.values(widths).reduce((acc, w) => acc + (Number(w) || 0), 0);
  }, [widths]);

  return {
    widths,
    totalWidth,
    activeResizingKey,
    startResize,
    resetWidths,
  };
}

/**
 * Resize Handle Component với con trỏ chuột w-resize, hit area rộng và đường highlight trực quan
 */
export const ResizeHandle: React.FC<{
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing?: boolean;
  onDoubleClick?: () => void;
}> = ({ onMouseDown, isResizing, onDoubleClick }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'w-resize' }}
      title="Kéo sang trái/phải để chỉnh độ rộng cột"
      className={`absolute right-0 top-0 bottom-0 w-4 -mr-2 z-30 flex items-center justify-center group select-none ${
        isResizing ? 'pointer-events-auto' : ''
      }`}
    >
      {/* Vạch ngăn cách trực quan - đổi màu và nổi bật khi hover/drag */}
      <div
        style={{ cursor: 'w-resize' }}
        className={`h-full transition-all duration-150 ${
          isResizing
            ? 'w-[3px] bg-emerald-500 shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-800'
            : 'w-[1.5px] bg-slate-300 dark:bg-slate-700 group-hover:w-[3px] group-hover:bg-emerald-500'
        }`}
      />
    </div>
  );
};
