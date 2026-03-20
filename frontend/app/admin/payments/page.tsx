'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState({ today: 0, this_month: 0, all_time: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [boostModal, setBoostModal] = useState(false);
  const [boostPropertyId, setBoostPropertyId] = useState('');
  const [boostDuration, setBoostDuration] = useState('7');
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostMsg, setBoostMsg] = useState('');
  const limit = 20;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/payments', { params: { page, limit } });
      setPayments(data.data.payments);
      setTotal(data.data.total);
      setRevenue(data.data.revenue);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  async function handleGrantBoost() {
    if (!boostPropertyId.trim()) return;
    setBoostLoading(true);
    setBoostMsg('');
    try {
      await api.post('/api/admin/boost/grant', {
        property_id: boostPropertyId.trim(),
        duration_days: parseInt(boostDuration),
      });
      setBoostMsg('Boost granted successfully!');
      setBoostPropertyId('');
      fetchPayments();
    } catch (err: any) {
      setBoostMsg(err.response?.data?.message || 'Failed to grant boost');
    } finally {
      setBoostLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <button onClick={() => setBoostModal(true)}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Grant Boost
        </button>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(revenue.today)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(revenue.this_month)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">All Time</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(revenue.all_time)}</p>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No payments yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-3 text-left font-medium text-gray-500">User</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Type</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Plan/Duration</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Amount</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Date</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-900">{p.user_name}</p>
                    <p className="text-xs text-gray-500">{p.user_phone}</p>
                  </td>
                  <td className="py-3 px-3 capitalize text-gray-600">{p.type}</td>
                  <td className="py-3 px-3 text-gray-600">{p.metadata?.plan_name || p.metadata?.duration_days ? `${p.metadata.duration_days} days` : '-'}</td>
                  <td className="py-3 px-3 font-medium text-gray-900">{formatPrice(p.amount)}</td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(p.created_at)}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'paid' ? 'bg-green-100 text-green-700' :
                      p.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
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

      {/* Grant Boost Modal */}
      {boostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBoostModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Free Boost</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property ID (UUID)</label>
                <input type="text" value={boostPropertyId} onChange={e => setBoostPropertyId(e.target.value)}
                  placeholder="Enter property UUID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select value={boostDuration} onChange={e => setBoostDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
              {boostMsg && (
                <p className={`text-sm ${boostMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{boostMsg}</p>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setBoostModal(false); setBoostMsg(''); }}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleGrantBoost} disabled={boostLoading || !boostPropertyId.trim()}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {boostLoading ? 'Granting...' : 'Grant Boost'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
