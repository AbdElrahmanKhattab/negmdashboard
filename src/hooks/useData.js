import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

/* ─── CLIENTS ─────────────────────────────────────────── */

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, projects:projects(id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Attach project count
      return data.map(c => ({ ...c, total_projects: c.projects?.length ?? 0 }));
    },
  });
}

export function useClient(id) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, projects:projects(*, milestones(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('clients').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients', vars.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

/* ─── PROJECTS ────────────────────────────────────────── */

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(name), milestones(id, amount, status)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Compute progress percentage
      return data.map(p => {
        const milestones = p.milestones || [];
        const total = milestones.length;
        const paidCount = milestones.filter(m => m.status === 'fully_paid' || m.status === 'done').length;
        const progress = total > 0 ? Math.round((paidCount / total) * 100) : 0;
        const due = milestones.filter(m => m.status === 'late').reduce((s, m) => s + Number(m.amount), 0);
        return { ...p, client_name: p.client?.name, progress, due };
      });
    },
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(name, id), milestones(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useProjectByShareToken(token) {
  return useQuery({
    queryKey: ['projects', 'share', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(name), milestones(*)')
        .eq('share_token', token)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('projects').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', vars.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/* ─── MILESTONES ──────────────────────────────────────── */

export function useMilestones(projectId) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*, payments(*)')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data.map(m => ({
        ...m,
        title: m.name,
        paid: Number(m.paid_amount || 0),
        lateFee: Number(m.late_fee_amount || 0),
      }));
    },
    enabled: !!projectId,
  });
}

export function useMilestone(id) {
  return useQuery({
    queryKey: ['milestones', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*, payments(*), project:projects(name, id, client:clients(*))')
        .eq('id', id)
        .order('paid_at', { foreignTable: 'payments', ascending: false })
        .single();
      if (error) throw error;
      return {
        ...data,
        title: data.name,
        paid: Number(data.paid_amount || 0),
        lateFee: Number(data.late_fee_amount || 0),
      };
    },
    enabled: !!id,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('milestones').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['milestones', data.project_id] });
      qc.invalidateQueries({ queryKey: ['projects', data.project_id] });
    },
  });
}

/* ─── PAYMENTS ────────────────────────────────────────── */

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('payments').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['milestones'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/* ─── TRANSACTIONS ────────────────────────────────────── */

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, project:projects(name)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('transactions').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

/* ─── COMMENTS ────────────────────────────────────────── */

export function useComments(projectId) {
  return useQuery({
    queryKey: ['comments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:users(full_name, avatar_url)')
        .eq('project_id', projectId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data.map(c => ({ ...c, body: c.content }));
    },
    enabled: !!projectId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('comments').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['comments', data.project_id] }),
  });
}

/* ─── ACTIVITY LOG ────────────────────────────────────── */

export function useActivityLog(projectId) {
  return useQuery({
    queryKey: ['activity', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, user:users(full_name, avatar_url)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map(a => ({ ...a, description: a.action, action_type: a.entity_type }));
    },
    enabled: !!projectId,
  });
}

/* ─── NOTIFICATIONS ───────────────────────────────────── */

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

/* ─── DOCUMENTS ───────────────────────────────────────── */

export function useDocuments(projectId) {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*, user:users(full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useInvoiceSearch(invoiceId) {
  return useQuery({
    queryKey: ['invoice-search', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await supabase
        .from('project_documents')
        .select('*, project:projects(name)')
        .ilike('invoice_id', `%${invoiceId}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId && invoiceId.length > 2,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('project_documents').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['documents', data.project_id] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('project_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      // Note: We need a way to know which projectId to invalidate, 
      // but usually we just invalidate all documents or pass the ID.
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/* ─── DASHBOARD KPIs ──────────────────────────────────── */

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      // Fetch all data needed for KPIs in parallel
      const [projectsRes, transactionsRes, milestonesRes] = await Promise.all([
        supabase.from('projects').select('id, total_contract_value, status, health'),
        supabase.from('transactions').select('type, amount'),
        supabase.from('milestones').select('id, status'),
      ]);
      if (projectsRes.error) throw projectsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      const projects = projectsRes.data;
      const txns = transactionsRes.data;
      const milestones = milestonesRes.data;

      const totalContractValue = projects.reduce((s, p) => s + Number(p.total_contract_value), 0);
      const totalIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const totalExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const lateMilestones = milestones.filter(m => m.status === 'late').length;

      return { totalContractValue, totalIncome, totalExpenses, activeProjects, lateMilestones };
    },
  });
}

/* ─── EMPLOYEES (Users Table) ────────────────────────── */

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateEmployeeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }) => {
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ full_name, email, password, role }) => {
      // We now call a secure Edge Function to handle atomic creation
      // and prevent the admin from being logged out by session conflicts.
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: { full_name, email, password, role },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        // Functions error might be nested
        const msg = typeof error === 'string' ? error : (error.message || 'Server error');
        throw new Error(msg);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}
