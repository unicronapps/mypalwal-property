"use client";

import React from "react";

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

interface PaperworkSectionProps {
  onOpenModal: () => void;
}

export default function PaperworkSection({ onOpenModal }: PaperworkSectionProps) {
  return (
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
            onClick={onOpenModal}
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
            onClick={onOpenModal}
            className="w-full mt-5 border border-amber-400 text-amber-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-amber-50 transition-colors"
          >
            Submit Request
          </button>
        </div>
      </div>
    </section>
  );
}
