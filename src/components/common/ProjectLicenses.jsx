import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectLicenses, useCreateLicense, useDeleteLicense, useUploadLicenseDocument } from '@/hooks/useProjectLicenses';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import LicenseForm from '@/components/forms/LicenseForm';
import { toast } from 'sonner';

const MANDATORY_LICENSES = ['survey', 'demolition', 'building'];

const PREDEFINED_TYPES = {
  survey: { label: 'قرار مساحي', icon: '📐', color: 'text-accent' },
  demolition: { label: 'رخصة هدم', icon: '🔨', color: 'text-status-critical' },
  building: { label: 'رخصة بناء', icon: '🏗️', color: 'text-status-good' },
  residential: { label: 'قرار سكني', icon: '🏠', color: 'text-accent' },
};

const getLicenseTypeInfo = (type) => PREDEFINED_TYPES[type] || { label: type, icon: '📄', color: 'text-text-primary' };

const LICENSE_STATUSES = {
  pending: { label: 'قيد الإصدار', color: 'text-status-warning', bg: 'bg-status-warning/10' },
  approved: { label: 'صادرة', color: 'text-status-good', bg: 'bg-status-good/10' },
  rejected: { label: 'مرفوضة', color: 'text-status-critical', bg: 'bg-status-critical/10' },
  revision: { label: 'مطلوب تعديل', color: 'text-text-muted', bg: 'bg-text-muted/10' },
};

export default function ProjectLicenses({ projectId }) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';

  const { data: licenses = [], isLoading } = useProjectLicenses(projectId);
  const createLicense = useCreateLicense();
  const deleteLicense = useDeleteLicense();
  const uploadLicenseDocument = useUploadLicenseDocument();

  const handleCreate = async (data) => {
    try {
      const newLicense = await createLicense.mutateAsync({
        projectId,
        type: data.type,
        requestNumber: data.requestNumber,
        notes: data.notes,
        createdBy: useAuthStore.getState().user?.id
      });

      if (data.file && newLicense) {
        await uploadLicenseDocument.mutateAsync({
          licenseId: newLicense.id,
          projectId,
          file: data.file
        });
      }
      setShowForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (data) => {
    await createLicense.mutateAsync({
      projectId,
      type: data.type,
      requestNumber: data.requestNumber,
      notes: data.notes,
      createdBy: useAuthStore.getState().user?.id
    });
    setEditingLicense(null);
    setShowForm(false);
  };

  const handleDelete = (license) => {
    const typeInfo = getLicenseTypeInfo(license.type);
    if (window.confirm(`هل أنت متأكد من حذف "${typeInfo.label}"؟`)) {
      deleteLicense.mutate(license.id, {
        onSuccess: () => {
          toast.success('تم حذف الرخصة بنجاح');
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const mandatoryLicenses = licenses.filter(l => MANDATORY_LICENSES.includes(l.type));
  // Sort mandatory to a specific order
  mandatoryLicenses.sort((a, b) => MANDATORY_LICENSES.indexOf(a.type) - MANDATORY_LICENSES.indexOf(b.type));
  const optionalLicenses = licenses.filter(l => !MANDATORY_LICENSES.includes(l.type));

  const renderLicenseCard = (license) => {
    const typeInfo = getLicenseTypeInfo(license.type);
    const statusInfo = LICENSE_STATUSES[license.status];
    const docCount = license.documents?.length || 0;
    const isMandatory = MANDATORY_LICENSES.includes(license.type);

    return (
      <div
        key={license.id}
        onClick={() => navigate(`/projects/${projectId}/licenses/${license.id}`)}
        className={cn(
          "bg-bg-surface border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md",
          "hover:border-accent/50"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{typeInfo.icon}</div>
            <div>
              <h4 className={cn("font-bold font-sans text-base", typeInfo.color)}>
                {typeInfo.label}
              </h4>
              <div className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans mt-1",
                statusInfo.bg,
                statusInfo.color
              )}>
                {statusInfo.label}
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditingLicense(license); setShowForm(true); }}
                className="h-7 w-7 p-0 hover:bg-accent/10"
              >
                <Edit className="w-3.5 h-3.5 text-accent" />
              </Button>
              {!isMandatory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(license)}
                  className="h-7 w-7 p-0 hover:bg-status-critical/10"
                  disabled={deleteLicense.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 text-status-critical" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        {license.request_number && (
          <div className="text-xs font-sans text-text-muted mb-2">
            رقم الطلب: <span className="font-mono" dir="ltr">{license.request_number}</span>
          </div>
        )}

        {license.notes && (
          <p className="text-xs text-text-secondary font-sans line-clamp-2 mb-3">
            {license.notes}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-text-muted font-sans">
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{docCount} مستند{docCount !== 1 ? 'ات' : ''}</span>
          </div>
          <span>
            {new Date(license.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <LicenseForm 
        isOpen={showForm} 
        onClose={() => { setShowForm(false); setEditingLicense(null); }} 
        projectId={projectId}
        initialData={editingLicense}
        onSave={editingLicense ? handleUpdate : handleCreate}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-sans text-text-primary">رخص المشروع</h3>
          <p className="text-xs text-text-muted font-sans mt-1">إدارة رخص البناء والقرارات السكنية</p>
        </div>
        {isOwner && (
          <Button
            onClick={() => { setEditingLicense(null); setShowForm(true); }}
            className="bg-accent hover:bg-accent/90"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة رخصة
          </Button>
        )}
      </div>

      {licenses.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border-default rounded-xl">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-sm font-sans text-text-muted">لا توجد رخص مضافة لهذا المشروع</p>
          {isOwner && (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="mt-4 border-border-default"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول رخصة
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {mandatoryLicenses.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-text-primary font-sans border-b border-border-subtle pb-2">الرخص الأساسية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mandatoryLicenses.map(renderLicenseCard)}
              </div>
            </div>
          )}
          
          {optionalLicenses.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-text-primary font-sans border-b border-border-subtle pb-2">الرخص الإضافية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {optionalLicenses.map(renderLicenseCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
