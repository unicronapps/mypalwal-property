export const runtime = 'edge';
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatRelativeDate } from '@/lib/format';

export default function EnquiriesSentPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/api/enquiries/sent', { params: { page, limit: 15 } });
        setEnquiries(data.data.enquiries);
        setTotal(data.data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Enquiries</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-500 mb-3">You haven&apos;t made any enquiries yet</p>
          <Link href="/search" className="text-sm text-primary-600 hover:underline">Browse properties</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
              {/* Property thumbnail */}
              <Link href={`/property/${e.pid}`} className="w-full sm:w-28 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 block">
                {e.property_thumbnail ? (
                  <img src={e.property_thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No photo</div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/property/${e.pid}`} className="font-medium text-gray-900 hover:text-primary-600 truncate block">
                      {e.property_title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {e.city && `${e.city}`}{e.locality && `, ${e.locality}`}
                      {e.price && ` \u00b7 ${formatPrice(e.price, e.price_unit)}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    e.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    e.status === 'replied' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{e.status}</span>
                </div>

                {e.message && <p className="text-sm text-gray-700 mt-2 line-clamp-2">{e.message}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(e.created_at)}</p>

                {e.status === 'closed' && (
                  <Link
                    href={`/property/${e.pid}`}
                    className="inline-block mt-2 px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
                  >
                    Re-enquire
                  </Link>
                )}
              </div>
            </div>
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
