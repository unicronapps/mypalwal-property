'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

interface DailyView {
  date: string;
  views: number;
}

interface Listing {
  id: string;
  property_id: string;
  title: string;
  view_count: number;
  city?: string;
  locality?: string;
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('property');

  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedId, setSelectedId] = useState<string>(preselected || '');
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [enquiryCount, setEnquiryCount] = useState(0);

  // Load listings
  useEffect(() => {
    async function loadListings() {
      try {
        const { data } = await api.get('/api/properties/my/listings?status=active&limit=50');
        setListings(data.data.listings);
        if (!selectedId && data.data.listings.length > 0) {
          setSelectedId(preselected || data.data.listings[0].id);
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  // Load analytics for selected property
  useEffect(() => {
    if (!selectedId) return;
    async function loadAnalytics() {
      setChartLoading(true);
      try {
        const [viewsRes, statsRes] = await Promise.all([
          api.get(`/api/visits/property/${selectedId}?days=${range}`),
          api.get('/api/enquiries/received/stats'),
        ]);
        setDailyViews(viewsRes.data.data.daily_views.map((r: any) => ({
          date: r.date,
          views: parseInt(r.views, 10),
        })));
        const propStats = statsRes.data.data.stats.find((s: any) => s.property_id === selectedId);
        setEnquiryCount(propStats ? parseInt(propStats.total, 10) : 0);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setChartLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedId, range]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No active listings to analyze.</p>
      </div>
    );
  }

  const totalViews = dailyViews.reduce((sum, d) => sum + d.views, 0);
  const peakDay = dailyViews.length > 0
    ? dailyViews.reduce((max, d) => d.views > max.views ? d : max, dailyViews[0])
    : null;
  const maxViews = dailyViews.length > 0 ? Math.max(...dailyViews.map(d => d.views), 1) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Property Analytics</h1>

      {/* Property Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="input-field max-w-md"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} ({l.property_id}) — {l.city}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === d
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Views ({range}d)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalViews}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Peak Day</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{peakDay ? peakDay.views : 0}</p>
          {peakDay && <p className="text-xs text-gray-400 mt-1">{new Date(peakDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Enquiries</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{enquiryCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Views/Day</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {dailyViews.length > 0 ? (totalViews / dailyViews.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      {/* Chart — simple CSS bar chart (no external deps) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Views per Day</h2>
        {chartLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dailyViews.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No view data for this period.</p>
        ) : (
          <div className="flex items-end gap-1 h-48 overflow-x-auto">
            {dailyViews.map((d) => {
              const height = Math.max(4, (d.views / maxViews) * 100);
              return (
                <div key={d.date} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: dailyViews.length > 30 ? '8px' : '20px' }}>
                  <div
                    className="w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors group relative"
                    style={{ height: `${height}%` }}
                    title={`${new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${d.views} views`}
                  />
                  {dailyViews.length <= 14 && (
                    <span className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                      {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">All Listings — Ranked by Views</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...listings].sort((a, b) => b.view_count - a.view_count).map((l, i) => (
                <tr
                  key={l.id}
                  className={`hover:bg-gray-50 cursor-pointer ${l.id === selectedId ? 'bg-primary-50' : ''}`}
                  onClick={() => setSelectedId(l.id)}
                >
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{l.title} <span className="text-xs text-gray-400">({l.property_id})</span></td>
                  <td className="px-4 py-3 text-gray-500">{l.city}{l.locality ? `, ${l.locality}` : ''}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{l.view_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
