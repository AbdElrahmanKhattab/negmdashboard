import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormModal from '@/components/common/FormModal';
import FormField from '@/components/common/FormField';
import { useCreateClient } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';

export default function ClientForm({ isOpen, onClose }) {
  const user = useAuthStore(s => s.user);
  const createClient = useCreateClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (values) => {
    await createClient.mutateAsync({
      ...values,
      office_id: user?.user_metadata?.office_id,
      created_by: user?.id,
    });
    reset();
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="إضافة عميل جديد">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="اسم العميل / الشركة" error={errors.name?.message}>
          <Input {...register('name')} placeholder="مثال: شركة الأفق للاستثمار" className="bg-bg-base" />
        </FormField>

        <FormField label="البريد الإلكتروني" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="name@example.com" className="bg-bg-base dir-ltr text-left" dir="ltr" />
        </FormField>

        <FormField label="الهاتف" error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" placeholder="0501234567" className="bg-bg-base dir-ltr text-left" dir="ltr" />
        </FormField>

        <FormField label="العنوان" error={errors.address?.message}>
          <Input {...register('address')} placeholder="العنوان الكامل" className="bg-bg-base" />
        </FormField>

        <FormField label="ملاحظات" error={errors.notes?.message}>
          <textarea {...register('notes')} rows={3} placeholder="ملاحظات إضافية..." className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent" />
        </FormField>

        <div className="flex gap-3 pt-4 border-t border-border-default">
          <Button type="submit" disabled={createClient.isPending} className="bg-accent hover:bg-accent-hover text-white font-sans flex-1">
            {createClient.isPending ? 'جاري الحفظ...' : 'حفظ العميل'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="font-sans border-border-default">إلغاء</Button>
        </div>
      </form>
    </FormModal>
  );
}
