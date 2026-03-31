import React from 'react';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import PaymentProgressBar from './PaymentProgressBar';
import { Calendar, DollarSign, AlertCircle } from 'lucide-react';

export default function MilestoneCard({ milestone, className }) {
  const {
    title = 'مرحلة جديدة',
    due_date,
    amount = 0,
    paid_amount = 0,
    status = 'waiting',
    late_fee_amount = 0,
  } = milestone || {};

  const amountNumber = Number(amount);
  const paidNumber = Number(paid_amount);
  const lateFeeNumber = Number(late_fee_amount);
  const isLate = status === 'late';

  return (
    <div className={cn(
      "bg-bg-surface border border-border-default rounded-xl p-5 hover:bg-bg-elevated/30 transition-colors shadow-sm relative overflow-hidden",
      isLate && "border-status-critical/50 shadow-sm shadow-status-critical/10",
      className
    )}>
      {isLate && (
        <div className="absolute top-0 right-0 w-2 h-full bg-status-critical" />
      )}
      
      <div className="flex justify-between items-start mb-4 pl-4 pr-1">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-text-primary text-base font-sans">{title}</h3>
            <StatusBadge type={status} size="sm" />
          </div>
          {due_date && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted font-sans mt-2">
              <Calendar className="w-3.5 h-3.5" />
              <span dir="ltr">{due_date}</span>
            </div>
          )}
        </div>
        
        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      <PaymentProgressBar amount={amountNumber + lateFeeNumber} paid={paidNumber} className="my-4" />

      {lateFeeNumber > 0 && (
        <div className="mt-3 bg-status-critical/5 border border-status-critical/20 rounded-md p-2.5 flex items-center gap-2 text-xs font-sans text-status-critical">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>غرامة تأخير: {lateFeeNumber.toLocaleString()} ج.م</span>
        </div>
      )}
    </div>
  );
}
