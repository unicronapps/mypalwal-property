'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const PROPERTY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'flat', label: 'Flat' },
  { value: 'plot', label: 'Plot' },
  { value: 'house', label: 'House' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'agricultural', label: 'Land' },
  { value: 'farmhouse', label: 'Farmhouse' },
  { value: 'villa', label: 'Villa' },
];

interface Suggestion {
  type: 'property' | 'city' | 'locality';
  label: string;
  value: string;
  property_id?: string;
  id?: string;
  city?: string;
}

interface SearchBarProps {
  initialQuery?: string;
  initialType?: string;
  size?: 'lg' | 'sm';
}

export default function SearchBar({ initialQuery = '', initialType = '', size = 'lg' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPropertyId, setIsPropertyId] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if query looks like a property ID
    setIsPropertyId(/^[A-Za-z0-9]{5}$/.test(query.trim()));

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/search/suggest', { params: { q: query } });
        setSuggestions(data.data.suggestions || []);
        setShowSuggestions(true);
      } catch {}
    }, 300);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type) params.set('type', type);
    router.push(`/search?${params.toString()}`);
    setShowSuggestions(false);
  }

  function handleSuggestionClick(s: Suggestion) {
    setShowSuggestions(false);
    if (s.type === 'property') {
      router.push(`/property/${s.property_id || s.value}`);
    } else if (s.type === 'city') {
      router.push(`/search?city=${encodeURIComponent(s.value)}`);
    } else if (s.type === 'locality') {
      router.push(`/search?locality=${encodeURIComponent(s.value)}${s.city ? `&city=${encodeURIComponent(s.city)}` : ''}`);
    }
  }

  const isLg = size === 'lg';

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSearch} className={`flex gap-2 ${isLg ? 'flex-col sm:flex-row' : 'flex-row'}`}>
        {/* Type filter */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 ${isLg ? 'px-3 py-3 text-sm sm:w-44' : 'px-2 py-2 text-xs w-32'}`}
        >
          {PROPERTY_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search city, locality, or property ID…"
            className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${isLg ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'}`}
          />
          {isPropertyId && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Search by ID</span>
            </div>
          )}
        </div>

        <button type="submit" className={`bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors ${isLg ? 'px-6 py-3' : 'px-4 py-2 text-sm'}`}>
          Search
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
            >
              <span className="text-gray-400 text-xs w-14 shrink-0">
                {s.type === 'property' ? '🏠 Listing' : s.type === 'city' ? '🏙 City' : '📍 Area'}
              </span>
              <span className="text-sm text-gray-800">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
