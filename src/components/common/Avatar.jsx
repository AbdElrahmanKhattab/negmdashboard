import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export default function Avatar({ 
  src, 
  alt = 'User', 
  initials,
  size = 'md',
  className 
}) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-16 h-16 text-xl',
  };

  const hasImage = Boolean(src);
  const displayInitials = initials || (alt ? alt.substring(0, 2).toUpperCase() : '');

  return (
    <div className={cn(
      'relative flex shrink-0 overflow-hidden rounded-full bg-bg-elevated border border-border-default text-text-muted justify-center items-center font-medium font-sans',
      sizeClasses[size],
      className
    )}>
      {hasImage ? (
        <img 
          src={src} 
          alt={alt} 
          className="aspect-square h-full w-full object-cover"
        />
      ) : displayInitials ? (
        <span>{displayInitials}</span>
      ) : (
        <User className="w-1/2 h-1/2" />
      )}
    </div>
  );
}
