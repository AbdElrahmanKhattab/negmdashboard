import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormModal from '@/components/common/FormModal';
import FormField from '@/components/common/FormField';
import { useCreateTransaction, useProjects } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';

const CATEGORY_OPTIONS = [
  { value: 'project_payment', label: 'دفعة مشروع' },
  { value: 'salaries', label: 'رواتب' },
  { value: 'office_rent', label: 'إيجار مكتب' },
  { value: 'materials', label: 'مواد' },
  { value: 'government_fees', label: 'رسوم حكومية' },
  { value: 'misc', label: 'متفرقات' },
];

export default function TransactionForm({ isOpen, onClose }) {
  const user = useAuthStore(s => s.user);
  const createTxn = useCreateTransaction();
  const { data: projects } = useProjects();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'expense', date: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      office_id: user?.user_metadata?.office_id,
      created_by: user?.id,
    };
    if (!payload.project_id) delete payload.project_id;
    await createTxn.mutateAsync(payload);
    reset();
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="إضافة معاملة مالية">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="نوع المعاملة" error={errors.type?.message}>
          <select {...register('type')} className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent h-10">
            <option value="income">إيراد</option>
            <option value="expense">مصروف</option>
          </select>
        </FormField>

        <FormField label="البيان" error={errors.title?.message}>
          <Input {...register('title')} placeholder="مثال: دفعة مشروع الفيلا" className="bg-bg-base" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="المبلغ (ج.م)" error={errors.amount?.message}>
            <Input {...register('amount')} type="number" placeholder="0" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
          <FormField label="التاريخ" error={errors.date?.message}>
            <Input {...register('date')} type="date" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
        </div>

        <FormField label="التصنيف" error={errors.category?.message}>
          <select {...register('category')} className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent h-10">
            <option value="">اختر التصنيف...</option>
            {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </FormField>

        <FormField label="المشروع (اختياري)" error={errors.project_id?.message}>
          <select {...register('project_id')} className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent h-10">
            <option value="">بدون مشروع</option>
            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>

        <FormField label="ملاحظات" error={errors.notes?.message}>
          <textarea {...register('notes')} rows={2} placeholder="ملاحظات اختيارية..." className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent" />
        </FormField>

        <div className="flex gap-3 pt-4 border-t border-border-default">
          <Button type="submit" disabled={createTxn.isPending} className="bg-accent hover:bg-accent-hover text-white font-sans flex-1">
            {createTxn.isPending ? 'جاري الحفظ...' : 'تسجيل المعاملة'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="font-sans border-border-default">إلغاء</Button>
        </div>
      </form>
    </FormModal>
  );
}
