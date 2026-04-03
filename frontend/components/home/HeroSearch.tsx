'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const PROPERTY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'flat', label: 'Flat' },
  { value: 'plot', label: 'Plot' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'agricultural', label: 'Land' },
  { value: 'farmhouse', label: 'Farmhouse' },
  { value: 'pg', label: 'PG' },
];

// Matches FilterPanel's min_price / max_price params exactly
const BUDGET_BUY = [
  { label: 'Any Budget', value: '' },
  { label: 'Under ₹20L', min: '', max: '2000000' },
  { label: '₹20L – ₹50L', min: '2000000', max: '5000000' },
  { label: '₹50L – ₹1Cr', min: '5000000', max: '10000000' },
  { label: '₹1Cr – ₹2Cr', min: '10000000', max: '20000000' },
  { label: 'Above ₹2Cr', min: '20000000', max: '' },
];

const BUDGET_RENT = [
  { label: 'Any Budget', value: '' },
  { label: 'Under ₹5K/mo', min: '', max: '5000' },
  { label: '₹5K – ₹10K/mo', min: '5000', max: '10000' },
  { label: '₹10K – ₹20K/mo', min: '10000', max: '20000' },
  { label: '₹20K – ₹50K/mo', min: '20000', max: '50000' },
  { label: 'Above ₹50K/mo', min: '50000', max: '' },
];

const LOCAL_LOCALITIES = [
  'HUDA Sector 2', 'New Colony', 'New Colony Extension', 'Adarsh Colony',
  'Krishna Colony', 'Kalra Colony', 'Shiv Colony', 'Shiva Puri',
  'Kailash Nagar', 'Camp Colony', 'Housing Board Colony', 'Jawahar Nagar',
  'Prakash Vihar Colony', 'Panchwati Colony', 'Ramnagar', 'Deepak Colony',
  'Shyam Nagar Colony', 'Alapur', 'Omaxe City', 'SRS Prime Floor Sector 6',
  'RPS Urbania Sector 10', 'Baghola', 'Patli Khurd', 'Main Market Agra Chowk',
  'Gol Market', 'Railway Road', 'Bus Stand Area', 'Subzi Mandi Area',
  'Mathura Road Area', 'Minar Gate',
];

const KEYWORD_SUGGESTIONS = [
  'Apartment', 'Gated Society', 'Ready to Move', 'Under Construction',
  'Corner Plot', 'Park Facing', 'Metro Nearby', 'Near School',
];

interface Suggestion {
  type: 'property' | 'city' | 'locality';
  label: string;
  value: string;
  property_id?: string;
  city?: string;
}

type Tab = 'buy' | 'rent' | 'id';

export default function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('buy');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [propertyId, setPropertyId] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [localMatches, setLocalMatches] = useState<string[]>(LOCAL_LOCALITIES);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const keywordInputRef = useRef<HTMLInputElement>(null);

  const budgetOptions = tab === 'rent' ? BUDGET_RENT : BUDGET_BUY;

  useEffect(() => { setBudgetIdx(0); }, [tab]);

  // Location autocomplete — filter local list immediately, then debounce API
  useEffect(() => {
    if (tab === 'id') {
      setSuggestions([]);
      setLocalMatches(LOCAL_LOCALITIES);
      return;
    }
    const q = location.trim();
    // Filter local localities
    const matched = q.length === 0
      ? LOCAL_LOCALITIES
      : LOCAL_LOCALITIES.filter((l) => l.toLowerCase().includes(q.toLowerCase()));
    setLocalMatches(matched);
    setActiveIdx(-1);

    // API call only after 2+ chars
    if (q.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/search/suggest', { params: { q } });
        const filtered = (data.data.suggestions || []).filter(
          (s: Suggestion) => s.type === 'city' || s.type === 'locality'
        );
        setSuggestions(filtered);
        setActiveIdx(-1);
      } catch {}
    }, 300);
  }, [location, tab]);

  // Click-outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowKeywordDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (tab === 'id') {
      const id = propertyId.trim().toUpperCase();
      if (id) router.push(`/search?q=${id}`);
      return;
    }

    const params = new URLSearchParams();
    params.set('category', tab === 'rent' ? 'rent' : 'sale');
    if (propertyType) params.set('type', propertyType);

    // Combine location + keyword into q param
    const qParts = [location.trim(), keyword.trim()].filter(Boolean);
    if (qParts.length) params.set('q', qParts.join(' '));

    const selected = budgetOptions[budgetIdx];
    if (selected && 'min' in selected) {
      if (selected.min) params.set('min_price', selected.min);
      if (selected.max) params.set('max_price', selected.max);
    }

    router.push(`/search?${params.toString()}`);
    setShowSuggestions(false);
    setShowKeywordDropdown(false);
  }

  function handleSuggestionClick(s: Suggestion) {
    setLocation(s.type === 'city' ? s.value : s.label);
    setShowSuggestions(false);
    setTimeout(() => keywordInputRef.current?.focus(), 50);
  }

  function handleLocalityClick(name: string) {
    setLocation(name);
    setShowSuggestions(false);
    setTimeout(() => keywordInputRef.current?.focus(), 50);
  }

  // Combined list length for keyboard nav: local first, then API
  const totalItems = localMatches.length + suggestions.length;

  function handleLocationKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      if (activeIdx < localMatches.length) {
        handleLocalityClick(localMatches[activeIdx]);
      } else {
        handleSuggestionClick(suggestions[activeIdx - localMatches.length]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function handleKeywordSelect(kw: string) {
    setKeyword(kw);
    setShowKeywordDropdown(false);
  }

  const filteredKeywords = KEYWORD_SUGGESTIONS.filter(
    (kw) => !keyword || kw.toLowerCase().includes(keyword.toLowerCase())
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'buy', label: 'Buy' },
    { key: 'rent', label: 'Rent' },
    { key: 'id', label: 'Search by ID' },
  ];

  return (
    <div ref={containerRef} className="w-full">
      {/* Tab strip */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch}>
        {tab === 'id' ? (
          /* ── Property ID search ── */
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <input
                type="text"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value.toUpperCase())}
                placeholder="Enter 5-character property ID, e.g. A3K9P"
                maxLength={5}
                className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 text-base font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
              />
              {propertyId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {propertyId.length}/5
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={propertyId.trim().length !== 5}
              className="bg-primary-600 text-white rounded-xl font-semibold px-7 py-3 hover:bg-primary-700 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Find
            </button>
          </div>
        ) : (
          /* ── Buy / Rent search ── */
          <div className="flex flex-col gap-2">
            {/* Row 1: Property type + Location + Budget + Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Property type */}
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-3 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-40"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {/* Location autocomplete */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  ref={locationInputRef}
                  type="text"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleLocationKeyDown}
                  placeholder="Search locality…"
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-9 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoComplete="off"
                />
                {location && (
                  <button
                    type="button"
                    onClick={() => { setLocation(''); setSuggestions([]); setShowSuggestions(false); locationInputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear location"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Location dropdown */}
                {showSuggestions && (localMatches.length > 0 || suggestions.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <ul className="max-h-72 overflow-y-auto">

                      {/* ── Local localities ── */}
                      {localMatches.length > 0 && (
                        <>
                          <li className="px-4 pt-3 pb-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {location.trim() ? 'Matching localities' : 'Popular localities'}
                            </p>
                          </li>
                          {localMatches.map((name, i) => (
                            <li key={name}>
                              <button
                                type="button"
                                onClick={() => handleLocalityClick(name)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                  i === activeIdx ? 'bg-primary-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                  </svg>
                                </span>
                                <span className="text-sm text-gray-800">{name}</span>
                              </button>
                            </li>
                          ))}
                        </>
                      )}

                      {/* ── API results (cities / other localities) ── */}
                      {suggestions.length > 0 && (
                        <>
                          <li className="px-4 pt-3 pb-1.5 border-t border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">More results</p>
                          </li>
                          {suggestions.map((s, i) => {
                            const globalIdx = localMatches.length + i;
                            return (
                              <li key={i}>
                                <button
                                  type="button"
                                  onClick={() => handleSuggestionClick(s)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                    globalIdx === activeIdx ? 'bg-primary-50' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                    s.type === 'city' ? 'bg-blue-50' : 'bg-green-50'
                                  }`}>
                                    {s.type === 'city' ? (
                                      <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                      </svg>
                                    )}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 truncate">{s.label}</p>
                                    {s.city && <p className="text-xs text-gray-400">{s.city}</p>}
                                  </div>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                                    s.type === 'city' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-600'
                                  }`}>{s.type}</span>
                                </button>
                              </li>
                            );
                          })}
                        </>
                      )}

                      {/* Empty state when typed but nothing matched */}
                      {location.trim().length >= 2 && localMatches.length === 0 && suggestions.length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-gray-400">No localities found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Budget */}
              <select
                value={budgetIdx}
                onChange={(e) => setBudgetIdx(Number(e.target.value))}
                className="border border-gray-300 rounded-xl px-3 py-3 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-48"
              >
                {budgetOptions.map((b, i) => (
                  <option key={i} value={i}>{b.label}</option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-primary-600 text-white rounded-xl font-semibold px-7 py-3 hover:bg-primary-700 active:scale-95 transition-all whitespace-nowrap"
              >
                Search
              </button>
            </div>

            {/* Row 2: Keyword input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <input
                ref={keywordInputRef}
                type="text"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setShowKeywordDropdown(true); }}
                onFocus={() => setShowKeywordDropdown(true)}
                placeholder="Add keyword — apartment, gated society, corner plot… (optional)"
                className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                autoComplete="off"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => { setKeyword(''); keywordInputRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear keyword"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Keyword dropdown */}
              {showKeywordDropdown && filteredKeywords.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Suggestions</p>
                    <p className="text-[10px] text-gray-400">Click to add</p>
                  </div>
                  <div className="p-2 flex flex-wrap gap-1.5">
                    {filteredKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => handleKeywordSelect(kw)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          keyword === kw
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600 bg-white'
                        }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {tab === 'id' && (
        <p className="text-xs text-gray-400 mt-2">
          Property IDs are shown on listing cards and shared by sellers. Each ID is unique to one listing.
        </p>
      )}
    </div>
  );
}
