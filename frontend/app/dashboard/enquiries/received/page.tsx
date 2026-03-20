'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatRelativeDate } from '@/lib/format';

const TABS = ['all', 'new', 'replied', 'closed'] as const;
type Tab = (typeof TABS)[number];

export default function LeadsReceivedPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (tab !== 'all') params.status = tab;
      const { data } = await api.get('/api/enquiries/received', { params });
      setEnquiries(data.data.enquiries);
      setTotal(data.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);
  useEffect(() => { setPage(1); }, [tab]);

  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/api/enquiries/${id}/status`, { status });
      fetchEnquiries();
    } catch (err) {
      console.error(err);
    }
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Leads Received</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              tab === t ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-500">No enquiries found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Property thumbnail */}
                <div className="w-full sm:w-20 h-16 sm:h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {e.property_thumbnail && <img src={e.property_thumbnail} alt="" className="w-full h-full object-cover" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{e.buyer_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{e.buyer_phone}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      e.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      e.status === 'replied' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{e.status}</span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Re: <span className="font-medium">{e.property_title}</span> ({e.pid})
                  </p>
                  {e.message && <p className="text-sm text-gray-700 mt-1 line-clamp-2">{e.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(e.created_at)}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {e.buyer_phone && (
                      <a
                        href={`https://wa.me/91${e.buyer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50"
                      >
                        WhatsApp
                      </a>
                    )}
                    {e.buyer_phone && (
                      <a
                        href={`tel:${e.buyer_phone}`}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        Call
                      </a>
                    )}
                    {e.status === 'new' && (
                      <button
                        onClick={() => updateStatus(e.id, 'replied')}
                        className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
                      >
                        Mark Replied
                      </button>
                    )}
                    {e.status !== 'closed' && (
                      <button
                        onClick={() => updateStatus(e.id, 'closed')}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
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
