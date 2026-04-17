import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/* ─── PROJECT STAGES ──────────────────────────────────── */

/**
 * Get all stages for a project with payment info
 */
export function useProjectStages(projectId) {
  return useQuery({
    queryKey: ['project-stages', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_stages_with_payments')
        .select(`
          *,
          documents:stage_documents(*)
        `)
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data.map(stage => ({
        ...stage,
        supervisor: stage.supervisor_name ? { full_name: stage.supervisor_name } : null
      }));
    },
    enabled: !!projectId,
  });
}

/**
 * Get a single stage by ID with payment info
 */
export function useProjectStage(stageId) {
  return useQuery({
    queryKey: ['project-stage', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_stages_with_payments')
        .select(`
          *,
          documents:stage_documents(*),
          payments:payments(*)
        `)
        .eq('id', stageId)
        .single();
      
      if (error) throw error;
      return {
        ...data,
        supervisor: data.supervisor_name ? { full_name: data.supervisor_name } : null
      };
    },
    enabled: !!stageId,
  });
}

/**
 * Get payments for a specific stage
 */
export function useStagePayments(stageId) {
  return useQuery({
    queryKey: ['stage-payments', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('stage_id', stageId)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!stageId,
  });
}

/**
 * Update a stage
 */
export function useUpdateStage() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ stageId, ...payload }) => {
      const { data, error } = await supabase
        .from('project_stages')
        .update(payload)
        .eq('id', stageId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['project-stages'] });
      qc.invalidateQueries({ queryKey: ['project-stage', data.id] });
      toast.success('تم تحديث المرحلة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث المرحلة: ' + error.message);
    },
  });
}

/**
 * Upload a document to a stage
 */
export function useUploadStageDocument() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ stageId, file }) => {
      // Get the project_id for this stage
      const { data: stageData } = await supabase
        .from('project_stages')
        .select('project_id')
        .eq('id', stageId)
        .single();
      
      if (!stageData) throw new Error('Stage not found');
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${stageData.project_id}/${stageId}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('stage_documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stage_documents')
        .getPublicUrl(filePath);
      
      // Save document record
      const { data, error } = await supabase
        .from('stage_documents')
        .insert({
          stage_id: stageId,
          file_url: publicUrl,
          type: fileExt
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['project-stages'] });
      qc.invalidateQueries({ queryKey: ['project-stage', variables.stageId] });
      toast.success('تم رفع الملف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في رفع الملف: ' + error.message);
    },
  });
}

/**
 * Delete a stage document
 */
export function useDeleteStageDocument() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, fileUrl, stageId }) => {
      // Extract file path from URL
      const urlParts = fileUrl.split('/storage/v1/object/public/stage_documents/');
      const filePath = urlParts.length > 1 ? urlParts[1] : null;
      
      if (filePath) {
        await supabase.storage
          .from('stage_documents')
          .remove([filePath]);
      }
      
      const { error } = await supabase
        .from('stage_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      return { documentId, stageId };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['project-stages'] });
      qc.invalidateQueries({ queryKey: ['project-stage', variables.stageId] });
      toast.success('تم حذف الملف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الملف: ' + error.message);
    },
  });
}

/**
 * Create a payment for a stage
 */
export function useCreateStagePayment() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ stageId, amount, paidAt, receiptUrl, notes, officeId, createdBy }) => {
      const payload = {
        stage_id: stageId,
        amount_paid: amount,
        paid_at: paidAt || new Date().toISOString(),
        notes
      };
      
      // Add optional fields only if they exist
      if (receiptUrl) payload.receipt_url = receiptUrl;
      if (officeId) payload.office_id = officeId;
      if (createdBy) payload.created_by = createdBy;
      
      const { data, error } = await supabase
        .from('payments')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-stages'] });
      qc.invalidateQueries({ queryKey: ['project-stage'] });
      qc.invalidateQueries({ queryKey: ['stage-payments'] });
      toast.success('تم تسجيل الدفعة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تسجيل الدفعة: ' + error.message);
    },
  });
}

/**
 * Calculate stage progress for a project
 */
export function useStageProgress(projectId) {
  return useQuery({
    queryKey: ['stage-progress', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_stages')
        .select('status')
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      const totalStages = data.length;
      const completedStages = data.filter(s => s.status === 'completed').length;
      const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
      
      return {
        total: totalStages,
        completed: completedStages,
        progress
      };
    },
    enabled: !!projectId,
  });
}

/* ─── PROJECT DOCUMENTS ──────────────────────────────────── */

/**
 * Get project-level documents
 */
export function useProjectDocuments(projectId) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select(`
          *,
          linked_stages:document_stage_links(
            stage_id,
            stage:project_stages(stage_name, order_index)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Create a project document
 */
export function useCreateProjectDocument() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, name, fileUrl, fileType, size, stageIds = [] }) => {
      const { data, error } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          name,
          file_url: fileUrl,
          file_type: fileType,
          size
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Link to stages if specified
      if (stageIds.length > 0) {
        const links = stageIds.map(stageId => ({
          document_id: data.id,
          stage_id: stageId
        }));
        
        const { error: linkError } = await supabase
          .from('document_stage_links')
          .insert(links);
        
        if (linkError) throw linkError;
      }
      
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-documents'] });
      qc.invalidateQueries({ queryKey: ['project-stages'] });
      toast.success('تم رفع المستند بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في رفع المستند: ' + error.message);
    },
  });
}

/**
 * Delete a project document
 */
export function useDeleteProjectDocument() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, fileUrl }) => {
      // Extract file path from URL
      const urlParts = fileUrl.split('/storage/v1/object/public/');
      const fullPath = urlParts.length > 1 ? urlParts[1] : null;
      
      if (fullPath) {
        const [bucket, ...pathParts] = fullPath.split('/');
        const filePath = pathParts.join('/');
        
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
      }
      
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      return documentId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-documents'] });
      toast.success('تم حذف المستند بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف المستند: ' + error.message);
    },
  });
}

/**
 * Link document to stage
 */
export function useLinkDocumentToStage() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, stageId }) => {
      const { data, error } = await supabase
        .from('document_stage_links')
        .insert({ document_id: documentId, stage_id: stageId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-documents'] });
      qc.invalidateQueries({ queryKey: ['project-stages'] });
      toast.success('تم ربط المستند بالمرحلة');
    },
    onError: (error) => {
      toast.error('فشل في ربط المستند: ' + error.message);
    },
  });
}
