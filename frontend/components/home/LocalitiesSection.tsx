import Link from "next/link";

/* ─── Grouped locality data with property counts ───────────────────────── */
const LOCALITY_GROUPS = [
  {
    label: "Sectors & Planned Areas",
    color: "blue" as const,
    localities: [
      { name: "HUDA Sector 2", count: 48 },
      { name: "SRS Prime Floor (Sector 6)", count: 23 },
      { name: "RPS Urbania (Sector 10)", count: 31 },
      { name: "Omaxe City", count: 57 },
    ],
  },
  {
    label: "Colonies",
    color: "violet" as const,
    localities: [
      { name: "New Colony", count: 62 },
      { name: "New Colony Extension", count: 19 },
      { name: "Adarsh Colony", count: 34 },
      { name: "Krishna Colony", count: 27 },
      { name: "Kalra Colony", count: 15 },
      { name: "Shiv Colony", count: 22 },
      { name: "Kailash Nagar", count: 41 },
      { name: "Camp Colony", count: 18 },
      { name: "Housing Board Colony", count: 29 },
      { name: "Jawahar Nagar", count: 37 },
      { name: "Prakash Vihar Colony", count: 11 },
      { name: "Panchwati Colony", count: 16 },
      { name: "Deepak Colony", count: 13 },
      { name: "Shyam Nagar Colony", count: 8 },
    ],
  },
  {
    label: "Markets & Commercial Hubs",
    color: "amber" as const,
    localities: [
      { name: "Main Market (Agra Chowk)", count: 44 },
      { name: "Gol Market", count: 38 },
      { name: "Railway Road", count: 26 },
      { name: "Bus Stand Area", count: 19 },
      { name: "Subzi Mandi Area", count: 12 },
      { name: "Mathura Road Area", count: 33 },
      { name: "Minar Gate", count: 21 },
    ],
  },
  {
    label: "Villages & Outskirts",
    color: "emerald" as const,
    localities: [
      { name: "Ramnagar", count: 17 },
      { name: "Shiva Puri", count: 9 },
      { name: "Baghola", count: 14 },
      { name: "Patli Khurd", count: 7 },
      { name: "Alapur", count: 11 },
    ],
  },
];

/* ─── Color maps ──────────────────────────────────────────────────────── */
const COLOR = {
  blue: {
    header: "text-blue-700",
    headerBg: "bg-blue-50 border-blue-100",
    dot: "bg-blue-400",
    pill: "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
    count:
      "bg-blue-50 text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-700",
    icon: "text-gray-300 group-hover:text-blue-400",
  },
  violet: {
    header: "text-violet-700",
    headerBg: "bg-violet-50 border-violet-100",
    dot: "bg-violet-400",
    pill: "bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700",
    count:
      "bg-violet-50 text-violet-500 group-hover:bg-violet-100 group-hover:text-violet-700",
    icon: "text-gray-300 group-hover:text-violet-400",
  },
  amber: {
    header: "text-amber-700",
    headerBg: "bg-amber-50 border-amber-100",
    dot: "bg-amber-400",
    pill: "bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700",
    count:
      "bg-amber-50 text-amber-500 group-hover:bg-amber-100 group-hover:text-amber-700",
    icon: "text-gray-300 group-hover:text-amber-400",
  },
  emerald: {
    header: "text-emerald-700",
    headerBg: "bg-emerald-50 border-emerald-100",
    dot: "bg-emerald-400",
    pill: "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
    count:
      "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100 group-hover:text-emerald-700",
    icon: "text-gray-300 group-hover:text-emerald-400",
  },
} as const;

/* ─── Component ──────────────────────────────────────────────────────── */
export default function LocalitiesSection() {
  const totalListings = LOCALITY_GROUPS.flatMap((g) => g.localities).reduce(
    (s, l) => s + l.count,
    0,
  );

  return (
    <section className="bg-white border-t border-gray-100 py-12 px-6">
      <div className="max-w-[1120px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="hp-font-display text-[1.45rem] font-bold text-gray-900 leading-tight">
              Search by Locality
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">
              {totalListings.toLocaleString()} properties across{" "}
              {LOCALITY_GROUPS.flatMap((g) => g.localities).length} localities
              in Palwal
            </p>
          </div>

          {/* View map CTA */}
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            View all areas
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
        </div>

        {/* Groups */}
        <div className="space-y-6">
          {LOCALITY_GROUPS.map((group) => {
            const c = COLOR[group.color];
            return (
              <div key={group.label}>
                {/* Group label */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3 ${c.headerBg}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`}
                  />
                  <span
                    className={`text-[11px] font-semibold tracking-wide uppercase ${c.header}`}
                  >
                    {group.label}
                  </span>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap gap-2">
                  {group.localities.map((loc) => (
                    <Link
                      key={loc.name}
                      href={`/search?q=${encodeURIComponent(loc.name)}`}
                      className={`group inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 border rounded-full text-[12.5px] font-medium transition-all duration-150 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px ${c.pill}`}
                    >
                      {/* Pin icon */}
                      <svg
                        className={`w-3 h-3 flex-shrink-0 transition-colors ${c.icon}`}
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

                      {loc.name}

                      {/* Count badge */}
                      <span
                        className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${c.count}`}
                      >
                        {loc.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom strip — total summary */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[12.5px] text-gray-400">
            Can't find your locality?{" "}
            <Link
              href="/search"
              className="text-primary-600 font-semibold hover:underline"
            >
              Search all properties →
            </Link>
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
            <svg
              className="w-3.5 h-3.5 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Updated every few minutes
          </div>
        </div>
      </div>
    </section>
  );
}
