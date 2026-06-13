/**
 * Decorative KabulLearn hero composition.
 *
 * One art-directed illustration centered on a premium learning dashboard,
 * supported by a smaller phone, a dotted-Earth globe, and language markers.
 * Built as layered HTML/SVG so it stays responsive. The whole thing is a
 * single grouped artwork: a fixed-size design canvas (.kl-hero-stage) whose
 * children are absolutely positioned relative to each other, then scaled as
 * one unit to fit the column width — so nothing ever drifts independently.
 */

import type { ReactNode } from "react";

type HeroStat = {
  icon: ReactNode;
  label: string;
  value: string;
};

const Icon = {
  pencil: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.5 2 14 4.5 5.5 13H3v-2.5L11.5 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 1.5V3M9 15v1.5M1.5 9H3M15 9h1.5M3.7 3.7l1.1 1.1M13.2 13.2l1.1 1.1M3.7 14.3l1.1-1.1M13.2 4.8l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 5.1C7.4 3.9 4.3 3.8 2.6 4.4v10c1.7-.6 4.8-.5 6.4.7m0-10c1.6-1.2 4.7-1.3 6.4-.7v10c-1.7-.6-4.8-.5-6.4.7m0-10v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 4 1.8 7 9 10l7.2-3L9 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4.5 8.4v3.1c0 1 2 1.9 4.5 1.9s4.5-.9 4.5-1.9V8.4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  award: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="m6.7 10.2-1 5L9 13.4l3.3 1.8-1-5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2.5 10.4 6.6 14.5 8 10.4 9.4 9 13.5 7.6 9.4 3.5 8l4.1-1.4L9 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 4h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8l-3 2.5V12H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m10.3 10.3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 6.6a3 3 0 0 1 6 0c0 2.4 1 3.6 1 3.6H4s1-1.2 1-3.6ZM6.8 12.1a1.3 1.3 0 0 0 2.4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const SIDEBAR: Array<[string, keyof typeof Icon]> = [
  ["My Dashboard", "grid"],
  ["My Courses", "book"],
  ["My Certificates", "award"],
  ["My Messages", "chat"],
  ["My Settings", "settings"],
];

/* Real continent coastlines as [lon, lat] polygons (approximate but
   recognisable shapes traced from a world map). A point-in-polygon test
   paints dots only on land, so the globe reads as planet Earth. */
const CONTINENTS_LL: Array<Array<[number, number]>> = [
  // North America (Alaska → Canada → US east coast → Mexico → Central America → US west coast)
  [[-166, 65], [-158, 71], [-128, 70], [-100, 72], [-82, 73], [-64, 60], [-56, 51], [-67, 45], [-70, 41], [-74, 39], [-81, 31], [-80, 25], [-90, 30], [-97, 25], [-97, 20], [-87, 15], [-83, 9], [-78, 8], [-88, 13], [-96, 16], [-107, 23], [-112, 29], [-118, 33], [-124, 40], [-124, 48], [-132, 53], [-145, 60], [-160, 59], [-166, 65]],
  // South America
  [[-78, 8], [-70, 11], [-60, 9], [-50, 0], [-44, -2], [-35, -7], [-39, -14], [-48, -25], [-58, -39], [-66, -50], [-71, -54], [-74, -48], [-72, -38], [-71, -25], [-70, -18], [-76, -14], [-81, -5], [-80, 1], [-78, 8]],
  // Africa
  [[-10, 35], [2, 37], [11, 34], [25, 32], [33, 31], [37, 17], [43, 12], [51, 11], [48, 5], [41, -2], [40, -12], [33, -26], [20, -35], [15, -30], [12, -16], [9, -1], [3, 5], [-8, 5], [-15, 12], [-17, 20], [-13, 28], [-10, 35]],
  // Eurasia (Iberia → N Europe → Siberia → Far East → China → back across the Caspian)
  [[-10, 36], [-9, 45], [2, 51], [-4, 58], [10, 62], [28, 70], [50, 68], [75, 72], [105, 73], [135, 71], [162, 68], [178, 65], [168, 59], [155, 52], [143, 46], [140, 42], [128, 40], [122, 39], [120, 32], [112, 22], [105, 19], [100, 20], [95, 16], [90, 22], [82, 18], [76, 9], [70, 20], [60, 25], [52, 28], [45, 36], [38, 40], [28, 41], [18, 43], [8, 43], [-2, 41], [-10, 36]],
  // Arabian peninsula
  [[35, 30], [42, 31], [50, 28], [58, 23], [60, 19], [52, 15], [44, 13], [39, 16], [36, 23], [35, 30]],
  // Indian subcontinent
  [[70, 24], [74, 18], [77, 9], [80, 13], [84, 18], [88, 22], [82, 24], [74, 25], [70, 24]],
  // Indonesia / SE Asia archipelago
  [[96, 4], [104, 1], [114, -2], [120, -8], [110, -7], [100, -4], [96, 1], [96, 4]],
  // Australia
  [[114, -22], [124, -16], [136, -12], [143, -12], [148, -20], [153, -28], [149, -37], [140, -38], [131, -32], [122, -34], [114, -30], [113, -25], [114, -22]],
  // Greenland
  [[-46, 60], [-22, 60], [-18, 70], [-22, 80], [-40, 83], [-52, 76], [-50, 66], [-46, 60]],
];

function pointInPoly(lon: number, lat: number, poly: Array<[number, number]>) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function isLand(lat: number, lon: number) {
  if (lat <= -62) return true; // Antarctica ice cap
  for (const poly of CONTINENTS_LL) {
    if (pointInPoly(lon, lat, poly)) return true;
  }
  return false;
}

/* Orthographic dotted Earth, tilted so the North Pole reads near the top
   and the latitude curvature is visible. Centred on Africa / Eurasia. */
function GlobeEarth() {
  const cx = 500;
  const cy = 500;
  const R = 456;
  const centerLon = 14; // degrees — face the viewer with Africa / Europe
  const tilt = (24 * Math.PI) / 180; // look down a little → north pole toward top
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  const dots: Array<{ x: number; y: number; r: number; o: number }> = [];
  const step = 2.4;
  for (let lat = -84; lat <= 86; lat += step) {
    const phi = (lat * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const lonStep = step / Math.max(0.3, cosPhi); // spread dots near the poles
    for (let lon = -180; lon < 180; lon += lonStep) {
      if (!isLand(lat, lon)) continue;
      const dl = ((lon - centerLon) * Math.PI) / 180;
      const x = cosPhi * Math.sin(dl);
      const y0 = sinPhi;
      const z = cosPhi * Math.cos(dl);
      const y2 = y0 * cosT - z * sinT;
      const z2 = y0 * sinT + z * cosT;
      if (z2 < 0) continue; // far hemisphere hidden
      dots.push({
        x: cx + x * R,
        y: cy - y2 * R,
        r: 2.2 + 1.3 * z2,
        o: 0.42 + 0.55 * z2,
      });
    }
  }

  return (
    <svg className="kl-globe-svg" viewBox="0 0 1000 1000" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="kl-globe-sphere" cx="40%" cy="32%" r="76%">
          <stop offset="0%" stopColor="#eef4ff" stopOpacity="0.85" />
          <stop offset="56%" stopColor="#d4e1fb" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#9fb8ee" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      {/* Sphere body */}
      <circle cx={cx} cy={cy} r={R} fill="url(#kl-globe-sphere)" />

      {/* Dotted land */}
      <g fill="#2f6bff">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} opacity={d.o.toFixed(2)} />
        ))}
      </g>

      {/* Crisp rim */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#2f6bff" strokeOpacity="0.18" strokeWidth="2" />
    </svg>
  );
}

function ChartTile({ tone = "blue" }: { tone?: "blue" | "green" | "purple" | "orange" }) {
  const gradients = {
    blue: ["#0057FF", "#2563EB"],
    green: ["#18825C", "#0E7490"],
    purple: ["#7C3AED", "#0057FF"],
    orange: ["#B06C00", "#C42B2B"],
  }[tone];

  return (
    <svg viewBox="0 0 140 82" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`hero-chart-${tone}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradients[0]} />
          <stop offset="100%" stopColor={gradients[1]} />
        </linearGradient>
      </defs>
      <rect width="140" height="82" rx="12" fill={`url(#hero-chart-${tone})`} />
      {Array.from({ length: 18 }).map((_, index) => (
        <circle key={index} cx={(index % 6) * 20 + 18} cy={Math.floor(index / 6) * 20 + 18} r="1.8" fill="#fff" opacity="0.16" />
      ))}
      <path d="M20 60 45 46 70 51 112 24" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.82" />
    </svg>
  );
}


export function HomeHeroVisual({ stats }: { stats: HeroStat[] }) {
  return (
    <div className="kl-hero-visual" aria-hidden="true">
      <div className="hero-visual-group">
        <div className="kl-deco-group">
          <div className="kl-globe">
            <GlobeEarth />
          </div>

          {/* Location pins on the globe */}
          <span className="kl-geo-pin kl-geo-pin-1" />
          <span className="kl-geo-pin kl-geo-pin-2" />
          <span className="kl-geo-pin kl-geo-pin-3" />
          <span className="kl-geo-pin kl-geo-pin-4" />
          <span className="kl-geo-pin kl-geo-pin-5" />

          {/* Connection network — arcing lines linking all 4 pins */}
          <svg className="kl-pin-network" viewBox="0 0 960 800" aria-hidden="true">
            <g stroke="#7cb9ff" strokeOpacity="0.82" strokeWidth="1.8" strokeLinecap="round" fill="none">
              {/* existing connections */}
              <path d="M631 24 Q673 -14 716 65" />
              <path d="M631 24 Q732 -24 833 71" />
              <path d="M716 65 Q775  22 833 71" />
              <path d="M833 71 Q877 32 921 117" />
              {/* pin-5 (861,-1) → all others */}
              <path d="M861 -1 Q746 -18 631 24" />
              <path d="M861 -1 Q788 -8 716 65" />
              <path d="M861 -1 Q847 -12 833 71" />
              <path d="M861 -1 Q891 58 921 117" />
            </g>
            <g fill="#7cb9ff" fillOpacity="0.9">
              <circle cx="631" cy="24" r="3" />
              <circle cx="716" cy="65" r="3" />
              <circle cx="833" cy="71" r="3" />
              <circle cx="921" cy="117" r="3" />
              <circle cx="861" cy="-1" r="3" />
            </g>
          </svg>

          {/* Language markers, anchored to the globe */}
          <span className="kl-bubble kl-bubble-ps" dir="rtl">پښتو</span>
          <span className="kl-bubble kl-bubble-en">English</span>
          <span className="kl-bubble kl-bubble-da" dir="rtl">دری</span>
        </div>

        <section className="kl-dashboard-card">
          <aside className="kl-dash-sidebar">
            <div className="kl-dash-portal-header">
              <span className="kl-dash-portal-icon">{Icon.pencil}</span>
              <strong>MY PORTAL</strong>
            </div>
            <div className="kl-dash-divider" />
            {SIDEBAR.map(([item, icon], index) => (
              <div key={item} className={index === 0 ? "active" : ""}>
                <span>{Icon[icon]}</span>
                <p>{item}</p>
              </div>
            ))}
          </aside>

          <div className="kl-dash-main">
            <div className="kl-dash-banner">
              <div className="kl-dash-banner-copy">
                <p>MY LEARNING</p>
                <h3>Welcome back, Ahmad 👋</h3>
                <span>Continue your learning journey.</span>
              </div>
              <div className="kl-dash-banner-stats">
                {([["2","IN PROGRESS"],["40","LESSONS DONE"],["5","CERTIFICATES"],["11","QUIZ ATTEMPTS"]] as const).map(([val, label]) => (
                  <div key={label} className="kl-dash-stat-box">
                    <strong>{val}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="kl-dash-summary">
              <div className="kl-learning-card">
                <div className="kl-learning-banner">
                  <span className="kl-learning-badge">CONTINUE LEARNING</span>
                </div>
                <div className="kl-learning-body">
                  <p>UP NEXT</p>
                  <strong>Web Development Starter</strong>
                  <small>Applied software</small>
                  <div className="kl-progress-meta">
                    <span>Progress</span>
                    <span className="kl-progress-pct">33%</span>
                  </div>
                  <div className="kl-progress-bar"><i /></div>
                  <button type="button">Continue</button>
                </div>
              </div>

              <div className="kl-progress-card">
                <p>YOUR PROGRESS</p>
                <div className="kl-ring"><span>76%</span></div>
                <small>Overall progress</small>
                <div className="kl-progress-stats">
                  <div><span>Lessons completed</span><strong>40/46</strong></div>
                  <div><span>Courses completed</span><strong>5/7</strong></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Grounding contact shadows */}
        <div className="kl-ground kl-ground-dash" />
        <div className="kl-ground kl-ground-phone" />

        <section className="kl-phone">
          <span className="kl-phone-island" />
          <span className="kl-phone-key kl-phone-key-power" />
          <div className="kl-phone-screen">
            <div className="kl-phone-top">
              <span className="kl-phone-ava">A</span>
              <div>
                <small>Welcome back</small>
                <strong>Ahmad 👋</strong>
              </div>
            </div>

            <div className="kl-phone-hero">
              <div className="kl-phone-ring"><span>72%</span></div>
              <div>
                <small>Overall Progress</small>
                <b>34 / 52 lessons</b>
                <i><em style={{ width: "65%" }} /></i>
              </div>
            </div>

            {[
              ["#0057FF", "Applied Data Science", "65%"],
              ["#18825C", "Statistics with Real Examples", "42%"],
            ].map(([color, title, progress]) => (
              <div className="kl-phone-course" key={title}>
                <span style={{ background: color }} />
                <div>
                  <strong>{title}</strong>
                  <i><em style={{ width: progress }} /></i>
                </div>
              </div>
            ))}

            <div className="kl-phone-nav">
              <span>{Icon.grid}</span><span>{Icon.book}</span><span>{Icon.award}</span><span>{Icon.chat}</span>
            </div>
          </div>
        </section>

        {stats.length > 0 && (
          <dl className="kl-stat-strip">
            {stats.map((stat, index) => (
              <div key={stat.label} className={index > 0 ? "with-border" : ""}>
                <span>{stat.icon}</span>
                <div>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
