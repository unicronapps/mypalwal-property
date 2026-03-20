'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { formatDate, PROPERTY_TYPE_LABELS } from '@/lib/format';

const STATUS_TABS = ['all', 'pending', 'active', 'sold', 'inactive'] as const;

export default function AdminListingsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [tab, setTab] = useState(initialStatus);
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (tab !== 'all') params.status = tab;
      if (search) params.search = search;
      const { data } = await api.get('/api/admin/properties', { params });
      setListings(data.data.properties);
      setTotal(data.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [tab, search]);

  async function handleApprove(id: string) {
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/properties/${id}/approve`);
      fetchListings();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/properties/${rejectModal}/reject`, { reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchListings();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  }

  async function handleVerify(id: string) {
    try {
      await api.patch(`/api/admin/properties/${id}/verify`);
      fetchListings();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.patch(`/api/admin/properties/${id}/reject`, { reason: 'Removed by admin' });
      fetchListings();
    } catch (err) { console.error(err); }
  }

  async function handleBulkApprove() {
    if (!selected.size) return;
    setActionLoading(true);
    try {
      await Promise.all([...selected].map(id => api.patch(`/api/admin/properties/${id}/approve`)));
      setSelected(new Set());
      fetchListings();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  }

  async function handleBulkDelete() {
    if (!selected.size || !confirm(`Delete ${selected.size} listings?`)) return;
    setActionLoading(true);
    try {
      await Promise.all([...selected].map(id => api.patch(`/api/admin/properties/${id}/reject`, { reason: 'Bulk removed by admin' })));
      setSelected(new Set());
      fetchListings();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === listings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(listings.map(l => l.id)));
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setTab(s)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors capitalize ${tab === s ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {s}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search by title or property ID..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
          <button onClick={handleBulkApprove} disabled={actionLoading}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">Approve All</button>
          <button onClick={handleBulkDelete} disabled={actionLoading}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">Delete All</button>
          <button onClick={() => setSelected(new Set())} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : listings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No listings found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-3 text-left">
                  <input type="checkbox" checked={selected.size === listings.length && listings.length > 0} onChange={toggleSelectAll}
                    className="rounded border-gray-300" />
                </th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">ID</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Title</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Type</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">City</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Owner</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Status</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Listed</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)}
                      className="rounded border-gray-300" />
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-gray-500">{l.property_id}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {l.cover_photo && <img src={l.cover_photo} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">{l.title}</span>
                      {l.is_verified && <span className="text-blue-500" title="Verified">&#10003;</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{PROPERTY_TYPE_LABELS[l.property_type] || l.property_type}</td>
                  <td className="py-3 px-3 text-gray-600">{l.city}</td>
                  <td className="py-3 px-3 text-gray-600">{l.owner_name}</td>
                  <td className="py-3 px-3"><StatusBadge status={l.status} /></td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(l.created_at)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <a href={`/property/${l.property_id}`} target="_blank" rel="noopener"
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">View</a>
                      {l.status === 'pending' && (
                        <button onClick={() => handleApprove(l.id)} disabled={actionLoading}
                          className="px-2 py-1 text-xs text-green-700 hover:bg-green-50 rounded disabled:opacity-50">Approve</button>
                      )}
                      {l.status !== 'inactive' && (
                        <button onClick={() => setRejectModal(l.id)}
                          className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded">Reject</button>
                      )}
                      <button onClick={() => handleVerify(l.id)}
                        className={`px-2 py-1 text-xs rounded ${l.is_verified ? 'text-blue-700 hover:bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {l.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                      {l.status !== 'inactive' && (
                        <button onClick={() => handleDelete(l.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Listing</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 resize-none h-24" />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    sold: 'bg-blue-100 text-blue-700',
    inactive: 'bg-gray-100 text-gray-600',
    rented: 'bg-teal-100 text-teal-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}
