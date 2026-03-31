import React from 'react';
import { cn } from '@/lib/utils';

const HEALTH_CONFIG = {
  good: {
    bg: 'bg-status-good',
    text: 'text-white dark:text-bg-base',
    label: 'جيد',
    emoji: '🟢',
  },
  warning: {
    bg: 'bg-status-warning',
    text: 'text-white dark:text-bg-base',
    label: 'تحذير',
    emoji: '🟡',
  },
  critical: {
    bg: 'bg-status-critical',
    text: 'text-white dark:text-bg-base',
    label: 'حرج',
    emoji: '🔴',
  },
};

export default function HealthBadge({ health = 'good', className }) {
  const config = HEALTH_CONFIG[health] || HEALTH_CONFIG.good;
  
  // PRD requires: "Filled pill. Green/Yellow/Red. Shows emoji + text"
  return (
    <div className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans gap-1.5 shadow-sm',
      config.bg,
      config.text,
      className
    )}>
      <span aria-hidden="true" className="text-[10px] sm:text-xs">{config.emoji}</span>
      <span>{config.label}</span>
    </div>
  );
}
