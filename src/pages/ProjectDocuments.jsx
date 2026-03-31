import React from 'react';
import { useDocuments, useCreateDocument, useDeleteDocument } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/common/FileUpload';
import { FileText, Download, Trash2, Calendar, User, File } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DataTable from '@/components/common/DataTable';

export default function ProjectDocuments({ projectId }) {
  const { data: documents, isLoading } = useDocuments(projectId);
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();

  const handleUploadComplete = (file) => {
    if (!file) return;
    createDoc.mutate({
      project_id: projectId,
      name: file.name,
      file_url: file.url,
      file_type: file.type,
      size: file.size
    });
  };

  const columns = [
    {
      title: 'الملف',
      key: 'name',
      render: (val, row) => {
        const isImage = row.file_type?.startsWith('image/') || row.file_url?.match(/\.(jpeg|jpg|gif|png|webp)/i);
        return (
          <div className="flex items-center gap-3">
            {isImage ? (
              <div className="w-10 h-10 rounded-md overflow-hidden border border-border-default bg-white shrink-0 group-hover:scale-110 transition-transform cursor-pointer" onClick={() => window.open(row.file_url, '_blank')}>
                <img src={row.file_url} className="w-full h-full object-cover" alt="thumb" />
              </div>
            ) : (
              <div className="p-2.5 bg-accent/10 rounded-md shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-sans font-semibold text-text-primary truncate max-w-[200px]">{val}</span>
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{row.file_type?.split('/')[1] || (isImage ? 'IMAGE' : 'FILE')}</span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'بواسطة',
      key: 'user',
      render: (_, row) => (
        <div className="flex items-center gap-2 text-text-secondary">
          <User className="w-3.5 h-3.5" />
          <span className="text-xs font-sans">{row.user?.full_name || 'نظام'}</span>
        </div>
      )
    },
    {
      title: 'التاريخ',
      key: 'created_at',
      render: (val) => (
        <div className="flex items-center gap-2 text-text-muted">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs font-sans">
            {format(new Date(val), 'PPP', { locale: ar })}
          </span>
        </div>
      )
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.open(row.file_url, '_blank')}
            className="text-accent hover:text-accent-hover hover:bg-accent/10 font-sans"
          >
            <Download className="w-4 h-4 ml-1.5" />
            تحميل
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
                deleteDoc.mutate(row.id);
              }
            }}
            className="text-status-critical hover:text-status-critical-hover hover:bg-status-critical/10 font-sans"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold font-sans text-text-primary mb-4">رفع مستند جديد</h3>
        <FileUpload 
          bucket="contracts" 
          label="اختر ملفاً لرفعه إلى المشروع (عقود، مخططات، إلخ)"
          onUploadComplete={handleUploadComplete} 
        />
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border-default bg-bg-base/30">
          <h3 className="text-md font-bold font-sans text-text-primary flex items-center gap-2">
            <File className="w-4 h-4 text-accent" />
            مستندات المشروع
          </h3>
        </div>
        <DataTable 
          columns={columns} 
          data={documents || []} 
          isLoading={isLoading} 
          emptyStateTitle="لا توجد مستندات"
          emptyStateDesc="ابدأ برفع أول مستند لهذا المشروع."
        />
      </div>
    </div>
  );
}
