"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import {
  formatPrice,
  formatArea,
  formatDate,
  PROPERTY_TYPE_LABELS,
  CATEGORY_LABELS,
} from "@/lib/format";
import PropertyCard from "./PropertyCard";
import api from "@/lib/api";

interface Props {
  property: any;
}

const AMENITY_ICONS: Record<string, string> = {
  parking: "🚗",
  gym: "💪",
  swimming_pool: "🏊",
  security: "🔒",
  lift: "🛗",
  power_backup: "⚡",
  park: "🌳",
  clubhouse: "🏛️",
  wifi: "📶",
  cctv: "📹",
  garden: "🌿",
  playground: "🎠",
};

export default function PropertyDetail({ property: p }: Props) {
  const { isAuthenticated } = useAuth();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [guestName, setGuestName] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("enquiry_name") || ""
      : "",
  );
  const [guestPhone, setGuestPhone] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("enquiry_phone") || ""
      : "",
  );
  const [consentChecked, setConsentChecked] = useState(false);
  const [enquiryError, setEnquiryError] = useState("");
  const [lightbox, setLightbox] = useState(false);
  const [mobileBarVisible, setMobileBarVisible] = useState(false);
  const [autoModalShown, setAutoModalShown] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const autoModalFiredRef = useRef(false);

  const photos = (p.media || []).filter((m: any) => m.media_type === "photo");
  const amenities: string[] = p.amenities || [];
  const attrs = p.attributes || {};
  const attrEntries = Object.entries(attrs).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  const hasCall = p.contact_info?.can_call && p.contact_info?.phone;
  const hasWhatsapp =
    p.contact_info?.can_whatsapp && p.contact_info?.whatsapp_url;
  const hasEnquiry = p.contact_enquiry;

  // Show secondary mobile bar (call/whatsapp) once title scrolls out of view
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setMobileBarVisible(!e.isIntersecting),
      { threshold: 0 },
    );
    if (titleRef.current) obs.observe(titleRef.current);
    return () => obs.disconnect();
  }, []);

  // Auto-open enquiry modal when user scrolls past 50% — once per page visit
  useEffect(() => {
    if (!hasEnquiry) return;

    const onScroll = () => {
      if (autoModalFiredRef.current) return;
      const scrollPct =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPct >= 0.5) {
        autoModalFiredRef.current = true;
        // Small delay so it doesn't feel like it's reacting to a specific scroll position
        setTimeout(() => {
          // Guard: don't open if user already opened/sent or lightbox is open
          setShowEnquiry((prev) => {
            if (prev) return prev; // already open
            setAutoModalShown(true);
            return true;
          });
        }, 600);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasEnquiry]);

  useEffect(() => {
    document.body.style.overflow = showEnquiry || lightbox ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showEnquiry, lightbox]);

  async function submitEnquiry() {
    setEnquiryError("");
    if (!consentChecked) {
      setEnquiryError("Please confirm you agree to be contacted.");
      return;
    }
    if (!isAuthenticated) {
      if (!guestName.trim()) {
        setEnquiryError("Please enter your name.");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(guestPhone.trim())) {
        setEnquiryError("Enter a valid 10-digit mobile number.");
        return;
      }
    }
    setEnquiryLoading(true);
    try {
      const payload: Record<string, string> = {
        property_id: p.id,
        message: enquiryMsg,
      };
      if (!isAuthenticated) {
        payload.guest_name = guestName.trim();
        payload.guest_phone = guestPhone.trim();
      }
      await api.post("/api/enquiries", payload);
      if (!isAuthenticated) {
        localStorage.setItem("enquiry_name", guestName.trim());
        localStorage.setItem("enquiry_phone", guestPhone.trim());
      }
      setEnquirySent(true);
    } catch (err: any) {
      setEnquiryError(
        err?.response?.data?.message || "Failed to send. Please try again.",
      );
    }
    setEnquiryLoading(false);
  }

  function closeEnquiry() {
    setShowEnquiry(false);
    setEnquiryError("");
    setAutoModalShown(false);
    if (enquirySent) {
      setEnquirySent(false);
      setEnquiryMsg("");
      setConsentChecked(false);
    }
  }

  return (
    <div className="bg-[#f5f7fa] min-h-screen">
      {/* ── PAGE WRAPPER ─────────────────────── */}
      {/* pb-20 on mobile for slim sticky bar, pb-10 on desktop */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-20 lg:pb-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href="/search"
            className="hover:text-primary-600 transition-colors"
          >
            Properties
          </Link>
          {p.location?.city && (
            <>
              <span className="text-gray-300">/</span>
              <Link
                href={`/search?city=${p.location.city}`}
                className="hover:text-primary-600 transition-colors"
              >
                {p.location.city}
              </Link>
            </>
          )}
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 truncate max-w-[160px]">
            {p.title}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* ════ LEFT COLUMN ════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* ── PHOTO GALLERY ── */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              {photos.length > 0 ? (
                <>
                  {/* Main photo */}
                  <div
                    className="relative h-56 sm:h-80 md:h-[420px] cursor-zoom-in bg-gray-900 group"
                    onClick={() => setLightbox(true)}
                  >
                    <Image
                      src={photos[photoIndex]?.url}
                      alt={p.title}
                      fill
                      priority
                      className="object-cover group-hover:scale-[1.01] transition-transform duration-500"
                    />
                    {/* Dark gradient at bottom for badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Top-left badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      <span className="bg-primary-600 text-white text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded shadow-lg uppercase tracking-wide">
                        {CATEGORY_LABELS[p.category] || p.category}
                      </span>
                      {p.is_verified && (
                        <span className="bg-green-500 text-white text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded shadow-lg flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      )}
                      {p.is_featured && (
                        <span className="bg-amber-400 text-amber-900 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded shadow-lg">
                          ★ Featured
                        </span>
                      )}
                    </div>

                    {/* Photo count top-right */}
                    <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {photoIndex + 1} / {photos.length}
                    </div>

                    {/* Arrows */}
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoIndex((i) => Math.max(0, i - 1));
                          }}
                          disabled={photoIndex === 0}
                          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-black/80 transition disabled:opacity-30"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoIndex((i) =>
                              Math.min(photos.length - 1, i + 1),
                            );
                          }}
                          disabled={photoIndex === photos.length - 1}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-black/80 transition disabled:opacity-30"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
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
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {photos.length > 1 && (
                    <div className="flex gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 overflow-x-auto bg-gray-50 border-t border-gray-100 scrollbar-hide">
                      {photos.map((m: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIndex(i)}
                          className={`shrink-0 w-12 h-9 sm:w-14 sm:h-10 rounded overflow-hidden border-2 transition-all ${
                            i === photoIndex
                              ? "border-primary-500 shadow-md scale-105"
                              : "border-transparent opacity-60 hover:opacity-90"
                          }`}
                        >
                          <Image
                            src={m.url}
                            alt=""
                            width={56}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-52 sm:h-64 bg-gray-100 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <svg
                    className="w-12 h-12 sm:w-14 sm:h-14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm">No photos available</p>
                </div>
              )}
            </div>

            {/* ── TITLE + PROPERTY ID + PRICE ── */}
            <div
              ref={titleRef}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5"
            >
              {/* Title row */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start gap-2 sm:gap-3 mb-2">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex-1 leading-snug">
                  {p.title}
                </h1>
                {/* Highlighted Property ID */}
                <div className="flex items-center gap-1.5 bg-amber-50 border-2 border-amber-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 shrink-0 self-start">
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-700 tracking-widest font-mono uppercase">
                    {p.property_id}
                  </span>
                </div>
              </div>

              {/* Location */}
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="line-clamp-1">
                  {PROPERTY_TYPE_LABELS[p.property_type]} &nbsp;·&nbsp;
                  {p.location?.locality}, {p.location?.city}
                  {p.location?.pincode && ` - ${p.location.pincode}`}
                </span>
              </p>

              {/* Price row */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-4 py-3 border-t border-b border-gray-100">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-0.5">
                    Price
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">
                    {formatPrice(p.price, p.price_unit)}
                  </p>
                  {p.price_negotiable && (
                    <span className="inline-block mt-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      ✓ Negotiable
                    </span>
                  )}
                </div>

                {/* Key stats inline */}
                <div className="flex gap-4 sm:gap-5 flex-wrap">
                  <div className="sm:border-l sm:border-gray-200 sm:pl-4">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">
                      Area
                    </p>
                    <p className="text-sm sm:text-base font-bold text-gray-800">
                      {p.area_display_value && p.area_display_unit
                        ? formatArea(p.area_display_value, p.area_display_unit)
                        : formatArea(p.area_sqft, "sqft")}
                    </p>
                  </div>
                  {p.possession_status && (
                    <div className="sm:border-l sm:border-gray-200 sm:pl-4">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">
                        Possession
                      </p>
                      <p className="text-sm sm:text-base font-bold text-gray-800 capitalize">
                        {p.possession_status.replace(/_/g, " ")}
                      </p>
                    </div>
                  )}
                  <div className="sm:border-l sm:border-gray-200 sm:pl-4">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">
                      Views
                    </p>
                    <p className="text-sm sm:text-base font-bold text-gray-800">
                      {p.view_count ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Listed dates */}
              <p className="text-[11px] text-gray-400 mt-3">
                Listed: {formatDate(p.listed_at)}
                {p.updated_at !== p.created_at && (
                  <> &nbsp;·&nbsp; Updated: {formatDate(p.updated_at)}</>
                )}
              </p>
            </div>

            {/* ── ABOUT ── */}
            {p.description && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary-600 rounded-full" />
                  About this Property
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {p.description}
                </p>
              </div>
            )}

            {/* ── PROPERTY DETAILS ── */}
            {attrEntries.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary-600 rounded-full" />
                  Property Details
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {attrEntries.map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-white px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary-50/40 transition-colors"
                    >
                      <p className="text-[10px] sm:text-[11px] text-gray-400 capitalize mb-0.5">
                        {k.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 capitalize">
                        {typeof v === "boolean"
                          ? v
                            ? "Yes"
                            : "No"
                          : String(v)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AMENITIES ── */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary-600 rounded-full" />
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {amenities.map((a: string) => (
                    <div
                      key={a}
                      className="flex items-center gap-2 sm:gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5"
                    >
                      <span className="text-base sm:text-lg leading-none">
                        {AMENITY_ICONS[a] || "✓"}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium text-gray-700 capitalize">
                        {a.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SIMILAR ── */}
            {p.similar?.length > 0 && (
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary-600 rounded-full" />
                  Similar Properties
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {p.similar.map((s: any) => (
                    <PropertyCard key={s.id} property={s} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN — sticky contact card (desktop only) ════ */}
          <aside className="lg:w-[340px] shrink-0 hidden lg:block">
            <div className="sticky top-4 space-y-3">
              {/* Owner + contact card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Owner header */}
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow">
                      {p.owner?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {p.owner?.name || "Owner"}
                      </p>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {p.owner?.verified_dealer && (
                          <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                            ✓ Verified Dealer
                          </span>
                        )}
                        {p.owner?.agency_name && (
                          <span className="text-[11px] text-gray-500">
                            {p.owner.agency_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="p-4 space-y-2.5">
                  {hasCall && (
                    <a
                      href={`tel:+91${p.contact_info.phone}`}
                      className="flex items-center justify-center gap-2 w-full border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:text-primary-700 transition-all"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Call +91 {p.contact_info.phone}
                    </a>
                  )}
                  {hasWhatsapp && (
                    <a
                      href={p.contact_info.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Chat on WhatsApp
                    </a>
                  )}
                  {hasEnquiry && (
                    <button
                      onClick={() => setShowEnquiry(true)}
                      className="relative flex items-center justify-center gap-2 w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-[0.98] overflow-hidden group"
                    >
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute w-full h-full rounded-lg bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 ease-out" />
                      </span>
                      <svg
                        className="w-4 h-4 relative z-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="relative z-10">Send Enquiry</span>
                    </button>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>{p.view_count ?? 0} people viewed this</span>
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Active
                  </span>
                </div>
              </div>

              {/* Property ID highlight card */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] text-amber-600 font-medium uppercase tracking-wide">
                    Property ID
                  </p>
                  <p className="text-base font-black text-amber-800 tracking-widest font-mono">
                    {p.property_id}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── DESKTOP FLOATING RIPPLE ENQUIRY BUTTON ───────── */}
      {hasEnquiry && (
        <button
          onClick={() => setShowEnquiry(true)}
          className="hidden lg:flex fixed bottom-8 right-8 z-40 items-center gap-2.5 bg-primary-600 text-white font-bold text-sm px-5 py-3.5 rounded-full shadow-2xl shadow-primary-300 hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 group"
          style={{ boxShadow: "0 0 0 0 rgba(79,70,229,0.5)" }}
        >
          <span className="absolute inset-0 rounded-full animate-ping bg-primary-500 opacity-25" />
          <span
            className="absolute inset-0 rounded-full animate-ping bg-primary-400 opacity-15"
            style={{ animationDelay: "0.4s" }}
          />
          <svg
            className="w-4 h-4 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="relative z-10">Send Enquiry</span>
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════
          MOBILE STICKY BOTTOM — compact single-row bar
          Primary: Enquire Now button (fills most width)
          Secondary: Call + WhatsApp as compact icon buttons
          Total height: ~52px including safe padding
          ═══════════════════════════════════════════════════════ */}
      {(hasCall || hasWhatsapp || hasEnquiry) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
          <div className="bg-white border-t border-gray-100 px-3 py-2 flex items-center gap-2 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
            {/* Secondary: icon-only call */}
            {hasCall && (
              <a
                href={`tel:+91${p.contact_info.phone}`}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 active:scale-90 active:bg-gray-50 transition-all"
                aria-label="Call owner"
              >
                <svg
                  className="w-[18px] h-[18px]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </a>
            )}
            {/* Secondary: icon-only whatsapp */}
            {hasWhatsapp && (
              <a
                href={p.contact_info.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-[#25D366] text-white active:scale-90 active:bg-[#1ebe5d] transition-all"
                aria-label="Chat on WhatsApp"
              >
                <svg
                  className="w-[18px] h-[18px]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            )}
            {/* Primary: Enquire Now — takes remaining width */}
            {hasEnquiry && (
              <button
                onClick={() => setShowEnquiry(true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 text-white rounded-lg h-10 text-[13px] font-semibold active:scale-[0.97] active:bg-primary-700 transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Enquire Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── ENQUIRY MODAL ─────────────────────────────────── */}
      {showEnquiry && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEnquiry();
          }}
        >
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
            {/* Drag handle on mobile */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-0.5">
              <div className="w-9 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Nudge banner — only when auto-triggered */}
            {autoModalShown && !enquirySent && (
              <div className="mx-4 mt-2 mb-0 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-primary-600 text-base">👋</span>
                <p className="text-xs text-primary-700 leading-snug">
                  Looks like you&apos;re interested! Drop your details and the
                  owner will call you back.
                </p>
              </div>
            )}

            {/* Header */}
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                  Send Enquiry
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                  {p.title}
                </p>
              </div>
              <button
                onClick={closeEnquiry}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 ml-3"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {enquirySent ? (
                <div className="text-center py-5">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-7 h-7 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1.5">
                    Enquiry Sent!
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">
                    The owner will reach out to you shortly.
                  </p>
                  <button
                    onClick={closeEnquiry}
                    className="bg-primary-600 text-white font-semibold px-8 py-2.5 rounded-lg hover:bg-primary-700 transition text-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {!isAuthenticated && (
                    <>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="input-field text-sm"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">
                          Mobile Number *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium border-r border-gray-200 pr-2">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={guestPhone}
                            onChange={(e) =>
                              setGuestPhone(
                                e.target.value.replace(/\D/g, "").slice(0, 10),
                              )
                            }
                            placeholder="10-digit number"
                            className="input-field text-sm pl-14"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase tracking-wide">
                      Message{" "}
                      <span className="text-gray-300 font-normal normal-case">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={enquiryMsg}
                      onChange={(e) => setEnquiryMsg(e.target.value)}
                      placeholder="Hi, I am interested in this property…"
                      rows={2}
                      className="input-field text-sm resize-none"
                    />
                  </div>

                  {/* Consent checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <div
                      onClick={() => setConsentChecked((v) => !v)}
                      className={`mt-0.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        consentChecked
                          ? "bg-primary-600 border-primary-600"
                          : "border-gray-300 group-hover:border-primary-400"
                      }`}
                    >
                      {consentChecked && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 leading-relaxed select-none">
                      I agree to be contacted by the owner/team about this
                      property.
                    </span>
                  </label>

                  {enquiryError && (
                    <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                      <svg
                        className="w-3 h-3 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {enquiryError}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-0.5">
                    <button
                      onClick={closeEnquiry}
                      className="w-[100px] shrink-0 border border-gray-200 rounded-lg py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitEnquiry}
                      disabled={enquiryLoading || !consentChecked}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg py-2.5 text-[13px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
                    >
                      {enquiryLoading ? (
                        <>
                          <svg
                            className="w-3.5 h-3.5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        "Send Enquiry"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Slide-up animation */}
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0.5; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ──────────────────────────────────────── */}
      {lightbox && photos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            className="relative w-full max-w-4xl max-h-screen px-4 sm:px-12 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[60vh] sm:h-[70vh]">
              <Image
                src={photos[photoIndex]?.url}
                alt={p.title}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-center text-white/50 text-sm mt-3">
              {photoIndex + 1} / {photos.length}
            </p>
          </div>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex((i) => Math.max(0, i - 1));
                }}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex((i) => Math.min(photos.length - 1, i + 1));
                }}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
