import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { milestoneSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormModal from '@/components/common/FormModal';
import FormField from '@/components/common/FormField';
import { useCreateMilestone } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function MilestoneForm({ isOpen, onClose, projectId, initialData = null }) {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';
  const createMilestone = useCreateMilestone();
  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase.from('milestones').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['milestones', data.project_id] });
      qc.invalidateQueries({ queryKey: ['projects', data.project_id] });
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(milestoneSchema),
    defaultValues: initialData || { late_fee_rate: 2.5, order_index: 0, status: 'waiting' },
  });

  const onSubmit = async (values) => {
    if (initialData?.id) {
      await updateMilestone.mutateAsync({ id: initialData.id, ...values });
    } else {
      await createMilestone.mutateAsync({
        ...values,
        project_id: projectId,
        created_by: user?.id,
      });
    }
    reset();
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="إضافة مرحلة مالية">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="اسم المرحلة" error={errors.name?.message}>
          <Input {...register('name')} placeholder="مثال: الدفعة المقدمة" className="bg-bg-base" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="قيمة المرحلة (ج.م)" error={errors.amount?.message}>
            <Input {...register('amount')} type="number" placeholder="0" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
          <FormField label="تاريخ الاستحقاق" error={errors.deadline?.message}>
            <Input {...register('deadline')} type="date" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="نسبة غرامة التأخير (%)" error={errors.late_fee_rate?.message}>
            <Input {...register('late_fee_rate')} type="number" step="0.1" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
          </FormField>
          <FormField label="حالة المرحلة" error={errors.status?.message}>
            <select 
              {...register('status')} 
              className="w-full h-10 px-3 rounded-md border border-border-default bg-bg-base text-sm focus:ring-2 focus:ring-accent outline-none"
            >
              <option value="waiting">بانتظار البدء (Waiting)</option>
              <option value="in_progress">قيد التنفيذ (In Progress)</option>
              <option value="fully_paid">مدفوع بالكامل (Fully Paid)</option>
              <option value="done">تم الإنجاز (Done)</option>
            </select>
          </FormField>
        </div>

        <FormField label="ترتيب المرحلة" error={errors.order_index?.message}>
          <Input {...register('order_index')} type="number" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
        </FormField>

        <div className="flex gap-3 pt-4 border-t border-border-default">
          {isOwner && (
            <Button type="submit" disabled={createMilestone.isPending} className="bg-accent hover:bg-accent-hover text-white font-sans flex-1">
              {createMilestone.isPending ? 'جاري الحفظ...' : 'إضافة المرحلة'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose} className="font-sans border-border-default">إلغاء</Button>
        </div>
      </form>
    </FormModal>
  );
}
