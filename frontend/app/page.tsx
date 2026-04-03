"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import HeroSearch from "@/components/home/HeroSearch";
import LeadModal from "@/components/home/LeadModal";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyCardSkeleton from "@/components/property/PropertyCardSkeleton";
import api from "@/lib/api";

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

const PAPERWORK_STEPS = [
  {
    label: "Registry",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Mutation",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
  },
  {
    label: "NOC",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <polyline points="20,6 9,17 4,12" />
      </svg>
    ),
  },
  {
    label: "Loan NOC",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-4 0v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
      </svg>
    ),
  },
];

const TRUST_POINTS = [
  {
    title: "Fast turnaround",
    desc: "Most cases done in 5–7 working days",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 text-amber-500"
      >
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
      </svg>
    ),
  },
  {
    title: "Legally secure",
    desc: "Verified lawyers, 10+ years experience",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 text-amber-500"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Local expertise",
    desc: "Deep knowledge of Haryana offices",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 text-amber-500"
      >
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: "Live WhatsApp updates",
    desc: "Updates at every step, no surprises",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 text-amber-500"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
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
      <section className="bg-primary-700 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left copy */}
          <div className="text-white">
            <span className="inline-block bg-white/10 border border-white/20 text-xs font-semibold rounded-full px-3 py-1 mb-4">
              Free service — no brokerage
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-3">
              Can't find the
              <br />
              right property?
            </h2>
            <p className="text-primary-200 text-sm leading-relaxed mb-6">
              Tell us what you're looking for. Our team reviews every request
              personally and calls back with shortlisted options within 24
              hours.
            </p>
            <ul className="space-y-2">
              {[
                "Residential, commercial &amp; agricultural",
                "All locations across Haryana",
                "Any budget — affordable to premium",
              ].map((pt) => (
                <li
                  key={pt}
                  className="flex items-start gap-2 text-sm text-primary-100"
                >
                  <svg
                    className="w-4 h-4 text-primary-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span dangerouslySetInnerHTML={{ __html: pt }} />
                </li>
              ))}
            </ul>
          </div>

          {/* Right form card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl shadow-primary-900/20">
            <p className="font-bold text-gray-900 text-base mb-4">
              Tell us what you need
            </p>
            <InlineRequirementForm onSuccess={() => {}} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PROPERTY PAPER COMPLETION — full section
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-t border-gray-100 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Left: copy */}
          <div>
            <span className="inline-block bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full px-3 py-1 mb-4">
              Legal Assistance
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
              Hassle-free Property
              <br />
              Paper Completion
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
              Registry, mutation, NOC — our experienced legal team handles all
              documentation from start to stamp. You just sign.
            </p>

            {/* Steps pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {PAPERWORK_STEPS.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700"
                >
                  {s.icon} {s.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400">
                + more
              </span>
            </div>

            <button
              onClick={() => setModal("paperwork")}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Get Help with Paperwork
            </button>
          </div>

          {/* Right: trust card */}
          <div className="bg-[#fffbf0] border border-amber-100 rounded-2xl p-6">
            <p className="font-bold text-gray-900 text-sm mb-4">
              Why use our service?
            </p>
            <div className="space-y-4">
              {TRUST_POINTS.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-white border border-amber-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 leading-snug mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setModal("paperwork")}
              className="w-full mt-5 border border-amber-400 text-amber-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-amber-50 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </div>
      </section>

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

/* ─── Inline requirement form ──────────────────────────────────────────── */
function InlineRequirementForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    requirement: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const CITIES = [
    "Palwal",
    "Gurugram",
    "Faridabad",
    "Panipat",
    "Karnal",
    "Rohtak",
    "Ambala",
    "Sonipat",
    "Hisar",
    "Other",
  ];

  function set(f: string, v: string) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await api.post("/api/leads/find-property", form);
      setStatus("success");
      onSuccess();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-5">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <p className="font-bold text-gray-900 text-sm">Request submitted!</p>
        <p className="text-xs text-gray-400 mt-1">
          We'll call back within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Your name"
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          required
          type="tel"
          pattern="[6-9][0-9]{9}"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Phone number"
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <select
        required
        value={form.city}
        onChange={(e) => set("city", e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
      >
        <option value="">Select city</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <textarea
        required
        value={form.requirement}
        onChange={(e) => set("requirement", e.target.value)}
        rows={2}
        placeholder="E.g. 2BHK flat under ₹50L near Railway Road…"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {status === "error" && (
        <p className="text-xs text-red-500">
          Something went wrong. Please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-primary-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Find My Property"}
      </button>
    </form>
  );
}
