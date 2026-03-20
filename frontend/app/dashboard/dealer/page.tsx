'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice } from '@/lib/format';

interface DealerStats {
  total_views: number;
  recent_views_7d: number;
  top_listing: any;
}

interface SubStatus {
  plan_name: string;
  listings_used: number;
  listing_limit: number;
  can_post: boolean;
  subscription: any;
}

interface Listing {
  id: string;
  property_id: string;
  title: string;
  price: number;
  price_unit: string;
  view_count: number;
  status: string;
  is_boosted?: boolean;
  boost_expires_at?: string;
  cover_photo?: string;
  city?: string;
  locality?: string;
}

export default function DealerDashboardPage() {
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [boostCount, setBoostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, subRes, listRes] = await Promise.all([
          api.get('/api/visits/dealer/summary'),
          api.get('/api/payments/subscription/status'),
          api.get('/api/properties/my/listings?status=active&limit=50'),
        ]);
        setStats(statsRes.data.data);
        setSubStatus(subRes.data.data);
        const allListings = listRes.data.data.listings;
        setListings(allListings);
        setBoostCount(allListings.filter((l: any) => l.is_boosted).length);
      } catch (err) {
        console.error('Failed to load dealer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const daysRemaining = subStatus?.subscription
    ? Math.max(0, Math.ceil((new Date(subStatus.subscription.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dealer Dashboard</h1>
        <Link href="/post" className="btn-primary text-sm px-4 py-2">Post Property</Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Views" value={stats?.total_views || 0} />
        <StatCard label="Views (7 days)" value={stats?.recent_views_7d || 0} />
        <StatCard label="Active Boosts" value={boostCount} />
        <StatCard label="Active Listings" value={subStatus?.listings_used || 0} />
      </div>

      {/* Subscription Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-primary-600">{subStatus?.plan_name || 'Free'}</span>
              {' '}&middot;{' '}
              {subStatus?.listing_limit === -1
                ? 'Unlimited listings'
                : `${subStatus?.listings_used || 0} / ${subStatus?.listing_limit || 5} listings used`}
              {daysRemaining > 0 && ` · ${daysRemaining} days remaining`}
            </p>
          </div>
          <Link
            href="/dashboard/dealer/subscription"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {subStatus?.subscription ? 'Manage' : 'Upgrade'}
          </Link>
        </div>
        {!subStatus?.can_post && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              You&apos;ve reached your listing limit. <Link href="/dashboard/dealer/subscription" className="font-medium underline">Upgrade your plan</Link> to post more.
            </p>
          </div>
        )}
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Listing Performance</h2>
          <Link href="/dashboard/dealer/analytics" className="text-sm text-primary-600 hover:underline">View Analytics</Link>
        </div>
        {listings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No active listings yet.</p>
            <Link href="/post" className="text-primary-600 hover:underline text-sm mt-2 inline-block">Post your first property</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Boost</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {listing.cover_photo ? (
                          <img src={listing.cover_photo} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                          <p className="text-xs text-gray-500">{listing.city}{listing.locality ? `, ${listing.locality}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatPrice(listing.price, listing.price_unit)}</td>
                    <td className="px-4 py-3 text-gray-700">{listing.view_count}</td>
                    <td className="px-4 py-3">
                      {listing.is_boosted ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <Link href={`/dashboard/dealer/boost?property=${listing.id}`} className="text-xs text-primary-600 hover:underline">Boost</Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/dealer/analytics?property=${listing.id}`} className="text-xs text-primary-600 hover:underline">Analytics</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/post" label="Post Property" icon="+" />
        <QuickAction href="/dashboard/dealer/boost" label="Boost Listing" icon="⚡" />
        <QuickAction href="/dashboard/dealer/analytics" label="View Analytics" icon="📊" />
        <QuickAction href="/dashboard/dealer/subscription" label="Plans" icon="⭐" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString('en-IN')}</p>
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}
