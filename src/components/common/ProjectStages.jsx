import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStages, useStageProgress, useUpdateStage } from '@/hooks/useProjectStages';
import { useProject } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { FileText, Edit, CheckCircle, Clock, Circle, DollarSign, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  not_started: {
    label: 'لم يبدأ',
    color: 'text-text-muted',
    bg: 'bg-text-muted/10',
    icon: Circle,
  },
  in_progress: {
    label: 'جاري التنفيذ',
    color: 'text-status-warning',
    bg: 'bg-status-warning/10',
    icon: Clock,
  },
  completed: {
    label: 'مكتمل',
    color: 'text-status-good',
    bg: 'bg-status-good/10',
    icon: CheckCircle,
  },
};

export default function ProjectStages({ projectId }) {
  const navigate = useNavigate();
  const [editingAmountId, setEditingAmountId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';

  const { data: stages, isLoading } = useProjectStages(projectId);
  const { data: project } = useProject(projectId);
  const { data: progress } = useStageProgress(projectId);
  const updateStage = useUpdateStage();

  const contractValue = Number(project?.total_contract_value || 0);
  const totalDistributed = stages?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;
  const remainingAmount = contractValue - totalDistributed;
  const isFullyDistributed = Math.abs(remainingAmount) < 0.01;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="p-12 text-center text-text-muted font-sans">
        لا توجد مراحل متاحة لهذا المشروع.
      </div>
    );
  }

  const handleStartEditing = (stageId, currentAmount) => {
    setEditingAmountId(stageId);
    setEditingAmount(currentAmount || 0);
  };

  const handleSaveAmount = async (stageId) => {
    const amount = Number(editingAmount);
    if (amount < 0) {
      toast.error('المبلغ لا يمكن أن يكون سالباً');
      return;
    }

    await updateStage.mutateAsync({
      stageId,
      amount
    }, {
      onSuccess: () => {
        setEditingAmountId(null);
        setEditingAmount('');
      }
    });
  };

  const handleDistributeEqually = async () => {
    const amountPerStage = contractValue / stages.length;
    
    const updates = stages.map(stage => 
      updateStage.mutateAsync({ stageId: stage.id, amount: amountPerStage })
    );
    
    await Promise.all(updates);
    toast.success(`تم توزيع ${contractValue.toLocaleString('ar-EG')} بالتساوي على ${stages.length} مراحل`);
  };

  const handleDistributeRemaining = async () => {
    const stagesWithZero = stages.filter(s => !s.amount || s.amount === 0);
    if (stagesWithZero.length === 0) {
      toast.warning('لا توجد مراحل فارغة لتوزيع المبلغ المتبقي');
      return;
    }

    const amountPerStage = remainingAmount / stagesWithZero.length;
    
    const updates = stagesWithZero.map(stage => 
      updateStage.mutateAsync({ stageId: stage.id, amount: amountPerStage })
    );
    
    await Promise.all(updates);
    toast.success(`تم توزيع المبلغ المتبقي (${remainingAmount.toLocaleString('ar-EG')}) على ${stagesWithZero.length} مراحل`);
  };

  const handleKeyDown = (e, stageId) => {
    if (e.key === 'Enter') {
      handleSaveAmount(stageId);
    } else if (e.key === 'Escape') {
      setEditingAmountId(null);
      setEditingAmount('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {progress && (
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-primary font-sans">تقدم المشروع</h3>
            <span className="text-sm font-sans font-medium text-text-primary">
              {progress.progress}% ({progress.completed}/{progress.total} مراحل مكتملة)
            </span>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-accent to-accent/70 transition-all duration-500 rounded-full"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Amount Distribution Panel */}
      {isOwner && (
        <div className={cn(
          "bg-bg-surface border rounded-xl p-6 shadow-sm",
          isFullyDistributed ? "border-status-good/50" : "border-status-warning/50"
        )}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-primary font-sans flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent" />
                توزيع المبالغ
              </h3>
              <p className="text-xs text-text-muted font-sans mt-1">قم بتوزيع قيمة العقد على المراحل</p>
            </div>
            {!isFullyDistributed && (
              <div className="flex items-center gap-1.5 text-status-warning text-sm font-sans">
                <AlertTriangle className="w-4 h-4" />
                <span>غير موزع بالكامل</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-bg-base rounded-lg">
              <div className="text-xs text-text-muted mb-1">قيمة العقد</div>
              <div className="text-xl font-sans font-bold text-text-primary font-mono" dir="ltr">
                {contractValue.toLocaleString('en-US')} ر.س
              </div>
            </div>
            <div className="p-4 bg-bg-base rounded-lg">
              <div className="text-xs text-text-muted mb-1">الموزع</div>
              <div className="text-xl font-sans font-bold text-status-good font-mono" dir="ltr">
                {totalDistributed.toLocaleString('en-US')} ر.س
              </div>
            </div>
            <div className="p-4 bg-bg-base rounded-lg">
              <div className="text-xs text-text-muted mb-1">المتبقي</div>
              <div className={cn(
                "text-xl font-sans font-bold font-mono",
                isFullyDistributed ? "text-status-good" : "text-status-warning"
              )} dir="ltr">
                {remainingAmount.toLocaleString('en-US')} ر.س
              </div>
            </div>
          </div>

          {!isFullyDistributed && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleDistributeEqually}
                disabled={updateStage.isPending}
                className="bg-accent hover:bg-accent/90"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 ml-2" />
                توزيع بالتساوي
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDistributeRemaining}
                disabled={updateStage.isPending || remainingAmount === 0}
                className="border-border-default"
              >
                توزيع المتبقي على المراحل الفارغة
              </Button>
            </div>
          )}

          {isFullyDistributed && (
            <div className="flex items-center gap-2 p-3 bg-status-good/10 rounded-lg text-status-good text-sm font-sans">
              <CheckCircle className="w-4 h-4" />
              تم توزيع كامل قيمة العقد بنجاح
            </div>
          )}
        </div>
      )}

      {/* Stages Timeline */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-text-primary font-sans mb-6 border-b border-border-subtle pb-4">
          مراحل المشروع
        </h3>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.not_started;
            const Icon = config.icon;
            const hasDocuments = stage.documents && stage.documents.length > 0;
            const paidAmount = Number(stage.paid_amount || 0);
            const remainingAmount = Number(stage.remaining_amount || stage.amount);
            const paymentPercentage = Number(stage.payment_percentage || 0);
            const hasFinancials = stage.amount > 0;

            return (
              <div
                key={stage.id}
                onClick={() => navigate(`/projects/${projectId}/stages/${stage.id}`)}
                className={cn(
                  "relative border rounded-xl p-4 transition-all duration-200 cursor-pointer",
                  "hover:border-accent/50 hover:bg-accent/5",
                  stage.status === 'completed' && "border-status-good/30 bg-status-good/5",
                  stage.status === 'in_progress' && "border-status-warning/30 bg-status-warning/5"
                )}
              >
                {/* Stage Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Stage Number & Connector */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        stage.status === 'completed' && "bg-status-good text-white",
                        stage.status === 'in_progress' && "bg-status-warning text-white",
                        stage.status === 'not_started' && "bg-text-muted/20 text-text-muted"
                      )}>
                        {index + 1}
                      </div>
                      {index < stages.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-8 mt-2",
                          stage.status === 'completed' ? "bg-status-good" : "bg-border-subtle"
                        )} />
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-text-primary font-sans text-base">
                          {stage.stage_name}
                        </h4>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-medium",
                          config.bg,
                          config.color
                        )}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </div>
                        {hasDocuments && (
                          <div className="flex items-center gap-1 text-text-muted text-xs">
                            <FileText className="w-3 h-3" />
                            <span>{stage.documents.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Financial Info */}
                      {hasFinancials && (
                        <div className="mb-2 space-y-2">
                          <div className="flex items-center gap-4 text-xs font-sans">
                            {editingAmountId === stage.id && isOwner ? (
                              <div className="flex items-center gap-2 w-full bg-bg-base p-2 rounded-lg border border-accent">
                                <DollarSign className="w-3.5 h-3.5 text-accent" />
                                <input
                                  type="number"
                                  value={editingAmount}
                                  onChange={(e) => setEditingAmount(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, stage.id)}
                                  className="flex-1 px-2 py-1 bg-transparent border-none text-xs font-mono text-text-primary focus:outline-none"
                                  dir="ltr"
                                  autoFocus
                                  placeholder="0.00"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); handleSaveAmount(stage.id); }}
                                    disabled={updateStage.isPending}
                                    className="h-6 w-6 p-0 text-status-good hover:bg-status-good/10"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); setEditingAmountId(null); setEditingAmount(''); }}
                                    className="h-6 w-6 p-0 text-text-muted hover:bg-bg-elevated"
                                  >
                                    <Circle className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 text-text-muted">
                                  <DollarSign className="w-3 h-3" />
                                  <span className="text-xs">المبلغ:</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); isOwner && handleStartEditing(stage.id, stage.amount); }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-base hover:bg-accent/5 border border-border-default hover:border-accent/50 rounded transition-colors cursor-pointer"
                                    disabled={!isOwner}
                                    title={isOwner ? "تعديل المبلغ" : ""}
                                  >
                                    <span className="font-mono font-semibold text-text-primary text-xs">{Number(stage.amount).toLocaleString('en-US')}</span>
                                    <span className="text-[10px] text-text-muted">ر.س</span>
                                    {isOwner && <Edit className="w-3 h-3 text-accent" />}
                                  </button>
                                </div>
                                {paidAmount > 0 && (
                                  <>
                                    <div className="text-status-good text-xs">
                                      المدفوع: <span className="font-mono font-semibold">{paidAmount.toLocaleString('en-US')} ر.س</span>
                                    </div>
                                    <div className="text-text-muted text-xs">
                                      المتبقي: <span className="font-mono font-semibold">{remainingAmount.toLocaleString('en-US')} ر.س</span>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Payment Progress Bar */}
                          <div className="w-full bg-bg-elevated rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500 rounded-full",
                                paymentPercentage >= 100 ? "bg-status-good" : "bg-accent"
                              )}
                              style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                            />
                          </div>
                          {paidAmount > 0 && (
                            <div className="text-xs text-text-muted font-sans">
                              {paymentPercentage.toFixed(1)}% مدفوع
                            </div>
                          )}
                        </div>
                      )}

                      {stage.request_number && (
                        <div className="text-xs font-sans text-text-muted mb-1">
                          رقم الطلب: <span className="font-mono" dir="ltr">{stage.request_number}</span>
                        </div>
                      )}

                      {stage.notes && (
                        <p className="text-xs text-text-secondary font-sans line-clamp-2">
                          {stage.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions - Navigate Button */}
                  {isOwner && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${projectId}/stages/${stage.id}`);
                        }}
                        className="h-8 w-8 p-0 hover:bg-accent/10"
                      >
                        <Edit className="w-4 h-4 text-accent" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
