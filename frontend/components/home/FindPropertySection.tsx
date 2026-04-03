import api from "@/lib/api";
import { useState } from "react";
import FindPropertyForm from "./FindPropertyForm";

const FindPropertySection = () => {
  return (
    <section className="bg-primary-700 py-14 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left copy */}
        <div className="text-white">
          <span className="inline-block bg-white/10 border border-white/20 text-xs font-semibold rounded-full px-3 py-1 mb-4">
            Your Dream Property, Search Made Simple
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-3">
            Can't find the
            <br />
            right property?
          </h2>
          <p className="text-primary-200 text-sm leading-relaxed mb-6">
            Tell us what you're looking for. Our team reviews every request
            personally and calls back with shortlisted options within 24 hours.
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
            Submit Requirement
          </p>
          <FindPropertyForm onClose={() => null} />
        </div>
      </div>
    </section>
  );
};

export default FindPropertySection;
