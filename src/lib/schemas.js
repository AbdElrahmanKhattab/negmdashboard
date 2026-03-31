import { z } from 'zod';

/* ─── CLIENT SCHEMA ───────────────────────────────────── */
export const clientSchema = z.object({
  name: z.string().min(2, 'اسم العميل مطلوب (حرفين على الأقل)'),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

/* ─── PROJECT SCHEMA ──────────────────────────────────── */
export const projectSchema = z.object({
  name: z.string().min(3, 'اسم المشروع مطلوب (3 أحرف على الأقل)'),
  client_id: z.string().uuid('يجب اختيار عميل'),
  total_contract_value: z.coerce.number().min(1, 'يجب إدخال قيمة التعاقد'),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

/* ─── MILESTONE SCHEMA ────────────────────────────────── */
export const milestoneSchema = z.object({
  name: z.string().min(2, 'اسم المرحلة مطلوب'),
  amount: z.coerce.number().min(1, 'يجب إدخال قيمة المرحلة'),
  deadline: z.string().min(1, 'يجب تحديد تاريخ الاستحقاق'),
  status: z.enum(['waiting', 'in_progress', 'fully_paid', 'done', 'late']).optional(),
  late_fee_rate: z.coerce.number().min(0).max(100).optional(),
  order_index: z.coerce.number().int().min(0).optional(),
});

/* ─── PAYMENT SCHEMA ──────────────────────────────────── */
export const paymentSchema = z.object({
  amount_paid: z.coerce.number().min(1, 'يجب إدخال قيمة الدفعة'),
  notes: z.string().optional().or(z.literal('')),
});

/* ─── TRANSACTION SCHEMA ──────────────────────────────── */
export const transactionSchema = z.object({
  title: z.string().min(2, 'البيان مطلوب'),
  type: z.enum(['income', 'expense'], { required_error: 'يجب اختيار نوع المعاملة' }),
  amount: z.coerce.number().min(0.01, 'يجب إدخال المبلغ'),
  category: z.enum(['project_payment', 'salaries', 'office_rent', 'materials', 'government_fees', 'misc'], { required_error: 'يجب اختيار التصنيف' }),
  date: z.string().min(1, 'يجب تحديد التاريخ'),
  project_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
