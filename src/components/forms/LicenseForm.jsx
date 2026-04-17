import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LICENSE_TYPES = [
  { value: 'survey', label: 'قرار مساحي', icon: '📐' },
  { value: 'demolition', label: 'رخصة هدم', icon: '🔨' },
  { value: 'building', label: 'رخصة بناء', icon: '🏗️' },
  { value: 'residential', label: 'قرار سكني', icon: '🏠' },
  { value: 'other', label: 'أخرى', icon: '📝' },
];

const LICENSE_STATUSES = [
  { value: 'pending', label: 'قيد الإصدار', color: 'text-status-warning', bg: 'bg-status-warning/10' },
  { value: 'approved', label: 'صادرة', color: 'text-status-good', bg: 'bg-status-good/10' },
  { value: 'rejected', label: 'مرفوضة', color: 'text-status-critical', bg: 'bg-status-critical/10' },
  { value: 'revision', label: 'مطلوب تعديل', color: 'text-text-muted', bg: 'bg-text-muted/10' },
];

export default function LicenseForm({ isOpen, onClose, projectId, initialData, onSave }) {
  const [type, setType] = useState('survey');
  const [customType, setCustomType] = useState('');
  const [requestNumber, setRequestNumber] = useState(initialData?.request_number || '');
  const [status, setStatus] = useState(initialData?.status || 'pending');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      const isPredefined = LICENSE_TYPES.some(t => t.value === initialData.type && t.value !== 'other');
      if (isPredefined) {
        setType(initialData.type);
        setCustomType('');
      } else {
        setType('other');
        setCustomType(initialData.type);
      }
      setRequestNumber(initialData.request_number || '');
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setFile(null);
    } else {
      setType('survey');
      setCustomType('');
      setRequestNumber('');
      setStatus('pending');
      setNotes('');
      setFile(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalType = type === 'other' ? customType : type;
    if (!finalType?.trim()) {
      toast.error('الرجاء تحديد نوع الرخصة');
      return;
    }
    onSave({ type: finalType, requestNumber, status, notes, file });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-bg-surface z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-xl font-bold font-sans text-text-primary">
              {initialData ? 'تعديل الرخصة' : 'إضافة رخصة جديدة'}
            </h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* License Type */}
          <div>
            <label className="block text-sm font-sans font-medium text-text-primary mb-3">
              نوع الرخصة
            </label>
            <div className="grid grid-cols-3 gap-3">
              {LICENSE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    type === t.value
                      ? "border-accent bg-accent/10"
                      : "border-border-default hover:border-border-strong"
                  )}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-xs font-sans font-medium">{t.label}</div>
                </button>
              ))}
            </div>
            {type === 'other' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="أدخل نوع الرخصة (مثال: رخصة تسوير)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border-default bg-bg-base text-sm font-sans text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-sans font-medium text-text-primary mb-3">
              حالة الرخصة
            </label>
            <div className="grid grid-cols-2 gap-3">
              {LICENSE_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center font-sans text-sm",
                    status === s.value
                      ? `border-current ${s.color} ${s.bg}`
                      : "border-border-default text-text-secondary hover:border-border-strong"
                  )}
                >
                  {s.label}
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
              placeholder="أدخل رقم الطلب..."
              className="w-full px-4 py-2.5 rounded-xl border border-border-default bg-bg-base text-sm font-sans text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
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
              placeholder="أضف ملاحظات..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border-default bg-bg-base text-sm font-sans text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
            />
          </div>

          {/* File Upload (Optional) */}
          {!initialData && (
            <div>
              <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                إرفاق ملف الرخصة (اختياري)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full px-4 py-2 rounded-xl border border-dashed border-border-default bg-bg-base text-sm font-sans text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              />
              <p className="text-xs text-text-muted mt-1">يمكنك رفع صورة أو ملف PDF.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-sans border-border-default"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="font-sans bg-accent hover:bg-accent/90"
            >
              {initialData ? 'حفظ التغييرات' : 'إضافة الرخصة'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
