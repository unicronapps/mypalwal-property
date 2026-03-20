'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function AdminDealersPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit, role: 'dealer' };
      if (search) params.search = search;
      const { data } = await api.get('/api/admin/users', { params });
      setDealers(data.data.users);
      setTotal(data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchDealers(); }, [fetchDealers]);
  useEffect(() => { setPage(1); }, [search]);

  async function handleVerifyToggle(id: string) {
    try {
      await api.patch(`/api/admin/dealers/${id}/verify`);
      fetchDealers();
    } catch (err) { console.error(err); }
  }

  async function handleBanToggle(dealer: any) {
    if (dealer.is_active && !confirm(`Ban dealer ${dealer.name || dealer.phone}?`)) return;
    try {
      await api.patch(`/api/admin/users/${dealer.id}/ban`);
      fetchDealers();
    } catch (err) { console.error(err); }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Dealers</h1>

      <div className="flex justify-end">
        <input type="text" placeholder="Search dealers..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : dealers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No dealers found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-3 text-left font-medium text-gray-500">Dealer</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Phone</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Agency</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Active Listings</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Verified</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Status</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Joined</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dealers.map(d => (
                <tr key={d.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!d.is_active ? 'bg-red-50/50' : ''}`}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                        {d.avatar_url ? <img src={d.avatar_url} alt="" className="w-full h-full object-cover" /> : (d.name?.[0] || '?')}
                      </div>
                      <span className="font-medium text-gray-900">{d.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{d.phone}</td>
                  <td className="py-3 px-3 text-gray-600">{d.agency_name || '-'}</td>
                  <td className="py-3 px-3 text-gray-900 font-medium">{d.active_listings}</td>
                  <td className="py-3 px-3">
                    <button onClick={() => handleVerifyToggle(d.id)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                        d.verified_dealer
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {d.verified_dealer ? (
                        <><span>&#10003;</span> Verified</>
                      ) : (
                        'Not Verified'
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    {!d.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Banned</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(d.created_at)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <a href={`/dealer/${d.id}`} target="_blank" rel="noopener"
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">Profile</a>
                      <button onClick={() => handleBanToggle(d)}
                        className={`px-2 py-1 text-xs rounded ${!d.is_active ? 'text-green-700 hover:bg-green-50' : 'text-red-700 hover:bg-red-50'}`}>
                        {!d.is_active ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
