import React from 'react';
import { cn } from '@/lib/utils';
import AmountDisplay from './AmountDisplay';

export default function KPICard({ 
  title, 
  value, 
  subtitle,
  isCurrency = false,
  icon: Icon,
  iconBgColor = "bg-[#f0f4f8]",
  iconColor = "text-[#0d47a1]",
  badgeText,
  badgeType = "neutral", // 'positive', 'negative', 'neutral', 'text'
  valueColor = "text-text-primary",
  className 
}) {

  return (
    <div className={cn(
      'bg-bg-surface border border-border-subtle rounded-2xl p-6 flex flex-col justify-between shadow-sm relative h-full min-h-[160px] overflow-hidden group',
      className
    )}>
      
      {/* Top Row: Icon & Badge */}
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", iconBgColor, iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        {badgeText && (
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-bold font-sans tracking-wide",
            badgeType === 'positive' ? "bg-[#dcfce7] text-[#15803d]" : 
            badgeType === 'negative' ? "bg-[#fee2e2] text-[#b91c1c]" : 
            badgeType === 'text' ? "text-[#0d47a1] bg-transparent px-0 text-sm" :
            "bg-bg-elevated text-text-secondary"
          )}>
            {badgeText}
          </div>
        )}
      </div>

      {/* Bottom Row: Title & Values */}
      <div className="mt-auto">
        <h3 className="text-text-secondary font-medium text-sm font-sans mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <div className={cn("text-3xl font-bold font-sans tracking-tight", valueColor)}>
            {isCurrency ? (
              <AmountDisplay amount={value} type="neutral" size="xl" />
            ) : (
              <span>{value}</span>
            )}
          </div>
          {subtitle && (
            <span className={cn("text-sm font-sans font-medium", badgeType === 'negative' ? "text-[#b91c1c]" : "text-text-muted")}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
