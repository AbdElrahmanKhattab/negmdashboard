import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import HealthBadge from '@/components/common/HealthBadge';
import StatusBadge from '@/components/common/StatusBadge';
import TimelineView from '@/components/common/TimelineView';
import CommentThread from '@/components/common/CommentThread';
import ActivityFeed from '@/components/common/ActivityFeed';
import KPICard from '@/components/common/KPICard';
import PageTransition from '@/components/common/PageTransition';
import ProjectForm from '@/components/forms/ProjectForm';
import ProjectDocuments from './ProjectDocuments';
import ProjectStages from '@/components/common/ProjectStages';
import { useProject, useComments, useActivityLog, useCreateComment } from '@/hooks/useData';
import { useStageProgress } from '@/hooks/useProjectStages';
import { useRealtimeComments } from '@/hooks/useRealtime';
import { useAuthStore } from '@/stores/authStore';

export default function ProjectDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditProjectForm, setShowEditProjectForm] = useState(false);
  const user = useAuthStore(s => s.user);
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';

  const { data: project, isLoading } = useProject(id);
  const { data: comments } = useComments(id);
  const { data: activities } = useActivityLog(id);
  const { data: stageProgress } = useStageProgress(id);
  const addComment = useCreateComment();

  useRealtimeComments(id);

  const tabs = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'stages', label: 'المراحل' },
    { id: 'documents', label: 'المستندات' },
    { id: 'timeline', label: 'الجدول الزمني' },
    { id: 'comments', label: 'التعليقات' },
    { id: 'activity', label: 'سجل النشاط' },
  ];

  if (isLoading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  }
  if (!project) {
    return <div className="p-12 text-center text-text-muted font-sans">لم يتم العثور على المشروع.</div>;
  }

const totalPaid = (project.milestones || []).reduce((s, m) => s + Number(m.paid_amount || 0), 0);
const totalLateFees = (project.milestones || []).reduce((s, m) => s + Number(m.late_fee_amount || 0), 0);
const totalProjectValue = Number(project.total_contract_value) + totalLateFees;
const milestones = (project.milestones || []).map(m => ({
  ...m,
  title: m.name,
  due_date: m.deadline,
}));

  const handleAddComment = (body) => {
    if (!user) return;
    addComment.mutate({
      project_id: id,
      office_id: project.office_id,
      user_id: user.id,
      content: body,
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/share/${project.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ رابط المشاركة بنجاح');
  };

  return (
    <PageTransition className="space-y-6 flex flex-col h-full">
      <ProjectForm isOpen={showEditProjectForm} onClose={() => setShowEditProjectForm(false)} initialData={project} />
      <div className="flex items-center gap-2 text-sm text-text-muted font-sans mb-2 shrink-0">
        <Link to="/projects" className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للمشاريع
        </Link>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-sans text-text-primary tracking-tight">{project.name}</h1>
              <HealthBadge health={project.health} />
              <StatusBadge type={project.status} size="sm" />
            </div>
            <p className="text-sm font-sans text-text-secondary">
              العميل: <Link to={`/clients/${project.client_id}`} className="text-accent hover:underline">{project.client?.name}</Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare} className="font-sans border-border-default h-9">
              <Share2 className="w-4 h-4 ml-2" /> مشاركة رابط العميل
            </Button>
            {isOwner && (
              <Button variant="outline" onClick={() => setShowEditProjectForm(true)} className="font-sans border-border-default h-9">
                <Edit className="w-4 h-4 ml-2" /> تعديل
              </Button>
            )}
          </div>
        </div>

        {/* Stage Progress Indicator */}
        {stageProgress && stageProgress.total > 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-sans font-medium text-text-primary">تقدم المراحل</span>
              <span className="text-xs font-sans text-text-muted">
                {stageProgress.progress}% ({stageProgress.completed}/{stageProgress.total} مراحل مكتملة)
              </span>
            </div>
            <div className="w-full bg-bg-elevated rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-status-good to-status-good/70 transition-all duration-500 rounded-full"
                style={{ width: `${stageProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2 space-x-reverse border-b border-border-default shrink-0 overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 font-sans text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <KPICard title="قيمة التعاقد الأصلية" value={Number(project.total_contract_value)} trend={0} />
                <KPICard title="المدفوع حتى الآن" value={totalPaid} trend={0} />
                <KPICard title="إجمالي غرامات التأخير" value={totalLateFees} trend={0} variant={totalLateFees > 0 ? 'warning' : 'default'} />
                <KPICard title="الإجمالي المستحق" value={totalProjectValue} trend={0} />
              </div>
              <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-text-primary mb-4 font-sans border-b border-border-subtle pb-4">تفاصيل المشروع</h3>
                <div className="space-y-4 font-sans text-sm">
                  <div className="grid grid-cols-3 border-b border-border-subtle pb-3">
                    <span className="text-text-secondary">تاريخ البدء</span>
                    <span className="col-span-2 text-text-primary font-mono" dir="ltr">{project.start_date || '–'}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-border-subtle pb-3">
                    <span className="text-text-secondary">تاريخ التسليم</span>
                    <span className="col-span-2 text-text-primary font-mono" dir="ltr">{project.end_date || '–'}</span>
                  </div>
                  {project.description && (
                    <div className="grid grid-cols-3 pb-3">
                      <span className="text-text-secondary">الوصف</span>
                      <span className="col-span-2 text-text-primary">{project.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stages' && (
          <ProjectStages projectId={id} />
        )}

        {activeTab === 'documents' && (
          <ProjectDocuments projectId={id} />
        )}

        {activeTab === 'timeline' && (
          <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm max-w-3xl">
            <TimelineView milestones={milestones} />
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm h-full max-h-[600px] max-w-3xl flex flex-col">
            <CommentThread comments={comments || []} onAddComment={handleAddComment} />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="max-w-3xl">
            <ActivityFeed activities={activities || []} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
