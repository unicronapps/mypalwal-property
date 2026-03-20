'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, formatRelativeDate } from '@/lib/format';

const STATUS_TABS = ['all', 'pending', 'dismissed', 'resolved'] as const;

export default function AdminReportsPage() {
  const [tab, setTab] = useState('all');
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const limit = 12;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (tab !== 'all') params.status = tab;
      const { data } = await api.get('/api/admin/reports', { params });
      setReports(data.data.reports);
      setTotal(data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { setPage(1); }, [tab]);

  async function handleAction(reportId: string, action: 'dismiss' | 'remove' | 'ban_poster') {
    const labels = { dismiss: 'Dismiss', remove: 'Remove listing', ban_poster: 'Ban poster & remove listing' };
    if (!confirm(`${labels[action]}?`)) return;
    setActionLoading(reportId);
    try {
      await api.patch(`/api/admin/reports/${reportId}`, { action });
      fetchReports();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reported Listings</h1>

      <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1 w-fit">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors capitalize ${tab === s ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white rounded-xl border animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">No reports found</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              {/* Listing preview */}
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {r.property_photo ? (
                    <img src={r.property_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No photo</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.property_title}</p>
                  <p className="text-xs text-gray-500">{r.property_city} &middot; {r.pid}</p>
                  <p className="text-xs text-gray-500 mt-1">Owner: {r.owner_name}</p>
                </div>
                <ReportStatusBadge status={r.status} />
              </div>

              {/* Report details */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Reported by <strong>{r.reporter_name}</strong> &middot; {formatRelativeDate(r.created_at)}</p>
                <p className="text-sm font-medium text-gray-800">{r.reason}</p>
                {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
              </div>

              {/* Actions */}
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <a href={`/property/${r.pid}`} target="_blank" rel="noopener"
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    View Listing
                  </a>
                  <button onClick={() => handleAction(r.id, 'dismiss')} disabled={actionLoading === r.id}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    Dismiss
                  </button>
                  <button onClick={() => handleAction(r.id, 'remove')} disabled={actionLoading === r.id}
                    className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                    Remove Listing
                  </button>
                  <button onClick={() => handleAction(r.id, 'ban_poster')} disabled={actionLoading === r.id}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                    Ban Poster
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    dismissed: 'bg-gray-100 text-gray-600',
    resolved: 'bg-red-100 text-red-700',
    reviewed: 'bg-blue-100 text-blue-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full h-fit ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}
