import React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react'; // Default icon

export default function EmptyState({ 
  title = 'لا توجد بيانات', 
  description = 'لم يتم العثور على سجلات تطابق طلبك.',
  icon: Icon = FolderOpen,
  action,
  className 
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center min-h-[200px] bg-bg-base/50 border border-border-subtle rounded-lg border-dashed',
      className
    )}>
      <div className="w-12 h-12 bg-bg-surface rounded-full flex items-center justify-center text-text-muted mb-4 shadow-sm border border-border-default">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-text-primary font-medium font-sans text-base mb-1">{title}</h3>
      <p className="text-text-secondary text-sm font-sans max-w-sm mb-6">{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
