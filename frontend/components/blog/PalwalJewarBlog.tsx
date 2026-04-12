'use client';

import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { id: "hero", title: "Palwal × Jewar", subtitle: "A New Era of Connectivity" },
  {
    id: "overview", title: "The Big Picture", icon: "🛫",
    content: "The Noida International Airport at Jewar, inaugurated on March 28, 2026, is reshaping the connectivity landscape for the entire NCR — and Palwal sits at a sweet spot. Located just ~40 km away, Palwal is set to become a major beneficiary of multiple road, rail, and metro links converging at the airport.",
  },
  {
    id: "routes", title: "Connectivity Routes", icon: "🛣️",
    routes: [
      { name: "Jewar Greenfield Expressway", status: "Under Construction", statusColor: "#f59e0b", distance: "31.4 km corridor", detail: "A six-lane access-controlled expressway from Faridabad through Palwal to Jewar Airport. About 24 km passes through Faridabad and Palwal in Haryana. Over 52% complete — expected to finish by end of 2026.", eta: "Late 2026" },
      { name: "Palwal–Jewar–Khurja Railway", status: "Under Construction", statusColor: "#f59e0b", distance: "61 km rail line", detail: "A new railway line connecting Palwal to the airport and onward to Khurja — linking the Delhi–Mumbai and Amritsar–Kolkata main rail corridors directly through the airport.", eta: "TBD" },
      { name: "Yamuna Expressway", status: "Operational", statusColor: "#10b981", distance: "700m from airport", detail: "The airport is just 700 metres from the Yamuna Expressway, which already provides signal-free access from Noida, Greater Noida, Agra, and beyond. Palwal residents can connect via Eastern Peripheral Expressway.", eta: "Now" },
      { name: "Ballabhgarh–Palwal–Jewar Metro", status: "Planning Stage", statusColor: "#8b5cf6", distance: "~45 km proposed", detail: "A proposed metro extension from the Delhi Metro Violet Line's Ballabhgarh station through Palwal to Jewar Airport. DPR is yet to be prepared.", eta: "2031+" },
      { name: "Eastern Peripheral Expressway", status: "Operational", statusColor: "#10b981", distance: "100m wide corridor", detail: "The 100-metre wide EPE runs through the Yamuna Expressway near the F1 track, connecting Palwal, Manesar, Ghaziabad, Baghpat, and Meerut to the airport zone.", eta: "Now" },
    ],
  },
  {
    id: "timeline", title: "Timeline", icon: "📅",
    events: [
      { year: "2021", label: "Foundation stone laid by PM Modi", done: true },
      { year: "2024", label: "Greenfield Expressway 52%+ complete", done: true },
      { year: "Mar 2026", label: "Airport inaugurated", done: true },
      { year: "Mid 2026", label: "Commercial flights begin", done: false },
      { year: "Late 2026", label: "Greenfield Expressway completion", done: false },
      { year: "2028", label: "Palwal–Khurja rail line target", done: false },
      { year: "2031+", label: "Metro & RRTS corridors", done: false },
    ],
  },
  {
    id: "impact", title: "What It Means for Palwal", icon: "🏙️",
    impacts: [
      { emoji: "⏱️", title: "Travel Time", desc: "Under 30 minutes to a world-class international airport" },
      { emoji: "🏠", title: "Real Estate Boom", desc: "Residential, commercial, and industrial demand surging around the corridor" },
      { emoji: "💼", title: "Employment", desc: "Logistics parks, IT hubs, hotels, and airport-city development creating thousands of jobs" },
      { emoji: "🚆", title: "Multi-Modal Hub", desc: "Road + Rail + Metro convergence making Palwal an NCR gateway" },
      { emoji: "📈", title: "Investment Magnet", desc: "Industrial zones and SEZs attracting national and international players" },
      { emoji: "✈️", title: "Airport Access", desc: "Closest airport link for Palwal, Hodal, Mathura belt — no need to trek to IGI Delhi" },
    ],
  },
  { id: "map", title: "Distance Snapshot", icon: "📍" },
];

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)", transition: `all 0.7s cubic-bezier(.22,1,.36,1) ${delay}s` }}>
      {children}
    </div>
  );
}

function RouteCard({ route, index, expanded, onToggle }: { route: any; index: number; expanded: boolean; onToggle: () => void }) {
  return (
    <AnimatedSection delay={index * 0.08}>
      <div onClick={onToggle} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${expanded ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "20px 24px", cursor: "pointer", marginBottom: 12, transition: "all 0.3s ease", ...(expanded ? { background: "rgba(255,255,255,0.07)" } : {}) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <span style={{ fontSize: 22 }}>→</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>{route.name}</div>
              <span style={{ fontSize: 13, color: "#999", fontFamily: "'DM Sans', sans-serif" }}>{route.distance}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: route.statusColor + "22", color: route.statusColor, fontWeight: 600 }}>{route.status}</span>
            <span style={{ color: "#666", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s", fontSize: 18 }}>▾</span>
          </div>
        </div>
        {expanded && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "#aaa", lineHeight: 1.7, margin: 0, fontSize: 15 }}>{route.detail}</p>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#666" }}>Expected:</span>
              <span style={{ fontSize: 13, color: "#e0c97f", fontWeight: 600 }}>{route.eta}</span>
            </div>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

function Timeline({ events }: { events: any[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: 32 }}>
      <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, #e0c97f, rgba(224,201,127,0.1))" }} />
      {events.map((ev, i) => (
        <AnimatedSection key={i} delay={i * 0.07}>
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 28, position: "relative" }}>
            <div style={{ position: "absolute", left: -32, top: 4, width: 24, height: 24, borderRadius: "50%", background: ev.done ? "#e0c97f" : "transparent", border: ev.done ? "none" : "2px solid #555", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ev.done && <span style={{ fontSize: 13, color: "#111" }}>✓</span>}
            </div>
            <div>
              <div style={{ fontSize: 13, color: ev.done ? "#e0c97f" : "#666", fontWeight: 700, marginBottom: 4 }}>{ev.year}</div>
              <div style={{ fontSize: 15, color: ev.done ? "#ccc" : "#888" }}>{ev.label}</div>
            </div>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

function ImpactGrid({ impacts }: { impacts: any[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
      {impacts.map((imp, i) => (
        <AnimatedSection key={i} delay={i * 0.06}>
          <div
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "24px 20px", transition: "transform 0.3s, border-color 0.3s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(224,201,127,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{imp.emoji}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{imp.title}</div>
            <div style={{ fontSize: 14, color: "#999", lineHeight: 1.6 }}>{imp.desc}</div>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

function DistanceBar({ label, km, max, color }: { label: string; km: number; max: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref);
  const pct = (km / max) * 100;
  return (
    <div ref={ref} style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
        <span style={{ color: "#ccc" }}>{label}</span>
        <span style={{ color: "#888" }}>{km} km</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 5, width: vis ? pct + "%" : "0%", background: color, transition: "width 1.2s cubic-bezier(.22,1,.36,1)" }} />
      </div>
    </div>
  );
}

export default function PalwalJewarBlog() {
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const distances = [
    { label: "Palwal → Jewar Airport", km: 40, color: "#e0c97f" },
    { label: "Palwal → via Greenfield Expwy", km: 31, color: "#10b981" },
    { label: "Palwal → IGI Delhi Airport", km: 85, color: "#ef4444" },
    { label: "Noida → Jewar Airport", km: 55, color: "#8b5cf6" },
    { label: "Faridabad → Jewar Airport", km: 38, color: "#3b82f6" },
  ];

  return (
    <div style={{ background: "#0a0a0a", color: "#f0f0f0", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hero */}
      <div style={{ minHeight: "90vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(224,201,127,0.08) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: "15%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,201,127,0.04), transparent)", filter: "blur(80px)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 14, letterSpacing: 6, color: "#e0c97f", marginBottom: 24, textTransform: "uppercase", fontWeight: 600 }}>Infrastructure Special</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(42px, 8vw, 86px)", fontWeight: 900, lineHeight: 1.05, margin: 0, background: "linear-gradient(135deg, #f5f0e0, #e0c97f, #f5f0e0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Palwal × Jewar
          </h1>
          <p style={{ fontSize: "clamp(18px, 3vw, 26px)", color: "#888", marginTop: 16, fontWeight: 400, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
            A New Era of Connectivity
          </p>
          <div style={{ marginTop: 48, display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[["~40 km", "Distance"], ["5+", "Routes"], ["2026", "Target Year"]].map(([val, lab]) => (
              <div key={lab} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#e0c97f", fontFamily: "'Playfair Display', serif" }}>{val}</div>
                <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{lab}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, fontSize: 28, color: "#444", animation: "bounce 2s infinite" }}>↓</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Overview */}
        <AnimatedSection>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 13, letterSpacing: 4, color: "#e0c97f", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>🛫 The Big Picture</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, margin: "0 0 20px", color: "#f0f0f0" }}>Why This Matters</h2>
            <p style={{ color: "#999", lineHeight: 1.8, fontSize: 16 }}>
              The Noida International Airport at Jewar was inaugurated on March 28, 2026, and is set to reshape NCR's connectivity. Palwal — just ~40 km away — sits in the sweet spot of multiple road, rail, and metro links converging at the airport. With Phase 1 handling 12 million passengers annually and plans for 70 million+ in future phases, this is not just an airport — it&apos;s a regional transformation engine.
            </p>
          </div>
        </AnimatedSection>

        {/* Routes */}
        <div style={{ marginBottom: 64 }}>
          <AnimatedSection>
            <div style={{ fontSize: 13, letterSpacing: 4, color: "#e0c97f", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>🛣️ Connectivity Routes</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, margin: "0 0 8px", color: "#f0f0f0" }}>Five Ways In</h2>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>Tap any route to expand details</p>
          </AnimatedSection>
          {(SECTIONS[2] as any).routes.map((r: any, i: number) => (
            <RouteCard key={i} route={r} index={i} expanded={expandedRoute === i} onToggle={() => setExpandedRoute(expandedRoute === i ? null : i)} />
          ))}
        </div>

        {/* Timeline */}
        <AnimatedSection>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 13, letterSpacing: 4, color: "#e0c97f", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>📅 Timeline</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, margin: "0 0 28px", color: "#f0f0f0" }}>The Journey So Far</h2>
            <Timeline events={(SECTIONS[3] as any).events} />
          </div>
        </AnimatedSection>

        {/* Impact */}
        <div style={{ marginBottom: 64 }}>
          <AnimatedSection>
            <div style={{ fontSize: 13, letterSpacing: 4, color: "#e0c97f", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>🏙️ Impact</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, margin: "0 0 28px", color: "#f0f0f0" }}>What It Means for Palwal</h2>
          </AnimatedSection>
          <ImpactGrid impacts={(SECTIONS[4] as any).impacts} />
        </div>

        {/* Distance Snapshot */}
        <AnimatedSection>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 13, letterSpacing: 4, color: "#e0c97f", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>📍 Distance Snapshot</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, margin: "0 0 8px", color: "#f0f0f0" }}>Palwal&apos;s Advantage</h2>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 28 }}>Compare how close Palwal is versus other NCR cities</p>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 28 }}>
              {distances.map((d, i) => <DistanceBar key={i} {...d} max={90} />)}
            </div>
          </div>
        </AnimatedSection>

        {/* Footer CTA */}
        <AnimatedSection>
          <div style={{ textAlign: "center", padding: "48px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#e0c97f", marginBottom: 12 }}>Palwal is closer than you think.</div>
            <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
              With five major connectivity projects linking it to Jewar Airport, Palwal is poised to become one of NCR&apos;s most strategic locations. The future is arriving — quite literally.
            </p>
            <div style={{ marginTop: 24, fontSize: 12, color: "#444" }}>Sources: NHAI, YEIDA, Wikipedia, BusinessToday · April 2026</div>
          </div>
        </AnimatedSection>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
    </div>
  );
}
