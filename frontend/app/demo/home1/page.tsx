export const runtime = 'edge';
"use client";

import { all } from "axios";
import { Sign } from "crypto";
import { transform } from "next/dist/build/swc";
import { pages } from "next/dist/build/templates/app-page";
import { it } from "node:test";
import { type } from "os";
import { list } from "postcss";
import { useState, useEffect, useRef, useCallback } from "react";
import style from "styled-jsx/style";
import page from "../../page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyListing {
  id: number;
  price: string;
  priceUnit?: string;
  title: string;
  beds?: string;
  area: string;
  extra?: string;
  badge: "rent" | "sale" | "featured" | "new";
  badgeLabel: string;
  bg: string;
  icon: string;
  owner: string;
  sparkline: string;
}

interface Testimonial {
  initials: string;
  avatarBg: string;
  avatarColor: string;
  name: string;
  role: string;
  text: string;
  stars: number;
}

interface PropertyType {
  icon: string;
  label: string;
  count: number;
  iconBg: string;
}

interface City {
  name: string;
  count: number;
  trend?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROPERTY_TYPES: PropertyType[] = [
  { icon: "🏢", label: "Flat", count: 824, iconBg: "#E1F5EE" },
  { icon: "📐", label: "Plot", count: 312, iconBg: "#E6F1FB" },
  { icon: "🏠", label: "House", count: 510, iconBg: "#FAEEDA" },
  { icon: "🏡", label: "Villa", count: 78, iconBg: "#FAECE7" },
  { icon: "🛏", label: "PG", count: 190, iconBg: "#EEEDFE" },
  { icon: "🏪", label: "Commercial", count: 143, iconBg: "#E6F1FB" },
  { icon: "🌾", label: "Land", count: 99, iconBg: "#E1F5EEE" },
  { icon: "🌳", label: "Farmhouse", count: 44, iconBg: "#FAEEDA" },
];

const FEATURED: PropertyListing[] = [
  {
    id: 1,
    price: "₹18,000",
    priceUnit: "/ month",
    title: "2BHK Flat, Sector 14, Gurugram",
    beds: "2 BHK",
    area: "980 sq.ft",
    badge: "rent",
    badgeLabel: "For Rent",
    bg: "#E1F5EE",
    icon: "🏢",
    owner: "Owner listing",
    sparkline: "0,18 10,14 20,16 30,10 40,8 50,5 60,4",
  },
  {
    id: 2,
    price: "₹45 L",
    title: "3BHK House, NIT, Faridabad",
    beds: "3 BHK",
    area: "1,450 sq.ft",
    badge: "featured",
    badgeLabel: "★ Featured",
    bg: "#FAEEDA",
    icon: "🏠",
    owner: "Verified",
    sparkline: "0,20 10,16 20,12 30,14 40,9 50,7 60,6",
  },
  {
    id: 3,
    price: "₹22 L",
    title: "200 sq.yd Plot, Panipat",
    area: "200 sq.yd",
    extra: "DDJAY",
    badge: "sale",
    badgeLabel: "For Sale",
    bg: "#E6F1FB",
    icon: "📐",
    owner: "Owner listing",
    sparkline: "0,22 10,19 20,20 30,15 40,13 50,10 60,8",
  },
  {
    id: 4,
    price: "₹1.2 Cr",
    title: "4BHK Villa, Sector 50, Gurugram",
    beds: "4 BHK",
    area: "2,800 sq.ft",
    badge: "sale",
    badgeLabel: "For Sale",
    bg: "#EEEDFE",
    icon: "🏡",
    owner: "Verified",
    sparkline: "0,16 10,18 20,14 30,10 40,8 50,6 60,3",
  },
];

const RECENT: PropertyListing[] = [
  {
    id: 5,
    price: "₹55 L",
    title: "Commercial space, Sector 3, Faridabad",
    area: "620 sq.ft",
    extra: "G. Floor",
    badge: "sale",
    badgeLabel: "For Sale",
    bg: "#FAECE7",
    icon: "🏪",
    owner: "Dealer listing",
    sparkline: "0,18 10,15 20,17 30,12 40,10 50,8 60,6",
  },
  {
    id: 6,
    price: "₹8,500",
    priceUnit: "/ month",
    title: "PG for girls, IFFCO Chowk, Gurugram",
    area: "Single room",
    extra: "Meals incl.",
    badge: "rent",
    badgeLabel: "For Rent",
    bg: "#E1F5EE",
    icon: "🛏",
    owner: "Owner listing",
    sparkline: "0,20 10,18 20,16 30,14 40,12 50,10 60,8",
  },
  {
    id: 7,
    price: "₹40 L",
    title: "2 acre agri land, Rohtak",
    area: "2 acres",
    extra: "Tube-well",
    badge: "sale",
    badgeLabel: "For Sale",
    bg: "#FAEEDA",
    icon: "🌾",
    owner: "Owner listing",
    sparkline: "0,16 10,14 20,15 30,11 40,9 50,7 60,5",
  },
  {
    id: 8,
    price: "₹2.8 Cr",
    title: "Farmhouse 1 acre, Karnal highway",
    area: "1 acre",
    extra: "Pool",
    badge: "featured",
    badgeLabel: "★ Featured",
    bg: "#EEEDFE",
    icon: "🌳",
    owner: "Verified",
    sparkline: "0,20 10,17 20,13 30,11 40,8 50,6 60,4",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    initials: "RS",
    avatarBg: "#E1F5EE",
    avatarColor: "#085041",
    name: "Rahul Sharma",
    role: "Renter, Gurugram",
    stars: 5,
    text: "Found my flat in Gurugram in just 3 days. No broker, direct from owner. The verification badge made me feel safe.",
  },
  {
    initials: "PD",
    avatarBg: "#E6F1FB",
    avatarColor: "#0C447C",
    name: "Priya Devi",
    role: "Seller, Panipat",
    stars: 5,
    text: "Posted my plot for sale and got 12 enquiries in a week. Sold it within a month. Couldn't be easier.",
  },
  {
    initials: "AK",
    avatarBg: "#FAEEDA",
    avatarColor: "#633806",
    name: "Amit Kumar",
    role: "Buyer, Faridabad",
    stars: 4,
    text: "The city-wise search and price range filter made shortlisting very convenient. Great experience overall.",
  },
  {
    initials: "SG",
    avatarBg: "#EEEDFE",
    avatarColor: "#3C3489",
    name: "Sunita Gupta",
    role: "Renter, Sonipat",
    stars: 5,
    text: "Set up a price alert and got notified the day a flat in my budget was listed. That feature alone is worth it.",
  },
];

const CITIES: City[] = [
  { name: "Gurugram", count: 820, trend: "↑ 12%" },
  { name: "Faridabad", count: 510, trend: "↑ 8%" },
  { name: "Panipat", count: 280, trend: "↑ 5%" },
  { name: "Karnal", count: 195 },
  { name: "Rohtak", count: 160 },
  { name: "Ambala", count: 140, trend: "↑ 3%" },
  { name: "Sonipat", count: 120 },
  { name: "Hisar", count: 96 },
];

const TICKER_ITEMS = [
  { isNew: true, text: "3BHK Flat in Sector 14, Gurugram — ₹1.2 Cr" },
  { isNew: false, text: "Plot 200 sq.yd in Panipat — ₹22 L" },
  { isNew: true, text: "PG for Girls near IFFCO Chowk — ₹8,500/mo" },
  { isNew: false, text: "Commercial space in Faridabad — ₹55 L" },
  { isNew: true, text: "Villa in Karnal — ₹2.8 Cr" },
  { isNew: false, text: "Agricultural land 2 acres, Rohtak — ₹40 L" },
];

const HOW_STEPS = [
  {
    num: "1",
    title: "Search & filter",
    desc: "Browse 2,400+ verified listings by city, type, and budget",
  },
  {
    num: "2",
    title: "Contact directly",
    desc: "Call or message the owner or dealer — no middlemen, no fees",
  },
  {
    num: "3",
    title: "Move in",
    desc: "Visit the property, finalise the deal and you're home",
  },
];

const INTENT_TABS = ["Buy", "Rent", "PG / Hostel", "Commercial"];
const CITY_PLACEHOLDERS = [
  "Gurugram",
  "Faridabad",
  "Panipat",
  "Karnal",
  "Rohtak",
];
const PROPERTY_TYPE_CHIPS = [
  "Flat",
  "Plot",
  "House",
  "PG",
  "Commercial",
  "Villa",
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [start, target, duration]);
  return value;
}

function useIntersection(
  ref: React.RefObject<Element | null>,
  threshold = 0.15,
) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function badgeStyle(badge: PropertyListing["badge"]): React.CSSProperties {
  const map = {
    rent: { background: "#E6F1FB", color: "#0C447C" },
    sale: { background: "#E1F5EE", color: "#085041" },
    featured: { background: "#FAEEDA", color: "#633806" },
    new: { background: "#EEEDFE", color: "#3C3489" },
  };
  return {
    ...map[badge],
    fontSize: 10,
    fontWeight: 500,
    padding: "3px 9px",
    borderRadius: 20,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TickerBar() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      style={{
        background: "#04342C",
        height: 30,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="hp-ticker">
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 32px",
              fontSize: 12,
              color: "#9FE1CB",
              whiteSpace: "nowrap",
            }}
          >
            {item.isNew && (
              <span
                style={{
                  background: "#1D9E75",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 6px",
                  borderRadius: 4,
                  marginRight: 4,
                }}
              >
                New
              </span>
            )}
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#5DCAA5",
                display: "inline-block",
              }}
            />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function Navbar({ showSearchPill }: { showSearchPill: boolean }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: 52,
        background: "var(--background)",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1D9E75",
          }}
        />
        Haryana<span style={{ color: "#1D9E75" }}>Homes</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          className={`hp-nav-pill ${showSearchPill ? "hp-nav-pill--show" : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#f4f4f4",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 13,
            color: "#666",
            cursor: "pointer",
            transition: "opacity .3s, transform .3s",
            opacity: showSearchPill ? 1 : 0,
            pointerEvents: showSearchPill ? "all" : "none",
            transform: showSearchPill ? "translateY(0)" : "translateY(-4px)",
          }}
        >
          <svg
            width={13}
            height={13}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <circle cx={11} cy={11} r={7} />
            <path d="M20 20l-4-4" />
          </svg>
          Search properties
        </div>
        <button
          style={{
            background: "transparent",
            color: "#555",
            border: "0.5px solid rgba(0,0,0,0.12)",
            borderRadius: 20,
            padding: "7px 14px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
        <button
          style={{
            background: "#1D9E75",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Post free
        </button>
      </div>
    </nav>
  );
}

function SearchCard() {
  const [activeTab, setActiveTab] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);
  const [cityVisible, setCityVisible] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCityVisible(false);
      setTimeout(() => {
        setCityIdx((i) => (i + 1) % CITY_PLACEHOLDERS.length);
        setCityVisible(true);
      }, 250);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    setSearched(true);
    setTimeout(() => setSearched(false), 1800);
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
      }}
    >
      {/* Intent tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        {INTENT_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              padding: "10px 4px",
              fontSize: 13,
              fontWeight: 500,
              textAlign: "center",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              borderBottom:
                activeTab === i ? "2px solid #1D9E75" : "2px solid transparent",
              color: activeTab === i ? "#1D9E75" : "#999",
              transition: "all .2s",
              whiteSpace: "nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Search fields */}
      <div
        style={{ display: "flex", gap: 0, padding: 8, alignItems: "stretch" }}
      >
        {[
          {
            label: "City",
            value: CITY_PLACEHOLDERS[cityIdx] + "…",
            animated: true,
          },
          { label: "Type", value: "Flat, House, Plot…", animated: false },
          { label: "Budget", value: "Any range", animated: false },
        ].map(({ label, value, animated }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "8px 10px",
              border: "0.5px solid rgba(0,0,0,0.1)",
              borderRadius: 8,
              margin: "0 3px",
              cursor: "text",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#888",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: animated
                  ? "opacity .25s, transform .25s"
                  : undefined,
                opacity: animated ? (cityVisible ? 1 : 0) : 1,
                transform: animated
                  ? cityVisible
                    ? "translateY(0)"
                    : "translateY(6px)"
                  : undefined,
              }}
            >
              {value}
            </div>
          </div>
        ))}
        <button
          onClick={handleSearch}
          style={{
            background: "#1D9E75",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            margin: "0 3px",
            padding: "0 18px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background .15s, transform .15s",
            transform: searched ? "scale(0.96)" : "scale(1)",
          }}
        >
          {searched ? (
            "✓"
          ) : (
            <svg
              width={16}
              height={16}
              fill="none"
              stroke="#fff"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx={11} cy={11} r={7} />
              <path d="M20 20l-4-4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function HeroStats() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref, 0.5);

  useEffect(() => {
    if (visible) setStarted(true);
  }, [visible]);

  const s1 = useCountUp(2400, 1400, started);
  const s2 = useCountUp(8, 800, started);
  const s3 = useCountUp(340, 1200, started);
  const s4 = useCountUp(98, 1000, started);

  const stats = [
    { value: s1.toLocaleString() + "+", label: "Listings" },
    { value: String(s2), label: "Cities" },
    { value: s3.toLocaleString() + "+", label: "Verified owners" },
    { value: String(s4) + "%", label: "Satisfaction" },
  ];

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginTop: 20,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{ display: "flex", alignItems: "center", gap: 24 }}
        >
          {i > 0 && (
            <div
              style={{
                width: 0.5,
                height: 32,
                background: "rgba(255,255,255,0.2)",
              }}
            />
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#fff" }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RevealWrapper({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity .55s ${delay}s ease, transform .55s ${delay}s ease`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PropertyCard({ listing }: { listing: PropertyListing }) {
  const [saved, setSaved] = useState(false);
  const [hovering, setHovering] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: "#fff",
        border: `0.5px solid ${hovering ? "rgba(29,158,117,0.4)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transform: hovering ? "translateY(-4px)" : "translateY(0)",
        transition: "transform .2s, border-color .2s",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 120,
          background: listing.bg,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 40,
            transform: hovering ? "scale(1.1)" : "scale(1)",
            transition: "transform .3s",
          }}
        >
          {listing.icon}
        </div>
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            gap: 4,
          }}
        >
          <span style={badgeStyle(listing.badge)}>{listing.badgeLabel}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: saved ? "#E24B4A" : "#999",
            transform: saved ? "scale(1.15)" : "scale(1)",
            transition: "transform .2s, color .15s",
          }}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>
          {listing.price}
          {listing.priceUnit && (
            <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}>
              {" "}
              {listing.priceUnit}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#666",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {listing.title}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
          {listing.beds && (
            <span style={{ fontSize: 11, color: "#aaa" }}>
              🛏 {listing.beds}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#aaa" }}>📐 {listing.area}</span>
          {listing.extra && (
            <span style={{ fontSize: 11, color: "#aaa" }}>
              · {listing.extra}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
            paddingTop: 8,
            borderTop: "0.5px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "#1D9E75",
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#1D9E75",
              }}
            />
            {listing.owner}
          </div>
          <svg width={60} height={24} viewBox="0 0 60 24">
            <polyline
              points={listing.sparkline}
              fill="none"
              stroke="#1D9E75"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TypeCard({ pt, index }: { pt: PropertyType; index: number }) {
  const [hovering, setHovering] = useState(false);
  return (
    <RevealWrapper delay={index * 0.05}>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          background: "#fff",
          border: `0.5px solid ${hovering ? "#1D9E75" : "rgba(0,0,0,0.08)"}`,
          borderRadius: 10,
          padding: "14px 8px 12px",
          textAlign: "center",
          cursor: "pointer",
          transform: hovering ? "translateY(-3px)" : "translateY(0)",
          transition: "all .2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: pt.iconBg,
            margin: "0 auto 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            transform: hovering ? "scale(1.1)" : "scale(1)",
            transition: "transform .2s",
          }}
        >
          {pt.icon}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#444" }}>
          {pt.label}
        </div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
          {pt.count} listings
        </div>
      </div>
    </RevealWrapper>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref, 0.4);
  const [fill, setFill] = useState(false);

  useEffect(() => {
    if (visible) setTimeout(() => setFill(true), 200);
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{
        background: "#f8faf9",
        borderTop: "0.5px solid rgba(0,0,0,0.06)",
        borderBottom: "0.5px solid rgba(0,0,0,0.06)",
        padding: "32px 20px",
      }}
    >
      <RevealWrapper>
        <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 20 }}>
          How it works
        </div>
      </RevealWrapper>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          position: "relative",
        }}
      >
        {/* Connector lines */}
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 44,
              left: `calc(${33 + i * 34}% - 10px)`,
              width: "calc(34% - 10px)",
              height: 2,
              background: "rgba(0,0,0,0.06)",
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "#1D9E75",
                width: fill ? "100%" : "0%",
                transition: `width 1.2s ${i * 0.5}s ease`,
              }}
            />
          </div>
        ))}
        {HOW_STEPS.map((step, i) => (
          <RevealWrapper
            key={step.num}
            delay={i * 0.15}
            style={{
              textAlign: "center",
              padding: "20px 12px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 48,
                height: 48,
                margin: "0 auto 14px",
              }}
            >
              <div
                className="hp-pulse-ring"
                style={{ animationDelay: `${i * 0.8}s` }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#1D9E75",
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {step.num}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              {step.title}
            </div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
              {step.desc}
            </div>
          </RevealWrapper>
        ))}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const [page, setPage] = useState(0);
  const pages = TESTIMONIALS.length - 1;

  useEffect(() => {
    const interval = setInterval(() => setPage((p) => (p + 1) % pages), 4000);
    return () => clearInterval(interval);
  }, [pages]);

  return (
    <section style={{ padding: "28px 20px" }}>
      <RevealWrapper>
        <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 16 }}>
          What our users say
        </div>
      </RevealWrapper>
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            transition: "transform .5s cubic-bezier(.4,0,.2,1)",
            transform: `translateX(-${page * (50 + 3)}%)`,
          }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.initials}
              style={{
                minWidth: "calc(50% - 6px)",
                background: "#fff",
                border: "0.5px solid rgba(0,0,0,0.08)",
                borderRadius: 14,
                padding: 16,
                flexShrink: 0,
              }}
            >
              <div style={{ color: "#EF9F27", fontSize: 12, marginBottom: 8 }}>
                {"★".repeat(t.stars)}
                {"☆".repeat(5 - t.stars)}
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: "#1D9E75",
                  lineHeight: 1,
                  marginBottom: 8,
                  fontFamily: "Georgia, serif",
                }}
              >
                "
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#555",
                  lineHeight: 1.55,
                  marginBottom: 12,
                }}
              >
                {t.text}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: t.avatarBg,
                    color: t.avatarColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginTop: 14,
        }}
      >
        {Array.from({ length: pages }).map((_, i) => (
          <div
            key={i}
            onClick={() => setPage(i)}
            style={{
              width: page === i ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: page === i ? "#1D9E75" : "rgba(0,0,0,0.12)",
              cursor: "pointer",
              transition: "all .2s",
            }}
          />
        ))}
      </div>
    </section>
  );
}

function AlertSection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  const toggleChip = (chip: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(chip) ? n.delete(chip) : n.add(chip);
      return n;
    });

  const handleSubmit = () => {
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div style={{ background: "#04342C", padding: "32px 20px" }}>
      <div
        style={{
          fontSize: 17,
          fontWeight: 500,
          color: "#fff",
          marginBottom: 4,
        }}
      >
        Get instant property alerts
      </div>
      <div
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 16,
        }}
      >
        Tell us what you're looking for and we'll notify you the moment it's
        listed.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Your city — Gurugram, Panipat…"
          style={{
            flex: 1,
            minWidth: 160,
            background: "rgba(255,255,255,0.1)",
            border: "0.5px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#fff",
            outline: "none",
          }}
        />
        <input
          placeholder="Budget range — ₹20L–₹60L"
          style={{
            flex: 1,
            minWidth: 140,
            background: "rgba(255,255,255,0.1)",
            border: "0.5px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#fff",
            outline: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            background: done ? "rgba(93,202,165,0.6)" : "#5DCAA5",
            color: "#04342C",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background .2s",
          }}
        >
          {done ? "✓ Alerts set!" : "Get alerts →"}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {PROPERTY_TYPE_CHIPS.map((chip) => (
          <div
            key={chip}
            onClick={() => toggleChip(chip)}
            style={{
              background: selected.has(chip)
                ? "rgba(93,202,165,0.2)"
                : "rgba(255,255,255,0.08)",
              border: `0.5px solid ${selected.has(chip) ? "rgba(93,202,165,0.5)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              color: selected.has(chip) ? "#9FE1CB" : "rgba(255,255,255,0.75)",
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {chip}
          </div>
        ))}
      </div>
    </div>
  );
}

function CitySection() {
  return (
    <div
      style={{
        background: "#f8faf9",
        borderTop: "0.5px solid rgba(0,0,0,0.06)",
        padding: "24px 20px",
      }}
    >
      <RevealWrapper>
        <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 12 }}>
          Popular cities
        </div>
      </RevealWrapper>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CITIES.map((city, i) => (
          <RevealWrapper key={city.name} delay={i * 0.04}>
            <CityPill city={city} />
          </RevealWrapper>
        ))}
      </div>
    </div>
  );
}

function CityPill({ city }: { city: City }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#fff",
        border: `0.5px solid ${hovering ? "#1D9E75" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 20,
        padding: "7px 14px",
        fontSize: 13,
        color: hovering ? "#1D9E75" : "#555",
        cursor: "pointer",
        transform: hovering ? "translateY(-2px)" : "translateY(0)",
        transition: "all .2s",
      }}
    >
      {city.name}
      <span style={{ fontSize: 11, color: "#aaa" }}>{city.count}</span>
      {city.trend && (
        <span
          style={{
            fontSize: 10,
            color: "#1D9E75",
            background: "#E1F5EE",
            padding: "1px 5px",
            borderRadius: 4,
          }}
        >
          {city.trend}
        </span>
      )}
    </div>
  );
}

// ─── Global styles (animations) ───────────────────────────────────────────────

const GLOBAL_CSS = `
  @keyframes hp-ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  @keyframes hp-float1 { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-18px) scale(1.04) } }
  @keyframes hp-float2 { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-12px) rotate(8deg) } }
  @keyframes hp-float3 { 0%,100% { transform: translateY(0) scale(1) } 60% { transform: translateY(-22px) scale(0.96) } }
  @keyframes hp-pulse-ring { 0% { transform: scale(1); opacity: .6 } 100% { transform: scale(2.2); opacity: 0 } }
  @keyframes hp-slide-up { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes hp-slide-in { from { opacity: 0; transform: translateX(-24px) } to { opacity: 1; transform: translateX(0) } }

  .hp-ticker { display: flex; white-space: nowrap; animation: hp-ticker 22s linear infinite; }
  .hp-pulse-ring { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #5DCAA5; opacity: 0; animation: hp-pulse-ring 2.5s ease-out infinite; }
  .hp-hero-badge { animation: hp-slide-in .5s both; }
  .hp-hero-badge:nth-child(2) { animation-delay: .1s; }
  .hp-hero-badge:nth-child(3) { animation-delay: .2s; }
  .hp-hero-h1 { animation: hp-slide-up .5s .1s both; }
  .hp-hero-sub { animation: hp-slide-up .5s .2s both; }
  .hp-search-card { animation: hp-slide-up .5s .3s both; }
  .hp-stats-strip { animation: hp-slide-up .5s .45s both; }
  .hp-bubble-1 { animation: hp-float1 6s ease-in-out infinite; }
  .hp-bubble-2 { animation: hp-float2 8s ease-in-out infinite; }
  .hp-bubble-3 { animation: hp-float3 5s ease-in-out infinite; }
  .hp-bubble-4 { animation: hp-float1 7s ease-in-out infinite 1s; }
`;

// ─── Main page component ──────────────────────────────────────────────────────

export default function HomePage() {
  const [heroVisible, setHeroVisible] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setHeroVisible(e.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* Inject global keyframe animations */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <TickerBar />
      <Navbar showSearchPill={!heroVisible} />

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          background:
            "linear-gradient(135deg, #0F6E56 0%, #1D9E75 60%, #5DCAA5 100%)",
          padding: "44px 20px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Floating bubbles */}
        {[
          {
            cls: "hp-bubble-1",
            style: { width: 180, height: 180, top: -40, right: -20 },
          },
          {
            cls: "hp-bubble-2",
            style: { width: 100, height: 100, bottom: 20, left: -20 },
          },
          {
            cls: "hp-bubble-3",
            style: { width: 60, height: 60, top: "50%", right: "15%" },
          },
          {
            cls: "hp-bubble-4",
            style: { width: 140, height: 140, bottom: -50, right: "25%" },
          },
        ].map((b, i) => (
          <div
            key={i}
            className={b.cls}
            style={{
              position: "absolute",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              ...b.style,
            }}
          />
        ))}

        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Trust badges */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {[
              { icon: "✓", text: "Verified listings" },
              { icon: "0", text: "Zero brokerage" },
              { icon: "★", text: "2,400+ properties" },
            ].map((b) => (
              <div
                key={b.text}
                className="hp-hero-badge"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(255,255,255,0.12)",
                  border: "0.5px solid rgba(255,255,255,0.25)",
                  borderRadius: 20,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#5DCAA5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    color: "#04342C",
                    flexShrink: 0,
                  }}
                >
                  {b.icon}
                </div>
                {b.text}
              </div>
            ))}
          </div>

          <h1
            className="hp-hero-h1"
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: "#fff",
              lineHeight: 1.3,
              marginBottom: 8,
            }}
          >
            Find your perfect home
            <br />
            across Haryana
          </h1>
          <p
            className="hp-hero-sub"
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.75)",
              marginBottom: 20,
            }}
          >
            Direct owner contact · Verified listings · Instant alerts
          </p>

          <div className="hp-search-card">
            <SearchCard />
          </div>
          <div className="hp-stats-strip">
            <HeroStats />
          </div>
        </div>
      </section>

      {/* ── Browse by type ── */}
      <section style={{ padding: "28px 20px" }}>
        <RevealWrapper>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 500 }}>
              Browse by type
            </span>
            <span style={{ fontSize: 13, color: "#1D9E75", cursor: "pointer" }}>
              See all →
            </span>
          </div>
        </RevealWrapper>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {PROPERTY_TYPES.map((pt, i) => (
            <TypeCard key={pt.label} pt={pt} index={i} />
          ))}
        </div>
      </section>

      <div
        style={{
          height: 0.5,
          background: "rgba(0,0,0,0.06)",
          margin: "0 20px",
        }}
      />

      {/* ── Featured listings ── */}
      <section style={{ padding: "28px 20px" }}>
        <RevealWrapper>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 500 }}>
              Featured listings
            </span>
            <span style={{ fontSize: 13, color: "#1D9E75", cursor: "pointer" }}>
              View all →
            </span>
          </div>
        </RevealWrapper>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {FEATURED.map((l, i) => (
            <RevealWrapper key={l.id} delay={i * 0.08}>
              <PropertyCard listing={l} />
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Recently added ── */}
      <section style={{ padding: "28px 20px" }}>
        <RevealWrapper>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 500 }}>
              Recently added
            </span>
            <span style={{ fontSize: 13, color: "#1D9E75", cursor: "pointer" }}>
              View all →
            </span>
          </div>
        </RevealWrapper>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {RECENT.map((l, i) => (
            <RevealWrapper key={l.id} delay={i * 0.08}>
              <PropertyCard listing={l} />
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── Post CTA ── */}
      <RevealWrapper style={{ margin: "0 20px 24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0F6E56, #1D9E75)",
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -30,
              top: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>
              Have a property to list?
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                marginTop: 4,
              }}
            >
              Post for free — reach thousands of serious buyers and renters
              directly.
            </div>
          </div>
          <button
            style={{
              background: "#fff",
              color: "#0F6E56",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Post for free →
          </button>
        </div>
      </RevealWrapper>

      {/* ── Alert section ── */}
      <AlertSection />

      {/* ── Popular cities ── */}
      <CitySection />

      <div style={{ height: 20 }} />
    </>
  );
}
