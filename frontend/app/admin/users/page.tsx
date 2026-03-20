'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';

const ROLE_TABS = ['all', 'user', 'dealer', 'admin'] as const;

export default function AdminUsersPage() {
  const [role, setRole] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [banConfirm, setBanConfirm] = useState<any>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (role !== 'all') params.role = role;
      if (search) params.search = search;
      const { data } = await api.get('/api/admin/users', { params });
      setUsers(data.data.users);
      setTotal(data.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [role, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [role, search]);

  async function handleBanToggle(user: any) {
    if (user.is_active) {
      // About to deactivate (ban) — confirm
      setBanConfirm(user);
      return;
    }
    // Reactivate (unban)
    try {
      await api.patch(`/api/admin/users/${user.id}/ban`);
      fetchUsers();
    } catch (err) { console.error(err); }
  }

  async function confirmBan() {
    if (!banConfirm) return;
    try {
      await api.patch(`/api/admin/users/${banConfirm.id}/ban`);
      setBanConfirm(null);
      fetchUsers();
    } catch (err) { console.error(err); }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) { console.error(err); }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {ROLE_TABS.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors capitalize ${role === r ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {r}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search by name or phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-3 text-left font-medium text-gray-500">User</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Phone</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Role</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Listings</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Status</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Joined</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!u.is_active ? 'bg-red-50/50' : ''}`}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] || '?')}
                      </div>
                      <span className="font-medium text-gray-900">{u.name || 'Unnamed'}</span>
                      {u.verified_dealer && <span className="text-blue-500 text-xs" title="Verified Dealer">&#10003;</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{u.phone}</td>
                  <td className="py-3 px-3">
                    {u.role === 'admin' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">admin</span>
                    ) : (
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1">
                        <option value="user">user</option>
                        <option value="dealer">dealer</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-600">{u.active_listings}</td>
                  <td className="py-3 px-3">
                    {!u.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Banned</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {u.role !== 'admin' && (
                        <button onClick={() => handleBanToggle(u)}
                          className={`px-2 py-1 text-xs rounded ${!u.is_active ? 'text-green-700 hover:bg-green-50' : 'text-red-700 hover:bg-red-50'}`}>
                          {!u.is_active ? 'Unban' : 'Ban'}
                        </button>
                      )}
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

      {/* Ban Confirmation Modal */}
      {banConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBanConfirm(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ban User</h3>
            <p className="text-sm text-gray-600 mb-4">Ban <strong>{banConfirm.name || banConfirm.phone}</strong>? Their active listings will be deactivated.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setBanConfirm(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmBan}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Ban User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
