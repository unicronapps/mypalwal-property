'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PostFormData } from '@/app/post/page';
import api from '@/lib/api';

interface Props {
  form: PostFormData;
  onChange: (d: Partial<PostFormData>) => void;
  onPropertyCreated: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
  existingPropertyId?: string;
}

export default function Step4Media({ form, onPropertyCreated, onNext, onBack, existingPropertyId }: Props) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(existingPropertyId || null);
  const [error, setError] = useState('');

  async function createAndProceed() {
    if (propertyId) { onNext(); return; }
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
      onNext();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing. Please go back and check your details.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-gray-900 text-lg">Photos</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4">
        <div className="text-3xl shrink-0">📸</div>
        <div>
          <p className="font-medium text-blue-900 text-sm mb-1">Upload photos after your listing is created</p>
          <p className="text-blue-700 text-sm">
            Once your listing is live, go to <strong>My Listings</strong> and tap <strong>Manage Photos</strong> on your listing to upload, reorder, or delete photos anytime.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-700">Why separate?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Upload from any device — phone, laptop, or tablet</li>
          <li>Add more photos later without editing the listing</li>
          <li>Delete or reorder photos anytime</li>
        </ul>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="border border-gray-300 rounded-lg px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          {propertyId && (
            <button
              onClick={() => router.push(`/dashboard/listings/${propertyId}/photos`)}
              className="border border-primary-300 text-primary-600 rounded-lg px-5 py-2.5 text-sm hover:bg-primary-50"
            >
              Upload Photos Now
            </button>
          )}
          <button
            onClick={createAndProceed}
            disabled={isCreating}
            className="btn-primary px-8 py-2.5"
          >
            {isCreating ? 'Creating listing…' : 'Create Listing →'}
          </button>
        </div>
      </div>
    </div>
  );
}
