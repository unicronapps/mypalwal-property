'use client';

import type { PostFormData } from '@/app/post/page';

const TYPES = ['flat','house','plot','commercial','agricultural','farmhouse','villa','independent_house','pg','warehouse','shop','office'];
const CATEGORIES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'lease', label: 'Lease' },
  { value: 'pg', label: 'PG / Hostel' },
];
const AREA_UNITS = ['sqft','sqyard','sqmeter','bigha','acre','kanal','biswa','gaj'];
const PRICE_UNITS = [
  { value: 'total', label: 'Total Price' },
  { value: 'per_sqft', label: 'Per sqft' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'per_year', label: 'Per Year' },
];

interface Props { form: PostFormData; onChange: (d: Partial<PostFormData>) => void; onNext: () => void; }

export default function Step1BasicInfo({ form, onChange, onNext }: Props) {
  function validate() {
    if (!form.title.trim()) return 'Title is required';
    if (!form.property_type) return 'Select a property type';
    if (!form.price || parseFloat(form.price) <= 0) return 'Enter a valid price';
    if (!form.area_value || parseFloat(form.area_value) <= 0) return 'Enter a valid area';
    if (!form.contact_call && !form.contact_whatsapp && !form.contact_enquiry) return 'Select at least one contact method';
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) { alert(err); return; }
    onNext();
  }

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-gray-900 text-lg">Basic Information</h2>

      {/* Property type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t} type="button" onClick={() => onChange({ property_type: t })}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                form.property_type === t ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:border-primary-400'
              }`}>
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Listing Category *</label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(c => (
            <button key={c.value} type="button" onClick={() => onChange({ category: c.value })}
              className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                form.category === c.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input type="text" value={form.title} onChange={e => onChange({ title: e.target.value })}
          placeholder="e.g. 3BHK Flat in Sector 14, Karnal" className="input-field" maxLength={100} />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={e => onChange({ description: e.target.value })}
          placeholder="Describe the property, nearby amenities, unique features…" rows={4}
          className="input-field resize-none" />
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
          <input type="number" value={form.price} onChange={e => onChange({ price: e.target.value })}
            placeholder="e.g. 4500000" className="input-field" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
          <select value={form.price_unit} onChange={e => onChange({ price_unit: e.target.value })} className="input-field">
            {PRICE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.price_negotiable} onChange={e => onChange({ price_negotiable: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
        <span className="text-sm text-gray-700">Price is negotiable</span>
      </label>

      {/* Area */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
          <input type="number" value={form.area_value} onChange={e => onChange({ area_value: e.target.value })}
            placeholder="e.g. 1200" className="input-field" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <select value={form.area_unit} onChange={e => onChange({ area_unit: e.target.value })} className="input-field">
            {AREA_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Contact preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Options * (select at least one)</label>
        <div className="flex gap-4">
          {[['contact_call', 'Phone Call'], ['contact_whatsapp', 'WhatsApp'], ['contact_enquiry', 'Enquiry Form']].map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form[key as keyof PostFormData] as boolean}
                onChange={e => onChange({ [key]: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleNext} className="btn-primary px-8 py-2.5">Next →</button>
      </div>
    </div>
  );
}
