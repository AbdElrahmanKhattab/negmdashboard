import React from 'react';
import { cn } from '@/lib/utils';
import AmountDisplay from './AmountDisplay';

export default function PaymentProgressBar({ amount, paid, className }) {
  const progressPercent = amount > 0 ? Math.min(100, (paid / amount) * 100) : 0;
  const isFullyPaid = progressPercent >= 100;
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-end mb-1.5 font-sans">
        <div>
          <span className="text-xs text-text-muted block mb-0.5">المدفوع</span>
          <AmountDisplay amount={paid} size="sm" type={isFullyPaid ? "income" : "neutral"} />
        </div>
        <div className="text-left">
          <span className="text-xs text-text-muted block mb-0.5">من أصل</span>
          <AmountDisplay amount={amount} size="sm" type="neutral" />
        </div>
      </div>
      <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden border border-border-default/50">
        <div 
          className={cn(
            "h-full transition-all duration-500", 
            isFullyPaid ? "bg-status-good" : "bg-accent"
          )} 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
    </div>
  );
}
