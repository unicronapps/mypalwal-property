'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const PROPERTY_TYPES = [
  { value: 'flat',             label: 'Flat' },
  { value: 'house',            label: 'House' },
  { value: 'plot',             label: 'Plot' },
  { value: 'villa',            label: 'Villa' },
  { value: 'commercial',       label: 'Commercial' },
  { value: 'agricultural',     label: 'Land' },
  { value: 'farmhouse',        label: 'Farmhouse' },
  { value: 'pg',               label: 'PG' },
  { value: 'warehouse',        label: 'Warehouse' },
  { value: 'shop',             label: 'Shop' },
  { value: 'office',           label: 'Office' },
  { value: 'independent_house',label: 'Ind. House' },
];

const CATEGORIES = [
  { value: 'sale',  label: 'Buy' },
  { value: 'rent',  label: 'Rent' },
  { value: 'lease', label: 'Lease' },
  { value: 'pg',    label: 'PG' },
];

const PRICE_PRESETS = [
  { label: 'Under ₹20L',   min: '',         max: '2000000' },
  { label: '₹20L–₹50L',   min: '2000000',  max: '5000000' },
  { label: '₹50L–₹1Cr',   min: '5000000',  max: '10000000' },
  { label: '₹1Cr–₹2Cr',   min: '10000000', max: '20000000' },
  { label: 'Above ₹2Cr',  min: '20000000', max: '' },
];

const AREA_UNITS = ['sqft', 'sqyard', 'sqmeter', 'bigha', 'acre', 'kanal'];

interface FilterPanelProps {
  onClose: () => void;
}

export default function FilterPanel({ onClose }: FilterPanelProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const [filters, setFilters] = useState({
    type:         sp.get('type') || '',
    category:     sp.get('category') || '',
    city:         sp.get('city') || '',
    locality:     sp.get('locality') || '',
    min_price:    sp.get('min_price') || '',
    max_price:    sp.get('max_price') || '',
    min_area:     sp.get('min_area') || '',
    max_area:     sp.get('max_area') || '',
    area_unit:    sp.get('area_unit') || 'sqft',
    verified_only:sp.get('verified_only') || '',
  });

  function set(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function toggle(key: 'type' | 'category', value: string) {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? '' : value }));
  }

  function applyPricePreset(min: string, max: string) {
    // Toggle: if already active, clear
    if (filters.min_price === min && filters.max_price === max) {
      setFilters((f) => ({ ...f, min_price: '', max_price: '' }));
    } else {
      setFilters((f) => ({ ...f, min_price: min, max_price: max }));
    }
  }

  function isPricePresetActive(min: string, max: string) {
    return filters.min_price === min && filters.max_price === max;
  }

  function applyFilters() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (sp.get('q')) params.set('q', sp.get('q')!);
    if (sp.get('sort')) params.set('sort', sp.get('sort')!);
    router.push(`/search?${params.toString()}`);
    onClose();
  }

  function resetFilters() {
    const q = sp.get('q');
    const sort = sp.get('sort');
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (sort) next.set('sort', sort);
    router.push(`/search?${next.toString()}`);
    setFilters({ type: '', category: '', city: '', locality: '', min_price: '', max_price: '', min_area: '', max_area: '', area_unit: 'sqft', verified_only: '' });
    onClose();
  }

  return (
    <div className="space-y-6">

      {/* ── Category ── */}
      <div>
        <SectionLabel>Looking to</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              active={filters.category === c.value}
              onClick={() => toggle('category', c.value)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* ── Property type ── */}
      <div>
        <SectionLabel>Property Type</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {PROPERTY_TYPES.map((t) => (
            <Chip
              key={t.value}
              active={filters.type === t.value}
              onClick={() => toggle('type', t.value)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* ── Location ── */}
      <div>
        <SectionLabel>Location</SectionLabel>
        <div className="space-y-2">
          <input
            type="text"
            value={filters.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="City (e.g. Gurugram)"
            className="input-sm"
          />
          <input
            type="text"
            value={filters.locality}
            onChange={(e) => set('locality', e.target.value)}
            placeholder="Locality / Sector (optional)"
            className="input-sm"
          />
        </div>
      </div>

      {/* ── Price ── */}
      <div>
        <SectionLabel>Budget</SectionLabel>
        {/* Quick presets */}
        <div className="flex gap-2 flex-wrap mb-3">
          {PRICE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPricePreset(p.min, p.max)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isPricePresetActive(p.min, p.max)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 text-gray-600 hover:border-primary-400 bg-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Manual range */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.min_price}
            onChange={(e) => set('min_price', e.target.value)}
            className="input-sm flex-1"
          />
          <span className="text-gray-400 text-sm flex-shrink-0">–</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.max_price}
            onChange={(e) => set('max_price', e.target.value)}
            className="input-sm flex-1"
          />
        </div>
      </div>

      {/* ── Area ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel className="mb-0">Area</SectionLabel>
          <select
            value={filters.area_unit}
            onChange={(e) => set('area_unit', e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {AREA_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_area}
            onChange={(e) => set('min_area', e.target.value)}
            className="input-sm flex-1"
          />
          <span className="text-gray-400 text-sm flex-shrink-0">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_area}
            onChange={(e) => set('max_area', e.target.value)}
            className="input-sm flex-1"
          />
        </div>
      </div>

      {/* ── Verified only ── */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={filters.verified_only === 'true'}
            onChange={(e) => set('verified_only', e.target.checked ? 'true' : '')}
          />
          <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-600 transition-colors" />
          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">Verified listings only</p>
          <p className="text-xs text-gray-400">Show only verified properties</p>
        </div>
      </label>

      {/* ── Actions (desktop only — mobile uses sheet footer) ── */}
      <div className="hidden lg:flex flex-col gap-2 pt-2">
        <button
          onClick={applyFilters}
          className="w-full bg-primary-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-primary-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={resetFilters}
          className="w-full border border-gray-300 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          Reset all
        </button>
      </div>

      {/* Mobile apply — inside sheet, this button is in the sheet footer,
          but we expose it here too so the panel can be used standalone */}
      <div className="lg:hidden">
        <button
          onClick={applyFilters}
          className="w-full bg-primary-600 text-white font-semibold py-3 rounded-xl text-sm hover:bg-primary-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>

    </div>
  );
}

/* ─── Small helpers ─── */
function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ${className}`}>
      {children}
    </p>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'border-gray-300 text-gray-600 hover:border-primary-400 bg-white'
      }`}
    >
      {children}
    </button>
  );
}
