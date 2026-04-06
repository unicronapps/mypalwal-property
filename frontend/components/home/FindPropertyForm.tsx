"use client";

/*
 * BACKEND API REQUIRED:
 * POST /api/leads/find-property
 * Body (JSON):
 *   name          string    required
 *   phone         string    required  (10-digit Indian mobile)
 *   city          string    required
 *   requirement   string    required  free-text (what they're looking for)
 *   localities    string[]  optional  selected localities from the list
 *   otherLocality string    optional  free-text when user picks "Other"
 *   budgetMin     string    optional  e.g. "20L", "1Cr"
 *   budgetMax     string    optional  e.g. "50L", "2Cr"
 * Response: { success: true, id: <uuid> }
 * Auth: none (public endpoint)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/lib/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const CITIES = [
  "Palwal",
  "Faridabad",
  "Hathin",
  "Hodal",
  "Jewar",
  "Sohna",
  "Prithla",
  "Other",
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetFormState() {
  return { name: "", phone: "", city: "", requirement: "" };
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  name,
  onClose,
  onSubmitAnother,
}: {
  name: string;
  onClose: () => void;
  onSubmitAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-4 px-2">
      {/* Animated checkmark ring */}
      <div className="relative mb-5">
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
        {/* Subtle pulse ring */}
        <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-ping opacity-30" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-1">
        You're all set, {name.split(" ")[0]}!
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-1">
        Your property request has been received.
      </p>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        Our team will review your requirements and{" "}
        <span className="text-gray-700 font-medium">
          call you within 24 hours
        </span>{" "}
        with the best matching options.
      </p>

      {/* Info pill */}
      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-4 py-2.5 rounded-full mb-6">
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z" />
        </svg>
        Check your WhatsApp for a confirmation message
      </div>

      {/* Actions */}
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

// ─── Error Banner ─────────────────────────────────────────────────────────────

type ErrorType = "network" | "rate_limit" | "server" | "unknown";

function getErrorContent(type: ErrorType) {
  switch (type) {
    case "network":
      return {
        title: "No internet connection",
        message: "Please check your connection and try again.",
        icon: (
          <path d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M6.343 6.343A8 8 0 0117.657 17.657M3.106 3.106A15.965 15.965 0 001 12c0 6.075 4.5 11.11 10.379 11.925M12 12v.01" />
        ),
      };
    case "rate_limit":
      return {
        title: "Too many requests",
        message:
          "You've submitted several requests recently. Please wait a few minutes before trying again.",
        icon: (
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        ),
      };
    case "server":
      return {
        title: "Something went wrong on our end",
        message: "Our team has been notified. Please try again in a moment.",
        icon: <path d="M5 12H3a9 9 0 1018 0h-2M12 3v9" />,
      };
    default:
      return {
        title: "Submission failed",
        message:
          "We couldn't send your request. Please try again or call us directly.",
        icon: (
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        ),
      };
  }
}

function ErrorBanner({
  type,
  onDismiss,
}: {
  type: ErrorType;
  onDismiss: () => void;
}) {
  const { title, message, icon } = getErrorContent(type);

  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
      <div className="flex-shrink-0 mt-0.5">
        <svg
          className="w-4 h-4 text-red-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">{title}</p>
        <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors mt-0.5"
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

// ─── Budget Range Picker ──────────────────────────────────────────────────────

interface BudgetPickerProps {
  budgetMin: string;
  budgetMax: string;
  onChange: (min: string, max: string) => void;
}

function BudgetPicker({ budgetMin, budgetMax, onChange }: BudgetPickerProps) {
  const minIdx = BUDGET_BRACKETS.findIndex((b) => b.value === budgetMin);
  const maxIdx = BUDGET_BRACKETS.findIndex((b) => b.value === budgetMax);

  function handleClick(idx: number) {
    const isFlexible = BUDGET_BRACKETS[idx].value === "flexible";

    // Flexible is a standalone toggle — clears any range
    if (isFlexible) {
      if (budgetMin === "flexible") {
        onChange("", "");
      } else {
        onChange("flexible", "");
      }
      return;
    }

    if (!budgetMin || budgetMin === "flexible") {
      onChange(BUDGET_BRACKETS[idx].value, "");
      return;
    }
    if (budgetMin && !budgetMax) {
      if (idx === minIdx) {
        onChange("", "");
      } else if (idx < minIdx) {
        onChange(BUDGET_BRACKETS[idx].value, "");
      } else {
        onChange(budgetMin, BUDGET_BRACKETS[idx].value);
      }
      return;
    }
    onChange(BUDGET_BRACKETS[idx].value, "");
  }

  const hasSelection = !!budgetMin;
  const isFlexible = budgetMin === "flexible";

  const summaryLabel = isFlexible
    ? "Flexible / open to options"
    : budgetMin && budgetMax
      ? `${BUDGET_BRACKETS[minIdx]?.label} – ${BUDGET_BRACKETS[maxIdx]?.label}`
      : budgetMin
        ? `From ${BUDGET_BRACKETS[minIdx]?.label}`
        : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-600">
          Budget Range
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        {hasSelection && (
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
          const isActiveFlexible = isThisFlexible && isFlexible;
          const isActive = isMin || isMax || isInRange || isActiveFlexible;

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
              <span className="text-gray-400 ml-1">
                — tap another to set max
              </span>
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
                        className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-primary-600 border-primary-600"
                            : "border-gray-300"
                        }`}
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
                className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
                  showOther
                    ? "bg-primary-600 border-primary-600"
                    : "border-gray-300"
                }`}
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

// ─── Main Form ────────────────────────────────────────────────────────────────

function getErrorType(error: unknown): ErrorType {
  if (!navigator.onLine) return "network";
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate")) return "rate_limit";
    if (msg.includes("5") || msg.includes("server")) return "server";
  }
  // Check for fetch/axios response status if applicable
  if (typeof error === "object" && error !== null) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status === 429) return "rate_limit";
    if (status && status >= 500) return "server";
  }
  return "unknown";
}

export default function FindPropertyForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(resetFormState());
  const [selectedLocalities, setSelectedLocalities] = useState<Set<string>>(
    new Set(),
  );
  const [showOther, setShowOther] = useState(false);
  const [otherLocality, setOtherLocality] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorType, setErrorType] = useState<ErrorType>("unknown");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const handleToggle = useCallback((loc: string) => {
    setSelectedLocalities((prev) => {
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
    setSelectedLocalities(new Set());
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
        localities: Array.from(selectedLocalities),
        otherLocality: showOther ? otherLocality : "",
        budgetMin,
        budgetMax,
      });
      setStatus("success");
    } catch (err) {
      setErrorType(getErrorType(err));
      setStatus("error");
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <SuccessScreen
        name={form.name}
        onClose={onClose}
        onSubmitAnother={handleSubmitAnother}
      />
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
          <option value="">Select city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <LocalityPicker
        selected={selectedLocalities}
        otherLocality={otherLocality}
        showOther={showOther}
        onToggle={handleToggle}
        onToggleOther={handleToggleOther}
        onOtherTextChange={setOtherLocality}
      />

      <BudgetPicker
        budgetMin={budgetMin}
        budgetMax={budgetMax}
        onChange={(min, max) => {
          setBudgetMin(min);
          setBudgetMax(max);
        }}
      />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          What are you looking for? *
        </label>
        <textarea
          required
          value={form.requirement}
          onChange={(e) => set("requirement", e.target.value)}
          rows={3}
          placeholder="E.g. 2BHK flat in Sector 15, budget ₹50 lakh, ground floor preferred…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Error banner — shown inline, dismissable */}
      {status === "error" && (
        <ErrorBanner type={errorType} onDismiss={() => setStatus("idle")} />
      )}

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
