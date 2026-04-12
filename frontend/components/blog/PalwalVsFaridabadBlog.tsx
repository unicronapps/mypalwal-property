'use client';

import { useState, useEffect, useRef } from "react";

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.12) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    o.observe(ref.current);
    return () => o.disconnect();
  }, [ref, threshold]);
  return v;
}

function Anim({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(36px)", transition: `all 0.7s cubic-bezier(.22,1,.36,1) ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

const COMPARISON = [
  { param: "Avg. Price (₹/sq ft)", palwal: "₹3,500–5,950", faridabad: "₹6,600–10,500", winner: "palwal" },
  { param: "3 BHK Flat Budget", palwal: "₹18L–95L", faridabad: "₹55L–2.5Cr", winner: "palwal" },
  { param: "Plots Available", palwal: "300+", faridabad: "500+", winner: "faridabad" },
  { param: "YoY Appreciation", palwal: "15–25%", faridabad: "13–36%", winner: "tie" },
  { param: "Jewar Airport Dist.", palwal: "~40 km", faridabad: "~38 km", winner: "tie" },
  { param: "IGI Delhi Airport", palwal: "~85 km", faridabad: "~35 km", winner: "faridabad" },
  { param: "Metro Connectivity", palwal: "Planned (2031+)", faridabad: "Violet Line (Active)", winner: "faridabad" },
  { param: "Highway Access", palwal: "NH-19, EPE, KMP", faridabad: "NH-44, EPE, KMP", winner: "tie" },
  { param: "Growth Potential", palwal: "Very High (Early)", faridabad: "Moderate (Mature)", winner: "palwal" },
  { param: "Rental Yield", palwal: "2–3%", faridabad: "3–4.1%", winner: "faridabad" },
];

const PROS_CONS: Record<string, { pros: string[]; cons: string[] }> = {
  palwal: {
    pros: [
      "40-50% cheaper than Faridabad — same NCR address",
      "Closest to Jewar Airport via Greenfield Expressway",
      "Palwal–Khurja rail line will directly connect to airport",
      "Early mover advantage — prices still haven't peaked",
      "Large plot sizes at accessible budgets",
      "NH-19 (Delhi–Agra Highway) backbone connectivity",
    ],
    cons: [
      "Metro still years away (2031+)",
      "Limited social infrastructure compared to Faridabad",
      "Fewer ready-to-move housing options",
      "Market less liquid — resale takes longer",
    ],
  },
  faridabad: {
    pros: [
      "Active Delhi Metro Violet Line — daily NCR commute",
      "Established hospitals, schools, malls, IT parks",
      "Strong rental demand — 3–4% yields",
      "Closer to Delhi for work and lifestyle",
      "Mature market with transparent pricing",
      "Better resale liquidity — larger buyer pool",
    ],
    cons: [
      "Prices already high — ₹6,600–10,500/sq ft average",
      "Appreciation slowing in central sectors",
      "Congestion in old Faridabad areas",
      "Less room for exponential growth vs newer corridors",
    ],
  },
};

const VERDICT_CARDS = [
  { emoji: "💰", title: "Best for Budget Buyers", answer: "Palwal", reason: "Get 2x the land or built-up area for the same budget. A plot that costs ₹60L in Palwal Sector 10 would cost ₹1.5Cr+ in prime Faridabad." },
  { emoji: "🚇", title: "Best for Daily Commuters", answer: "Faridabad", reason: "The Violet Line metro is operational now. Palwal's metro is still on paper. If you work in Delhi, Faridabad saves you 2+ hours daily." },
  { emoji: "📈", title: "Best for Long-term ROI", answer: "Palwal", reason: "With Jewar Airport, Greenfield Expressway, and rail connectivity — all converging by 2026-28, Palwal's early-stage pricing has the highest upside." },
  { emoji: "👨‍👩‍👧‍👦", title: "Best for Families (Now)", answer: "Faridabad", reason: "Schools, hospitals, malls, and parks are already established. Palwal is building up but still catching up on social infrastructure." },
  { emoji: "🏗️", title: "Best for Investors", answer: "Palwal", reason: "Infrastructure is being built. Land banking near the Greenfield Expressway corridor or railway line could see 2-3x returns by 2030." },
  { emoji: "✈️", title: "Best for Airport Access", answer: "Tie", reason: "Both are ~38-40 km from Jewar. Faridabad is closer to IGI Delhi. Net-net, almost identical for airport proximity." },
];

const IMAGES = [
  { id: "hero", placeholder: "Hero Banner — Aerial shot of NCR development or Jewar Airport", aspect: "21/9" },
  { id: "palwal", placeholder: "Palwal — City skyline / township / highway shot", aspect: "16/10" },
  { id: "faridabad", placeholder: "Faridabad — Metro / cityscape / developed area", aspect: "16/10" },
  { id: "expressway", placeholder: "Greenfield Expressway or Yamuna Expressway", aspect: "16/9" },
  { id: "verdict", placeholder: "Property investment / family / future city", aspect: "16/9" },
];

function ImagePlaceholder({ id, placeholder, aspect, style = {} }: { id: string; placeholder: string; aspect: string; style?: React.CSSProperties }) {
  return (
    <div style={{ aspectRatio: aspect, background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", border: "2px dashed #A5B4FC", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23818CF8' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
      <div style={{ marginTop: 12, fontSize: 13, color: "#6366F1", fontFamily: "Outfit", fontWeight: 500, textAlign: "center", padding: "0 24px", maxWidth: 320 }}>{placeholder}</div>
      <div style={{ marginTop: 6, fontSize: 11, color: "#A5B4FC", fontFamily: "Outfit" }}>📎 Attach image for: <strong>{id}</strong></div>
    </div>
  );
}

function ComparisonTable({ data, highlight, setHighlight }: { data: typeof COMPARISON; highlight: string | null; setHighlight: (v: string | null) => void }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #E5E7EB" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Outfit", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#F8FAFC" }}>
            <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 600, color: "#64748B", borderBottom: "2px solid #E5E7EB", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>Parameter</th>
            <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 700, color: "#1746A2", borderBottom: "2px solid #E5E7EB", cursor: "pointer", background: highlight === "palwal" ? "#EEF2FF" : "transparent", transition: "background 0.3s" }} onClick={() => setHighlight(highlight === "palwal" ? null : "palwal")}>🏡 Palwal</th>
            <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 700, color: "#FF6B35", borderBottom: "2px solid #E5E7EB", cursor: "pointer", background: highlight === "faridabad" ? "#FFF7ED" : "transparent", transition: "background 0.3s" }} onClick={() => setHighlight(highlight === "faridabad" ? null : "faridabad")}>🏙️ Faridabad</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFBFC" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F0F4FF")}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFC")}>
              <td style={{ padding: "13px 18px", borderBottom: "1px solid #F1F5F9", fontWeight: 500, color: "#334155" }}>{row.param}</td>
              <td style={{ padding: "13px 18px", borderBottom: "1px solid #F1F5F9", textAlign: "center", fontWeight: row.winner === "palwal" ? 700 : 400, color: row.winner === "palwal" ? "#1746A2" : "#64748B", background: row.winner === "palwal" ? "#EEF2FF" : "transparent" }}>
                {row.palwal} {row.winner === "palwal" && <span style={{ marginLeft: 4 }}>✅</span>}
              </td>
              <td style={{ padding: "13px 18px", borderBottom: "1px solid #F1F5F9", textAlign: "center", fontWeight: row.winner === "faridabad" ? 700 : 400, color: row.winner === "faridabad" ? "#FF6B35" : "#64748B", background: row.winner === "faridabad" ? "#FFF7ED" : "transparent" }}>
                {row.faridabad} {row.winner === "faridabad" && <span style={{ marginLeft: 4 }}>✅</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProsConsToggle({ data }: { data: typeof PROS_CONS }) {
  const [active, setActive] = useState<"palwal" | "faridabad">("palwal");
  const d = data[active];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {([["palwal", "🏡 Palwal", "#1746A2"], ["faridabad", "🏙️ Faridabad", "#FF6B35"]] as const).map(([key, label, clr]) => (
          <button key={key} onClick={() => setActive(key)} style={{ flex: 1, padding: "14px 0", border: active === key ? `2px solid ${clr}` : "2px solid #E5E7EB", borderRadius: 12, background: active === key ? (key === "palwal" ? "#EEF2FF" : "#FFF7ED") : "#fff", color: active === key ? clr : "#94A3B8", fontFamily: "Outfit", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.3s" }}>{label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontFamily: "Outfit" }}>✅ Pros</div>
          {d.pros.map((p, i) => (
            <Anim key={`${active}-p-${i}`} delay={i * 0.04}>
              <div style={{ padding: "10px 14px", background: "#F0FDF4", borderRadius: 10, marginBottom: 8, fontSize: 14, color: "#166534", fontFamily: "Outfit", borderLeft: "3px solid #22C55E" }}>{p}</div>
            </Anim>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontFamily: "Outfit" }}>⚠️ Cons</div>
          {d.cons.map((c, i) => (
            <Anim key={`${active}-c-${i}`} delay={i * 0.04}>
              <div style={{ padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, marginBottom: 8, fontSize: 14, color: "#991B1B", fontFamily: "Outfit", borderLeft: "3px solid #EF4444" }}>{c}</div>
            </Anim>
          ))}
        </div>
      </div>
    </div>
  );
}

function PriceBar({ label, min, max, ceiling, color }: { label: string; min: number; max: number; ceiling: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref);
  return (
    <div ref={ref} style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "Outfit", fontSize: 14 }}>
        <span style={{ color: "#334155", fontWeight: 600 }}>{label}</span>
        <span style={{ color: "#94A3B8" }}>₹{min.toLocaleString()}–{max.toLocaleString()}/sq ft</span>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: "#F1F5F9", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: `${(min / ceiling) * 100}%`, width: vis ? `${((max - min) / ceiling) * 100}%` : "0%", height: "100%", borderRadius: 7, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: "width 1.2s cubic-bezier(.22,1,.36,1)" }} />
      </div>
    </div>
  );
}

export default function PalwalVsFaridabadBlog() {
  const [highlight, setHighlight] = useState<string | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<{ key: string; label: string; answer: string } | null>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ background: "#FFFFFF", color: "#1E293B", minHeight: "100vh", fontFamily: "Outfit, sans-serif" }}>

      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #0F2E6B 0%, #1746A2 40%, #3B6DD8 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, background: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "6px 20px", borderRadius: 30, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", fontSize: 13, fontWeight: 600, color: "#FFD166", letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>Property Guide 2026</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#fff", lineHeight: 1.15, margin: "0 0 16px" }}>
            Palwal vs Faridabad
          </h1>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 22px)", color: "rgba(255,255,255,0.7)", fontWeight: 300, margin: 0 }}>
            Where Should You Buy Property in 2026?
          </p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
            {[["₹3.5K–6K", "Palwal /sq ft"], ["₹6.6K–10.5K", "Faridabad /sq ft"], ["~40 km", "Both to Jewar"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#FFD166", fontFamily: "Outfit" }}>{v}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div style={{ maxWidth: 900, margin: "-30px auto 0", padding: "0 24px", position: "relative", zIndex: 2 }}>
        <Anim><ImagePlaceholder {...IMAGES[0]} /></Anim>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* INTRO */}
        <Anim>
          <div style={{ marginBottom: 56 }}>
            <div style={{ width: 48, height: 4, borderRadius: 2, background: "#FF6B35", marginBottom: 20 }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, margin: "0 0 16px", color: "#0F172A" }}>The NCR Property Dilemma</h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#64748B" }}>
              With Jewar Airport now inaugurated and multiple expressways under construction, two Haryana cities are in the spotlight — <strong style={{ color: "#1746A2" }}>Palwal</strong> and <strong style={{ color: "#FF6B35" }}>Faridabad</strong>. One is an established urban centre with metro connectivity and mature markets. The other is an emerging growth corridor with prices still on the ground floor. Which one makes more sense for your money in 2026? Let&apos;s break it down.
            </p>
          </div>
        </Anim>

        {/* CITY PROFILES */}
        <Anim>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 56 }}>
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB" }}>
              <ImagePlaceholder {...IMAGES[1]} style={{ borderRadius: 0, border: "none", borderBottom: "1px solid #E5E7EB" }} />
              <div style={{ padding: 24 }}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: "0 0 8px", color: "#1746A2" }}>🏡 Palwal</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: 0 }}>A fast-emerging district on NH-19 (Delhi–Agra Highway). It&apos;s the closest Haryana city to Jewar Airport, connected via the upcoming Greenfield Expressway and a dedicated rail line. Property prices range from ₹3,500–5,950 per sq ft — nearly half of Faridabad&apos;s average.</p>
              </div>
            </div>
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #E5E7EB" }}>
              <ImagePlaceholder {...IMAGES[2]} style={{ borderRadius: 0, border: "none", borderBottom: "1px solid #E5E7EB" }} />
              <div style={{ padding: 24 }}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: "0 0 8px", color: "#FF6B35" }}>🏙️ Faridabad</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: 0 }}>NCR&apos;s established industrial-turned-residential powerhouse. Active Delhi Metro Violet Line, top hospitals, schools, and malls. Average prices sit around ₹6,600/sq ft, with prime sectors crossing ₹10,000+. Mature market with strong rental demand.</p>
              </div>
            </div>
          </div>
        </Anim>

        {/* PRICE BARS */}
        <Anim>
          <div style={{ marginBottom: 56 }}>
            <div style={{ width: 48, height: 4, borderRadius: 2, background: "#1746A2", marginBottom: 20 }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, margin: "0 0 8px", color: "#0F172A" }}>Price Range Comparison</h2>
            <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>Residential property rates across key micro-markets</p>
            <div style={{ background: "#F8FAFC", borderRadius: 16, padding: 28, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1746A2", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Palwal Markets</div>
              <PriceBar label="Palwal City" min={3500} max={5950} ceiling={22000} color="#1746A2" />
              <PriceBar label="Omaxe City Palwal" min={4500} max={5800} ceiling={22000} color="#3B6DD8" />
              <PriceBar label="Sector 10 Palwal" min={5000} max={5777} ceiling={22000} color="#5B8DEF" />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FF6B35", letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 16 }}>Faridabad Markets</div>
              <PriceBar label="Faridabad Central" min={7000} max={10500} ceiling={22000} color="#FF6B35" />
              <PriceBar label="Sector 21A-B" min={18200} max={21100} ceiling={22000} color="#E85D26" />
              <PriceBar label="Nehar Par / Sec 87" min={6000} max={7200} ceiling={22000} color="#FF8F5E" />
              <PriceBar label="Sector 78-80" min={6450} max={8000} ceiling={22000} color="#FFB088" />
            </div>
          </div>
        </Anim>

        {/* COMPARISON TABLE */}
        <Anim>
          <div style={{ marginBottom: 56 }}>
            <div style={{ width: 48, height: 4, borderRadius: 2, background: "#F59E0B", marginBottom: 20 }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, margin: "0 0 8px", color: "#0F172A" }}>Head-to-Head Comparison</h2>
            <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>Click a city header to highlight its wins</p>
            <ComparisonTable data={COMPARISON} highlight={highlight} setHighlight={setHighlight} />
          </div>
        </Anim>

        {/* Expressway Image */}
        <Anim>
          <div style={{ marginBottom: 56 }}>
            <ImagePlaceholder {...IMAGES[3]} />
            <p style={{ textAlign: "center", fontSize: 13, color: "#94A3B8", marginTop: 10, fontStyle: "italic" }}>The Jewar Greenfield Expressway — connecting Faridabad &amp; Palwal to Noida International Airport</p>
          </div>
        </Anim>

        {/* PROS & CONS */}
        <Anim>
          <div style={{ marginBottom: 56 }}>
            <div style={{ width: 48, height: 4, borderRadius: 2, background: "#22C55E", marginBottom: 20 }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, margin: "0 0 24px", color: "#0F172A" }}>Pros &amp; Cons Breakdown</h2>
            <ProsConsToggle data={PROS_CONS} />
          </div>
        </Anim>

        {/* QUIZ */}
        <Anim>
          <div style={{ marginBottom: 56, background: "linear-gradient(135deg, #EEF2FF, #FFF7ED)", borderRadius: 20, padding: 32, border: "1px solid #E0E7FF" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, margin: "0 0 8px", color: "#0F172A" }}>🤔 Quick Quiz: Which City Fits You?</h3>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>What&apos;s your primary goal with this property purchase?</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { key: "invest", label: "🏦 Long-term Investment", answer: "Palwal — lower entry, higher growth runway with airport & expressway catalysts." },
                { key: "live", label: "🏠 Move in & Live Now", answer: "Faridabad — ready infrastructure, metro, schools, hospitals all operational today." },
                { key: "rent", label: "💵 Rental Income", answer: "Faridabad — stronger rental market (3-4% yields) thanks to established working population." },
                { key: "land", label: "📐 Buy a Plot & Build", answer: "Palwal — 300+ plots from ₹50L. Big land parcels available in gated communities like Omaxe City." },
              ].map(opt => (
                <button key={opt.key} onClick={() => setQuizAnswer(opt)} style={{ padding: "16px 14px", borderRadius: 12, border: quizAnswer?.key === opt.key ? "2px solid #1746A2" : "2px solid #E5E7EB", background: quizAnswer?.key === opt.key ? "#fff" : "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "Outfit", fontSize: 14, fontWeight: 600, color: quizAnswer?.key === opt.key ? "#1746A2" : "#475569", transition: "all 0.3s", textAlign: "left" }}>{opt.label}</button>
              ))}
            </div>
            {quizAnswer && (
              <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14, border: "1px solid #E0E7FF", animation: "fadeIn 0.4s ease" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1746A2", marginBottom: 6 }}>Our Recommendation:</div>
                <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.7 }}>{quizAnswer.answer}</div>
              </div>
            )}
          </div>
        </Anim>

        {/* VERDICT CARDS */}
        <Anim>
          <div style={{ marginBottom: 56 }}>
            <div style={{ width: 48, height: 4, borderRadius: 2, background: "#FF6B35", marginBottom: 20 }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, margin: "0 0 24px", color: "#0F172A" }}>The Verdict — Use Case by Use Case</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {VERDICT_CARDS.map((v, i) => (
                <Anim key={i} delay={i * 0.05}>
                  <div style={{ padding: 24, borderRadius: 16, border: "1px solid #E5E7EB", background: "#FAFBFC", transition: "box-shadow 0.3s, transform 0.3s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(23,70,162,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{v.emoji}</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#0F172A", marginBottom: 4 }}>{v.title}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: v.answer === "Palwal" ? "#1746A2" : v.answer === "Faridabad" ? "#FF6B35" : "#F59E0B", marginBottom: 8, fontFamily: "Outfit" }}>→ {v.answer}</div>
                    <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>{v.reason}</div>
                  </div>
                </Anim>
              ))}
            </div>
          </div>
        </Anim>

        {/* Verdict Image */}
        <Anim><ImagePlaceholder {...IMAGES[4]} style={{ marginBottom: 56 }} /></Anim>

        {/* FINAL TAKE */}
        <Anim>
          <div style={{ background: "linear-gradient(160deg, #0F2E6B, #1746A2)", borderRadius: 20, padding: "40px 32px", color: "#fff", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, margin: "0 0 16px" }}>Our Final Take</h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.8)", margin: "0 0 20px" }}>
              <strong style={{ color: "#FFD166" }}>Faridabad</strong> is the safer, ready-now choice — ideal for families who need metro access, schools, and an established urban life today. But the premium is real, and the growth curve is flattening in core sectors.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.8)", margin: 0 }}>
              <strong style={{ color: "#FFD166" }}>Palwal</strong> is the high-conviction, high-upside bet — especially if you&apos;re buying plots or investing for 3–5 years. With Jewar Airport operational, the Greenfield Expressway nearing completion, and a rail link in the works, the infrastructure story is no longer speculative. It&apos;s being built, right now. The question isn&apos;t <em>if</em> — it&apos;s how early you get in.
            </p>
          </div>
        </Anim>

        {/* DISCLAIMER */}
        <Anim>
          <div style={{ textAlign: "center", padding: "32px 0 0", borderTop: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
              ⚠️ This blog is for informational purposes only and does not constitute financial or investment advice. Property prices are approximate and sourced from 99acres, SquareYards, and public data as of April 2026. Always do independent due diligence before making purchase decisions.
            </p>
            <div style={{ marginTop: 16, fontSize: 11, color: "#CBD5E1" }}>Sources: 99acres.com · SquareYards · NHAI · Wikipedia · BusinessToday · April 2026</div>
          </div>
        </Anim>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        table { font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}
