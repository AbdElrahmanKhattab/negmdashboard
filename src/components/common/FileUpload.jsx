import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileCheck, X } from 'lucide-react';

export default function FileUpload({ 
  bucket = 'receipts', 
  onUploadComplete, 
  accept = '*', 
  label = 'ارفع ملفاً',
  icon: Icon = Upload,
  currentFile = null
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (event) => {
    try {
      setUploading(true);
      setError(null);

      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadComplete({
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        isImage: file.type.startsWith('image/')
      });
    } catch (err) {
      setError(err.message);
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const isImage = currentFile?.isImage || (typeof currentFile === 'string' && (currentFile.match(/\.(jpeg|jpg|gif|png|webp)/i)));

  if (currentFile) {
    return (
      <div className="flex items-center justify-between p-3 border border-border-default rounded-xl bg-bg-base/50 group/file">
        <div className="flex items-center gap-3">
          {isImage ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-border-subtle bg-white shrink-0">
              <img 
                src={typeof currentFile === 'string' ? currentFile : currentFile.url} 
                className="w-full h-full object-cover" 
                alt="preview" 
              />
            </div>
          ) : (
            <div className="p-3 bg-accent/10 rounded-lg">
              <FileCheck className="w-6 h-6 text-accent" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-sans font-semibold text-text-primary truncate max-w-[200px]">
              {typeof currentFile === 'string' ? 'تم رفع الملف' : currentFile.name}
            </span>
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
              {isImage ? 'IMAGE' : 'DOCUMENT'} 
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onUploadComplete(null)}
          className="hover:bg-status-critical/10 hover:text-status-critical h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative group">
        <Input
          type="file"
          accept={accept}
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id={`file-upload-${bucket}`}
        />
        <label
          htmlFor={`file-upload-${bucket}`}
          className={`
            flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer
            transition-all duration-200
            ${uploading ? 'bg-bg-base/50 border-border-default opacity-50' : 'bg-bg-surface border-border-default hover:border-accent hover:bg-accent/5'}
          `}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          ) : (
            <Icon className="w-8 h-8 text-text-muted group-hover:text-accent mb-2" />
          )}
          <span className="text-sm font-sans font-medium text-text-primary">
            {uploading ? 'جاري الرفع...' : label}
          </span>
          <span className="text-xs text-text-muted font-sans mt-1">
            أو اسحب وأفلت الملف هنا
          </span>
        </label>
      </div>
      {error && (
        <p className="text-xs font-sans text-status-critical mt-1">{error}</p>
      )}
    </div>
  );
}
