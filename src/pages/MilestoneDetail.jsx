import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, Download, Calculator, CheckCircle2 } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import PaymentProgressBar from '@/components/common/PaymentProgressBar';
import AmountDisplay from '@/components/common/AmountDisplay';
import DataTable from '@/components/common/DataTable';
import PageTransition from '@/components/common/PageTransition';
import PaymentForm from '@/components/forms/PaymentForm';
import MilestoneForm from '@/components/forms/MilestoneForm';
import { useMilestone } from '@/hooks/useData';

export default function MilestoneDetail() {
  const { projectId, id } = useParams();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const { data: milestone, isLoading } = useMilestone(id);

  if (isLoading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  }
  if (!milestone) {
    return <div className="p-12 text-center text-text-muted font-sans">لم يتم العثور على المرحلة.</div>;
  }

  const amount = Number(milestone.amount);
  const lateFeeAmount = Number(milestone.lateFee || 0);
  const totalDue = amount + lateFeeAmount;
  const paid = Number(milestone.paid || 0);
  const remaining = Math.max(0, totalDue - paid);

  const paymentColumns = [
    { title: 'المبلغ', key: 'amount_paid', render: (val) => <AmountDisplay amount={Number(val)} size="sm" /> },
    { title: 'التاريخ', key: 'paid_at', cellClassName: 'font-mono text-text-secondary', render: (val) => val ? new Date(val).toLocaleDateString('ar-EG') : '–' },
    { title: 'الملاحظات', key: 'notes', render: (val) => val || '–' },
    { title: 'الإيصال', key: 'receipt_url', render: (val) => {
      if (!val) return <span className="text-text-muted">لا يوجد</span>;
      const isImage = val.match(/\.(jpeg|jpg|gif|png|webp)/i);
      return (
        <div className="flex items-center gap-2">
          {isImage && (
            <div className="w-8 h-8 rounded border border-border-default overflow-hidden bg-white shrink-0 cursor-pointer" onClick={() => window.open(val, '_blank')}>
              <img src={val} className="w-full h-full object-cover" alt="receipt" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.open(val, '_blank')}
            className="h-8 text-accent hover:text-accent-hover hover:bg-accent/10 font-sans"
          >
            {isImage ? 'عرض' : 'تحميل'} <Download className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      );
    }},
  ];

  return (
    <PageTransition className="space-y-6">
      <PaymentForm isOpen={showPaymentForm} onClose={() => setShowPaymentForm(false)} milestoneId={id} officeId={milestone.office_id} />
      <MilestoneForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} projectId={projectId} initialData={milestone} />
      <div className="flex items-center gap-2 text-sm text-text-muted font-sans mb-2">
        <Link to={`/projects/${projectId || milestone.project?.id}`} className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة لتفاصيل المشروع
        </Link>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-border-subtle pb-6">
          <div>
            {milestone.project?.name && <div className="text-xs text-text-muted font-sans mb-1">{milestone.project.name}</div>}
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-sans text-text-primary tracking-tight">{milestone.title}</h1>
              <StatusBadge type={milestone.status} size="sm" />
            </div>
            <div className="text-sm text-text-secondary font-sans font-medium flex items-center gap-1.5 mt-2">
              تاريخ الاستحقاق: <span dir="ltr" className="font-mono text-status-critical">{milestone.deadline || '–'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowEditForm(true)} className="font-sans border-border-default">
              تعديل المرحلة
            </Button>
            <Button variant="outline" className="font-sans border-border-default">
              <Calculator className="w-4 h-4 ml-2" /> إنشاء فاتورة ضريبية
            </Button>
            <Button onClick={() => setShowPaymentForm(true)} className="bg-status-good hover:bg-status-good/90 text-white font-sans">
              <Plus className="w-4 h-4 ml-2" /> تسجيل دفعة جديدة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-text-primary font-sans mb-4">الملخص المالي</h3>
            <div className="space-y-3 font-sans text-sm bg-bg-base/50 p-4 rounded-lg border border-border-subtle">
              <div className="flex justify-between">
                <span className="text-text-secondary">قيمة المرحلة الأساسية</span>
                <span className="font-mono" dir="ltr">{amount.toLocaleString()} ج.م</span>
              </div>
              {lateFeeAmount > 0 && (
                <div className="flex justify-between text-status-critical">
                  <span>غرامة التأخير المتراكمة</span>
                  <span className="font-mono" dir="ltr">{lateFeeAmount.toLocaleString()} ج.م</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border-default mt-2 pt-2 font-semibold">
                <span className="text-text-primary">إجمالي المستحق</span>
                <span className="font-mono" dir="ltr">{totalDue.toLocaleString()} ج.م</span>
              </div>
            </div>
            
            {remaining > 0 && (
              <div className="mt-6 bg-status-warning/10 border border-status-warning/30 p-4 rounded-lg flex items-center justify-between">
                <span className="font-medium text-status-warning text-sm">المبلغ المتبقي للتحصيل</span>
                <span className="text-xl font-bold font-mono text-status-warning" dir="ltr">{remaining.toLocaleString()} ج.م</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary font-sans mb-4">مؤشر السداد</h3>
            <PaymentProgressBar amount={totalDue} paid={paid} className="mb-4" />
            {remaining <= 0 && (
              <div className="flex flex-col items-center justify-center p-6 bg-status-good/10 text-status-good rounded-xl border border-status-good/20 mt-4 h-32 text-center">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <span className="font-medium">المرحلة مسدّدة بالكامل</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-primary font-sans mb-4">سجل الدفعات</h2>
        <DataTable columns={paymentColumns} data={milestone.payments || []} emptyStateTitle="لا توجد دفعات مسجلة" />
      </div>
    </PageTransition>
  );
}
