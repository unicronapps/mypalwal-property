'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PROPERTY_TYPE_LABELS } from '@/lib/format';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#e11d48'];

interface AnalyticsData {
  listings_by_type: { property_type: string; count: number }[];
  listings_by_city: { city: string; count: number }[];
  listings_by_month: { month: string; count: number }[];
  enquiries_by_month: { month: string; count: number }[];
  top_viewed_properties: { id: string; property_id: string; title: string; city: string; property_type: string; view_count: number }[];
  user_growth_by_month: { month: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/admin/analytics');
        setData(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-white rounded-xl border animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Failed to load analytics</p>;

  const typeData = data.listings_by_type.map(d => ({
    name: PROPERTY_TYPE_LABELS[d.property_type] || d.property_type,
    value: d.count,
  }));

  const monthData = data.listings_by_month.map(d => ({
    month: formatMonth(d.month),
    listings: d.count,
  }));

  const enquiryData = data.enquiries_by_month.map(d => ({
    month: formatMonth(d.month),
    enquiries: d.count,
  }));

  const userGrowth = data.user_growth_by_month.map(d => ({
    month: formatMonth(d.month),
    users: d.count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Listings by Type — Donut */}
        <ChartCard title="Listings by Type">
          {typeData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Listings per Month — Bar */}
        <ChartCard title="Listings Added (Last 6 Months)">
          {monthData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="listings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* User Growth — Line */}
        <ChartCard title="User Growth (Last 6 Months)">
          {userGrowth.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Enquiries per Month — Bar */}
        <ChartCard title="Enquiries (Last 6 Months)">
          {enquiryData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={enquiryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="enquiries" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Top 10 Viewed Listings */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Viewed Listings</h2>
        {data.top_viewed_properties.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">#</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Property</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">City</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Views</th>
                </tr>
              </thead>
              <tbody>
                {data.top_viewed_properties.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-2">
                      <a href={`/property/${p.property_id}`} target="_blank" rel="noopener"
                        className="font-medium text-primary-600 hover:text-primary-700">{p.title}</a>
                    </td>
                    <td className="py-2 px-2 text-gray-600">{PROPERTY_TYPE_LABELS[p.property_type] || p.property_type}</td>
                    <td className="py-2 px-2 text-gray-600">{p.city}</td>
                    <td className="py-2 px-2 text-right font-medium text-gray-900">{p.view_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-500 text-center py-4">No data yet</p>}
      </section>

      {/* Top Cities */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Cities by Listing Count</h2>
        {data.listings_by_city.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">#</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">City</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Listings</th>
                </tr>
              </thead>
              <tbody>
                {data.listings_by_city.map((c, i) => (
                  <tr key={c.city} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-2 font-medium text-gray-900">{c.city}</td>
                    <td className="py-2 px-2 text-right text-gray-900">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-500 text-center py-4">No data yet</p>}
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>;
}

function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}
