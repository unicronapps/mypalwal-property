'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatRelativeDate, PROPERTY_TYPE_LABELS } from '@/lib/format';

interface DashboardData {
  stats: {
    active_listings: number;
    total_listings: number;
    enquiries_received: number;
    enquiries_sent: number;
  };
  recentListings: any[];
  recentEnquiries: any[];
  recentVisits: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, listingsRes, enquiriesRes, visitsRes] = await Promise.all([
          api.get('/api/users/me'),
          api.get('/api/properties/my/listings?limit=3'),
          api.get('/api/enquiries/received?limit=5'),
          api.get('/api/visits/mine?limit=5'),
        ]);

        setData({
          stats: meRes.data.data.stats,
          recentListings: listingsRes.data.data.listings,
          recentEnquiries: enquiriesRes.data.data.enquiries,
          recentVisits: visitsRes.data.data.visits,
        });
      } catch (err) {
        console.error('Dashboard load error:', err);
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl border animate-pulse" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Listings" value={stats?.active_listings ?? 0} href="/dashboard/listings" />
        <StatCard label="Enquiries Received" value={stats?.enquiries_received ?? 0} href="/dashboard/enquiries/received" />
        <StatCard label="Enquiries Sent" value={stats?.enquiries_sent ?? 0} href="/dashboard/enquiries/sent" />
        <StatCard label="Total Listings" value={stats?.total_listings ?? 0} href="/dashboard/listings" />
      </div>

      {/* Recent Listings */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Recent Listings</h2>
          <Link href="/dashboard/listings" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        {data?.recentListings.length ? (
          <div className="grid gap-3">
            {data.recentListings.map((l: any) => (
              <div key={l.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {l.cover_photo ? (
                    <img src={l.cover_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No photo</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                  <p className="text-xs text-gray-500">
                    {PROPERTY_TYPE_LABELS[l.property_type] || l.property_type} &middot; {l.city}, {l.locality}
                  </p>
                  <p className="text-sm font-semibold text-primary-600 mt-0.5">{formatPrice(l.price, l.price_unit)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {l.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{l.view_count} views</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-3">You haven&apos;t posted any properties yet</p>
            <Link href="/post" className="inline-block px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
              Post Your First Property
            </Link>
          </div>
        )}
      </section>

      {/* Recent Enquiries */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
          <Link href="/dashboard/enquiries/received" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        {data?.recentEnquiries.length ? (
          <div className="space-y-2">
            {data.recentEnquiries.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {e.property_thumbnail && <img src={e.property_thumbnail} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.buyer_name || e.buyer_phone}</p>
                  <p className="text-xs text-gray-500 truncate">{e.property_title}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    e.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    e.status === 'replied' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{e.status}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(e.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-4 text-center">No enquiries received yet</p>
        )}
      </section>

      {/* Recent Visits */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recently Viewed</h2>
          <Link href="/dashboard/visits" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        {data?.recentVisits.length ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.recentVisits.map((v: any) => (
              <Link key={v.property_id} href={`/property/${v.pid}`} className="shrink-0 w-48 rounded-lg border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="h-28 bg-gray-100">
                  {v.cover_photo && <img src={v.cover_photo} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">{v.title}</p>
                  <p className="text-xs text-gray-500">{v.city}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-4 text-center">No properties viewed yet</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  );
}
