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
import LocalitiesSection from "@/components/home/LocalitiesSection";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type ModalType = "paperwork" | "find-property" | null;

/* ─── Hero floating showcase cards ─────────────────────────────────────── */
const HERO_CARDS = [
  {
    price: "₹45 Lakh",
    type: "2 BHK Flat",
    location: "HUDA Sector 2, Palwal",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80&auto=format",
  },
  {
    price: "₹1.2 Cr",
    type: "3 BHK Villa",
    location: "Omaxe City, Palwal",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80&auto=format",
  },
  {
    price: "₹22 Lakh",
    type: "Residential Plot",
    location: "New Colony, Palwal",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80&auto=format",
  },
];

/* ─── Property types with richer icons ─────────────────────────────────── */
const PROPERTY_TYPES = [
  {
    type: "flat",
    label: "Flat",
    bg: "bg-blue-50",
    text: "text-blue-600",
    hoverBorder: "hover:border-blue-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
      </svg>
    ),
  },
  {
    type: "plot",
    label: "Plot",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    hoverBorder: "hover:border-emerald-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    type: "house",
    label: "House",
    bg: "bg-orange-50",
    text: "text-orange-600",
    hoverBorder: "hover:border-orange-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    type: "commercial",
    label: "Commercial",
    bg: "bg-violet-50",
    text: "text-violet-600",
    hoverBorder: "hover:border-violet-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    type: "agricultural",
    label: "Land",
    bg: "bg-lime-50",
    text: "text-lime-700",
    hoverBorder: "hover:border-lime-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    type: "farmhouse",
    label: "Farmhouse",
    bg: "bg-rose-50",
    text: "text-rose-600",
    hoverBorder: "hover:border-rose-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
        <path d="M6 18h12" />
        <rect width="8" height="8" x="8" y="14" rx="1" />
      </svg>
    ),
  },
  {
    type: "villa",
    label: "Villa",
    bg: "bg-sky-50",
    text: "text-sky-600",
    hoverBorder: "hover:border-sky-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 20V9.5L12 2l10 7.5V20" />
        <path d="M10 20v-5h4v5" />
        <rect x="6" y="11" width="3" height="4" rx="0.5" />
        <rect x="15" y="11" width="3" height="4" rx="0.5" />
      </svg>
    ),
  },
  {
    type: "pg",
    label: "PG / Hostel",
    bg: "bg-amber-50",
    text: "text-amber-600",
    hoverBorder: "hover:border-amber-200",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M12 4v6" />
        <path d="M2 18h20" />
      </svg>
    ),
  },
];

/* ─── Localities ─────────────────────────────────────────────────────── */
const LOCALITIES = [
  "HUDA Sector 2",
  "New Colony",
  "New Colony Extension",
  "Adarsh Colony",
  "Krishna Colony",
  "Kalra Colony",
  "Shiv Colony",
  "Shiva Puri",
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
  "SRS Prime Floor",
  "RPS Urbania",
  "Baghola",
  "Patli Khurd",
  "Main Market",
  "Gol Market",
  "Railway Road",
  "Bus Stand Area",
  "Subzi Mandi Area",
  "Mathura Road Area",
  "Minar Gate",
];

/* ─── Trust stat data ───────────────────────────────────────────────── */
const TRUST_STATS = [
  {
    label: "Active Listings",
    value: "2,400+",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Verified Sellers",
    value: "100%",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Paperwork Support",
    value: "Full",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
];

/* ─── Page ──────────────────────────────────────────────────────────── */
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
    <>
      {/* ── Global keyframe animations (injected once) ─────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');

        @keyframes hp-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes hp-floatB {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes hp-floatC {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes hp-fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes hp-shimmer {
          0%   { background-position: 200% 50%; }
          100% { background-position: -200% 50%; }
        }
        @keyframes hp-pulse-dot {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.6); opacity: 0.5; }
        }

        .hp-font-display { font-family: 'Playfair Display', Georgia, serif; }

        .hp-card-1 { animation: hp-float  6s ease-in-out infinite; }
        .hp-card-2 { animation: hp-floatB 7s 1s   ease-in-out infinite; }
        .hp-card-3 { animation: hp-floatC 8s 2s   ease-in-out infinite; }

        .hp-fade-left  { animation: hp-fadeUp 0.65s ease both; }
        .hp-fade-right { animation: hp-fadeUp 0.65s 0.18s ease both; opacity: 0; animation-fill-mode: forwards; }

        .hp-eyebrow-dot { animation: hp-pulse-dot 2s ease-in-out infinite; }

        /* Shimmer sweep on service cards */
        .hp-svc-card { position: relative; overflow: hidden; }
        .hp-svc-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.11) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
          animation: hp-shimmer 3.5s linear infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[#f0f4f8]">
        {/* ═══════════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative bg-white border-b border-gray-100 overflow-hidden">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#1d4ed8 1px,transparent 1px),linear-gradient(90deg,#1d4ed8 1px,transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          {/* Soft radial glow */}
          <div
            className="absolute right-0 top-0 w-[620px] h-[620px] rounded-full pointer-events-none opacity-25"
            style={{
              background: "radial-gradient(circle,#dbeafe 0%,transparent 70%)",
            }}
          />

          <div className="relative max-w-[1120px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 items-center">
            {/* ── Left copy ── */}
            <div className="hp-fade-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
                <span className="hp-eyebrow-dot w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-blue-700 tracking-widest uppercase">
                  Palwal's Local Property Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="hp-font-display text-[2.85rem] md:text-[3.2rem] font-bold leading-[1.1] tracking-tight text-gray-900 mb-5">
                Find Your{" "}
                <span className="text-primary-600">Dream&nbsp;Home</span>
                <br />
                in Palwal
              </h1>

              <p className="text-gray-500 text-[1.05rem] leading-relaxed mb-8 max-w-[420px]">
                Verified listings across Palwal, Gurugram &amp; beyond. Direct
                owner &amp; dealer contact — zero brokerage hassle.
              </p>

              {/* Search card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_28px_rgba(0,0,0,0.07)] p-3.5 md:p-4">
                <HeroSearch />
              </div>

              {/* Trust strip */}
              <div className="mt-7 flex items-center gap-6 flex-wrap">
                {TRUST_STATS.map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-gray-900 leading-none">
                        {s.value}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {s.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right — floating property cards ── */}
            <div className="hidden lg:block hp-fade-right relative h-[400px]">
              {/* Decorative background blob */}
              <div
                className="absolute top-6 left-12 w-64 h-64 rounded-full opacity-40 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle,#bfdbfe 0%,transparent 70%)",
                }}
              />

              {HERO_CARDS.map((card, i) => (
                <div
                  key={i}
                  className={`absolute bg-white rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(15,23,42,0.14)] hp-card-${i + 1}`}
                  style={{
                    width: i === 1 ? 224 : 196,
                    top: i === 0 ? 0 : i === 1 ? 96 : 232,
                    left: i === 0 ? 24 : i === 1 ? 185 : 8,
                    zIndex: i === 1 ? 3 : 2,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.img}
                    alt={card.type}
                    className="w-full object-cover"
                    style={{ height: i === 1 ? 120 : 108 }}
                  />
                  <div className="p-3 pb-3.5">
                    <div className="text-[13px] font-bold text-gray-900">
                      {card.price}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Pin icon */}
                      <svg
                        className="w-2.5 h-2.5 flex-shrink-0 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="text-[10.5px] text-gray-500 truncate">
                        {card.location}
                      </span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 bg-green-50 border border-green-200 rounded-md px-1.5 py-0.5">
                      {/* Check icon */}
                      <svg
                        className="w-2.5 h-2.5 text-green-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-[10px] font-semibold text-green-700">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SERVICE QUICK-ACCESS
        ═══════════════════════════════════════════════════════════════ */}
        <section className="max-w-[1120px] mx-auto px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Find a Property */}
            <button
              onClick={() => setModal("find-property")}
              className="hp-svc-card group flex items-center gap-4 rounded-2xl px-5 py-5 text-left transition-all duration-200 hover:shadow-[0_16px_40px_rgba(29,78,216,0.25)] hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg,#1e40af 0%,#2563eb 55%,#3b82f6 100%)",
              }}
            >
              <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <p className="font-bold text-white text-[15px] leading-tight">
                  Find a Property For Me
                </p>
                <p className="text-[12.5px] text-blue-100 mt-0.5 leading-relaxed">
                  Share your need — we shortlist &amp; call within 24h
                </p>
              </div>
              <svg
                className="relative z-10 w-5 h-5 text-white/50 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Paperwork */}
            <button
              onClick={() => setModal("paperwork")}
              className="hp-svc-card group flex items-center gap-4 rounded-2xl px-5 py-5 text-left transition-all duration-200 hover:shadow-[0_16px_40px_rgba(180,83,9,0.25)] hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg,#92400e 0%,#b45309 55%,#d97706 100%)",
              }}
            >
              <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <p className="font-bold text-white text-[15px] leading-tight">
                  Property Paper Completion
                </p>
                <p className="text-[12.5px] text-amber-100 mt-0.5 leading-relaxed">
                  Registry, mutation, NOC — handled end-to-end
                </p>
              </div>
              <svg
                className="relative z-10 w-5 h-5 text-white/50 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BROWSE BY TYPE
        ═══════════════════════════════════════════════════════════════ */}
        <section className="max-w-[1120px] mx-auto px-6 pb-10">
          <SectionHeader title="Browse by Type" />
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {PROPERTY_TYPES.map((t) => (
              <Link
                key={t.type}
                href={`/search?type=${t.type}`}
                className={`group flex flex-col items-center gap-2.5 p-3 bg-white rounded-2xl border border-gray-100 ${t.hoverBorder} hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-200 text-center hover:-translate-y-0.5`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.bg} ${t.text} group-hover:scale-110 transition-transform duration-200`}
                >
                  {t.icon}
                </div>
                <span
                  className={`text-[10.5px] font-semibold text-gray-500 group-hover:${t.text} leading-tight transition-colors`}
                >
                  {t.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FEATURED LISTINGS
        ═══════════════════════════════════════════════════════════════ */}
        {!loading && featured.length > 0 && (
          <section className="max-w-[1120px] mx-auto px-6 pb-10">
            <SectionHeader
              title="Featured Listings"
              sub="Promoted by verified sellers"
              cta={{ label: "View all", href: "/search?featured=true" }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            RECENTLY ADDED
        ═══════════════════════════════════════════════════════════════ */}
        <section className="max-w-[1120px] mx-auto px-6 pb-14">
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
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FIND PROPERTY — full-width section
        ═══════════════════════════════════════════════════════════════ */}
        <FindPropertySection />

        {/* ═══════════════════════════════════════════════════════════════
            PAPERWORK — full section
        ═══════════════════════════════════════════════════════════════ */}
        <PaperworkSection onOpenModal={() => setModal("paperwork")} />

        {/* ═══════════════════════════════════════════════════════════════
            FAMOUS LOCATIONS
        ═══════════════════════════════════════════════════════════════ */}
        <LocalitiesSection />

        {/* ── Modal ── */}
        {modal && <LeadModal type={modal} onClose={() => setModal(null)} />}
      </div>
    </>
  );
}

/* ─── Section header ─────────────────────────────────────────────────── */
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
        <h2 className="hp-font-display text-[1.45rem] font-bold text-gray-900 leading-tight">
          {title}
        </h2>
        {sub && <p className="text-[12px] text-gray-400 mt-1">{sub}</p>}
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="flex items-center gap-1 text-[13px] font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap transition-colors group"
        >
          {cta.label}
          <svg
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      )}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────── */
function EmptyState() {
  return (
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
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
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
  );
}
