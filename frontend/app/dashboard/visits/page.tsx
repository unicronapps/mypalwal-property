'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatRelativeDate, PROPERTY_TYPE_LABELS } from '@/lib/format';

export default function VisitHistoryPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/api/visits/mine', { params: { page, limit: 12 } });
        setVisits(data.data.visits);
        setTotal(data.data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-500 mb-3">No properties viewed yet</p>
          <Link href="/search" className="text-sm text-primary-600 hover:underline">Browse properties</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visits.map((v) => (
            <Link
              key={v.property_id}
              href={`/property/${v.pid}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-36 bg-gray-100">
                {v.cover_photo ? (
                  <img src={v.cover_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No photo</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm truncate">{v.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {PROPERTY_TYPE_LABELS[v.property_type] || v.property_type}
                  {v.city && ` \u00b7 ${v.city}`}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-primary-600">
                    {v.price ? formatPrice(v.price, v.price_unit) : ''}
                  </span>
                  <span className="text-xs text-gray-400">Viewed {formatRelativeDate(v.viewed_at)}</span>
                </div>
                {v.status !== 'active' && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{v.status}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
