'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice } from '@/lib/format';

interface AdminStats {
  total_users: number;
  total_listings: number;
  pending_approvals: number;
  revenue_this_month: number;
  active_boosts: number;
  listings_by_status: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, listingsRes, usersRes, paymentsRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/properties?limit=5'),
          api.get('/api/admin/users?limit=5'),
          api.get('/api/admin/payments?limit=5'),
        ]);
        setStats(statsRes.data.data);
        setRecentListings(listingsRes.data.data.properties);
        setRecentUsers(usersRes.data.data.users);
        setRecentPayments(paymentsRes.data.data.payments);
      } catch (err) {
        console.error('Admin dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats?.total_users ?? 0} color="blue" />
        <StatCard label="Total Listings" value={stats?.total_listings ?? 0} color="green" />
        <Link href="/admin/listings?status=pending">
          <StatCard label="Pending Approvals" value={stats?.pending_approvals ?? 0} color="yellow" clickable />
        </Link>
        <StatCard label="Revenue (Month)" value={formatPrice(stats?.revenue_this_month ?? 0)} color="purple" isText />
        <StatCard label="Active Boosts" value={stats?.active_boosts ?? 0} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Listings</h2>
            <Link href="/admin/listings" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-2">
            {recentListings.map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                  {l.cover_photo ? <img src={l.cover_photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">N/A</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                  <p className="text-xs text-gray-500">{l.owner_name} &middot; {l.city}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
            {!recentListings.length && <p className="text-sm text-gray-500 text-center py-4">No listings yet</p>}
          </div>
        </section>

        {/* Recent Users */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-2">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-500 font-bold text-sm">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.name?.[0] || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">{u.phone}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'dealer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {u.role}
                </span>
              </div>
            ))}
            {!recentUsers.length && <p className="text-sm text-gray-500 text-center py-4">No users yet</p>}
          </div>
        </section>
      </div>

      {/* Recent Payments */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          <Link href="/admin/payments" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        {recentPayments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">User</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2 px-2">{p.user_name}</td>
                    <td className="py-2 px-2 capitalize">{p.type}</td>
                    <td className="py-2 px-2 font-medium">{formatPrice(p.amount)}</td>
                    <td className="py-2 px-2"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No payments yet</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, color, clickable, isText }: { label: string; value: number | string; color: string; clickable?: boolean; isText?: boolean }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue} ${clickable ? 'hover:shadow-sm cursor-pointer' : ''}`}>
      <p className="text-2xl font-bold text-gray-900">{isText ? value : value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
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
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-orange-100 text-orange-700',
    created: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
