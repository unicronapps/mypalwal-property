export const runtime = 'edge';
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Step1BasicInfo from '@/components/post/Step1BasicInfo';
import Step2Location from '@/components/post/Step2Location';
import Step3Attributes from '@/components/post/Step3Attributes';
import Step4Media from '@/components/post/Step4Media';
import type { PostFormData } from '@/app/post/page';

const STEPS = ['Basic Info', 'Location', 'Details', 'Photos', 'Done'];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PostFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/api/properties/${id}`);
        const p = data.data;
        setForm({
          title: p.title || '',
          description: p.description || '',
          property_type: p.property_type || '',
          category: p.category || '',
          price: String(p.price || ''),
          price_unit: p.price_unit || 'total',
          price_negotiable: p.price_negotiable || false,
          area_value: String(p.area_display_value || p.area_sqft || ''),
          area_unit: p.area_display_unit || 'sqft',
          possession_status: p.possession_status || '',
          contact_call: p.contact_call ?? true,
          contact_whatsapp: p.contact_whatsapp ?? false,
          contact_enquiry: p.contact_enquiry ?? true,
          city: p.city || '',
          locality: p.locality || '',
          pincode: p.pincode || '',
          landmark: p.landmark || '',
          attributes: p.attributes || {},
          amenities: p.amenities || [],
          propertyId: p.id,
        });
      } catch {
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Something went wrong'}</p>
        <button onClick={() => router.back()} className="text-sm text-primary-600 hover:underline">Go back</button>
      </div>
    );
  }

  function update(data: Partial<PostFormData>) {
    setForm((f) => (f ? { ...f, ...data } : f));
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/properties/${id}`, {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        price_unit: form.price_unit,
        price_negotiable: form.price_negotiable,
        area_value: parseFloat(form.area_value),
        area_unit: form.area_unit,
        possession_status: form.possession_status || undefined,
        contact_call: form.contact_call,
        contact_whatsapp: form.contact_whatsapp,
        contact_enquiry: form.contact_enquiry,
        attributes: form.attributes,
        status: 'active',
        city: form.city,
        locality: form.locality,
        pincode: form.pincode,
      });
      setStep(4); // done
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Property</h1>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? '\u2713' : i + 1}
            </div>
            <span className={`ml-2 text-xs font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {step === 0 && <Step1BasicInfo form={form} onChange={update} onNext={() => setStep(1)} />}
        {step === 1 && <Step2Location form={form} onChange={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <Step3Attributes form={form} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && (
          <div>
            <Step4Media
              form={form}
              onChange={update}
              onPropertyCreated={() => {}}
              onNext={handleSave}
              onBack={() => setStep(2)}
              existingPropertyId={id}
            />
            {saving && <p className="text-sm text-gray-500 mt-2 text-center">Saving changes...</p>}
            {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
          </div>
        )}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Updated</h2>
            <p className="text-gray-500 mb-6">Your listing has been updated successfully.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/dashboard/listings')} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                Back to Listings
              </button>
              <button onClick={() => router.push(`/property/${id}`)} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                View Listing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
