import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormModal from '@/components/common/FormModal';
import FormField from '@/components/common/FormField';
import { useCreateProject, useUpdateProject, useClients, useEmployees } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';

export default function ProjectForm({ isOpen, onClose, initialData = null }) {
  const user = useAuthStore(s => s.user);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: clients } = useClients();
  const { data: employees } = useEmployees();
  
  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || { is_supervised: false, supervisor_id: null },
  });

  const isSupervised = watch('is_supervised');

  const onSubmit = async (values) => {
    // Clean up supervisor_id if it's not supervised or empty string
    const payload = {
      ...values,
      supervisor_id: values.is_supervised && values.supervisor_id ? values.supervisor_id : null
    };

    if (initialData?.id) {
      await updateProject.mutateAsync({ id: initialData.id, ...payload });
    } else {
      await createProject.mutateAsync({
        ...payload,
        office_id: user?.user_metadata?.office_id,
        created_by: user?.id,
      });
    }
    reset();
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={initialData ? "تعديل المشروع" : "إضافة مشروع جديد"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="اسم المشروع" error={errors.name?.message}>
          <Input {...register('name')} placeholder="مثال: فيلا سكنية مزدوجة" className="bg-bg-base" />
        </FormField>

        <FormField label="العميل" error={errors.client_id?.message}>
          <select {...register('client_id')} className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent h-10">
            <option value="">اختر العميل...</option>
            {(clients || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>

        {/* Supervision Toggle & Selector */}
        <div className="p-4 border border-border-default rounded-lg space-y-4 bg-bg-base">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold font-sans text-text-primary block">الإشراف الهندسي</label>
              <span className="text-xs text-text-muted mt-1 block">تفعيل خيار إشراف المكتب على هذا المشروع</span>
            </div>
            <input
              type="checkbox"
              {...register('is_supervised')}
              className="w-5 h-5 rounded border-border-default text-accent focus:ring-accent accent-accent bg-bg-base"
            />
          </div>
          
          {isSupervised && (
            <div className="pt-2 border-t border-border-subtle">
              <FormField label="المشرف (اختياري)" error={errors.supervisor_id?.message}>
                <select {...register('supervisor_id')} className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent h-10">
                  <option value="">لا يوجد مشرف معين</option>
                  {(employees || []).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </FormField>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="قيمة التعاقد (ج.م)" error={errors.total_contract_value?.message}>
            <Input {...register('total_contract_value')} type="number" placeholder="0" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
          <FormField label="وصف المشروع" error={errors.description?.message}>
            <textarea {...register('description')} rows={2} placeholder="تفاصيل..." className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="تاريخ البدء" error={errors.start_date?.message}>
            <Input {...register('start_date')} type="date" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
          <FormField label="تاريخ الانتهاء" error={errors.end_date?.message}>
            <Input {...register('end_date')} type="date" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border-default">
          <Button type="submit" disabled={createProject.isPending || updateProject.isPending} className="bg-accent hover:bg-accent-hover text-white font-sans flex-1">
            {createProject.isPending || updateProject.isPending ? 'جاري الحفظ...' : (initialData ? 'تحديث المشروع' : 'إنشاء المشروع')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="font-sans border-border-default">إلغاء</Button>
        </div>
      </form>
    </FormModal>
  );
}
