export const runtime = 'edge';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Step1BasicInfo from '@/components/post/Step1BasicInfo';
import Step2Location from '@/components/post/Step2Location';
import Step3Attributes from '@/components/post/Step3Attributes';
import Step4Media from '@/components/post/Step4Media';
import Step5Preview from '@/components/post/Step5Preview';

export type PostFormData = {
  // Step 1
  title: string;
  description: string;
  property_type: string;
  category: string;
  price: string;
  price_unit: string;
  price_negotiable: boolean;
  area_value: string;
  area_unit: string;
  possession_status: string;
  contact_call: boolean;
  contact_whatsapp: boolean;
  contact_enquiry: boolean;
  // Step 2
  city: string;
  locality: string;
  pincode: string;
  landmark: string;
  // Step 3
  attributes: Record<string, any>;
  amenities: string[];
  // Step 4 — media handled separately (after property created)
  propertyId?: string; // set after step 4 creates the property
};

const INITIAL: PostFormData = {
  title: '', description: '', property_type: '', category: 'sale',
  price: '', price_unit: 'total', price_negotiable: false,
  area_value: '', area_unit: 'sqft', possession_status: '',
  contact_call: true, contact_whatsapp: false, contact_enquiry: true,
  city: '', locality: '', pincode: '', landmark: '',
  attributes: {}, amenities: [],
};

const STEPS = ['Basic Info', 'Location', 'Details', 'Photos', 'Preview'];

export default function PostPropertyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PostFormData>(INITIAL);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/post');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  function update(data: Partial<PostFormData>) {
    setForm(f => ({ ...f, ...data }));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a Property</h1>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-2 text-xs font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {step === 0 && <Step1BasicInfo form={form} onChange={update} onNext={() => setStep(1)} />}
        {step === 1 && <Step2Location form={form} onChange={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <Step3Attributes form={form} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step4Media form={form} onChange={update} onPropertyCreated={setCreatedPropertyId} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <Step5Preview form={form} propertyId={createdPropertyId} onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}
