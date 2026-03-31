import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormModal from '@/components/common/FormModal';
import FormField from '@/components/common/FormField';
import { useCreateProject, useClients } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';

export default function ProjectForm({ isOpen, onClose }) {
  const user = useAuthStore(s => s.user);
  const createProject = useCreateProject();
  const { data: clients } = useClients();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (values) => {
    await createProject.mutateAsync({
      ...values,
      office_id: user?.user_metadata?.office_id,
      created_by: user?.id,
    });
    reset();
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="إضافة مشروع جديد">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <FormField label="قيمة التعاقد (ج.م)" error={errors.total_contract_value?.message}>
          <Input {...register('total_contract_value')} type="number" placeholder="0" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="تاريخ البدء" error={errors.start_date?.message}>
            <Input {...register('start_date')} type="date" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
          <FormField label="تاريخ الانتهاء" error={errors.end_date?.message}>
            <Input {...register('end_date')} type="date" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
        </div>

        <FormField label="وصف المشروع" error={errors.description?.message}>
          <textarea {...register('description')} rows={3} placeholder="وصف مختصر للمشروع..." className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent" />
        </FormField>

        <div className="flex gap-3 pt-4 border-t border-border-default">
          <Button type="submit" disabled={createProject.isPending} className="bg-accent hover:bg-accent-hover text-white font-sans flex-1">
            {createProject.isPending ? 'جاري الحفظ...' : 'إنشاء المشروع'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="font-sans border-border-default">إلغاء</Button>
        </div>
      </form>
    </FormModal>
  );
}
