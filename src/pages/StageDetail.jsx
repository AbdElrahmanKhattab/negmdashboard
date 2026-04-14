import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStage, useUpdateStage, useCreateStagePayment, useUploadStageDocument, useDeleteStageDocument } from '@/hooks/useProjectStages';
import { useProject } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { ArrowRight, DollarSign, Calendar, FileText, Upload, Trash2, ExternalLink, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';
import FileUpload from '@/components/common/FileUpload';

export default function StageDetail() {
  const { projectId, stageId } = useParams();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receipt, setReceipt] = useState(null);
  
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';
  const currentUser = useAuthStore(state => state.user);

  const { data: stage, isLoading } = useProjectStage(stageId);
  const { data: project } = useProject(projectId);
  const updateStage = useUpdateStage();
  const createPayment = useCreateStagePayment();
  const uploadDocument = useUploadStageDocument();
  const deleteDocument = useDeleteStageDocument();

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="p-12 text-center text-text-muted font-sans">
        لم يتم العثور على المرحلة
      </div>
    );
  }

  const paidAmount = Number(stage.paid_amount || 0);
  const remainingAmount = Number(stage.remaining_amount || stage.amount - paidAmount);
  const paymentPercentage = stage.amount > 0 ? (paidAmount / Number(stage.amount)) * 100 : 0;
  const canComplete = paidAmount >= Number(stage.amount);

  const handleAddPayment = async () => {
    if (!paymentAmount || !project) return;
    
    await createPayment.mutateAsync({
      stageId,
      amount: Number(paymentAmount),
      notes: paymentNotes,
      receiptUrl: receipt?.url,
      officeId: project.office_id,
      createdBy: currentUser?.id
    });
    
    setPaymentAmount('');
    setPaymentNotes('');
    setReceipt(null);
    setShowPaymentForm(false);
  };

  const handleUploadDocument = async (file) => {
    if (!file) return;
    await uploadDocument.mutateAsync({ stageId, file });
  };

  const handleDeleteDocument = (doc) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      deleteDocument.mutate({ documentId: doc.id, fileUrl: doc.file_url, stageId });
    }
  };

  const formatDate = (date) => {
    if (!date) return '–';
    return format(new Date(date), 'PPP', { locale: ar });
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-text-muted font-sans mb-2">
        <Link to={`/projects/${projectId}`} className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للمشروع
        </Link>
      </div>

      {/* Stage Info Card */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sans text-text-primary mb-2">{stage.stage_name}</h1>
            <div className="flex items-center gap-3">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-sans font-medium",
                stage.status === 'completed' && "bg-status-good/10 text-status-good",
                stage.status === 'in_progress' && "bg-status-warning/10 text-status-warning",
                stage.status === 'not_started' && "bg-text-muted/10 text-text-muted"
              )}>
                {stage.status === 'completed' ? 'مكتمل' : stage.status === 'in_progress' ? 'جاري التنفيذ' : 'لم يبدأ'}
              </span>
              {stage.request_number && (
                <span className="text-sm text-text-muted font-mono" dir="ltr">
                  #{stage.request_number}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-bg-base rounded-lg">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <Calendar className="w-3 h-3" />
              <span>تاريخ البدء</span>
            </div>
            <div className="text-sm font-sans font-medium" dir="ltr">
              {formatDate(stage.start_date)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <Calendar className="w-3 h-3" />
              <span>تاريخ الانتهاء</span>
            </div>
            <div className="text-sm font-sans font-medium" dir="ltr">
              {formatDate(stage.end_date)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <Calendar className="w-3 h-3" />
              <span>الموعد النهائي</span>
            </div>
            <div className="text-sm font-sans font-medium" dir="ltr">
              {formatDate(stage.deadline)}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Section */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold font-sans text-text-primary mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-accent" />
          المعلومات المالية
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-bg-base rounded-lg">
            <div className="text-xs text-text-muted mb-1">المبلغ الإجمالي</div>
            <div className="text-xl font-sans font-bold text-text-primary font-mono" dir="ltr">
              {Number(stage.amount).toLocaleString('ar-EG')} ر.س
            </div>
          </div>
          <div className="p-4 bg-bg-base rounded-lg">
            <div className="text-xs text-text-muted mb-1">المدفوع</div>
            <div className="text-xl font-sans font-bold text-status-good font-mono" dir="ltr">
              {paidAmount.toLocaleString('ar-EG')} ر.س
            </div>
          </div>
          <div className="p-4 bg-bg-base rounded-lg">
            <div className="text-xs text-text-muted mb-1">المتبقي</div>
            <div className="text-xl font-sans font-bold text-text-primary font-mono" dir="ltr">
              {remainingAmount.toLocaleString('ar-EG')} ر.س
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-text-muted">نسبة الدفع</span>
            <span className="font-sans font-medium">{paymentPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                paymentPercentage >= 100 ? "bg-status-good" : "bg-accent"
              )}
              style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
            />
          </div>
        </div>

        {!canComplete && stage.status === 'completed' && (
          <div className="flex items-center gap-2 p-3 bg-status-critical/10 border border-status-critical/30 rounded-lg text-status-critical text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>لا يمكن اكتمال المرحلة بدون دفع المبلغ كاملاً</span>
          </div>
        )}

        {/* Payments List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-sans text-text-primary">سجل المدفوعات</h3>
            {isOwner && (
              <Button
                size="sm"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="bg-accent hover:bg-accent/90"
              >
                <Plus className="w-4 h-4 ml-2" /> إضافة دفعة
              </Button>
            )}
          </div>

          {showPaymentForm && isOwner && (
            <div className="p-4 border border-border-default rounded-lg bg-bg-base mb-4 space-y-3">
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">المبلغ</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded-lg font-sans text-sm"
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">ملاحظات</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded-lg font-sans text-sm resize-none"
                  rows={2}
                  placeholder="ملاحظات الدفعة..."
                />
              </div>
              <FileUpload
                bucket="receipts"
                currentFile={receipt}
                onUploadComplete={setReceipt}
                label="ارفع إيصال الدفع"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddPayment} className="bg-accent hover:bg-accent/90">
                  حفظ الدفعة
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentForm(false)} className="border-border-default">
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {stage.payments && stage.payments.length > 0 ? (
            <div className="space-y-2">
              {stage.payments.map(payment => (
                <div key={payment.id} className="p-4 border border-border-subtle rounded-lg bg-bg-base">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-mono font-bold text-text-primary" dir="ltr">
                        {Number(payment.amount_paid).toLocaleString('ar-EG')} ر.س
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {formatDate(payment.paid_at)}
                      </div>
                      {payment.notes && (
                        <div className="text-xs text-text-secondary mt-1">{payment.notes}</div>
                      )}
                    </div>
                    {payment.receipt_url && (
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-text-muted" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-border-default rounded-lg text-text-muted text-sm">
              لا توجد مدفوعات بعد
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold font-sans text-text-primary mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          المستندات
        </h2>

        {isOwner && (
          <div className="mb-4">
            <FileUpload
              bucket="stage_documents"
              onUploadComplete={handleUploadDocument}
              label="ارفع مستند"
            />
          </div>
        )}

        {stage.documents && stage.documents.length > 0 ? (
          <div className="space-y-2">
            {stage.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-border-subtle rounded-lg bg-bg-base">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-sm font-sans text-text-primary">
                    {doc.file_url.split('/').pop()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                  </a>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      className="p-2 hover:bg-status-critical/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-status-critical" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border-2 border-dashed border-border-default rounded-lg text-text-muted text-sm">
            لا توجد مستندات بعد
          </div>
        )}
      </div>
    </PageTransition>
  );
}
