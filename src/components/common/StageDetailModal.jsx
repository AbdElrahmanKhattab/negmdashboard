import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StageDetailModal({
  stage,
  onClose,
  onUpdate,
  onUploadDocument,
  onDeleteDocument,
  isOwner
}) {
  const [status, setStatus] = useState(stage.status);
  const [requestNumber, setRequestNumber] = useState(stage.request_number || '');
  const [notes, setNotes] = useState(stage.notes || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = () => {
    onUpdate(stage.id, {
      status,
      request_number: requestNumber,
      notes
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadDocument(stage.id, file);
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (doc) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      onDeleteDocument(doc.id, doc.file_url, stage.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-bg-surface z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold font-sans text-text-primary">{stage.stage_name}</h2>
            <p className="text-xs text-text-muted font-sans mt-1">
              المرحلة {stage.order_index} من {stage.total || 6}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-elevated"
          >
            <X className="w-5 h-5 text-text-muted" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Selector */}
          <div>
            <label className="block text-sm font-sans font-medium text-text-primary mb-2">
              حالة المرحلة
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'not_started', label: 'لم يبدأ', color: 'text-text-muted' },
                { value: 'in_progress', label: 'جاري التنفيذ', color: 'text-status-warning' },
                { value: 'completed', label: 'مكتمل', color: 'text-status-good' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  disabled={!isOwner}
                  className={cn(
                    "p-3 rounded-xl border-2 font-sans text-sm font-medium transition-all",
                    status === option.value
                      ? `border-current ${option.color} bg-current/10`
                      : "border-border-default text-text-secondary hover:border-border-subtle",
                    !isOwner && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Request Number */}
          <div>
            <label className="block text-sm font-sans font-medium text-text-primary mb-2">
              رقم الطلب
            </label>
            <input
              type="text"
              value={requestNumber}
              onChange={(e) => setRequestNumber(e.target.value)}
              disabled={!isOwner}
              placeholder="أدخل رقم الطلب..."
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border font-sans text-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
                isOwner
                  ? "bg-bg-base border-border-default text-text-primary"
                  : "bg-bg-elevated/50 border-border-default text-text-secondary opacity-50 cursor-not-allowed"
              )}
              dir="ltr"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-sans font-medium text-text-primary mb-2">
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isOwner}
              placeholder="أضف ملاحظات..."
              rows={4}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl border font-sans text-sm transition-colors resize-none",
                "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
                isOwner
                  ? "bg-bg-base border-border-default text-text-primary"
                  : "bg-bg-elevated/50 border-border-default text-text-secondary opacity-50 cursor-not-allowed"
              )}
            />
          </div>

          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-sans font-medium text-text-primary">
                المستندات
              </label>
              {isOwner && (
                <label className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-sans font-medium cursor-pointer hover:bg-accent/20 transition-colors",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}>
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'جاري الرفع...' : 'رفع ملف'}
                  <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                    accept="*/*"
                  />
                </label>
              )}
            </div>

            {/* Document List */}
            {stage.documents && stage.documents.length > 0 ? (
              <div className="space-y-2">
                {stage.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-border-default rounded-xl bg-bg-base hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                        <FileText className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-text-primary truncate">
                          {doc.file_url.split('/').pop()}
                        </p>
                        <p className="text-xs font-sans text-text-muted">
                          {new Date(doc.uploaded_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
                        title="عرض الملف"
                      >
                        <ExternalLink className="w-4 h-4 text-text-muted" />
                      </a>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="p-2 hover:bg-status-critical/10 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4 text-status-critical" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-border-default rounded-xl">
                <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm font-sans text-text-muted">لا توجد مستندات بعد</p>
                {isOwner && (
                  <p className="text-xs font-sans text-text-muted mt-1">
                    اضغط على "رفع ملف" لإضافة مستند
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        {isOwner && (
          <div className="flex justify-end gap-3 p-6 border-t border-border-subtle sticky bottom-0 bg-bg-surface rounded-b-2xl">
            <Button
              variant="outline"
              onClick={onClose}
              className="font-sans border-border-default"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              className="font-sans bg-accent hover:bg-accent/90"
            >
              حفظ التغييرات
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
