import React from 'react';
import { cn } from '@/lib/utils';

export default function FormField({ label, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="text-sm font-medium text-text-primary font-sans block">{label}</label>}
      {children}
      {error && <p className="text-xs text-status-critical font-sans mt-1">{error}</p>}
    </div>
  );
}
