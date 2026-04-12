"use client";
export const runtime = "edge";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import HeroSearch from "@/components/home/HeroSearch";
import LeadModal from "@/components/home/LeadModal";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyCardSkeleton from "@/components/property/PropertyCardSkeleton";
import api from "@/lib/api";
import FindPropertySection from "@/components/home/FindPropertySection";
import PaperworkSection from "@/components/home/PaperworkSection";
import LocalitiesSection from "@/components/home/LocalitiesSection";

/* ─── Types ─────────────────────────────────────────────────────────── */
type ModalType = "paperwork" | "find-property" | null;

/* ─── Hero BG images ────────────────────────────────────────────────── */
const HERO_BG_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=80&auto=format",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80&auto=format",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80&auto=format",
];

/* ─── Sample projects (Palwal area ads — dummy click tracking) ──────── */
const SAMPLE_PROJECTS = [
  {
    id: "proj-1",
    name: "Omaxe City Phase 3",
    builder: "Omaxe Ltd.",
    type: "2/3 BHK Flats",
    price: "₹38 – 72 Lakh",
    location: "NH-2, Palwal",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&auto=format",
    tag: "New Launch",
  },
  {
    id: "proj-2",
    name: "SRS Royal Hills",
    builder: "SRS Group",
    type: "Residential Plots",
    price: "₹15 – 35 Lakh",
    location: "Sector 87, Palwal",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&auto=format",
    tag: "Popular",
  },
  {
    id: "proj-3",
    name: "Green Valley Farmhouses",
    builder: "Local Developer",
    type: "Farmhouse Plots",
    price: "₹55 Lakh onwards",
    location: "Hodal Road, Palwal",
    img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80&auto=format",
    tag: "Premium",
  },
  {
    id: "proj-4",
    name: "RPS Urbania",
    builder: "RPS Group",
    type: "3/4 BHK Floors",
    price: "₹62 Lakh – 1.1 Cr",
    location: "Sector 45, Palwal",
    img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80&auto=format",
    tag: "Ready to Move",
  },
];

/* ─── Gallery images (scrollable showcase) ──────────────────────────── */
const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&q=80&auto=format",
    caption: "Modern Villas",
  },
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80&auto=format",
    caption: "Luxury Interiors",
  },
  {
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&q=80&auto=format",
    caption: "Premium Floors",
  },
  {
    src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500&q=80&auto=format",
    caption: "Farmhouse Living",
  },
  {
    src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&q=80&auto=format",
    caption: "High-rise Apartments",
  },
  {
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&q=80&auto=format",
    caption: "Independent Houses",
  },
];

/* ─── Property types ────────────────────────────────────────────────── */
const PROPERTY_TYPES = [
  { type: "flat", label: "Flat", emoji: "🏢" },
  { type: "plot", label: "Plot", emoji: "📐" },
  { type: "house", label: "House", emoji: "🏠" },
  { type: "commercial", label: "Commercial", emoji: "🏪" },
  { type: "agricultural", label: "Land", emoji: "🌿" },
  { type: "farmhouse", label: "Farmhouse", emoji: "🏡" },
  { type: "villa", label: "Villa", emoji: "🏛️" },
  { type: "pg", label: "PG / Hostel", emoji: "🛏️" },
];

/* ─── Trust stats ───────────────────────────────────────────────────── */
const TRUST_STATS = [
  { label: "Active Listings", value: "2,400+", icon: "🏘️" },
  { label: "Verified Sellers", value: "100%", icon: "✅" },
  { label: "Paperwork Support", value: "Full", icon: "📋" },
];

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL CAROUSEL HOOK
   ═══════════════════════════════════════════════════════════════════════ */
function useScrollCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useCallback((dir: "left" | "right") => {
    if (!ref.current) return;
    const amount = ref.current.offsetWidth * 0.7;
    ref.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);
  return { ref, scroll };
}

/* ═══════════════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER HOOK (for scroll animations)
   ═══════════════════════════════════════════════════════════════════════ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [modal, setModal] = useState<ModalType>(null);
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroBg, setHeroBg] = useState(0);
  const [adClicks, setAdClicks] = useState<Record<string, number>>({});

  const galleryCarousel = useScrollCarousel();
  const projectsCarousel = useScrollCarousel();
  const typesReveal = useReveal();
  const projectsReveal = useReveal();
  const galleryReveal = useReveal();

  /* API calls — unchanged */
  useEffect(() => {
    Promise.all([
      api
        .get("/api/properties", { params: { sort: "newest", limit: 8 } })
        .catch(() => ({ data: { data: { listings: [] } } })),
    ])
      .then(([rec]) => {
        setFeatured([]);
        setRecent(rec.data?.data?.listings || []);
      })
      .finally(() => setLoading(false));
  }, []);

  /* Hero BG slideshow */
  useEffect(() => {
    const t = setInterval(
      () => setHeroBg((p) => (p + 1) % HERO_BG_IMAGES.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  /* Ad click tracker (dummy) */
  const trackAdClick = (projectId: string) => {
    setAdClicks((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || 0) + 1,
    }));
    console.log(
      `[AD CLICK] Project: ${projectId}, Total: ${(adClicks[projectId] || 0) + 1}`,
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        :root {
          --clr-primary: #1746A2;
          --clr-primary-light: #3B6DD8;
          --clr-primary-dark: #0F2E6B;
          --clr-accent: #FF6B35;
          --clr-accent-warm: #F59E0B;
          --clr-surface: #F7F8FC;
          --clr-surface-warm: #FFF8F0;
          --clr-text: #1A1A2E;
          --clr-text-muted: #6B7280;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body: 'Outfit', system-ui, sans-serif;
          --radius: 16px;
          --radius-sm: 10px;
        }

        * { font-family: var(--font-body); }

        /* ── Keyframes ─────────────────────────────── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroShift {
          0%, 100% { transform: scale(1.05) translate(0, 0); }
          33%      { transform: scale(1.08) translate(-1%, -1%); }
          66%      { transform: scale(1.06) translate(1%, 0.5%); }
        }
        @keyframes pulseBadge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(255,107,53,0); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .anim-fade-up { animation: fadeInUp 0.7s ease both; }
        .anim-fade-up-d1 { animation: fadeInUp 0.7s 0.1s ease both; }
        .anim-fade-up-d2 { animation: fadeInUp 0.7s 0.2s ease both; }
        .anim-fade-up-d3 { animation: fadeInUp 0.7s 0.3s ease both; }
        .anim-fade-up-d4 { animation: fadeInUp 0.7s 0.4s ease both; }
        .anim-fade-scale { animation: fadeInScale 0.5s ease both; }
        .anim-slide-left { animation: slideInLeft 0.6s ease both; }

        .reveal-item { opacity: 0; transform: translateY(24px); transition: all 0.6s cubic-bezier(0.22,1,0.36,1); }
        .reveal-item.visible { opacity: 1; transform: translateY(0); }

        /* ── Hero BG ───────────────────────────────── */
        .hero-bg-img {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          animation: heroShift 20s ease-in-out infinite;
          transition: opacity 1.2s ease;
        }

        /* ── Scroll snap carousel ──────────────────── */
        .snap-carousel {
          display: flex; gap: 16px;
          overflow-x: auto; scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; -ms-overflow-style: none;
          padding-bottom: 4px;
        }
        .snap-carousel::-webkit-scrollbar { display: none; }
        .snap-carousel > * { scroll-snap-align: start; flex-shrink: 0; }

        /* ── Hover lifts ───────────────────────────── */
        .lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .lift:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.12); }

        /* ── Ad badge pulse ─────────────────────────── */
        .ad-badge { animation: pulseBadge 2s infinite; }

        /* ── Gradient text ─────────────────────────── */
        .gradient-text {
          background: linear-gradient(135deg, var(--clr-primary), var(--clr-accent));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Glass card ────────────────────────────── */
        .glass {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.5);
        }

        /* ── CTA shimmer ───────────────────────────── */
        .cta-shimmer {
          position: relative; overflow: hidden;
        }
        .cta-shimmer::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        /* ── Marquee ───────────────────────────────── */
        .marquee-track { animation: marquee 30s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      <div
        className="min-h-screen"
        style={{ background: "var(--clr-surface)" }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            HERO — with background images & sell button
        ═══════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden"
          style={{ minHeight: "clamp(520px, 85vh, 720px)" }}
        >
          {/* BG images with crossfade */}
          {HERO_BG_IMAGES.map((img, i) => (
            <div
              key={i}
              className="hero-bg-img"
              style={{
                backgroundImage: `url(${img})`,
                opacity: heroBg === i ? 1 : 0,
              }}
            />
          ))}
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.85) 60%, rgba(15,23,42,0.95) 100%)",
            }}
          />
          {/* Decorative circles */}
          <div
            className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, var(--clr-accent), transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-60px] left-[-60px] w-[200px] h-[200px] rounded-full opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, var(--clr-primary-light), transparent 70%)",
            }}
          />

          <div
            className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col justify-center"
            style={{ minHeight: "clamp(520px, 85vh, 720px)" }}
          >
            {/* Badge */}
            <div
              className="anim-fade-up inline-flex items-center gap-2 self-start rounded-full px-4 py-1.5 mb-5"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full bg-green-400"
                style={{ animation: "pulseBadge 2s infinite" }}
              />
              <span className="text-xs font-semibold text-white/90 tracking-wider uppercase">
                Palwal's #1 Property Platform
              </span>
            </div>

            {/* Headline */}
            <h1
              className="anim-fade-up-d1 text-white leading-[1.08] mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
              }}
            >
              Find, Buy, Rent or <br className="hidden sm:block" />
              <span className="gradient-text">Sell Property</span> in Palwal
            </h1>

            <p
              className="anim-fade-up-d2 text-white/60 text-base sm:text-lg max-w-lg mb-8"
              style={{ lineHeight: 1.7 }}
            >
              Verified listings. Direct owner contact. Zero brokerage. Your
              complete property platform for Palwal & beyond.
            </p>

            {/* ── Search card with glass effect ── */}
            <div
              className="anim-fade-up-d3 glass rounded-2xl p-4 sm:p-5 max-w-2xl w-full"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}
            >
              <HeroSearch />

              {/* Sell CTA — sits below the search form */}
              <div
                className="mt-4 pt-3 flex items-center gap-3"
                style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--clr-text-muted)" }}
                >
                  Want to list your property?
                </span>
                <Link
                  href="/post"
                  className="cta-shimmer inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--clr-accent), #e85d2a)",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Sell / Post Property
                </Link>
              </div>
            </div>

            {/* Trust stats */}
            <div className="anim-fade-up-d4 flex flex-wrap items-center gap-5 sm:gap-8 mt-7">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white leading-none">
                      {s.value}
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BG slide indicators */}
            <div className="flex gap-2 mt-8">
              {HERO_BG_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroBg(i)}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: heroBg === i ? 32 : 12,
                    background:
                      heroBg === i
                        ? "var(--clr-accent)"
                        : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SERVICE QUICK-ACCESS
        ═══════════════════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setModal("find-property")}
              className="lift cta-shimmer group flex items-center gap-4 rounded-2xl px-5 py-5 text-left"
              style={{
                background:
                  "linear-gradient(135deg, var(--clr-primary-dark), var(--clr-primary), var(--clr-primary-light))",
              }}
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
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
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-[15px] leading-tight">
                  Submit Property Demand
                </p>
                <p className="text-[12.5px] text-blue-100/70 mt-0.5">
                  Tell us your need — our team calls you back
                </p>
              </div>
              <svg
                className="w-5 h-5 text-white/40 flex-shrink-0 group-hover:translate-x-1 transition-transform"
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

            <button
              onClick={() => setModal("paperwork")}
              className="lift cta-shimmer group flex items-center gap-4 rounded-2xl px-5 py-5 text-left"
              style={{
                background:
                  "linear-gradient(135deg, #78350f, #b45309, #d97706)",
              }}
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
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
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-[15px] leading-tight">
                  Registry, Documents & Paperwork
                </p>
                <p className="text-[12.5px] text-amber-100/70 mt-0.5">
                  Registry, mutation, NOC — we handle it for you
                </p>
              </div>
              <svg
                className="w-5 h-5 text-white/40 flex-shrink-0 group-hover:translate-x-1 transition-transform"
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
            BROWSE BY TYPE — with reveal animation
        ═══════════════════════════════════════════════════════════════ */}
        <section
          ref={typesReveal.ref}
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10"
        >
          <SectionHeader title="Browse by Type" />
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {PROPERTY_TYPES.map((t, i) => (
              <Link
                key={t.type}
                href={`/search?type=${t.type}`}
                className={`reveal-item ${typesReveal.visible ? "visible" : ""} lift group flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 text-center`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200">
                  {t.emoji}
                </span>
                <span className="text-[10.5px] sm:text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors leading-tight">
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
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
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
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
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
            SAMPLE PROJECTS — ADVERTISEMENT SECTION (with click tracking)
        ═══════════════════════════════════════════════════════════════ */}
        <section
          ref={projectsReveal.ref}
          className="py-14"
          style={{
            background:
              "linear-gradient(180deg, var(--clr-surface-warm) 0%, var(--clr-surface) 100%)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ background: "var(--clr-accent)", color: "white" }}
              >
                Sponsored
              </span>
            </div>
            <SectionHeader
              title="Top Projects in Palwal"
              sub="Explore new developments in your area"
            />

            {/* Scroll carousel with nav arrows */}
            <div className="relative">
              <button
                onClick={() => projectsCarousel.scroll("left")}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform hidden sm:flex"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => projectsCarousel.scroll("right")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform hidden sm:flex"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <svg
                  className="w-5 h-5 text-gray-600"
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

              <div ref={projectsCarousel.ref} className="snap-carousel">
                {SAMPLE_PROJECTS.map((proj, i) => (
                  <div
                    key={proj.id}
                    onClick={() => trackAdClick(proj.id)}
                    className={`reveal-item ${projectsReveal.visible ? "visible" : ""} lift cursor-pointer bg-white rounded-2xl overflow-hidden`}
                    style={{
                      width: "clamp(260px, 42vw, 300px)",
                      transitionDelay: `${i * 100}ms`,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proj.img}
                        alt={proj.name}
                        className="w-full h-44 object-cover"
                      />
                      <span
                        className="ad-badge absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                        style={{ background: "var(--clr-accent)" }}
                      >
                        {proj.tag}
                      </span>
                      <span className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-black/50 text-white/70">
                        Ad
                      </span>
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-bold text-[15px] leading-tight"
                        style={{ color: "var(--clr-text)" }}
                      >
                        {proj.name}
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--clr-text-muted)" }}
                      >
                        {proj.builder}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="text-xs text-gray-500">
                          {proj.location}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400">
                            {proj.type}
                          </div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: "var(--clr-primary)" }}
                          >
                            {proj.price}
                          </div>
                        </div>
                        <span
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{
                            background: "var(--clr-surface)",
                            color: "var(--clr-primary)",
                          }}
                        >
                          View →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-4">
              Swipe to explore more projects
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            IMAGE GALLERY — swipe/scroll showcase
        ═══════════════════════════════════════════════════════════════ */}
        <section
          ref={galleryReveal.ref}
          className="py-14 max-w-6xl mx-auto px-4 sm:px-6"
        >
          <SectionHeader
            title="Explore Properties"
            sub="Swipe through our curated gallery"
          />
          <div className="relative">
            <button
              onClick={() => galleryCarousel.scroll("left")}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform hidden sm:flex"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => galleryCarousel.scroll("right")}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform hidden sm:flex"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <svg
                className="w-5 h-5 text-gray-600"
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

            <div ref={galleryCarousel.ref} className="snap-carousel">
              {GALLERY_IMAGES.map((img, i) => (
                <div
                  key={i}
                  className={`reveal-item ${galleryReveal.visible ? "visible" : ""} relative rounded-2xl overflow-hidden group cursor-pointer`}
                  style={{
                    width: "clamp(220px, 38vw, 280px)",
                    height: 200,
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 60%)",
                    }}
                  />
                  <div className="absolute bottom-0 left-0 p-4">
                    <p className="text-white font-semibold text-sm">
                      {img.caption}
                    </p>
                    {/* Placeholder — replace src with your own images */}
                    <p className="text-white/50 text-[10px] mt-0.5">
                      📷 Add your image here
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-[11px] text-gray-400 mt-4">
            ← Swipe or drag to explore →
          </p>
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

        {/* ═══════════════════════════════════════════════════════════════
            CIRCLE RATES — Palwal CTA
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-14 px-4 sm:px-6" style={{ background: "var(--clr-surface-warm)" }}>
          <div className="max-w-6xl mx-auto">
            <Link href="/circle-rates/palwal" className="block group">
              <div
                className="relative rounded-3xl overflow-hidden lift cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #0F2E6B 0%, #1746A2 45%, #2563EB 100%)",
                  boxShadow: "0 24px 64px rgba(23,70,162,0.35)",
                }}
              >
                {/* Decorative blobs */}
                <div className="absolute top-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full opacity-10 pointer-events-none"
                  style={{ background: "radial-gradient(circle, #FF6B35, transparent 70%)" }} />
                <div className="absolute bottom-[-40px] left-[30%] w-[200px] h-[200px] rounded-full opacity-10 pointer-events-none"
                  style={{ background: "radial-gradient(circle, #F59E0B, transparent 70%)" }} />

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-10">
                  {/* Left content */}
                  <div className="flex items-center gap-5">
                    <div
                      className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      🏛️
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                          style={{ background: "var(--clr-accent)", color: "white" }}
                        >
                          Official Rates
                        </span>
                      </div>
                      <h2
                        className="text-white text-xl sm:text-2xl font-bold leading-snug"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Circle Rates / Collector Rates<br className="hidden sm:block" />
                        <span style={{ color: "#93C5FD" }}> Palwal 2025–26</span>
                      </h2>
                      <p className="text-white/60 text-sm mt-1.5 max-w-sm">
                        Check government-fixed property registry rates for plots, flats & agricultural land across all sectors in Palwal.
                      </p>
                    </div>
                  </div>

                  {/* Right CTA */}
                  <div className="flex-shrink-0">
                    <span
                      className="cta-shimmer inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 group-hover:scale-105"
                      style={{
                        background: "var(--clr-accent)",
                        boxShadow: "0 8px 28px rgba(255,107,53,0.45)",
                      }}
                    >
                      View Rates
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                    <p className="text-white/40 text-[11px] text-center mt-2">Updated for FY 2025–26</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            BLOG — Latest Articles
        ═══════════════════════════════════════════════════════════════ */}
        <BlogSection />

        {/* ═══════════════════════════════════════════════════════════════
            ADVERTISE WITH US — bottom CTA banner
        ═══════════════════════════════════════════════════════════════ */}
        <section
          className="py-16"
          style={{
            background:
              "linear-gradient(135deg, var(--clr-primary-dark) 0%, var(--clr-primary) 50%, var(--clr-primary-light) 100%)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <span className="text-[11px] font-semibold text-white/80 tracking-wider uppercase">
                For Builders & Dealers
              </span>
            </div>
            <h2
              className="text-white text-2xl sm:text-3xl font-bold mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Advertise With Us
            </h2>
            <p
              className="text-white/50 text-sm sm:text-base max-w-md mx-auto mb-8"
              style={{ lineHeight: 1.7 }}
            >
              Get local visibility for your projects in Palwal. Reach thousands
              of verified buyers and investors every month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/advertise"
                className="cta-shimmer inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background: "var(--clr-accent)",
                  color: "white",
                  boxShadow: "0 8px 32px rgba(255,107,53,0.4)",
                }}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Get Local Visibility
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white/70 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Contact Sales
              </Link>
            </div>
            {/* Marquee of trust signals */}
            <div className="mt-10 overflow-hidden opacity-30">
              <div
                className="marquee-track flex items-center gap-8 whitespace-nowrap"
                style={{ width: "max-content" }}
              >
                {[...Array(2)].flatMap((_, r) =>
                  [
                    "Omaxe City",
                    "SRS Group",
                    "RPS Urbania",
                    "HUDA Palwal",
                    "Ansal API",
                    "Raheja Builders",
                    "Local Developers",
                    "Independent Sellers",
                  ].map((name, i) => (
                    <span
                      key={`${r}-${i}`}
                      className="text-white text-sm font-medium mx-4"
                    >
                      {name} •
                    </span>
                  )),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Modal ── */}
        {modal && <LeadModal type={modal} onClose={() => setModal(null)} />}
      </div>
    </>
  );
}

/* ─── Blog data ──────────────────────────────────────────────────────── */
const BLOG_POSTS = [
  {
    slug: "palwal-to-jewar-airport-connectivity-routes-distance-timeline-2026",
    title: "Palwal to Jewar Airport — Connectivity Routes, Distance & Timeline 2026",
    description: "Complete guide to Palwal–Jewar Airport connectivity: Greenfield Expressway, Railway, Metro routes, distances, timelines, and real estate impact.",
    category: "Infrastructure",
    publishedAt: "Apr 11, 2026",
    categoryColor: "#1746A2",
    categoryBg: "#EEF2FF",
    featureImage: "/blog/palwal-jewar-airport.jpg",
  },
  {
    slug: "palwal-vs-faridabad-property-investment-guide-2026",
    title: "Palwal vs Faridabad — Where to Buy Property in 2026?",
    description: "In-depth comparison of Palwal and Faridabad property markets. Compare prices, appreciation, airport distance, metro access, pros & cons.",
    category: "Property Guide",
    publishedAt: "Apr 11, 2026",
    categoryColor: "#065F46",
    categoryBg: "#ECFDF5",
    featureImage: "/blog/palwal-vs-faridabad.jpg",
  },
  {
    slug: "haryana-property-transfer-after-death-legal-process-mutation-guide",
    title: "How to Transfer Property After Death in Haryana — Mutation & Legal Guide",
    description: "Step-by-step guide to transfer inherited property in Haryana. Mutation (intaqal), legal heir certificate, jamabandi update, and required documents.",
    category: "Property Law",
    publishedAt: "Apr 1, 2025",
    categoryColor: "#7C3AED",
    categoryBg: "#F5F3FF",
    featureImage: "/blog/haryana-property-transfer.jpg",
  },
];

/* ─── Blog section ───────────────────────────────────────────────────── */
function BlogSection() {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className="py-14 max-w-6xl mx-auto px-4 sm:px-6">
      <SectionHeader
        title="Local Knowledge Hub"
        sub="Guides, market insights & legal explainers for Palwal property buyers"
        cta={{ label: "All Articles →", href: "/blog" }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {BLOG_POSTS.map((post, i) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <article
              className={`reveal-item ${visible ? "visible" : ""} lift bg-white rounded-2xl overflow-hidden h-full`}
              style={{ border: "1px solid #e5e7eb", transitionDelay: `${i * 100}ms` }}
            >
              {/* Feature image */}
              <div className="relative w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.featureImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Fallback gradient overlay always visible */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${post.categoryColor}22, ${post.categoryColor}44)`,
                  }}
                >
                  <span className="text-5xl opacity-30">
                    {post.category === "Infrastructure" ? "🛣️" : post.category === "Property Guide" ? "🏘️" : "⚖️"}
                  </span>
                </div>
              </div>

              <div className="p-5">
                {/* Category badge */}
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3"
                  style={{ background: post.categoryBg, color: post.categoryColor }}
                >
                  {post.category}
                </span>

                <h3
                  className="font-bold text-[15px] leading-snug mb-2"
                  style={{ color: "var(--clr-text)", fontFamily: "var(--font-display)" }}
                >
                  {post.title}
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--clr-text-muted)" }}>
                  {post.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{post.publishedAt}</span>
                  <span
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: "var(--clr-primary)" }}
                  >
                    Read
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
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
        <h2
          className="text-xl sm:text-2xl font-bold leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--clr-text)",
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            className="text-xs mt-1"
            style={{ color: "var(--clr-text-muted)" }}
          >
            {sub}
          </p>
        )}
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="flex items-center gap-1 text-[13px] font-semibold whitespace-nowrap transition-colors group"
          style={{ color: "var(--clr-primary)" }}
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
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl"
        style={{ background: "#f3f4f6" }}
      >
        🏠
      </div>
      <p className="font-semibold text-gray-700 mb-1">No listings yet</p>
      <p className="text-sm text-gray-400 mb-5">
        Be the first to post a property in your area.
      </p>
      <Link
        href="/post"
        className="inline-block text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        style={{ background: "var(--clr-primary)" }}
      >
        Post a Property
      </Link>
    </div>
  );
}
