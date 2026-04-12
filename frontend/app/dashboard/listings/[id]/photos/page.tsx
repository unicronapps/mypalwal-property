'use client';
export const runtime = 'edge';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface MediaItem {
  id: string;
  url: string;
  s3Key: string;
  is_cover: boolean;
  display_order: number;
  media_type: string;
}

interface UploadingItem {
  tempId: string;
  name: string;
  previewUrl: string;
  progress: number;
  error?: string;
}

function resolveContentType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  };
  return map[ext ?? ''] ?? 'image/jpeg';
}

export default function ManagePhotosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/properties/${id}`);
      setMedia(data.data.media || []);
      setTitle(data.data.title || '');
    } catch {
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  async function handleFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles).slice(0, 20 - media.length);
    if (!newFiles.length) return;

    const placeholders: UploadingItem[] = newFiles.map(f => ({
      tempId: Math.random().toString(36).slice(2),
      name: f.name,
      previewUrl: URL.createObjectURL(f),
      progress: 0,
    }));
    setUploading(prev => [...prev, ...placeholders]);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const tempId = placeholders[i].tempId;
      const contentType = resolveContentType(file);

      try {
        setUploading(prev => prev.map(u => u.tempId === tempId ? { ...u, progress: 20 } : u));

        const { data: presignData } = await api.post('/api/media/presign', {
          filename: file.name,
          contentType,
          propertyId: id,
          mediaType: 'photo',
        });
        const { presignedUrl, s3Key, fileUrl } = presignData.data;

        setUploading(prev => prev.map(u => u.tempId === tempId ? { ...u, progress: 50 } : u));

        await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': contentType },
        });

        setUploading(prev => prev.map(u => u.tempId === tempId ? { ...u, progress: 80 } : u));

        const isCover = media.length === 0 && i === 0;
        await api.post('/api/media/confirm', {
          propertyId: id,
          s3Key,
          url: fileUrl,
          mediaType: 'photo',
          isCover,
          displayOrder: media.length + i,
        });

        setUploading(prev => prev.map(u => u.tempId === tempId ? { ...u, progress: 100 } : u));

        // Remove from uploading and refresh after short delay
        setTimeout(() => {
          setUploading(prev => prev.filter(u => u.tempId !== tempId));
          fetchMedia();
        }, 600);

      } catch {
        setUploading(prev => prev.map(u => u.tempId === tempId ? { ...u, error: 'Upload failed', progress: 0 } : u));
      }
    }
  }

  async function handleDelete(mediaId: string) {
    setDeletingId(mediaId);
    try {
      await api.delete(`/api/media/${mediaId}`);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch {
      setError('Failed to delete photo');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetCover(mediaId: string) {
    // Optimistic update
    setMedia(prev => prev.map(m => ({ ...m, is_cover: m.id === mediaId })));
    try {
      await api.post('/api/media/confirm', {
        propertyId: id,
        s3Key: media.find(m => m.id === mediaId)?.s3Key,
        url: media.find(m => m.id === mediaId)?.url,
        mediaType: 'photo',
        isCover: true,
        displayOrder: media.find(m => m.id === mediaId)?.display_order,
      });
    } catch {
      fetchMedia(); // revert on failure
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalCount = media.length + uploading.filter(u => !u.error).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/listings')} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Photos</h1>
          {title && <p className="text-sm text-gray-500 truncate">{title}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Upload buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={totalCount >= 20}
          className="border-2 border-dashed border-gray-300 rounded-xl py-5 flex flex-col items-center gap-1 hover:border-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">🖼️</span>
          <span className="text-sm font-medium text-gray-700">Gallery</span>
          <span className="text-xs text-gray-400">Choose photos</span>
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={totalCount >= 20}
          className="border-2 border-dashed border-gray-300 rounded-xl py-5 flex flex-col items-center gap-1 hover:border-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">📷</span>
          <span className="text-sm font-medium text-gray-700">Camera</span>
          <span className="text-xs text-gray-400">Take a photo</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

      <p className="text-xs text-gray-400">{totalCount} / 20 photos uploaded</p>

      {/* Uploaded photos grid */}
      {(media.length > 0 || uploading.length > 0) ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {/* Existing media */}
          {media.map((m) => (
            <div key={m.id} className={`relative rounded-xl overflow-hidden border-2 aspect-square ${m.is_cover ? 'border-primary-600' : 'border-transparent'}`}>
              <img src={m.url} alt="" className="w-full h-full object-cover" />
              {m.is_cover && (
                <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">Cover</div>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                {!m.is_cover && (
                  <button
                    onClick={() => handleSetCover(m.id)}
                    title="Set as cover"
                    className="bg-white/90 text-xs px-1.5 py-0.5 rounded text-gray-700 hover:bg-white shadow-sm"
                  >
                    ★
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="bg-white/90 text-xs px-1.5 py-0.5 rounded text-red-600 hover:bg-white shadow-sm disabled:opacity-50"
                >
                  {deletingId === m.id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}

          {/* In-progress uploads */}
          {uploading.map((u) => (
            <div key={u.tempId} className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 aspect-square bg-gray-50">
              <img src={u.previewUrl} alt={u.name} className="w-full h-full object-cover opacity-60" />
              {u.error ? (
                <div className="absolute inset-0 bg-red-500/70 flex flex-col items-center justify-center gap-1">
                  <span className="text-white text-xs font-medium">Failed</span>
                  <button
                    onClick={() => setUploading(prev => prev.filter(p => p.tempId !== u.tempId))}
                    className="text-white/80 text-xs underline"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2">
                  <div className="w-3/4 bg-white/30 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${u.progress}%` }} />
                  </div>
                  <span className="text-white text-xs font-bold">{u.progress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-gray-500 text-sm">No photos yet</p>
          <p className="text-gray-400 text-xs mt-1">Use the buttons above to upload</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex gap-3 justify-between pt-2 border-t border-gray-100">
        <button
          onClick={() => router.push('/dashboard/listings')}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← My Listings
        </button>
        <button
          onClick={() => router.push(`/property/${id}`)}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          View Listing
        </button>
      </div>
    </div>
  );
}
