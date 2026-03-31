import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormModal from '@/components/common/FormModal';
import FormField from '@/components/common/FormField';
import FileUpload from '@/components/common/FileUpload';
import { useCreatePayment } from '@/hooks/useData';
import { useAuthStore } from '@/stores/authStore';
import { Receipt } from 'lucide-react';

export default function PaymentForm({ isOpen, onClose, milestoneId, officeId }) {
  const user = useAuthStore(s => s.user);
  const createPayment = useCreatePayment();
  const [receipt, setReceipt] = useState(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = async (values) => {
    await createPayment.mutateAsync({
      ...values,
      milestone_id: milestoneId,
      office_id: officeId,
      created_by: user?.id,
      receipt_url: receipt?.url,
    });
    reset();
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="تسجيل دفعة جديدة">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="قيمة الدفعة (ج.م)" error={errors.amount_paid?.message}>
          <Input {...register('amount_paid')} type="number" placeholder="0" className="bg-bg-base dir-ltr text-left font-mono" dir="ltr" />
        </FormField>

        <FormField label="ملاحظات" error={errors.notes?.message}>
          <textarea {...register('notes')} rows={3} placeholder="ملاحظات اختيارية..." className="w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent" />
        </FormField>

        <FormField label="إيصال الدفع">
          <FileUpload 
            bucket="receipts" 
            label="ارفع إيصال الدفع" 
            icon={Receipt}
            currentFile={receipt}
            onUploadComplete={setReceipt} 
          />
        </FormField>

        <div className="flex gap-3 pt-4 border-t border-border-default">
          <Button type="submit" disabled={createPayment.isPending} className="bg-status-good hover:bg-status-good/90 text-white font-sans flex-1">
            {createPayment.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="font-sans border-border-default">إلغاء</Button>
        </div>
      </form>
    </FormModal>
  );
}
