'use client';

import Link from 'next/link';
import type { PostFormData } from '@/app/post/page';
import { formatPrice, PROPERTY_TYPE_LABELS, CATEGORY_LABELS } from '@/lib/format';

interface Props { form: PostFormData; propertyId: string | null; onBack: () => void; }

export default function Step5Preview({ form, propertyId, onBack }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-900 text-lg">Preview & Submit</h2>

      {propertyId ? (
        <div className="text-center py-6">
          <p className="text-5xl mb-3">🎉</p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Your listing is live!</h3>
          <p className="text-sm text-gray-500 mb-6">Your property has been successfully listed.</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/property/${propertyId}`} className="btn-primary px-6 py-2.5">View Listing →</Link>
            <Link href="/post" className="border border-gray-300 rounded-lg px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Post Another</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">{PROPERTY_TYPE_LABELS[form.property_type] || form.property_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium">{CATEGORY_LABELS[form.category] || form.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price</span>
              <span className="font-medium">{formatPrice(parseFloat(form.price) || 0, form.price_unit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Area</span>
              <span className="font-medium">{form.area_value} {form.area_unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span className="font-medium">{form.locality}, {form.city}</span>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={onBack} className="border border-gray-300 rounded-lg px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50">← Back</button>
          </div>
        </>
      )}
    </div>
  );
}
