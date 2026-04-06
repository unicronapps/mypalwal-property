"use client";

/*
 * POST /api/leads/paperwork
 * Body: { name, phone, city, service, message?, urgency? }
 * Response: { success: true, id: <uuid> }
 */

import { useState, useCallback } from "react";
import api from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const SERVICES = [
  {
    value: "registry",
    label: "Property Registry",
    emoji: "📝",
    hint: "Sale deed, registration",
  },
  {
    value: "mutation",
    label: "Mutation (Intkal)",
    emoji: "🔄",
    hint: "Transfer of ownership records",
  },
  {
    value: "noc",
    label: "NOC / Clearance",
    emoji: "✅",
    hint: "No objection certificate",
  },
  {
    value: "loan_noc",
    label: "Loan NOC",
    emoji: "🏦",
    hint: "Bank loan clearance letter",
  },
  {
    value: "other",
    label: "Other / Not Sure",
    emoji: "💬",
    hint: "Tell us what you need",
  },
];

const URGENCY_OPTIONS = [
  {
    value: "urgent",
    label: "Urgent",
    sublabel: "Within this week",
    emoji: "🔥",
    activeClass: "border-red-400 bg-red-50 text-red-700",
    dotClass: "bg-red-400",
  },
  {
    value: "this_month",
    label: "This Month",
    sublabel: "No rush, but soon",
    emoji: "📅",
    activeClass: "border-amber-400 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-400",
  },
  {
    value: "exploring",
    label: "Just Exploring",
    sublabel: "No deadline yet",
    emoji: "🔍",
    activeClass: "border-blue-400 bg-blue-50 text-blue-700",
    dotClass: "bg-blue-400",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

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

function getErrorContent(type: ErrorType) {
  switch (type) {
    case "network":
      return {
        title: "No internet connection",
        message: "Please check your connection and try again.",
      };
    case "rate_limit":
      return {
        title: "Too many requests",
        message: "Please wait a few minutes before submitting again.",
      };
    case "server":
      return {
        title: "Something went wrong on our end",
        message: "Our team has been notified. Please try again in a moment.",
      };
    default:
      return {
        title: "Submission failed",
        message:
          "We couldn't send your request. Please try again or call us directly.",
      };
  }
}

function resetForm() {
  return {
    name: "",
    phone: "",
    city: "",
    service: "",
    message: "",
    urgency: "",
  };
}

// ─── Service Card Grid ────────────────────────────────────────────────────────

function ServicePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Service Needed *
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SERVICES.map((s) => {
          const isSelected = value === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange(s.value)}
              className={`relative flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50"
              }`}
            >
              {/* Selected indicator dot */}
              {isSelected && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
              )}
              <span className="text-xl leading-none mb-1">{s.emoji}</span>
              <span
                className={`text-xs font-semibold leading-tight ${
                  isSelected ? "text-primary-700" : "text-gray-800"
                }`}
              >
                {s.label}
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                {s.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Urgency Picker ───────────────────────────────────────────────────────────

function UrgencyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        How soon do you need this?
        <span className="font-normal text-gray-400 ml-1">(optional)</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {URGENCY_OPTIONS.map((u) => {
          const isSelected = value === u.value;
          return (
            <button
              key={u.value}
              type="button"
              onClick={() => onChange(isSelected ? "" : u.value)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center transition-all ${
                isSelected
                  ? `${u.activeClass} border-2`
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl leading-none">{u.emoji}</span>
              <span
                className={`text-xs font-semibold leading-tight ${
                  isSelected ? "" : "text-gray-700"
                }`}
              >
                {u.label}
              </span>
              <span
                className={`text-[10px] leading-tight ${
                  isSelected ? "opacity-70" : "text-gray-400"
                }`}
              >
                {u.sublabel}
              </span>
            </button>
          );
        })}
      </div>
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
  const { title, message } = getErrorContent(type);
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
  service,
  urgency,
  onClose,
  onSubmitAnother,
}: {
  name: string;
  service: string;
  urgency: string;
  onClose: () => void;
  onSubmitAnother: () => void;
}) {
  const serviceObj = SERVICES.find((s) => s.value === service);
  const urgencyObj = URGENCY_OPTIONS.find((u) => u.value === urgency);

  // Personalise the callback promise based on urgency
  const callbackLine =
    urgency === "urgent"
      ? "Given your urgency, we'll try to reach you within a few hours. 🔥"
      : "Our team will call you within 24 hours with next steps.";

  return (
    <div className="flex flex-col items-center text-center py-2 px-2">
      {/* Stacked emoji celebration */}
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
        <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-ping opacity-30" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-1">
        Request received, {name.split(" ")[0]}!
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">
        {callbackLine}
      </p>

      {/* Summary pill — what they asked for */}
      {serviceObj && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2 mb-2 text-xs text-gray-600">
          <span>{serviceObj.emoji}</span>
          <span className="font-medium text-gray-800">{serviceObj.label}</span>
          {urgencyObj && (
            <>
              <span className="text-gray-300">·</span>
              <span>{urgencyObj.emoji}</span>
              <span>{urgencyObj.label}</span>
            </>
          )}
        </div>
      )}

      {/* WhatsApp hint */}
      <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-4 py-2.5 rounded-full mb-6 mt-2">
        <span className="text-sm">💬</span>
        We will contact you in witin 4 Working hours
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

export default function PaperWorkForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(resetForm());
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorType, setErrorType] = useState<ErrorType>("unknown");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmitAnother() {
    setForm(resetForm());
    setStatus("idle");
    setErrorType("unknown");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.service) return; // service card grid has no native required — guard here
    setStatus("loading");
    setErrorType("unknown");
    try {
      await api.post("/api/leads/paperwork", {
        name: form.name,
        phone: form.phone,
        city: form.city,
        service: form.service,
        message: form.message || undefined,
        urgency: form.urgency || undefined,
      });
      setStatus("success");
    } catch (err) {
      setErrorType(getErrorType(err));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <SuccessScreen
        name={form.name}
        service={form.service}
        urgency={form.urgency}
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
          City *
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

      {/* Service card grid */}
      <ServicePicker value={form.service} onChange={(v) => set("service", v)} />

      {/* Inline validation message for service — since it's not a native input */}
      {status !== "idle" && !form.service && (
        <p className="text-xs text-red-500 -mt-2">Please select a service.</p>
      )}

      {/* Urgency */}
      <UrgencyPicker value={form.urgency} onChange={(v) => set("urgency", v)} />

      {/* Additional details */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Additional Details
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        <textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={2}
          placeholder="Any specific details about your property or requirement…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Error banner */}
      {status === "error" && (
        <ErrorBanner type={errorType} onDismiss={() => setStatus("idle")} />
      )}

      {/* Submit button */}
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
          "Submit Request"
        )}
      </button>
    </form>
  );
}
