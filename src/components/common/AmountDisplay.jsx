import React from 'react';
import { cn } from '@/lib/utils';

export default function AmountDisplay({ 
  amount = 0, 
  type = 'neutral', // 'income', 'expense', 'neutral'
  size = 'md',      // 'sm', 'md', 'lg'
  showSign = false,
  className 
}) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Format with commas, 2 decimals
  const formattedAmount = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl sm:text-2xl',
  };

  const typeConfig = {
    income: {
      color: 'text-income',
      sign: '+',
    },
    expense: {
      color: 'text-expense',
      sign: '-',
    },
    neutral: {
      color: 'text-text-primary',
      sign: isNegative ? '-' : '',
    },
  };

  const config = typeConfig[type] || typeConfig.neutral;
  const displaySign = showSign ? config.sign : (isNegative ? '-' : '');

  // PRD requires: "Always uses font-mono. Color-coded if type provided."
  return (
    <div className={cn(
      'inline-flex items-baseline font-mono tracking-tight gap-1',
      config.color,
      sizeClasses[size],
      className
    )} dir="ltr"> {/* Force LTR for numbers so minus sign is on the left */}
      <span className="text-text-muted text-[0.8em] font-sans font-medium select-none ml-1">ج.م</span>
      <span>{displaySign}{formattedAmount}</span>
    </div>
  );
}
