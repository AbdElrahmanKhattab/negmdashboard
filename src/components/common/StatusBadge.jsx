import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, AlertCircle, PlayCircle, StopCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  fully_paid: {
    color: 'text-status-good',
    bg: 'bg-status-good/10',
    label: 'مدفوع بالكامل',
    icon: CheckCircle2,
  },
  waiting: {
    color: 'text-status-pending',
    bg: 'bg-status-pending/10',
    label: 'بانتظار البدء',
    icon: Clock,
  },
  in_progress: {
    color: 'text-accent',
    bg: 'bg-accent/10',
    label: 'قيد التنفيذ',
    icon: PlayCircle,
  },
  done: {
    color: 'text-status-good',
    bg: 'bg-status-good/10',
    label: 'تم الإنجاز',
    icon: CheckCircle2,
  },
  late: {
    color: 'text-status-late',
    bg: 'bg-status-late/10',
    label: 'متأخر',
    icon: AlertCircle,
  },
  active: {
    color: 'text-accent',
    bg: 'bg-accent/10',
    label: 'نشط',
    icon: PlayCircle,
  },
  on_hold: {
    color: 'text-status-warning',
    bg: 'bg-status-warning/10',
    label: 'معلق',
    icon: StopCircle,
  },
};

export default function StatusBadge({ type = 'pending', size = 'md', className }) {
  const config = STATUS_CONFIG[type] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs gap-1.5',
    md: 'text-sm gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
  };

  // PRD requires: "No background fill — colored text with matching colored dot only."
  return (
    <div className={cn(
      'inline-flex items-center font-medium font-sans',
      config.color,
      sizeClasses[size],
      className
    )}>
      <Circle className={cn("fill-current", size === 'sm' ? "w-2 h-2" : "w-2.5 h-2.5")} />
      <span>{config.label}</span>
    </div>
  );
}
