'use client';

import React from 'react';
import { getStatusStyle } from './types';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status }) => {
  const cfg = getStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} text-[11px] font-bold transition-all shadow-2xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
