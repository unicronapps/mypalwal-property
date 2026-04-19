'use client';

import { useState, useEffect } from 'react';
import type { PostFormData } from '@/app/post/page';
import { CITIES, LOCALITIES } from '@/lib/constants';

interface Props { form: PostFormData; onChange: (d: Partial<PostFormData>) => void; onNext: () => void; onBack: () => void; }

export default function Step2Location({ form, onChange, onNext, onBack }: Props) {
  const isOtherLocality = !!form.locality && !LOCALITIES.includes(form.locality);
  const [localityMode, setLocalityMode] = useState<'list' | 'other'>(isOtherLocality ? 'other' : 'list');
  const [otherLocality, setOtherLocality] = useState(isOtherLocality ? form.locality : '');

  useEffect(() => {
    if (localityMode === 'other') {
      onChange({ locality: otherLocality });
    }
  }, [otherLocality, localityMode]);

  function handleLocalitySelect(val: string) {
    if (val === '__other__') {
      setLocalityMode('other');
      onChange({ locality: otherLocality });
    } else {
      setLocalityMode('list');
      onChange({ locality: val });
    }
  }

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
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Locality *</label>
          <select
            value={localityMode === 'other' ? '__other__' : (form.locality || '')}
            onChange={e => handleLocalitySelect(e.target.value)}
            className="input-field"
          >
            <option value="">Select locality</option>
            {LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
            <option value="__other__">Other</option>
          </select>
          {localityMode === 'other' && (
            <input
              type="text"
              value={otherLocality}
              onChange={e => { setOtherLocality(e.target.value); onChange({ locality: e.target.value }); }}
              placeholder="Enter your locality"
              className="input-field mt-2"
            />
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm text-yellow-800">
        If your locality is not in the list, select <strong>Other</strong> and type it manually.
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nearby Landmark</label>
        <input type="text" value={form.landmark} onChange={e => onChange({ landmark: e.target.value })}
          placeholder="e.g. Near railway station" className="input-field" />
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
