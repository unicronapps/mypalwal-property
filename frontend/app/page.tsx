"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import HeroSearch from "@/components/home/HeroSearch";
import LeadModal from "@/components/home/LeadModal";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyCardSkeleton from "@/components/property/PropertyCardSkeleton";
import api from "@/lib/api";
import FindPropertySection from "@/components/home/FindPropertySection";
import PaperworkSection from "@/components/home/PaperworkSection";

/* ─── Data ─────────────────────────────────────────────────────────────── */

const PROPERTY_TYPE_ICONS: Record<string, React.ReactNode> = {
  flat: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9m6 12V9" />
    </svg>
  ),
  plot: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 3l18 18M21 3 3 21" />
    </svg>
  ),
  house: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  ),
  commercial: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M2 20h20M4 20V8l8-5 8 5v12" />
      <path d="M10 20v-5h4v5" />
      <rect x="8" y="10" width="2" height="3" rx="0.5" />
      <rect x="14" y="10" width="2" height="3" rx="0.5" />
    </svg>
  ),
  agricultural: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M12 2a9 9 0 00-9 9c0 4.17 7 13 9 13s9-8.83 9-13a9 9 0 00-9-9z" />
      <path d="M12 2v20M3 11h18" />
    </svg>
  ),
  farmhouse: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" />
      <path d="M9 21v-7h6v7" />
      <circle cx="18" cy="6" r="2" />
      <path d="M18 8v5" />
    </svg>
  ),
  villa: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M2 20h20M4 20V9l6-6h4l6 6v11" />
      <path d="M10 20v-6h4v6" />
      <rect x="7" y="11" width="2" height="3" rx="0.5" />
      <rect x="15" y="11" width="2" height="3" rx="0.5" />
    </svg>
  ),
  pg: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      <path d="M3 11h18M7 7V5a2 2 0 014 0v2m2 0V5a2 2 0 014 0v2" />
    </svg>
  ),
};

const PROPERTY_TYPES = [
  { type: "flat", label: "Flat" },
  { type: "plot", label: "Plot" },
  { type: "house", label: "House" },
  { type: "commercial", label: "Commercial" },
  { type: "agricultural", label: "Land" },
  { type: "farmhouse", label: "Farmhouse" },
  { type: "villa", label: "Villa" },
  { type: "pg", label: "PG / Hostel" },
];

const LOCALITIES = [
  "HUDA Sector 2",
  "New Colony",
  "New Colony Extension",
  "Adarsh Colony",
  "Krishna Colony",
  "Kalra Colony",
  "Shiv Colony",
  "Shiva Puri (Shivapuri)",
  "Kailash Nagar",
  "Camp Colony",
  "Housing Board Colony",
  "Jawahar Nagar",
  "Prakash Vihar Colony",
  "Panchwati Colony",
  "Ramnagar",
  "Deepak Colony",
  "Shyam Nagar Colony",
  "Alapur",
  "Omaxe City",
  "SRS Prime Floor (Sector 6)",
  "RPS Urbania (Sector 10)",
  "Baghola",
  "Patli Khurd",
  "Main Market (Agra Chowk)",
  "Gol Market",
  "Railway Road",
  "Bus Stand Area",
  "Subzi Mandi Area",
  "Mathura Road Area",
  "Minar Gate",
];


type ModalType = "paperwork" | "find-property" | null;

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [modal, setModal] = useState<ModalType>(null);
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api
        .get("/api/properties/featured")
        .catch(() => ({ data: { data: { listings: [] } } })),
      api
        .get("/api/properties", { params: { sort: "newest", limit: 8 } })
        .catch(() => ({ data: { data: { listings: [] } } })),
    ])
      .then(([feat, rec]) => {
        setFeatured(feat.data?.data?.listings || []);
        setRecent(rec.data?.data?.listings || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO — clean, minimal, content-first
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-white border-b border-gray-100 overflow-hidden">
        {/* Very subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#1d4ed8 1px, transparent 1px), linear-gradient(90deg, #1d4ed8 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Soft blue glow behind search card */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[340px] bg-primary-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 pt-14 pb-16 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs font-semibold text-primary-700 tracking-wide">
              Haryana's local property platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[2.6rem] md:text-5xl font-extrabold text-gray-900 leading-[1.15] tracking-tight mb-4">
            Buy, Rent &amp; Sell <br className="hidden sm:block" />
            <span className="text-primary-600">Property in Haryana</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Verified listings across Palwal, Gurugram &amp; beyond. Direct owner
            &amp; dealer contact.
          </p>

          {/* Search card — sits right in the hero, no separate bg box */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-4 md:p-5 text-left">
            <HeroSearch />
          </div>

          {/* Trust strip */}
          <div className="mt-6 flex items-center justify-center gap-5 flex-wrap">
            {[
              { n: "2,400+", label: "Active listings" },
              { n: "100%", label: "Transpiracy" },
              { n: "Full", label: "Paperwork" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900">{s.n}</span>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SERVICE QUICK-ACCESS — two cards, flush below hero
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Find Property For Me */}
          <button
            onClick={() => setModal("find-property")}
            className="group relative flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">
                Find a Property For Me
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Share your need — we shortlist &amp; call back within 24h
              </p>
            </div>
            <svg
              className="relative w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Paper Completion */}
          <button
            onClick={() => setModal("paperwork")}
            className="group relative flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-amber-300 hover:shadow-md transition-all duration-200 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">
                Property Paper Completion
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Registry, mutation, NOC — handled end-to-end
              </p>
            </div>
            <svg
              className="relative w-4 h-4 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          BROWSE BY TYPE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <SectionHeader title="Browse by Type" />
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {PROPERTY_TYPES.map((t) => (
            <Link
              key={t.type}
              href={`/search?type=${t.type}`}
              className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-center"
            >
              <span className="text-primary-500 group-hover:text-primary-700 group-hover:scale-110 transition-all duration-150">
                {PROPERTY_TYPE_ICONS[t.type]}
              </span>
              <span className="text-[11px] font-semibold text-gray-600 group-hover:text-primary-700 leading-tight">
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED LISTINGS
      ═══════════════════════════════════════════════════════════════════ */}
      {!loading && featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <SectionHeader
            title="Featured Listings"
            sub="Promoted by verified sellers"
            cta={{ label: "View all", href: "/search?sort=newest" }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((p: any) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          RECENT LISTINGS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 pb-14">
        <SectionHeader
          title="Recently Added"
          sub="Fresh listings, updated every few minutes"
          cta={{ label: "View all", href: "/search" }}
        />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8"
              >
                <path d="M3 12L12 3l9 9" />
                <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 mb-1">No listings yet</p>
            <p className="text-sm text-gray-400 mb-5">
              Be the first to post a property in your area.
            </p>
            <Link
              href="/post"
              className="inline-block bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Post a Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map((p: any) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FIND PROPERTY FOR ME — full-width banner with inline form
      ═══════════════════════════════════════════════════════════════════ */}
      <FindPropertySection />

      {/* ═══════════════════════════════════════════════════════════════════
          PROPERTY PAPER COMPLETION — full section
      ═══════════════════════════════════════════════════════════════════ */}
      <PaperworkSection onOpenModal={() => setModal("paperwork")} />

      {/* ═══════════════════════════════════════════════════════════════════
          FAMOUS LOCATIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#f8f9fc] border-t border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Search Property in Famous Locations"
            sub="Tap any locality to browse available properties"
          />
          <div className="flex flex-wrap gap-2">
            {LOCALITIES.map((loc) => (
              <Link
                key={loc}
                href={`/search?q=${encodeURIComponent(loc)}`}
                className="group inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all"
              >
                <svg
                  className="w-3 h-3 text-gray-300 group-hover:text-primary-400 transition-colors flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {loc}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════ */}
      {modal && <LeadModal type={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ─── Section header ───────────────────────────────────────────────────── */
function SectionHeader({
  title,
  sub,
  cta,
}: {
  title: string;
  sub?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap flex items-center gap-1"
        >
          {cta.label}
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}
