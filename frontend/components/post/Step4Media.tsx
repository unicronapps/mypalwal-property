'use client';

import { useState, useRef } from 'react';
import type { PostFormData } from '@/app/post/page';
import api from '@/lib/api';

interface UploadedFile {
  id?: string;
  url: string;
  s3Key: string;
  name: string;
  isCover: boolean;
  progress: number;
  error?: string;
}

interface Props {
  form: PostFormData;
  onChange: (d: Partial<PostFormData>) => void;
  onPropertyCreated: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
  existingPropertyId?: string; // set in edit mode — skips POST /api/properties
}

export default function Step4Media({ form, onChange, onPropertyCreated, onNext, onBack, existingPropertyId }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(existingPropertyId || null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function createProperty() {
    setIsCreating(true);
    setError('');
    try {
      const { data } = await api.post('/api/properties', {
        ...form,
        price: parseFloat(form.price),
        area_value: parseFloat(form.area_value),
      });
      const pid = data.data.id;
      setPropertyId(pid);
      onPropertyCreated(pid);
      return pid;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing. Please go back and check your details.');
      setIsCreating(false);
      return null;
    }
  }

  async function handleFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    // Create property first if not yet created
    let pid = propertyId;
    if (!pid) {
      pid = await createProperty();
      if (!pid) return;
    }
    setIsCreating(false);

    const newFiles = Array.from(selectedFiles).slice(0, 20 - files.length);
    const placeholders: UploadedFile[] = newFiles.map(f => ({
      url: URL.createObjectURL(f),
      s3Key: '',
      name: f.name,
      isCover: files.length === 0,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...placeholders]);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const idx = files.length + i;

      try {
        // Get presigned URL
        const { data: presignData } = await api.post('/api/media/presign', {
          filename: file.name,
          contentType: file.type,
          propertyId: pid,
          mediaType: 'photo',
        });
        const { presignedUrl, s3Key, fileUrl } = presignData.data;

        // Upload to S3
        await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        setFiles(prev => prev.map((f, j) => j === idx ? { ...f, progress: 80, s3Key, url: fileUrl } : f));

        // Confirm
        const { data: mediaData } = await api.post('/api/media/confirm', {
          propertyId: pid,
          s3Key,
          url: fileUrl,
          mediaType: 'photo',
          isCover: idx === 0,
          displayOrder: idx,
        });

        setFiles(prev => prev.map((f, j) => j === idx ? { ...f, progress: 100, id: mediaData.data.id } : f));
      } catch {
        setFiles(prev => prev.map((f, j) => j === idx ? { ...f, error: 'Upload failed', progress: 0 } : f));
      }
    }
  }

  function setCover(idx: number) {
    setFiles(prev => prev.map((f, i) => ({ ...f, isCover: i === idx })));
    // TODO: call PATCH to update cover on backend
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function handleNext() {
    if (!propertyId) {
      // No files — create property anyway and skip media
      createProperty().then(pid => {
        if (pid) { setIsCreating(false); onNext(); }
      });
      return;
    }
    onNext();
  }

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-900 text-lg">Photos</h2>
      <p className="text-sm text-gray-500">Add up to 20 photos. First photo will be the cover image.</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
      >
        <p className="text-4xl mb-2">📷</p>
        <p className="text-sm font-medium text-gray-700">Click to add photos</p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max 20 photos</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {files.map((f, i) => (
            <div key={i} className={`relative rounded-lg overflow-hidden border-2 ${f.isCover ? 'border-primary-600' : 'border-transparent'}`}>
              <img src={f.url} alt={f.name} className="w-full h-24 object-cover" />
              {f.progress > 0 && f.progress < 100 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{f.progress}%</span>
                </div>
              )}
              {f.error && (
                <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                  <span className="text-white text-xs">Failed</span>
                </div>
              )}
              {f.isCover && (
                <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">Cover</div>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                {!f.isCover && f.progress === 100 && (
                  <button onClick={() => setCover(i)} className="bg-white/90 text-xs px-1.5 py-0.5 rounded text-gray-700 hover:bg-white">★</button>
                )}
                <button onClick={() => removeFile(i)} className="bg-white/90 text-xs px-1.5 py-0.5 rounded text-red-600 hover:bg-white">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="border border-gray-300 rounded-lg px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50">← Back</button>
        <button onClick={handleNext} disabled={isCreating} className="btn-primary px-8 py-2.5">
          {isCreating ? 'Creating listing…' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
