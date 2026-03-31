import React from 'react';
import { cn } from '@/lib/utils';
import EmptyState from './EmptyState';
import { Table as TableIcon } from 'lucide-react';

export default function DataTable({ 
  columns = [], 
  data = [], 
  isLoading = false,
  emptyStateTitle = 'لا توجد بيانات',
  emptyStateDesc = 'لم يتم العثور على سجلات في هذا الجدول.',
  className 
}) {
  if (isLoading) {
    return (
      <div className={cn("bg-bg-surface border border-border-default rounded-xl p-8 flex justify-center", className)}>
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("bg-bg-surface border border-border-default rounded-xl overflow-hidden", className)}>
        <EmptyState title={emptyStateTitle} description={emptyStateDesc} icon={TableIcon} />
      </div>
    );
  }

  return (
    <div className={cn("bg-bg-surface border border-border-default rounded-xl shadow-sm overflow-hidden overflow-x-auto", className)}>
      <table className="w-full text-right font-sans text-sm">
        <thead className="bg-bg-elevated border-b border-border-default text-text-secondary">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={col.key || idx} 
                className={cn("px-5 py-3 font-medium whitespace-nowrap", col.headerClassName)}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-text-primary">
          {data.map((row, rowIdx) => (
            <tr key={row.id || rowIdx} className="hover:bg-bg-elevated/50 transition-colors">
              {columns.map((col, colIdx) => (
                <td 
                  key={`${row.id || rowIdx}-${col.key || colIdx}`} 
                  className={cn("px-5 py-4", col.cellClassName)}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
