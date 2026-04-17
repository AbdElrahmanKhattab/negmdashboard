import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/* ─── PROJECT LICENSES ──────────────────────────────────── */

/**
 * Get all licenses for a project
 */
export function useProjectLicenses(projectId) {
  return useQuery({
    queryKey: ['project-licenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_licenses')
        .select(`
          *,
          documents:license_documents(
            id,
            document:project_documents(id, name, file_url, file_type, created_at)
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
 * Get a single license by ID
 */
export function useProjectLicense(licenseId) {
  return useQuery({
    queryKey: ['project-license', licenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_licenses')
        .select(`
          *,
          documents:license_documents(
            id,
            document:project_documents(id, name, file_url, file_type, created_at)
          )
        `)
        .eq('id', licenseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!licenseId,
  });
}

/**
 * Create a license
 */
export function useCreateLicense() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, type, requestNumber, notes, createdBy }) => {
      const { data, error } = await supabase
        .from('project_licenses')
        .insert({
          project_id: projectId,
          type,
          request_number: requestNumber,
          notes,
          created_by: createdBy
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-licenses'] });
      toast.success('تم إضافة الرخصة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة الرخصة: ' + error.message);
    },
  });
}

/**
 * Update a license
 */
export function useUpdateLicense() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ licenseId, ...payload }) => {
      const { data, error } = await supabase
        .from('project_licenses')
        .update(payload)
        .eq('id', licenseId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-licenses'] });
      qc.invalidateQueries({ queryKey: ['project-license'] });
      toast.success('تم تحديث الرخصة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث الرخصة: ' + error.message);
    },
  });
}

/**
 * Delete a license
 */
export function useDeleteLicense() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (licenseId) => {
      const { error } = await supabase
        .from('project_licenses')
        .delete()
        .eq('id', licenseId);
      
      if (error) throw error;
      return licenseId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-licenses'] });
      toast.success('تم حذف الرخصة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف الرخصة: ' + error.message);
    },
  });
}

/**
 * Link document to license
 */
export function useLinkDocumentToLicense() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, licenseId }) => {
      const { data, error } = await supabase
        .from('license_documents')
        .insert({ document_id: documentId, license_id: licenseId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-licenses'] });
      qc.invalidateQueries({ queryKey: ['project-license'] });
      qc.invalidateQueries({ queryKey: ['project-documents'] });
      toast.success('تم ربط المستند بالرخصة');
    },
    onError: (error) => {
      toast.error('فشل في ربط المستند: ' + error.message);
    },
  });
}

/**
 * Upload document to license
 */
export function useUploadLicenseDocument() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ licenseId, projectId, file }) => {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `licenses/${projectId}/${licenseId}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);
      
      // Save document record
      const { data, error } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          name: file.name,
          file_url: publicUrl,
          file_type: fileExt
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Link to license
      await supabase
        .from('license_documents')
        .insert({ document_id: data.id, license_id: licenseId });
      
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-licenses'] });
      qc.invalidateQueries({ queryKey: ['project-license'] });
      qc.invalidateQueries({ queryKey: ['project-documents'] });
      toast.success('تم رفع الملف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في رفع الملف: ' + error.message);
    },
  });
}

/**
 * Delete license document link
 */
export function useDeleteLicenseDocument() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ linkId }) => {
      const { error } = await supabase
        .from('license_documents')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      return linkId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-licenses'] });
      qc.invalidateQueries({ queryKey: ['project-license'] });
      toast.success('تم حذف المستند بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف المستند: ' + error.message);
    },
  });
}
