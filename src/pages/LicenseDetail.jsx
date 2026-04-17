import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectLicense, useUpdateLicense, useUploadLicenseDocument, useDeleteLicenseDocument } from '@/hooks/useProjectLicenses';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Upload, Trash2, ExternalLink, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';
import LicenseForm from '@/components/forms/LicenseForm';
import { toast } from 'sonner';

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

export default function LicenseDetail() {
  const { projectId, licenseId } = useParams();
  const [showEditForm, setShowEditForm] = useState(false);
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';

  const { data: license, isLoading } = useProjectLicense(licenseId);
  const updateLicense = useUpdateLicense();
  const uploadDocument = useUploadLicenseDocument();
  const deleteDocument = useDeleteLicenseDocument();

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!license) {
    return (
      <div className="p-12 text-center text-text-muted font-sans">
        لم يتم العثور على الرخصة
      </div>
    );
  }

  const handleFileUpload = async (file) => {
    if (!file) return;
    await uploadDocument.mutateAsync({ licenseId, projectId, file });
  };

  const handleDeleteDocument = (link) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
      deleteDocument.mutate({ linkId: link.id });
    }
  };

  const typeInfo = getLicenseTypeInfo(license.type);
  const statusInfo = LICENSE_STATUSES[license.status];

  return (
    <PageTransition className="space-y-6">
      <LicenseForm 
        isOpen={showEditForm} 
        onClose={() => setShowEditForm(false)} 
        projectId={projectId}
        initialData={license}
        onSave={(data) => {
          updateLicense.mutate({ licenseId, ...data });
          setShowEditForm(false);
        }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted font-sans mb-2">
        <Link to={`/projects/${projectId}`} className="hover:text-text-primary flex items-center gap-1 transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للمشروع
        </Link>
      </div>

      {/* License Info Card */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{typeInfo.icon}</div>
            <div>
              <h1 className={cn("text-2xl font-bold font-sans mb-2", typeInfo.color)}>
                {typeInfo.label}
              </h1>
              <div className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-sans font-medium",
                statusInfo.bg,
                statusInfo.color
              )}>
                {statusInfo.label}
              </div>
            </div>
          </div>
          {isOwner && (
            <Button
              onClick={() => setShowEditForm(true)}
              variant="outline"
              className="border-border-default"
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </Button>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-bg-base rounded-lg">
          <div>
            <div className="text-xs text-text-muted mb-1">رقم الطلب</div>
            <div className="text-sm font-sans font-mono" dir="ltr">
              {license.request_number || '–'}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">تاريخ الإنشاء</div>
            <div className="text-sm font-sans" dir="ltr">
              {new Date(license.created_at).toLocaleDateString('ar-EG')}
            </div>
          </div>
        </div>

        {license.notes && (
          <div className="mt-4 p-4 bg-bg-base rounded-lg">
            <div className="text-xs text-text-muted mb-2">ملاحظات</div>
            <p className="text-sm font-sans text-text-secondary">{license.notes}</p>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold font-sans text-text-primary mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          المستندات
        </h2>

        {isOwner && (
          <div className="mb-4 p-4 border-2 border-dashed border-border-default rounded-lg">
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              className="w-full text-sm font-sans"
              accept="*/*"
            />
          </div>
        )}

        {license.documents && license.documents.length > 0 ? (
          <div className="space-y-2">
            {license.documents.map((link) => {
              const doc = link.document;
              return (
                <div key={link.id} className="flex items-center justify-between p-4 border border-border-subtle rounded-lg bg-bg-base">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-sans text-text-primary">{doc.name}</div>
                      <div className="text-xs text-text-muted">
                        {new Date(doc.created_at).toLocaleDateString('ar-EG')}
                      </div>
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
                        onClick={() => handleDeleteDocument(link)}
                        className="p-2 hover:bg-status-critical/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-status-critical" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 border-2 border-dashed border-border-default rounded-lg text-text-muted text-sm">
            لا توجد مستندات مضافة بعد
          </div>
        )}
      </div>
    </PageTransition>
  );
}
