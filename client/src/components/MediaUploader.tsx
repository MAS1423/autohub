// MediaUploader — رفع الصور والفيديو عبر S3
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedFile {
  url: string;
  key: string;
  fileType: 'image' | 'video' | 'logo' | 'cover';
  name: string;
  preview?: string;
}

interface MediaUploaderProps {
  dealerId: number;
  vehicleId?: number;
  fileType: 'image' | 'video' | 'logo' | 'cover';
  multiple?: boolean;
  maxFiles?: number;
  onUpload: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  label?: string;
  hint?: string;
}

export default function MediaUploader({
  dealerId, vehicleId, fileType, multiple = false, maxFiles = 10,
  onUpload, existingFiles = [], label, hint,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVideo = fileType === 'video';
  const accept = isVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp';
  const maxSizeMB = isVideo ? 50 : 10;

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dealerId', String(dealerId));
    if (vehicleId) formData.append('vehicleId', String(vehicleId));
    formData.append('fileType', fileType);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الرفع');
      return {
        url: data.url,
        key: data.key,
        fileType: data.fileType,
        name: file.name,
        preview: isVideo ? undefined : URL.createObjectURL(file),
      };
    } catch (err: any) {
      toast.error(err.message || 'فشل رفع الملف');
      return null;
    }
  }, [dealerId, vehicleId, fileType, isVideo]);

  const handleFiles = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const filesToUpload = Array.from(selectedFiles).slice(0, maxFiles - files.length);
    if (filesToUpload.length === 0) {
      toast.error(`الحد الأقصى ${maxFiles} ملفات`);
      return;
    }

    // Validate sizes
    for (const f of filesToUpload) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${f.name}: حجم الملف يتجاوز ${maxSizeMB} ميجابايت`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    const uploaded: UploadedFile[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const result = await uploadFile(filesToUpload[i]);
      if (result) uploaded.push(result);
      setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
    }

    if (uploaded.length > 0) {
      const newFiles = multiple ? [...files, ...uploaded] : uploaded;
      setFiles(newFiles);
      onUpload(newFiles);
      toast.success(`تم رفع ${uploaded.length} ملف بنجاح`);
    }
    setUploading(false);
    setUploadProgress(0);
  }, [files, maxFiles, maxSizeMB, multiple, onUpload, uploadFile]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  return (
    <div className="space-y-3" dir="rtl">
      {label && <label className="block text-sm font-bold text-foreground">{label}</label>}

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-[oklch(0.72_0.18_55)] bg-[oklch(0.72_0.18_55)]/5'
            : 'border-border hover:border-[oklch(0.72_0.18_55)]/50 hover:bg-secondary/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: 'oklch(0.72 0.18 55)' }} />
            <p className="text-sm font-semibold">جاري الرفع... {uploadProgress}%</p>
            <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%`, background: 'oklch(0.72 0.18 55)' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
              style={{ background: 'oklch(0.72 0.18 55 / 0.1)' }}>
              {isVideo ? <Video size={22} style={{ color: 'oklch(0.72 0.18 55)' }} /> : <ImageIcon size={22} style={{ color: 'oklch(0.72 0.18 55)' }} />}
            </div>
            <p className="text-sm font-bold text-foreground">
              {isVideo ? 'اسحب الفيديو هنا أو انقر للاختيار' : 'اسحب الصور هنا أو انقر للاختيار'}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              {isVideo ? 'MP4, WebM — حتى 50 ميجابايت' : 'JPEG, PNG, WebP — حتى 10 ميجابايت لكل صورة'}
            </p>
            {hint && <p className="text-xs text-muted-foreground font-body mt-1">{hint}</p>}
          </div>
        )}
      </div>

      {/* Uploaded Files Preview */}
      {files.length > 0 && (
        <div className={`grid gap-3 ${isVideo ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
          {files.map((file, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-border bg-secondary aspect-video">
              {file.fileType === 'video' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                  <Video size={28} style={{ color: 'oklch(0.72 0.18 55)' }} />
                  <p className="text-xs font-semibold text-center truncate w-full px-2">{file.name}</p>
                  <CheckCircle size={14} className="text-emerald-500" />
                </div>
              ) : (
                <img
                  src={file.preview || file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
