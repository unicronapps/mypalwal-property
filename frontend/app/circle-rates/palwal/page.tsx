'use client';

import { useState, useMemo } from 'react';
import circleRates from '@/lib/circleRates';

const COL_VILLAGE_HI = 0;
const COL_SEGMENT_EN = 1;
const COL_PROP_TYPE = 2;
const COL_SUB_TYPE = 3;
const COL_OLD_RATE = 5;
const COL_OLD_UNIT = 6;
const COL_NEW_RATE = 7;
const COL_NEW_UNIT = 8;
const COL_PCT = 9;

const palwalData = circleRates.filter((r: any[]) =>
  (r[COL_VILLAGE_HI] as string).includes('पलवल')
);

const TYPE_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string; dot: string }> = {
  'निवासीय': { label: 'Residential', emoji: '🏠', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  'व्यवसायिक': { label: 'Commercial', emoji: '🏢', bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  'कृषि': { label: 'Agricultural', emoji: '🌾', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
};

function formatRate(rate: number, unit: string) {
  let amt: string;
  if (rate >= 10000000) amt = `₹${(rate / 10000000).toFixed(2)} Cr`;
  else if (rate >= 100000) amt = `₹${(rate / 100000).toFixed(2)} L`;
  else amt = `₹${rate.toLocaleString('en-IN')}`;
  return { amt, unit };
}

function PctBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-gray-500 font-semibold">→ No change</span>;
  const up = pct > 0;
  const high = pct >= 25;
  const color = up ? (high ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50') : 'text-green-700 bg-green-50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {up ? '📈' : '📉'} {up ? '+' : ''}{pct}%
    </span>
  );
}

export default function PalwalCircleRatesPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const propTypes = useMemo(() => {
    const set = new Set(palwalData.map((r: any[]) => r[COL_PROP_TYPE] as string));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return palwalData.filter((r: any[]) => {
      const matchType = !filterType || r[COL_PROP_TYPE] === filterType;
      const matchSearch =
        !q ||
        (r[COL_SEGMENT_EN] as string).toLowerCase().includes(q) ||
        (r[COL_SUB_TYPE] as string).toLowerCase().includes(q) ||
        (r[COL_PROP_TYPE] as string).includes(q);
      return matchType && matchSearch;
    });
  }, [search, filterType]);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-800 text-white px-4 pt-8 pb-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">
            📋 Haryana Revenue Department
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">
            🏙️ Circle Rates — Palwal
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-xl">
            Official <strong>collector circle rates (सर्किल रेट)</strong> for Palwal district, Haryana.
            Used to calculate <strong>stamp duty</strong> &amp; registration charges.
          </p>

          {/* Year badges */}
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 border border-white/20">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-xs text-blue-200 leading-none">Old Rates</p>
                <p className="font-bold text-base">2024</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 border border-white/20">
              <span className="text-lg">🆕</span>
              <div>
                <p className="text-xs text-blue-200 leading-none">New Rates</p>
                <p className="font-bold text-base">2025</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 border border-white/20">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-xs text-blue-200 leading-none">Total Entries</p>
                <p className="font-bold text-base">{palwalData.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Search + Filter ── */}
      <section className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-md px-4 py-3">
        <div className="max-w-3xl mx-auto space-y-2.5">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🔍</span>
            <input
              type="search"
              placeholder="Search area, colony, road, sector…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setFilterType('')}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterType === ''
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
              }`}
            >
              🗂️ All
            </button>
            {propTypes.map((pt) => {
              const cfg = TYPE_CONFIG[pt];
              return (
                <button
                  key={pt}
                  onClick={() => setFilterType(pt === filterType ? '' : pt)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filterType === pt
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                  }`}
                >
                  {cfg?.emoji} {cfg?.label ?? pt}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="max-w-3xl mx-auto px-4 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🔍</p>
            <p className="font-semibold text-gray-600">No results found</p>
            <p className="text-sm mt-1">Try a different keyword or clear the filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> entries
            </p>

            {filtered.map((r: any[], i: number) => {
              const propType = r[COL_PROP_TYPE] as string;
              const cfg = TYPE_CONFIG[propType];
              const pct = r[COL_PCT] as number;
              const increased = pct > 0;
              const oldR = formatRate(r[COL_OLD_RATE] as number, r[COL_OLD_UNIT] as string);
              const newR = formatRate(r[COL_NEW_RATE] as number, r[COL_NEW_UNIT] as string);

              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Card top */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base leading-snug">
                        📍 {r[COL_SEGMENT_EN]}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">
                        {r[COL_SUB_TYPE]}
                      </p>
                    </div>
                    {cfg && (
                      <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                    )}
                  </div>

                  {/* Rate comparison — 2024 vs 2025 */}
                  <div className="grid grid-cols-2 border-t border-gray-100">
                    {/* Old 2024 */}
                    <div className="px-4 py-3 bg-gray-50 border-r border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        📅 2024 Rate
                      </p>
                      <p className="text-lg font-bold text-gray-700 leading-none">{oldR.amt}</p>
                      <p className="text-xs text-gray-400 mt-1">per {oldR.unit}</p>
                    </div>
                    {/* New 2025 */}
                    <div className={`px-4 py-3 ${increased ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${increased ? 'text-orange-400' : 'text-green-400'}`}>
                        🆕 2025 Rate
                      </p>
                      <p className={`text-lg font-bold leading-none ${increased ? 'text-orange-700' : 'text-green-700'}`}>
                        {newR.amt}
                      </p>
                      <p className={`text-xs mt-1 ${increased ? 'text-orange-400' : 'text-green-400'}`}>
                        per {newR.unit}
                      </p>
                    </div>
                  </div>

                  {/* Change footer */}
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-white flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 font-medium">Rate change:</span>
                    <PctBadge pct={pct} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Info / FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 pb-12 space-y-3">

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="font-bold text-blue-900 mb-2 text-base">💡 What is a Circle Rate?</p>
          <p className="text-sm text-blue-800 leading-relaxed">
            Circle rate (सर्किल रेट) is the <strong>minimum government-fixed price</strong> for
            property registration in a specific area. Stamp duty and registration fees are calculated
            on the <strong>higher</strong> of circle rate or actual sale price — whichever is more.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
          <p className="font-bold text-yellow-900 mb-2 text-base">📌 How to use this page?</p>
          <ul className="text-sm text-yellow-800 space-y-1 list-none">
            <li>🔍 Search your area, road name or colony above</li>
            <li>🏠 Filter by property type — Residential, Commercial or Agricultural</li>
            <li>📊 Compare 2024 vs 2025 rates side by side</li>
            <li>📈 The % badge shows how much rates have changed</li>
          </ul>
        </div>

        <p className="text-center text-xs text-gray-400 pt-1">
          📋 Source: Haryana Revenue Department · Palwal District · Updated 2025
        </p>
      </section>
    </main>
  );
}
