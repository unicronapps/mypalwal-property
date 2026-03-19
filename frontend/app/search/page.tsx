'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import SearchBar from '@/components/search/SearchBar';
import FilterPanel from '@/components/search/FilterPanel';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton';
import api from '@/lib/api';

function SearchResults() {
  const sp = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyIdMatch, setPropertyIdMatch] = useState(false);

  const page = parseInt(sp.get('page') || '1', 10);

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

  function buildPageUrl(p: number) {
    const params = new URLSearchParams(sp.toString());
    params.set('page', String(p));
    return `/search?${params.toString()}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="mb-6">
        <SearchBar initialQuery={sp.get('q') || ''} initialType={sp.get('type') || ''} size="sm" />
      </div>

      {/* Property ID match banner */}
      {propertyIdMatch && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium">
          ⚡ Exact property ID match found
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <FilterPanel />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Count */}
          <div className="flex items-center justify-between mb-4">
            {!isLoading && (
              <p className="text-sm text-gray-600">
                {total === 0 ? 'No listings found' : `${total.toLocaleString('en-IN')} listing${total !== 1 ? 's' : ''} found`}
              </p>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium text-gray-600 mb-2">No properties found</p>
              <p className="text-sm mb-6">Try adjusting your filters or search term</p>
              <a href="/search" className="text-primary-600 hover:underline text-sm font-medium">Clear all filters →</a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map((p: any) => <PropertyCard key={p.id} property={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <a href={buildPageUrl(page - 1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">← Prev</a>
                  )}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <a key={p} href={buildPageUrl(p)}
                        className={`px-4 py-2 border rounded-lg text-sm ${p === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                        {p}
                      </a>
                    );
                  })}
                  {page < totalPages && (
                    <a href={buildPageUrl(page + 1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Next →</a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><PropertyCardSkeleton key={i}/>)}</div>}>
      <SearchResults />
    </Suspense>
  );
}
