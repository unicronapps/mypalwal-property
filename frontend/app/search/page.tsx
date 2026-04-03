'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from 'react';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton';
import FilterPanel from '@/components/search/FilterPanel';
import api from '@/lib/api';

type AnySearchParams = URLSearchParams | ReturnType<typeof useSearchParams>;

/* ─── Utility: build URL from current params + overrides ─── */
function buildUrl(sp: AnySearchParams, overrides: Record<string, string | null>) {
  const p = new URLSearchParams(sp.toString());
  Object.entries(overrides).forEach(([k, v]) => {
    if (v === null || v === '') p.delete(k);
    else p.set(k, v);
  });
  return `/search?${p.toString()}`;
}

/* ─── Active filter chips ─── */
const CHIP_KEYS: Record<string, (v: string) => string> = {
  category:   (v) => v.charAt(0).toUpperCase() + v.slice(1),
  type:       (v) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  city:       (v) => v,
  locality:   (v) => v,
  min_price:  (v) => `From ₹${Number(v).toLocaleString('en-IN')}`,
  max_price:  (v) => `Up to ₹${Number(v).toLocaleString('en-IN')}`,
  min_area:   (v) => `Area ≥ ${v}`,
  max_area:   (v) => `Area ≤ ${v}`,
  verified_only: () => 'Verified only',
  sort:       (v) => ({ newest: 'Newest', price_asc: 'Price ↑', price_desc: 'Price ↓', area_asc: 'Area ↑', area_desc: 'Area ↓' }[v] || v),
};
const SKIP_CHIPS = new Set(['q', 'page']);

function ActiveChips({ sp }: { sp: AnySearchParams }) {
  const router = useRouter();
  const chips: { key: string; label: string }[] = [];
  sp.forEach((v, k) => {
    if (!SKIP_CHIPS.has(k) && CHIP_KEYS[k]) chips.push({ key: k, label: CHIP_KEYS[k](v) });
  });
  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => router.push(buildUrl(sp, { [c.key]: null, page: null }))}
          className="inline-flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-medium rounded-full px-3 py-1.5 hover:bg-primary-100 transition-colors"
        >
          {c.label}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button
        onClick={() => router.push(sp.get('q') ? `/search?q=${sp.get('q')}` : '/search')}
        className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
}

/* ─── Search bar (inline, compact) ─── */
function InlineSearch() {
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(sp.get('q') || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl(sp, { q: q || null, page: null }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="City, locality, or property ID…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>
      <button type="submit" className="bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap">
        Search
      </button>
    </form>
  );
}

/* ─── Sort dropdown ─── */
const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
  { value: 'area_asc',  label: 'Area: Small → Large' },
  { value: 'area_desc', label: 'Area: Large → Small' },
];

function SortSelect() {
  const sp = useSearchParams();
  const router = useRouter();
  return (
    <select
      value={sp.get('sort') || 'newest'}
      onChange={(e) => router.push(buildUrl(sp, { sort: e.target.value, page: null }))}
      className="text-sm border border-gray-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
    >
      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ─── Main results component ─── */
function SearchResults() {
  const sp = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyIdMatch, setPropertyIdMatch] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const page = parseInt(sp.get('page') || '1', 10);

  // Count active filters (excluding q, page, sort)
  const activeFilterCount = Array.from(sp.entries()).filter(([k]) =>
    !['q', 'page', 'sort'].includes(k)
  ).length;

  useEffect(() => {
    const params: Record<string, string> = {};
    sp.forEach((v, k) => { params[k] = v; });
    setIsLoading(true);
    api.get('/api/properties', { params })
      .then(({ data }) => {
        setListings(data.data.listings || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
        setPropertyIdMatch(data.data.propertyIdMatch || false);
      })
      .catch(() => setListings([]))
      .finally(() => setIsLoading(false));
  }, [sp.toString()]);

  // Lock body scroll when filter sheet open
  useEffect(() => {
    document.body.style.overflow = filterOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filterOpen]);

  function buildPageUrl(p: number) {
    return buildUrl(sp, { page: String(p) });
  }

  const pages = (() => {
    const total = Math.min(5, totalPages);
    const start = Math.max(1, Math.min(page - 2, totalPages - total + 1));
    return Array.from({ length: Math.min(total, totalPages - start + 1) }, (_, i) => start + i);
  })();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Search input — expands on larger screens */}
            <div className="flex-1 min-w-0">
              <InlineSearch />
            </div>

            {/* Sort — hidden on mobile (in filter sheet instead) */}
            <div className="hidden sm:block flex-shrink-0">
              <SortSelect />
            </div>

            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setFilterOpen(true)}
              className="relative flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0 lg:hidden"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M10 12h4" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2.5">
            <ActiveChips sp={sp} />
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* Property ID match banner */}
        {propertyIdMatch && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium flex items-center gap-2">
            <span>⚡</span> Exact property ID match found
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <FilterPanel onClose={() => {}} />
            </div>
          </aside>

          {/* ── Results column ── */}
          <div className="flex-1 min-w-0">

            {/* Result count + sort row */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <p className="text-sm text-gray-500">
                {isLoading ? (
                  <span className="inline-block w-32 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <><span className="font-semibold text-gray-900">{total.toLocaleString('en-IN')}</span> {total === 1 ? 'listing' : 'listings'} found</>
                )}
              </p>
              <div className="sm:hidden flex-shrink-0">
                <SortSelect />
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-semibold text-gray-700 mb-1">No properties found</p>
                <p className="text-sm text-gray-400 mb-6">Try adjusting your filters or searching a different location.</p>
                <a href="/search" className="inline-block bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">
                  Clear all filters
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {listings.map((p: any) => <PropertyCard key={p.id} property={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 mt-10">
                    <a
                      href={page > 1 ? buildPageUrl(page - 1) : undefined}
                      aria-disabled={page <= 1}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm transition-colors ${page <= 1 ? 'border-gray-200 text-gray-300 pointer-events-none' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      ‹
                    </a>
                    {pages.map((p) => (
                      <a
                        key={p}
                        href={buildPageUrl(p)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-medium transition-colors ${p === page ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {p}
                      </a>
                    ))}
                    <a
                      href={page < totalPages ? buildPageUrl(page + 1) : undefined}
                      aria-disabled={page >= totalPages}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm transition-colors ${page >= totalPages ? 'border-gray-200 text-gray-300 pointer-events-none' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      ›
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ Mobile filter bottom sheet ══ */}
      {filterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setFilterOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl lg:hidden flex flex-col max-h-[90dvh]">
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 text-base">Filters &amp; Sort</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setFilterOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {/* Sort (mobile only) */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort By</label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => router.push(buildUrl(sp, { sort: o.value, page: null }))}
                      className={`text-xs px-3 py-2.5 rounded-xl border transition-colors text-left ${(sp.get('sort') || 'newest') === o.value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-700 hover:border-primary-300'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <FilterPanel onClose={() => setFilterOpen(false)} />
            </div>

            {/* Sheet footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
              <button
                onClick={() => { router.push(sp.get('q') ? `/search?q=${sp.get('q')}` : '/search'); setFilterOpen(false); }}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-2 bg-primary-600 text-white font-semibold py-3 px-6 rounded-xl text-sm hover:bg-primary-700 transition-colors"
              >
                {isLoading ? 'Loading…' : `Show ${total.toLocaleString('en-IN')} listings`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16" />
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
