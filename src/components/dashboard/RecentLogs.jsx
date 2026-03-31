import React, { useMemo } from 'react';
import { CheckCircle2, FileEdit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/hooks/useData';

export default function RecentLogs() {
  const { data: transactions, isLoading } = useTransactions();

  const logs = useMemo(() => {
    if (!transactions) return [];

    return transactions.slice(0, 4).map((tx, idx) => {
      const isIncome = tx.type === 'income';
      const isActive = idx === 0 || isIncome; // Just an example logic to light up some items
      
      return {
        id: tx.id,
        title: `Transaction #${tx.id.substring(0, 5).toUpperCase()} ${isIncome ? 'Completed' : 'Initiated'}`,
        description: `${tx.title || 'General Activity'} for ${tx.project?.name || 'internal'}.`,
        time: new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        icon: isIncome ? CheckCircle2 : FileEdit,
        color: isActive ? 'text-[#0d47a1]' : 'text-text-secondary',
        bgColor: isActive ? 'bg-[#e0e7ff]' : 'bg-border-default',
        active: isActive,
      };
    });
  }, [transactions]);

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl shadow-sm p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-bold text-lg text-text-primary tracking-tight">Recent Activity Logs</h2>
          <p className="text-sm font-medium text-text-muted mt-1 font-sans">سجلات العمل</p>
        </div>
      </div>
      
      <div className="relative border-l-2 border-border-default ml-4 space-y-8 pl-8 py-2">
        {isLoading ? (
           <div className="flex justify-center p-4">
             <div className="animate-spin w-5 h-5 border-2 border-[#0d47a1] border-t-transparent rounded-full" />
           </div>
        ) : logs.length === 0 ? (
           <p className="text-sm text-text-muted">No recent activity.</p>
        ) : logs.map((log) => {
          return (
            <div key={log.id} className="relative">
              {/* Timeline dot */}
              <div 
                className={cn(
                  "absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                  log.active ? "bg-[#0d47a1]" : "bg-border-strong"
                )}
              />
              
              <div className="flex flex-col gap-1">
                <h3 className={cn("font-semibold text-sm", log.active ? "text-[#0d47a1]" : "text-text-secondary")}>
                  {log.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
                  {log.description}
                </p>
                <span className="text-xs text-text-muted font-medium mt-1">
                  {log.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
