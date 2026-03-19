'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const PROPERTY_TYPES = ['flat','house','plot','commercial','agricultural','farmhouse','villa','independent_house','pg','warehouse','shop','office'];
const CATEGORIES = ['sale','rent','lease','pg'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'area_asc', label: 'Area: Small to Large' },
  { value: 'area_desc', label: 'Area: Large to Small' },
];

export default function FilterPanel() {
  const router = useRouter();
  const sp = useSearchParams();

  const [filters, setFilters] = useState({
    type: sp.get('type') || '',
    category: sp.get('category') || '',
    city: sp.get('city') || '',
    locality: sp.get('locality') || '',
    min_price: sp.get('min_price') || '',
    max_price: sp.get('max_price') || '',
    min_area: sp.get('min_area') || '',
    max_area: sp.get('max_area') || '',
    area_unit: sp.get('area_unit') || 'sqft',
    verified_only: sp.get('verified_only') || '',
    sort: sp.get('sort') || 'newest',
  });

  function applyFilters() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (sp.get('q')) params.set('q', sp.get('q')!);
    router.push(`/search?${params.toString()}`);
  }

  function resetFilters() {
    const q = sp.get('q');
    router.push(q ? `/search?q=${q}` : '/search');
  }

  function set(key: string, value: string) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button onClick={resetFilters} className="text-xs text-primary-600 hover:underline">Reset all</button>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Type</label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t}
              onClick={() => set('type', filters.type === t ? '' : t)}
              className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors capitalize ${
                filters.type === t
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 text-gray-700 hover:border-primary-400'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Category</label>
        <div className="flex gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => set('category', filters.category === c ? '' : c)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                filters.category === c
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 text-gray-700 hover:border-primary-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Price Range (₹)</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.min_price} onChange={e => set('min_price', e.target.value)}
            className="input-field text-sm flex-1" />
          <input type="number" placeholder="Max" value={filters.max_price} onChange={e => set('max_price', e.target.value)}
            className="input-field text-sm flex-1" />
        </div>
      </div>

      {/* Area Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Area</label>
          <select value={filters.area_unit} onChange={e => set('area_unit', e.target.value)} className="text-xs border border-gray-300 rounded px-1 py-0.5">
            {['sqft','sqyard','sqmeter','bigha','acre','kanal'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.min_area} onChange={e => set('min_area', e.target.value)}
            className="input-field text-sm flex-1" />
          <input type="number" placeholder="Max" value={filters.max_area} onChange={e => set('max_area', e.target.value)}
            className="input-field text-sm flex-1" />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sort By</label>
        <select value={filters.sort} onChange={e => set('sort', e.target.value)} className="input-field text-sm">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Verified only */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={filters.verified_only === 'true'} onChange={e => set('verified_only', e.target.checked ? 'true' : '')}
          className="w-4 h-4 text-primary-600 rounded" />
        <span className="text-sm text-gray-700">Verified listings only</span>
      </label>

      <button onClick={applyFilters} className="btn-primary w-full py-2.5">Apply Filters</button>
    </div>
  );
}
