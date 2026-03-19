'use client';

import { useEffect, useState } from 'react';
import type { PostFormData } from '@/app/post/page';
import api from '@/lib/api';

interface Props { form: PostFormData; onChange: (d: Partial<PostFormData>) => void; onNext: () => void; onBack: () => void; }

export default function Step2Location({ form, onChange, onNext, onBack }: Props) {
  const [cities, setCities] = useState<string[]>([]);
  const [localities, setLocalities] = useState<string[]>([]);

  useEffect(() => {
    api.get('/api/locations/cities').then(({ data }) => {
      setCities((data.data || []).map((c: any) => c.name));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.city) {
      api.get('/api/locations/localities', { params: { city: form.city } }).then(({ data }) => {
        setLocalities((data.data || []).map((l: any) => l.name));
      }).catch(() => setLocalities([]));
    }
  }, [form.city]);

  function validate() {
    if (!form.city) return 'City is required';
    if (!form.locality) return 'Locality is required';
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) { alert(err); return; }
    onNext();
  }

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-900 text-lg">Location</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <select value={form.city} onChange={e => onChange({ city: e.target.value, locality: '' })} className="input-field">
            <option value="">Select city</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Locality *</label>
          {localities.length > 0 ? (
            <select value={form.locality} onChange={e => onChange({ locality: e.target.value })} className="input-field">
              <option value="">Select locality</option>
              {localities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <input type="text" value={form.locality} onChange={e => onChange({ locality: e.target.value })}
              placeholder="Enter locality" className="input-field" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input type="text" value={form.pincode} onChange={e => onChange({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="e.g. 132001" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
          <input type="text" value={form.landmark} onChange={e => onChange({ landmark: e.target.value })}
            placeholder="e.g. Near railway station" className="input-field" />
        </div>
      </div>

      {/* TODO: [PHASE-3] Add interactive map pin drop here */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 text-sm">
        🗺 Map pin drop — coming soon
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="border border-gray-300 rounded-lg px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50">← Back</button>
        <button onClick={handleNext} className="btn-primary px-8 py-2.5">Next →</button>
      </div>
    </div>
  );
}
