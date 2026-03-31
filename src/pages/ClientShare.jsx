import React from 'react';
import { useParams } from 'react-router-dom';
import HealthBadge from '@/components/common/HealthBadge';
import StatusBadge from '@/components/common/StatusBadge';
import PaymentProgressBar from '@/components/common/PaymentProgressBar';
import TimelineView from '@/components/common/TimelineView';
import AmountDisplay from '@/components/common/AmountDisplay';
import { useProjectByShareToken } from '@/hooks/useData';

export default function ClientShare() {
  const { token } = useParams();
  const { data: project, isLoading, error } = useProjectByShareToken(token);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center" dir="rtl">
        <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }
  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4" dir="rtl">
        <div className="text-center text-text-muted font-sans">
          <p className="text-lg font-semibold mb-2">الرابط غير صالح أو منتهي الصلاحية.</p>
          <p className="text-sm">تواصل مع المكتب الهندسي للحصول على رابط جديد.</p>
        </div>
      </div>
    );
  }

  const milestones = (project.milestones || []).map(m => ({
    ...m, title: m.name, due_date: m.deadline,
  }));
  const totalPaid = milestones.filter(m => m.status === 'paid').reduce((s, m) => s + Number(m.amount), 0);
  const progress = milestones.length > 0 ? Math.round((milestones.filter(m => m.status === 'paid').length / milestones.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto mb-8 flex justify-center">
        <div className="bg-bg-surface px-6 py-3 rounded-2xl border border-border-default shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg leading-none">E</div>
          <div>
            <span className="font-bold text-lg tracking-tight text-text-primary block leading-none">EngiTrack</span>
            <span className="text-[10px] text-text-muted font-sans uppercase tracking-wider">بوابة العميل</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 md:p-10 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border-subtle pb-8 mb-8">
            <div>
              <p className="text-sm font-sans text-text-secondary mb-2">مرحباً <strong className="text-text-primary">{project.client?.name}</strong>، هذا ملخص مشروعكم:</p>
              <h1 className="text-2xl md:text-3xl font-bold font-sans text-text-primary tracking-tight mb-4">{project.name}</h1>
              <div className="flex gap-3">
                <HealthBadge health={project.health} />
                <StatusBadge type={project.status} size="sm" />
              </div>
            </div>
            <div className="bg-bg-base border border-border-default rounded-xl p-5 text-center min-w-[200px]">
              <span className="text-xs text-text-muted font-sans block mb-1">نسْبة الإنجاز الكلّية</span>
              <span className="text-3xl font-mono font-bold text-accent mb-2 block" dir="ltr">{progress}%</span>
              <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 font-sans">الملخص المالي المعتمد</h2>
              <PaymentProgressBar amount={Number(project.total_contract_value)} paid={totalPaid} />
              <div className="mt-4 flex justify-between text-sm font-sans">
                <span className="text-text-muted">المتبقي</span>
                <AmountDisplay amount={Number(project.total_contract_value) - totalPaid} size="sm" />
              </div>
            </div>
            <div className="bg-bg-base rounded-xl p-4 border border-border-default space-y-3 font-sans text-sm">
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-secondary">تاريخ بدء المشروع</span>
                <span className="font-mono text-text-primary" dir="ltr">{project.start_date || '–'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">التسليم المتوقع</span>
                <span className="font-mono text-text-primary" dir="ltr">{project.end_date || '–'}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-text-primary font-sans mb-6 px-2">الجدول الزمني لحالة المشروع</h2>
          <div className="bg-bg-surface border border-border-default rounded-2xl shadow-sm overflow-hidden">
            <TimelineView milestones={milestones} />
          </div>
        </div>
      </div>
    </div>
  );
}
