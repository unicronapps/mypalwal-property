"use client";

/*
 * POST /api/leads/find-property
 * Body (JSON):
 *   name          string    required
 *   phone         string    required  (10-digit Indian mobile)
 *   city          string    required
 *   requirement   string    required
 *   propertyType  string    optional  flat | house | plot | commercial | villa
 *   bhkConfig     string[]  optional  ["1BHK","2BHK"] — only for flat/house/villa
 *   possession    string    optional  ready | under_construction | any
 *   localities    string[]  optional
 *   otherLocality string    optional
 *   budgetMin     string    optional
 *   budgetMax     string    optional
 * Response: { success: true, id: <uuid> }
 *
 * ── New DB columns needed ─────────────────────────────────────────────────────
 *   property_type  TEXT
 *   bhk_config     TEXT[]
 *   possession     TEXT
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const CITIES = [
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

const PROPERTY_TYPES = [
  {
    value: "flat",
    label: "Flat / Apartment",
    emoji: "🏢",
    hint: "Society or builder floor",
  },
  {
    value: "house",
    label: "Independent House",
    emoji: "🏡",
    hint: "Kothi, villa, bungalow",
  },
  {
    value: "plot",
    label: "Plot / Land",
    emoji: "🏗️",
    hint: "Residential or commercial",
  },
  {
    value: "commercial",
    label: "Commercial",
    emoji: "🏪",
    hint: "Shop, office, showroom",
  },
  {
    value: "villa",
    label: "Villa / Farmhouse",
    emoji: "🌿",
    hint: "Gated community or farm",
  },
];

// BHK only makes sense for flat, house, villa — not plot/commercial
const BHK_TYPES = ["flat", "house", "villa"];

const BHK_OPTIONS = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "4+ BHK"];

const POSSESSION_OPTIONS = [
  { value: "ready", label: "Ready to Move", emoji: "✅" },
  { value: "under_construction", label: "Under Construction", emoji: "🏗️" },
  { value: "any", label: "Doesn't Matter", emoji: "🤷" },
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

const BUDGET_BRACKETS = [
  { label: "Under ₹20L", value: "20L" },
  { label: "₹20–40L", value: "40L" },
  { label: "₹40–60L", value: "60L" },
  { label: "₹60L–1Cr", value: "1Cr" },
  { label: "₹1–1.5Cr", value: "1.5Cr" },
  { label: "₹1.5–2Cr", value: "2Cr" },
  { label: "Above ₹2Cr", value: "2Cr+" },
  { label: "Flexible", value: "flexible" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ErrorType = "network" | "rate_limit" | "server" | "unknown";

function getErrorType(error: unknown): ErrorType {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "network";
  if (typeof error === "object" && error !== null) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status === 429) return "rate_limit";
    if (status && status >= 500) return "server";
  }
  return "unknown";
}

function resetFormState() {
  return { name: "", phone: "", city: "", requirement: "" };
}

// ─── Property Type Picker ─────────────────────────────────────────────────────

function PropertyTypePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Property Type
        <span className="font-normal text-gray-400 ml-1">(optional)</span>
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PROPERTY_TYPES.map((p) => {
          const isSelected = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(isSelected ? "" : p.value)}
              className={`relative flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
              )}
              <span className="text-xl leading-none mb-1">{p.emoji}</span>
              <span
                className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary-700" : "text-gray-800"}`}
              >
                {p.label}
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                {p.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── BHK Picker ───────────────────────────────────────────────────────────────

function BhkPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(bhk: string) {
    onChange(
      selected.includes(bhk)
        ? selected.filter((b) => b !== bhk)
        : [...selected, bhk],
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        BHK Configuration
        <span className="font-normal text-gray-400 ml-1">
          (pick all that work)
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {BHK_OPTIONS.map((bhk) => {
          const isSelected = selected.includes(bhk);
          return (
            <button
              key={bhk}
              type="button"
              onClick={() => toggle(bhk)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                isSelected
                  ? "bg-primary-600 border-primary-600 text-white shadow-sm scale-105"
                  : "bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600"
              }`}
            >
              {bhk}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="mt-1.5 text-xs text-gray-400">
          {selected.join(", ")} selected ·{" "}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-primary-600 hover:underline"
          >
            clear
          </button>
        </p>
      )}
    </div>
  );
}

// ─── Possession Toggle ────────────────────────────────────────────────────────

function PossessionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Possession Status
        <span className="font-normal text-gray-400 ml-1">(optional)</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {POSSESSION_OPTIONS.map((p) => {
          const isSelected = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(isSelected ? "" : p.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl leading-none">{p.emoji}</span>
              <span
                className={`text-[10px] font-semibold leading-tight ${isSelected ? "text-primary-700" : "text-gray-600"}`}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Budget Range Picker ──────────────────────────────────────────────────────

function BudgetPicker({
  budgetMin,
  budgetMax,
  onChange,
}: {
  budgetMin: string;
  budgetMax: string;
  onChange: (min: string, max: string) => void;
}) {
  const minIdx = BUDGET_BRACKETS.findIndex((b) => b.value === budgetMin);
  const maxIdx = BUDGET_BRACKETS.findIndex((b) => b.value === budgetMax);
  const isFlexible = budgetMin === "flexible";

  function handleClick(idx: number) {
    const isThisFlexible = BUDGET_BRACKETS[idx].value === "flexible";
    if (isThisFlexible) {
      onChange(isFlexible ? "" : "flexible", "");
      return;
    }
    if (!budgetMin || isFlexible) {
      onChange(BUDGET_BRACKETS[idx].value, "");
      return;
    }
    if (budgetMin && !budgetMax) {
      if (idx === minIdx) {
        onChange("", "");
        return;
      }
      if (idx < minIdx) {
        onChange(BUDGET_BRACKETS[idx].value, "");
        return;
      }
      onChange(budgetMin, BUDGET_BRACKETS[idx].value);
      return;
    }
    onChange(BUDGET_BRACKETS[idx].value, "");
  }

  const summaryLabel = isFlexible
    ? "Flexible / open to options"
    : budgetMin && budgetMax
      ? `${BUDGET_BRACKETS[minIdx]?.label} – ${BUDGET_BRACKETS[maxIdx]?.label}`
      : budgetMin
        ? `From ${BUDGET_BRACKETS[minIdx]?.label}`
        : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-medium text-gray-600">
          Budget Range
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        {budgetMin && (
          <button
            type="button"
            onClick={() => onChange("", "")}
            className="text-xs text-primary-600 hover:underline"
          >
            clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {BUDGET_BRACKETS.map((b, idx) => {
          const isThisFlexible = b.value === "flexible";
          const isMin = !isThisFlexible && idx === minIdx;
          const isMax = !isThisFlexible && idx === maxIdx;
          const isInRange =
            !isThisFlexible &&
            minIdx !== -1 &&
            maxIdx !== -1 &&
            idx > minIdx &&
            idx < maxIdx;
          const isActive =
            isMin || isMax || isInRange || (isThisFlexible && isFlexible);
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => handleClick(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-primary-600 border-primary-600 text-white"
                  : isThisFlexible
                    ? "bg-white border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600"
                    : "bg-white border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-600"
              }`}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        {summaryLabel ? (
          <>
            Selected:{" "}
            <span className="text-primary-600 font-medium">{summaryLabel}</span>
            {budgetMin && !budgetMax && !isFlexible && (
              <span className="ml-1">— tap another to set max</span>
            )}
          </>
        ) : (
          "Tap a bracket to set min, then tap another to set max"
        )}
      </p>
    </div>
  );
}

// ─── Locality Chip Picker ─────────────────────────────────────────────────────

interface LocalityPickerProps {
  selected: Set<string>;
  otherLocality: string;
  showOther: boolean;
  onToggle: (locality: string) => void;
  onToggleOther: () => void;
  onOtherTextChange: (value: string) => void;
}

function LocalityPicker({
  selected,
  otherLocality,
  showOther,
  onToggle,
  onToggleOther,
  onOtherTextChange,
}: LocalityPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = LOCALITIES.filter((l) =>
    l.toLowerCase().includes(query.toLowerCase()),
  );
  const totalSelected = selected.size + (showOther ? 1 : 0);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  function highlightMatch(text: string) {
    if (!query) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="font-semibold">
          {text.slice(idx, idx + query.length)}
        </strong>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Preferred Localities
        <span className="font-normal text-gray-400 ml-1">
          (optional, pick multiple)
        </span>
      </label>
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search locality e.g. Omaxe, HUDA…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">
                No matches — try "Other" below
              </p>
            )}
            {filtered.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-gray-400">
                  Localities
                </p>
                {filtered.map((loc) => {
                  const isSelected = selected.has(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => onToggle(loc)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={
                          isSelected
                            ? "text-primary-700 font-medium"
                            : "text-gray-700"
                        }
                      >
                        {highlightMatch(loc)}
                      </span>
                      <span
                        className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${isSelected ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
                      >
                        {isSelected && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            viewBox="0 0 10 8"
                            fill="none"
                          >
                            <path
                              d="M1 4l3 3 5-6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
            <div className="border-t border-gray-100 mt-1" />
            <button
              type="button"
              onClick={() => {
                onToggleOther();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <span
                className={
                  showOther ? "text-primary-700 font-medium" : "text-gray-700"
                }
              >
                Other / not listed
              </span>
              <span
                className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${showOther ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}
              >
                {showOther && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    viewBox="0 0 10 8"
                    fill="none"
                  >
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Array.from(selected).map((loc) => (
            <span
              key={loc}
              onClick={() => onToggle(loc)}
              className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary-100 transition-colors"
            >
              {loc}
              <span className="text-primary-400 text-sm leading-none">×</span>
            </span>
          ))}
          {showOther && (
            <span
              onClick={onToggleOther}
              className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:bg-primary-100 transition-colors"
            >
              Other
              <span className="text-primary-400 text-sm leading-none">×</span>
            </span>
          )}
        </div>
      )}

      {showOther && (
        <input
          type="text"
          value={otherLocality}
          onChange={(e) => onOtherTextChange(e.target.value)}
          placeholder="Describe the area e.g. near railway station, old city…"
          className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      )}

      {totalSelected > 0 && (
        <p className="mt-1.5 text-xs text-gray-400">
          {totalSelected} {totalSelected === 1 ? "locality" : "localities"}{" "}
          selected ·{" "}
          <button
            type="button"
            onClick={() => {
              Array.from(selected).forEach(onToggle);
              if (showOther) onToggleOther();
            }}
            className="text-primary-600 hover:underline"
          >
            clear all
          </button>
        </p>
      )}
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({
  type,
  onDismiss,
}: {
  type: ErrorType;
  onDismiss: () => void;
}) {
  const content: Record<ErrorType, { title: string; message: string }> = {
    network: {
      title: "No internet connection",
      message: "Please check your connection and try again.",
    },
    rate_limit: {
      title: "Too many requests",
      message: "Please wait a few minutes before submitting again.",
    },
    server: {
      title: "Something went wrong on our end",
      message: "Our team has been notified. Please try again in a moment.",
    },
    unknown: {
      title: "Submission failed",
      message:
        "We couldn't send your request. Please try again or call us directly.",
    },
  };
  const { title, message } = content[type];
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
      <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">{title}</p>
        <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  name,
  propertyType,
  bhkConfig,
  possession,
  budgetMin,
  budgetMax,
  localities,
  onClose,
  onSubmitAnother,
}: {
  name: string;
  propertyType: string;
  bhkConfig: string[];
  possession: string;
  budgetMin: string;
  budgetMax: string;
  localities: string[];
  onClose: () => void;
  onSubmitAnother: () => void;
}) {
  const ptObj = PROPERTY_TYPES.find((p) => p.value === propertyType);
  const minIdx = BUDGET_BRACKETS.findIndex((b) => b.value === budgetMin);
  const maxIdx = BUDGET_BRACKETS.findIndex((b) => b.value === budgetMax);

  const budgetLabel =
    budgetMin === "flexible"
      ? "Flexible budget"
      : budgetMin && budgetMax
        ? `${BUDGET_BRACKETS[minIdx]?.label} – ${BUDGET_BRACKETS[maxIdx]?.label}`
        : budgetMin
          ? `From ${BUDGET_BRACKETS[minIdx]?.label}`
          : null;

  const possessionLabel = POSSESSION_OPTIONS.find(
    (p) => p.value === possession,
  );

  // Build summary lines — only non-empty ones
  const summaryLines: { emoji: string; text: string }[] = [];
  if (ptObj) {
    const typeStr =
      bhkConfig.length > 0
        ? `${bhkConfig.join(", ")} ${ptObj.label}`
        : ptObj.label;
    summaryLines.push({ emoji: ptObj.emoji, text: typeStr });
  }
  if (possessionLabel)
    summaryLines.push({
      emoji: possessionLabel.emoji,
      text: possessionLabel.label,
    });
  if (budgetLabel) summaryLines.push({ emoji: "💰", text: budgetLabel });
  if (localities.length > 0) {
    summaryLines.push({
      emoji: "📍",
      text:
        localities.slice(0, 2).join(", ") +
        (localities.length > 2 ? ` +${localities.length - 2} more` : ""),
    });
  }

  return (
    <div className="flex flex-col items-center text-center py-2 px-2">
      {/* Animated checkmark */}
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-ping opacity-30" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-1">
        We're on it, {name.split(" ")[0]}!
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">
        Your request is live. We'll call you within{" "}
        <span className="text-gray-700 font-medium">24 hours</span> with matched
        properties.
      </p>

      {/* Search summary receipt card — only shown if any preferences were set */}
      {summaryLines.length > 0 && (
        <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 mb-4 text-left">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2.5">
            Your search summary
          </p>
          <div className="space-y-1.5">
            {summaryLines.map((line, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-base w-5 text-center flex-shrink-0">
                  {line.emoji}
                </span>
                <span className="text-xs text-gray-700 font-medium">
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp hint */}
      <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-4 py-2.5 rounded-full mb-5">
        <span className="text-sm">💬</span>
        Check your WhatsApp for a confirmation
      </div>

      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={onSubmitAnother}
          className="w-full bg-primary-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Submit another request
        </button>
        <button
          onClick={onClose}
          className="w-full border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function FindPropertyForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(resetFormState());
  const [propertyType, setPropertyType] = useState("");
  const [bhkConfig, setBhkConfig] = useState<string[]>([]);
  const [possession, setPossession] = useState("");
  const [selectedLocalities, setSelected] = useState<Set<string>>(new Set());
  const [showOther, setShowOther] = useState(false);
  const [otherLocality, setOtherLocality] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorType, setErrorType] = useState<ErrorType>("unknown");

  // When property type changes to plot/commercial, clear BHK
  function handlePropertyTypeChange(v: string) {
    setPropertyType(v);
    if (!BHK_TYPES.includes(v)) setBhkConfig([]);
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const handleToggle = useCallback((loc: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(loc) ? next.delete(loc) : next.add(loc);
      return next;
    });
  }, []);

  const handleToggleOther = useCallback(() => {
    setShowOther((v) => !v);
    setOtherLocality("");
  }, []);

  function handleSubmitAnother() {
    setForm(resetFormState());
    setPropertyType("");
    setBhkConfig([]);
    setPossession("");
    setSelected(new Set());
    setShowOther(false);
    setOtherLocality("");
    setBudgetMin("");
    setBudgetMax("");
    setStatus("idle");
    setErrorType("unknown");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorType("unknown");
    try {
      await api.post("/api/leads/find-property", {
        ...form,
        propertyType: propertyType || undefined,
        bhkConfig: bhkConfig.length > 0 ? bhkConfig : undefined,
        possession: possession || undefined,
        localities: Array.from(selectedLocalities),
        otherLocality: showOther ? otherLocality : "",
        budgetMin: budgetMin || undefined,
        budgetMax: budgetMax || undefined,
      });
      setStatus("success");
    } catch (err) {
      setErrorType(getErrorType(err));
      setStatus("error");
    }
  }

  const showBhk = BHK_TYPES.includes(propertyType);

  if (status === "success") {
    return (
      <SuccessScreen
        name={form.name}
        propertyType={propertyType}
        bhkConfig={bhkConfig}
        possession={possession}
        budgetMin={budgetMin}
        budgetMax={budgetMax}
        localities={Array.from(selectedLocalities)}
        onClose={onClose}
        onSubmitAnother={handleSubmitAnother}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Your Name *
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ramesh Kumar"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Phone Number *
          </label>
          <input
            required
            type="tel"
            pattern="[6-9][0-9]{9}"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="9876543210"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Preferred City *
        </label>
        <select
          required
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select your city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Property type */}
      <PropertyTypePicker
        value={propertyType}
        onChange={handlePropertyTypeChange}
      />

      {/* BHK — only when flat / house / villa */}
      {showBhk && <BhkPicker selected={bhkConfig} onChange={setBhkConfig} />}

      {/* Possession — only when property type is set and NOT plot */}
      {propertyType && propertyType !== "plot" && (
        <PossessionPicker value={possession} onChange={setPossession} />
      )}

      {/* Locality */}
      <LocalityPicker
        selected={selectedLocalities}
        otherLocality={otherLocality}
        showOther={showOther}
        onToggle={handleToggle}
        onToggleOther={handleToggleOther}
        onOtherTextChange={setOtherLocality}
      />

      {/* Budget */}
      <BudgetPicker
        budgetMin={budgetMin}
        budgetMax={budgetMax}
        onChange={(min, max) => {
          setBudgetMin(min);
          setBudgetMax(max);
        }}
      />

      {/* Requirement */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Anything else to know? *
        </label>
        <textarea
          required
          value={form.requirement}
          onChange={(e) => set("requirement", e.target.value)}
          rows={3}
          placeholder="E.g. ground floor preferred, near a school, vastu-compliant, loan required…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <ErrorBanner type={errorType} onDismiss={() => setStatus("idle")} />
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-primary-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
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
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Submitting…
          </>
        ) : status === "error" ? (
          "Try again"
        ) : (
          "Find My Property"
        )}
      </button>
    </form>
  );
}
