'use client';

import { useEffect, useState } from 'react';
import type { PostFormData } from '@/app/post/page';
import api from '@/lib/api';

interface FieldDef {
  label: string;
  type: 'integer' | 'number' | 'string' | 'boolean';
  required?: boolean;
  enum?: string[];
  unit?: string;
  haryana_specific?: boolean;
}

const AMENITY_OPTIONS = ['parking','lift','gym','swimming_pool','security','power_backup','water_supply','cctv','club_house','garden','playground','temple','market_nearby'];

interface Props { form: PostFormData; onChange: (d: Partial<PostFormData>) => void; onNext: () => void; onBack: () => void; }

export default function Step3Attributes({ form, onChange, onNext, onBack }: Props) {
  const [schema, setSchema] = useState<Record<string, FieldDef>>({});

  useEffect(() => {
    if (form.property_type) {
      api.get(`/api/properties/attributes/${form.property_type}`).then(({ data }) => {
        setSchema(data.data.fields || {});
      }).catch(() => setSchema({}));
    }
  }, [form.property_type]);

  function setAttr(key: string, value: any) {
    onChange({ attributes: { ...form.attributes, [key]: value } });
  }

  function toggleAmenity(a: string) {
    const current = form.amenities || [];
    onChange({ amenities: current.includes(a) ? current.filter(x => x !== a) : [...current, a] });
  }

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-900 text-lg">Property Details</h2>

      {Object.keys(schema).length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No additional details for this property type.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(schema).map(([key, field]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && ' *'}
                {field.haryana_specific && <span className="ml-1 text-amber-600 text-xs">(Haryana)</span>}
                {field.unit && <span className="ml-1 text-gray-400">({field.unit})</span>}
              </label>

              {field.type === 'boolean' ? (
                <div className="flex gap-3">
                  {[true, false].map(v => (
                    <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name={key} checked={form.attributes[key] === v}
                        onChange={() => setAttr(key, v)} className="text-primary-600" />
                      <span className="text-sm text-gray-700">{v ? 'Yes' : 'No'}</span>
                    </label>
                  ))}
                </div>
              ) : field.enum ? (
                <select value={form.attributes[key] || ''} onChange={e => setAttr(key, e.target.value)} className="input-field text-sm">
                  <option value="">Select…</option>
                  {field.enum.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                </select>
              ) : (
                <input
                  type={field.type === 'integer' || field.type === 'number' ? 'number' : 'text'}
                  value={form.attributes[key] ?? ''}
                  onChange={e => setAttr(key, field.type === 'integer' ? parseInt(e.target.value) : field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                  className="input-field text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(a => (
            <button key={a} type="button" onClick={() => toggleAmenity(a)}
              className={`text-xs px-2.5 py-1.5 rounded-full border capitalize transition-colors ${
                form.amenities?.includes(a) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700 hover:border-green-400'
              }`}>
              {a.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="border border-gray-300 rounded-lg px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50">← Back</button>
        <button onClick={onNext} className="btn-primary px-8 py-2.5">Next →</button>
      </div>
    </div>
  );
}
