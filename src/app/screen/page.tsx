"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  getLeaderboard,
  getScreenData,
  type LeaderboardRow,
  type ScreenData,
  type CompetitionResult,
} from "@/actions/results";
import { useFeasts } from "@/hooks/use-feast";
import { SHAKHA_COLOR_MAP } from "@/lib/feast-data";

// ─── Constants ───────────────────────────────────────────────────────────────

const DESIGN_W = 1920;
const DESIGN_H = 1080;

const C_CYAN = "#3fe7ff";
const C_BLUE = "#5b8cff";
const C_VIOLET = "#7c5cff";
const C_MAGENTA = "#e84ad6";
const GOLD_GRAD = `linear-gradient(135deg, #6ef2ff, #36b6ff 38%, #7a6cff 70%, ${C_MAGENTA})`;
const HUD_CLIP = (notch = 16) =>
  `polygon(0 ${notch}px, ${notch}px 0, calc(100% - ${notch}px) 0, 100% ${notch}px, 100% calc(100% - ${notch}px), calc(100% - ${notch}px) 100%, ${notch}px 100%, 0 calc(100% - ${notch}px))`;

const MEDAL_COLOR = ["#FFD24A", "#C8D6E0", "#E8934A"];
const MEDAL_GLOW = ["rgba(255,210,74,0.55)", "rgba(200,214,224,0.45)", "rgba(232,147,74,0.45)"];
const MEDAL_EMO = ["🥇", "🥈", "🥉"];
const PLACE_LBL = ["Champion Shakha", "Second Place", "Third Place"];
const PLACE_WORDS = ["First", "Second", "Third"];
const CATS = [
  { key: "subJunior" as keyof LeaderboardRow, label: "Sub Junior", color: "#0ea5e9" },
  { key: "junior" as keyof LeaderboardRow, label: "Junior", color: "#a855f7" },
  { key: "senior" as keyof LeaderboardRow, label: "Senior", color: C_CYAN },
  { key: "superSenior" as keyof LeaderboardRow, label: "Super Senior", color: C_MAGENTA },
  { key: "elder" as keyof LeaderboardRow, label: "Elder", color: "#f97316" },
];

const CAT_COLOR: Record<string, string> = {
  sub_junior: "#0ea5e9",
  junior: "#a855f7",
  senior: "#3fe7ff",
  super_senior: "#e84ad6",
  elder: "#f97316",
};

const REFRESH_MS = 20_000;
const ROTATE_MS = 15_000;
const TICKER_H = 44; // real viewport px

function shkColor(name: string) {
  return SHAKHA_COLOR_MAP[name] ?? C_VIOLET;
}

function derivedGrade(row: LeaderboardRow): "A" | "B" | "C" | null {
  if (row.aGrade > 0) return "A";
  if (row.bGrade > 0) return "B";
  if (row.cGrade > 0) return "C";
  return null;
}

// ─── Root ───────────────────────────────────────────────────────────────────

export default function ScreenPage() {
  const { feasts, loading: feastsLoading } = useFeasts();
  const [activeSlug, setActiveSlug] = useState("");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [screen2, setScreen2] = useState<ScreenData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [screenIdx, setScreenIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0); // 0=1st/GradeA, 1=2nd/GradeB, 2=3rd/GradeC
  const [scale, setScale] = useState(1);
  const [designH, setDesignH] = useState(DESIGN_H);
  const [clock, setClock] = useState("");
  const particleRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);

  // allScreens = ['rankings', ...competitionIds]
  const allScreens = useMemo(() => {
    const comps = screen2?.competitions ?? [];
    if (!comps.length) return ["rankings"];
    return ["rankings", ...comps.map((c) => c.competitionId)];
  }, [screen2]);

  const isRankings = allScreens[screenIdx] === "rankings";

  const activeCompetition = useMemo(() => {
    const s = allScreens[screenIdx];
    if (s === "rankings") return null;
    return screen2?.competitions.find((c) => c.competitionId === s) ?? null;
  }, [allScreens, screenIdx, screen2]);

  // Fit 1920-wide canvas to viewport
  useEffect(() => {
    function fit() {
      const s = window.innerWidth / DESIGN_W;
      const dh = Math.max(DESIGN_H, Math.round(window.innerHeight / s));
      setScale(s);
      setDesignH(dh);
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Clock
  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setClock(`${hh}:${mm} ${ss}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Pick feast
  useEffect(() => {
    if (!feasts.length) return;
    if (feasts.some((f) => f.slug === activeSlug)) return;
    const active =
      feasts.find((f) => /ongoing|registration/i.test(f.status ?? "")) ?? feasts[0];
    if (active) setActiveSlug(active.slug);
  }, [feasts, activeSlug]);

  // Fetch data
  const fetchData = useCallback(async (slug: string) => {
    const [lb, sd] = await Promise.all([
      getLeaderboard(slug),
      getScreenData(slug),
    ]);
    setRows(lb.data ?? []);
    setScreen2(sd.data ?? null);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (feastsLoading) return;
    if (!feasts.some((f) => f.slug === activeSlug)) {
      if (!feastsLoading) setDataLoading(false);
      return;
    }
    fetchData(activeSlug);
    const id = setInterval(() => fetchData(activeSlug), REFRESH_MS);
    return () => clearInterval(id);
  }, [activeSlug, feastsLoading, feasts, fetchData]);

  // Screen rotation — rankings rotate every ROTATE_MS, competitions cycle sub-positions every SUB_MS
  const SUB_MS = 5_000;
  const SUB_COUNT = 3;
  useEffect(() => {
    if (allScreens.length <= 1) return;
    const delay = isRankings ? ROTATE_MS : SUB_MS;
    const id = setTimeout(() => {
      if (isRankings) {
        setSubIdx(0);
        setScreenIdx((i) => (i + 1) % allScreens.length);
      } else {
        const next = subIdx + 1;
        if (next >= SUB_COUNT) {
          setSubIdx(0);
          setScreenIdx((i) => (i + 1) % allScreens.length);
        } else {
          setSubIdx(next);
        }
      }
    }, delay);
    return () => clearTimeout(id);
  }, [allScreens, allScreens.length, isRankings, screenIdx, subIdx]);

  // Particle canvas
  useEffect(() => {
    const cvMaybe = particleRef.current;
    if (!cvMaybe) return;
    const ctxMaybe = cvMaybe.getContext("2d");
    if (!ctxMaybe) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cv = cvMaybe!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = ctxMaybe!;
    let raf: number;
    const WARM = [255, 140, 70];
    const COOL = [90, 200, 255];
    interface Pt { x: number; y: number; r: number; vy: number; vx: number; a: number; warm: boolean; tw: number }
    let W = 0, H = 0, pts: Pt[] = [];

    function size() {
      W = cv.width = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
      pts = Array.from({ length: 70 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.6 + Math.random() * 2,
        vy: -(0.15 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.25,
        a: 0.15 + Math.random() * 0.5,
        warm: Math.random() < 0.45,
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function rgba(c: number[], a: number) {
      return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.y += p.vy; p.x += p.vx; p.tw += 0.04;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        const a = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        const c = p.warm ? WARM : COOL;
        ctx.fillStyle = rgba(c, a);
        ctx.shadowBlur = 8;
        ctx.shadowColor = rgba(c, 0.8);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    window.addEventListener("resize", size);
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  // Matrix rain canvas
  useEffect(() => {
    const cvMaybe = matrixRef.current;
    if (!cvMaybe) return;
    const ctxMaybe = cvMaybe.getContext("2d");
    if (!ctxMaybe) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cv = cvMaybe!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = ctxMaybe!;
    let raf: number;
    const GLYPHS = "✝☩✚†ΑΩΧΡΙΗΣΘΛΦΨABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    const FS = 22;
    let W = 0, H = 0, cols = 0;
    let drops: number[] = [], speeds: number[] = [], heads: string[] = [];

    function size() {
      W = cv.width = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
      cols = Math.ceil(W / FS);
      drops = Array.from({ length: cols }, () => Math.random() * -H / FS);
      speeds = Array.from({ length: cols }, () => 0.28 + Math.random() * 0.55);
      heads = Array.from({ length: cols }, () => Math.random() < 0.28 ? "warm" : "cool");
    }

    function frame() {
      ctx.fillStyle = "rgba(4,2,12,0.10)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${FS}px monospace`;
      ctx.textBaseline = "top";
      for (let i = 0; i < cols; i++) {
        const x = i * FS;
        const y = drops[i] * FS;
        const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        if (heads[i] === "warm") {
          ctx.fillStyle = "rgba(255,170,120,0.85)";
          ctx.shadowColor = "rgba(255,130,80,0.9)";
        } else {
          ctx.fillStyle = "rgba(150,220,255,0.85)";
          ctx.shadowColor = "rgba(80,170,255,0.9)";
        }
        ctx.shadowBlur = 10;
        ctx.fillText(g, x, y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = heads[i] === "warm" ? "rgba(200,120,90,0.30)" : "rgba(90,130,210,0.32)";
        ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], x, y - FS * (2 + (i * 7) % 4));
        drops[i] += speeds[i];
        if (y > H && Math.random() > 0.975) {
          drops[i] = Math.random() * -24;
          heads[i] = Math.random() < 0.28 ? "warm" : "cool";
        }
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    window.addEventListener("resize", size);
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  const activeFeast = feasts.find((f) => f.slug === activeSlug);
  const ranked = [...rows].sort((a, b) => a.rank - b.rank);
  const hasLb = ranked.some((r) => r.points > 0);
  const hasComps = (screen2?.competitions?.length ?? 0) > 0;
  const busy = dataLoading || feastsLoading;

  const headerTitle = isRankings ? "SHAKHA <b>RANKINGS</b>" : "COMPETITION <b>RESULTS</b>";
  const headerEyebrow = isRankings ? "Live Standings" : activeCompetition
    ? activeCompetition.categoryName || "Results Declared"
    : "Results Declared";

  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(120% 120% at 50% 0%, #0a0822, #03020b 72%)" }}>
      <style>{CSS}</style>

      {/* ── 1920px canvas scaled to fill viewport ── */}
      {/* overflow:hidden MUST NOT be here — it clips at pre-transform layout
          dimensions, cutting off the bottom at scale<1. position:fixed prevents
          scroll without it. */}
      <div
        id="screen-canvas"
        style={{
          width: DESIGN_W,
          height: designH,
          position: "absolute",
          top: 0,
          left: 0,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        {/* Background layers */}
        <div className="sc-bg">
          <div className="sc-bg-grad" />
          <div className="sc-glass-wash" />
          <div className="sc-glass-facets" />
          <div className="sc-bg-hex" />
          <canvas ref={matrixRef} className="sc-matrix" />
          <div className="sc-beam b1" />
          <div className="sc-beam b2" />
          <svg className="sc-church" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <g stroke="rgba(140,210,255,.85)" fill="none" strokeWidth="1.2">
              <CathedralRose cx={960} cy={296} R={188} />
            </g>
            <g stroke="rgba(170,150,255,.8)" fill="none" strokeWidth="1">
              <Lancet cx={150} by={1010} sy={470} ty={175} w={150} />
              <Lancet cx={1770} by={1010} sy={470} ty={175} w={150} />
            </g>
          </svg>
          <div className="sc-orbit" aria-hidden>
            <span className="sc-ring r1" />
            <span className="sc-ring r2" />
            <span className="sc-ring r3" />
          </div>
        </div>

        <canvas ref={particleRef} className="sc-particles" />
        <div className="sc-vig" />

        {/* Header — always visible */}
        <ScreenHeader
          feastName={activeFeast?.name ?? "Feast 2026"}
          subtitle="ചെറുപുഷ്‌പ മിഷൻ ലീഗ് കൽപറ്റ"
          title={headerTitle}
          eyebrow={headerEyebrow}
          clock={clock}
          allScreens={allScreens}
          screenIdx={screenIdx}
          onNav={(i) => { setSubIdx(0); setScreenIdx(i); }}
        />

        {/* Screens */}
        {busy ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <div className="sc-spinner" />
          </div>
        ) : (
          <>
            {/* Screen: Rankings */}
            <div className={`sc-screen ${isRankings ? "active" : ""}`} style={{ paddingTop: 128 }}>
              {hasLb ? (
                <Screen1Rankings rows={ranked} />
              ) : (
                <EmptyState message="No standings yet — rankings appear as results are published." />
              )}
            </div>

            {/* Screen: Competition result (one per competition) */}
            <div className={`sc-screen ${!isRankings ? "active" : ""}`} style={{ paddingTop: 118 }}>
              {activeCompetition ? (
                <Screen2Competition comp={activeCompetition} subIdx={subIdx} />
              ) : hasComps ? (
                <EmptyState message="Loading competition..." />
              ) : (
                <EmptyState message="No results published yet." />
              )}
            </div>
          </>
        )}
      </div>


      {/* ── Ticker — OUTSIDE canvas, always at real viewport bottom ── */}
      {!busy && hasLb && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: TICKER_H,
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(90deg,rgba(8,8,22,.94),rgba(18,12,38,.94))",
          borderTop: "1px solid rgba(100,160,255,.35)",
          zIndex: 1000,
          overflow: "hidden",
        }}>
          {/* Tag */}
          <div style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: "100%",
            padding: "0 28px 0 20px",
            fontFamily: "var(--font-rajdhani),sans-serif",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "2.5px",
            color: "#060e18",
            background: "linear-gradient(135deg,#6ef2ff,#5b8cff 55%,#9d6eff)",
            clipPath: "polygon(0 0,calc(100% - 20px) 0,100% 50%,calc(100% - 20px) 100%,0 100%)",
            paddingRight: 42,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#ff4dcf", boxShadow: "0 0 10px #ff7ada",
              animation: "scBlink 1.1s steps(1) infinite",
              display: "inline-block",
            }} />
            LIVE STANDINGS
          </div>

          {/* Scrolling text */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div className="sc-tk-move">
              {ranked.map((r) => (
                <span key={r.shakhaId}>
                  {r.name} <b>{r.points} PTS</b>
                  <span className="sc-cross">✝</span>
                </span>
              ))}
              {ranked.map((r) => (
                <span key={r.shakhaId + "_2"}>
                  {r.name} <b>{r.points} PTS</b>
                  <span className="sc-cross">✝</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

function ScreenHeader({ feastName, subtitle, title, eyebrow, clock, allScreens, screenIdx, onNav }: {
  feastName: string; subtitle: string; title: string; eyebrow: string; clock: string;
  allScreens: string[]; screenIdx: number; onNav: (i: number) => void;
}) {
  const [hh, ss] = clock.split(" ");
  const n = allScreens.length;
  return (
    <div className="sc-hdr">
      <div className="sc-crest">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Logo" style={{ width: 78, height: 78, objectFit: "contain", position: "relative", zIndex: 1 }} />
      </div>
      <div className="sc-hdr-txt">
        <div className="sc-hdr-event">{feastName}</div>
        <div className="sc-hdr-sub">{subtitle}</div>
      </div>
      <div className="sc-hdr-mid">
        <div className="sc-hdr-eyebrow">
          <CrossSVG size={13} /> {eyebrow} <CrossSVG size={13} />
        </div>
        <div className="sc-hdr-title" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <div className="sc-hdr-right">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Screen nav controls — left of LIVE */}
          {n > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => onNav((screenIdx - 1 + n) % n)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1px solid rgba(100,180,255,.4)",
                  background: "rgba(60,100,200,.25)",
                  color: "#eaf3ff", fontSize: 18, lineHeight: 1,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >‹</button>
              {allScreens.map((s, i) => (
                <button
                  key={s}
                  onClick={() => onNav(i)}
                  title={s === "rankings" ? "Rankings" : s}
                  style={{
                    width: i === screenIdx ? 22 : 8, height: 8,
                    borderRadius: i === screenIdx ? 4 : "50%",
                    background: i === screenIdx ? "linear-gradient(90deg,#6ef2ff,#7a6cff)" : "rgba(255,255,255,.25)",
                    border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                    transition: "all .35s",
                  }}
                />
              ))}
              <button
                onClick={() => onNav((screenIdx + 1) % n)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1px solid rgba(100,180,255,.4)",
                  background: "rgba(60,100,200,.25)",
                  color: "#eaf3ff", fontSize: 18, lineHeight: 1,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >›</button>
            </div>
          )}
          <div className="sc-live"><i />LIVE</div>
        </div>
        <div className="sc-clock">
          {hh}<small>{ss}</small>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 1 — Rankings ────────────────────────────────────────────────────

function Screen1Rankings({ rows }: { rows: LeaderboardRow[] }) {
  const top3 = rows.slice(0, 3);

  return (
    <div className="sc-s1-body">
      {/* Podium */}
      <div className="sc-podium">
        <div className="sc-sunburst" />
        {[top3[1], top3[0], top3[2]].map((r, slot) => {
          const mi = [1, 0, 2][slot];
          if (!r) return <div key={slot} className="sc-pod-empty" />;
          return (
            <PodCard
              key={r.shakhaId}
              row={r}
              medalIdx={mi}
              place={mi + 1}
              cls={slot === 1 ? "p1" : slot === 0 ? "p2" : "p3"}
            />
          );
        })}
      </div>

      {/* Full leaderboard table */}
      <div className="sc-hud sc-tbl">
        <span className="sc-tick tl" /><span className="sc-tick br" />
        <div className="sc-tbl-h">
          <h3 className="sc-font-disp">FULL <b>LEADERBOARD</b></h3>
          <div className="sc-tbl-cnt">{rows.length} Shakhas · Live</div>
        </div>
        <div className="sc-tcols">
          <span>Rank</span>
          <span>Shakha</span>
          <span style={{ textAlign: "center", color: "#fff" }}>Sub Jr</span>
          <span style={{ textAlign: "center", color: "#fff" }}>Junior</span>
          <span style={{ textAlign: "center", color: "#fff" }}>Senior</span>
          <span style={{ textAlign: "center", color: "#fff" }}>Sup Sr</span>
          <span style={{ textAlign: "center", color: "#fff" }}>Elder</span>
          <span style={{ textAlign: "center", color: "#FFD24A" }}>Total</span>
          <span style={{ textAlign: "center" }}>🥇 / 🥈 / 🥉</span>
          <span style={{ textAlign: "center" }}>A / B / C</span>
        </div>
        <div className="sc-tviewport">
          <div className="sc-ttrack">
            {[...rows, ...rows].map((r, i) => (
              <TableRow key={`${r.shakhaId}-${i}`} row={r} idx={i % rows.length} top={i < 3} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PodCard({ row, medalIdx, place, cls }: {
  row: LeaderboardRow; medalIdx: number; place: number; cls: string;
}) {
  const c = shkColor(row.name);
  const mc = MEDAL_COLOR[medalIdx];
  return (
    <div className={`sc-pod ${cls}`}>
      <div className="sc-medal" style={{ borderColor: mc, boxShadow: `0 0 24px ${MEDAL_GLOW[medalIdx]}` }}>
        <span style={{ color: mc }}>{place}</span>
      </div>
      <div className="sc-pod-rank">{PLACE_LBL[medalIdx]}</div>
      <div className="sc-pod-name sc-font-disp">{row.name}</div>
      <div className="sc-pod-pts">
        <b className="sc-font-disp" style={{ color: mc }}>{row.points}</b>
        <span>PTS</span>
      </div>
      <div className="sc-pod-medals">
        <MedalTag color={MEDAL_COLOR[0]} glow={MEDAL_GLOW[0]} count={row.firstCount} />
        <MedalTag color={MEDAL_COLOR[1]} glow={MEDAL_GLOW[1]} count={row.secondCount} />
        <MedalTag color={MEDAL_COLOR[2]} glow={MEDAL_GLOW[2]} count={row.thirdCount} />
      </div>
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: c, boxShadow: `0 0 10px ${c}`, margin: "4px auto 0" }} />
    </div>
  );
}

function MedalTag({ color, glow, count }: { color: string; glow: string; count: number }) {
  return (
    <span className="sc-mtag" style={{ opacity: count > 0 ? 1 : 0.35 }}>
      <i style={{ background: color, boxShadow: count > 0 ? `0 0 8px ${glow}` : "none" }} />
      {count}
    </span>
  );
}

function CatPts({ v }: { v: number; color: string; label: string }) {
  return (
    <div className="sc-r-catpts">
      <span style={{ color: v > 0 ? "#fff" : "rgba(150,170,220,.25)" }}>{v > 0 ? v : "—"}</span>
    </div>
  );
}

function TableRow({ row, idx, top }: { row: LeaderboardRow; idx: number; top: boolean }) {
  const mc = top ? MEDAL_COLOR[idx] : undefined;
  const c = shkColor(row.name);
  return (
    <div className={`sc-trow ${top ? "top" : ""}`} style={{ borderLeftColor: top ? mc : undefined }}>
      {/* Rank */}
      <div className="sc-r-rank sc-font-disp" style={{ color: mc ?? "rgba(200,210,240,0.5)" }}>
        {String(row.rank).padStart(2, "0")}
      </div>
      {/* Shakha name */}
      <div className="sc-r-name sc-font-disp" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}`, flexShrink: 0 }} />
        {row.name}
      </div>
      {/* Category points — Sub-Jr → Jr → Sr → SuperSr → Elder */}
      <CatPts v={row.subJunior}   color="#42c4f7" label="SUB-JR" />
      <CatPts v={row.junior}      color="#c084fc" label="JR" />
      <CatPts v={row.senior}      color={C_CYAN}  label="SR" />
      <CatPts v={row.superSenior} color="#f472b6" label="SUP-SR" />
      <CatPts v={row.elder}       color="#fb923c" label="ELDER" />
      {/* Total — gold, prominent */}
      <div className="sc-r-pts" style={{ color: mc ?? "#FFD24A", textShadow: mc ? `0 0 18px ${mc}88` : "0 0 18px rgba(255,210,74,.55)" }}>
        {row.points}
        <small>PTS</small>
      </div>
      {/* Gold / Silver / Bronze counts */}
      <div className="sc-r-medals">
        <span className="sc-mm" style={{ color: MEDAL_COLOR[0] }}><i style={{ background: MEDAL_COLOR[0] }} />{row.firstCount}</span>
        <span className="sc-mm" style={{ color: MEDAL_COLOR[1] }}><i style={{ background: MEDAL_COLOR[1] }} />{row.secondCount}</span>
        <span className="sc-mm" style={{ color: MEDAL_COLOR[2] }}><i style={{ background: MEDAL_COLOR[2] }} />{row.thirdCount}</span>
      </div>
      {/* A / B / C grade counts */}
      <div className="sc-r-grades">
        <div className="sc-grade-ct" style={{ color: row.aGrade > 0 ? "#4ade80" : "rgba(150,180,220,.25)" }}>
          {row.aGrade > 0 ? row.aGrade : "—"}
        </div>
        <div className="sc-grade-ct" style={{ color: row.bGrade > 0 ? "#fbbf24" : "rgba(150,180,220,.25)" }}>
          {row.bGrade > 0 ? row.bGrade : "—"}
        </div>
        <div className="sc-grade-ct" style={{ color: row.cGrade > 0 ? "#a78bfa" : "rgba(150,180,220,.25)" }}>
          {row.cGrade > 0 ? row.cGrade : "—"}
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2 — Per-competition Results (3-column like reference design) ────

const PLACE_LABELS_SHORT = ["1st Place", "2nd Place", "3rd Place"];
const GRADE_KEYS = ["A", "B", "C"] as const;

function Screen2Competition({ comp, subIdx }: { comp: CompetitionResult; subIdx: number }) {
  const catColor = CAT_COLOR[comp.categorySlug] ?? C_VIOLET;
  const spotlightWinner = comp.positions.find((p) => p.place === (subIdx + 1) as 1 | 2 | 3) ?? null;
  const activeGrade = GRADE_KEYS[subIdx];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Competition Heading — Anek Bold ── */}
      <div style={{ flexShrink: 0 }}>
        {/* Sub-position progress dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          {([0, 1, 2] as const).map((i) => (
            <span key={i} style={{
              width: i === subIdx ? 20 : 7, height: 7,
              borderRadius: i === subIdx ? 4 : "50%",
              background: i === subIdx
                ? `linear-gradient(90deg,${MEDAL_COLOR[i]},${MEDAL_COLOR[i]}aa)`
                : "rgba(255,255,255,.18)",
              transition: "all .4s",
              display: "block",
            }} />
          ))}
          <span style={{
            fontFamily: "var(--font-rajdhani),sans-serif",
            fontSize: 12, letterSpacing: "2px", color: MEDAL_COLOR[subIdx],
            fontWeight: 700, textTransform: "uppercase", marginLeft: 4,
          }}>
            {PLACE_LABELS_SHORT[subIdx]}
          </span>
        </div>

        {/* Category + competition name — same Anek Bold 62px gold gradient */}
        <div style={{
          fontFamily: "var(--font-anek), var(--font-oswald), sans-serif",
          fontWeight: 800, fontSize: 62, lineHeight: 1.05, letterSpacing: "1px",
          background: GOLD_GRAD, WebkitBackgroundClip: "text",
          backgroundClip: "text", color: "transparent", marginBottom: 6,
          overflow: "hidden", maxHeight: "2.15em",
        }}>
          {comp.categoryName ? `${comp.categoryName} — ${comp.competitionName}` : comp.competitionName}
        </div>

        <div style={{ height: 2, background: `linear-gradient(90deg, ${catColor}, ${C_VIOLET} 40%, transparent)` }} />
      </div>

      {/* ── 3-Column Body ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "310px 1fr 560px", gap: 20, minHeight: 0 }}>

        {/* LEFT — Position Winners (all 3, active highlighted) */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="sc-col-head">
            <h3 className="sc-font-disp">POSITION <b>WINNERS</b></h3>
            <div className="sc-col-bar" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, marginTop: 12 }}>
            {([1, 2, 3] as const).map((place) => (
              <PositionCard
                key={place}
                place={place}
                winner={comp.positions.find((p) => p.place === place)}
                isActive={place === subIdx + 1}
              />
            ))}
          </div>
        </div>

        {/* CENTRE — Featured Spotlight (cycles with subIdx) */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="sc-col-head">
            <h3 className="sc-font-disp">FEATURED <b>WINNER</b></h3>
            <div className="sc-col-bar" />
          </div>
          <FeaturedSpotlight key={subIdx} winner={spotlightWinner} placeIdx={subIdx} />
        </div>

        {/* RIGHT — Grade Achievers (one grade at a time) */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="sc-col-head">
            <h3 className="sc-font-disp">GRADE <b>ACHIEVERS</b></h3>
            <div className="sc-col-bar" />
          </div>
          <div style={{ flex: 1, marginTop: 12, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <GradeColumn key={subIdx} grade={activeGrade} achievers={comp.grades[activeGrade]} expanded />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedSpotlight({ winner, placeIdx }: {
  winner: { place: 1 | 2 | 3; name: string; houseName: string | null; shakha: string; photoUrl: string | null } | null;
  placeIdx: number;
}) {
  const mc = MEDAL_COLOR[placeIdx];
  const emo = MEDAL_EMO[placeIdx];

  return (
    <div className="sc-hud sc-feat-stage sc-fade-in" style={{ flex: 1, marginTop: 4 }}>
      <div className="sc-sunburst" />
      <div className="sc-feat-label">
        <CrossSVG size={13} /> {PLACE_LBL[placeIdx]} <CrossSVG size={13} />
      </div>
      {winner ? (
        <div className="sc-feat-card" style={{ gap: 6 }}>
          {/* Place word + medal row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              fontFamily: "var(--font-oswald),sans-serif",
              fontWeight: 700, fontSize: 68, lineHeight: 1, letterSpacing: "2px",
              color: mc, textShadow: `0 0 60px ${mc}, 0 0 24px ${mc}`,
              textTransform: "uppercase",
            }}>
              {PLACE_WORDS[placeIdx]}
            </div>
            <span style={{ fontSize: 68 }}>{emo}</span>
          </div>

          {/* Photo — centred */}
          <PhotoFrame url={winner.photoUrl ?? "https://lkeplxbdecciuwyawmwt.supabase.co/storage/v1/object/public/cml-images/media_68ff9b7085f9c.webp"} name={winner.name} size={280} medalColor={mc} />

          {/* Name — allows 2-line wrap, full card width */}
          <div style={{
            fontFamily: "var(--font-anek),var(--font-oswald),sans-serif",
            fontWeight: 800, fontSize: 66, color: "#fff",
            textAlign: "center", lineHeight: 1.1, marginTop: 4,
            display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", width: "100%",
            textShadow: "0 2px 18px rgba(0,0,0,.6)",
          }}>
            {winner.name}
          </div>

          {/* House name — single line, truncate if extreme */}
          {winner.houseName && (
            <div style={{
              fontFamily: "var(--font-anek),var(--font-oswald),sans-serif",
              fontWeight: 700, fontSize: 44, color: "rgba(220,232,255,.88)",
              textAlign: "center", lineHeight: 1.15,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              width: "100%",
            }}>
              🏠 {winner.houseName}
            </div>
          )}

          {/* Shakha */}
          <div style={{
            fontFamily: "var(--font-rajdhani),sans-serif",
            fontSize: 50, fontWeight: 700, letterSpacing: "1px",
            color: "#eaf3ff", textAlign: "center",
          }}>
            ⛪ {winner.shakha}
          </div>
        </div>
      ) : (
        <div className="sc-feat-card" style={{ opacity: 0.4 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>{emo}</div>
          <div style={{ fontFamily: "var(--font-oswald),sans-serif", fontSize: 28, color: "#fff" }}>
            No winner yet
          </div>
        </div>
      )}
    </div>
  );
}

function PositionCard({
  place,
  winner,
  isActive,
}: {
  place: 1 | 2 | 3;
  winner?: { name: string; houseName: string | null; shakha: string };
  isActive?: boolean;
}) {
  const mc = MEDAL_COLOR[place - 1];
  const mg = MEDAL_GLOW[place - 1];
  const emo = MEDAL_EMO[place - 1];
  const placeLabel = ["1st Place", "2nd Place", "3rd Place"][place - 1];

  return (
    <div
      className="sc-hud"
      style={{
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 16,
        borderTop: `2px solid ${mc}`, flex: 1,
        boxShadow: isActive ? `inset 0 0 0 1px ${mc}55, 0 0 28px ${mg}` : undefined,
        opacity: isActive ? 1 : 0.55,
        transition: "opacity .4s, box-shadow .4s",
      }}
    >
      {/* Medal */}
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        border: `2px solid ${mc}`, boxShadow: isActive ? `0 0 32px ${mg}` : `0 0 10px ${mg}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,.3)", flexShrink: 0, fontSize: 28,
        transition: "box-shadow .4s",
      }}>
        {emo}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-rajdhani),sans-serif",
          fontSize: 13, fontWeight: 700, letterSpacing: "3px",
          textTransform: "uppercase", color: mc, marginBottom: 4,
        }}>
          {placeLabel}
        </div>
        <div style={{
          fontFamily: "var(--font-anek), var(--font-oswald), sans-serif",
          fontWeight: 800, fontSize: 28,
          color: winner ? "#fff" : "rgba(150,180,240,.35)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          marginBottom: 2, lineHeight: 1.1,
        }}>
          {winner?.name ?? "—"}
        </div>
        {winner?.houseName && (
          <div style={{
            fontFamily: "var(--font-anek),sans-serif",
            fontSize: 16, fontWeight: 700, color: "#eaf3ff",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 2, lineHeight: 1.15, opacity: 0.8,
          }}>
            {winner.houseName}
          </div>
        )}
        {winner && (
          <div style={{ fontFamily: "var(--font-rajdhani),sans-serif", fontSize: 17, fontWeight: 700, color: "#eaf3ff" }}>
            ⛪ {winner.shakha}
          </div>
        )}
      </div>
    </div>
  );
}

function GradeColumn({
  grade,
  achievers,
  expanded,
}: {
  grade: "A" | "B" | "C";
  achievers: { name: string; houseName: string | null; shakha: string }[];
  expanded?: boolean;
}) {
  const GRADE_COLORS = { A: "#16a34a", B: "#d97706", C: "#7c5cff" };
  const GRADE_LABELS = { A: "DISTINCTION", B: "MERIT", C: "PASS" };
  const color = GRADE_COLORS[grade];

  return (
    <div
      className={`sc-hud sc-fade-in${expanded ? " sc-grade-expanded" : ""}`}
      style={{ display: "flex", flexDirection: "column", padding: expanded ? "18px 20px" : "14px 16px", overflow: "hidden", flex: expanded ? 1 : undefined }}
    >
      {/* Grade header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: expanded ? 16 : 10, flexShrink: 0 }}>
        <div style={{
          width: expanded ? 52 : 40, height: expanded ? 52 : 40, background: color, borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-oswald),sans-serif",
          fontSize: expanded ? 28 : 22, fontWeight: 700, color: "#fff", flexShrink: 0,
          clipPath: "polygon(0 6px,6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px))",
          boxShadow: expanded ? `0 0 24px ${color}88` : undefined,
        }}>
          {grade}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-oswald),sans-serif", fontSize: expanded ? 30 : 16, color: "#fff", fontWeight: 700 }}>
            Grade {grade}
          </div>
          <div style={{ fontFamily: "var(--font-rajdhani),sans-serif", fontSize: expanded ? 16 : 11, color: "rgba(150,190,240,.7)", letterSpacing: 1 }}>
            {GRADE_LABELS[grade]}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-oswald),sans-serif", fontSize: expanded ? 32 : 22, color: C_CYAN, lineHeight: 1 }}>
            {achievers.length}
          </div>
          <div style={{ fontFamily: "var(--font-rajdhani),sans-serif", fontSize: 10, color: "rgba(150,190,240,.6)", letterSpacing: 1 }}>
            ACHIEVERS
          </div>
        </div>
      </div>

      {/* Achievers list */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: expanded ? 7 : 4 }}>
        {achievers.length === 0 ? (
          <div style={{ color: "rgba(150,180,240,.35)", fontSize: 14 }}>No achievers</div>
        ) : (
          achievers.map((a, i) => (
            <div key={i} className="sc-achiever-row" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: expanded ? "16px 18px" : "5px 9px", borderRadius: 6,
              background: "rgba(60,80,150,.22)", flexShrink: 0,
              borderLeft: expanded ? `4px solid ${color}` : undefined,
              gap: 12,
              animationDelay: `${i * 0.07}s`,
            }}>
              {/* Name + house name block */}
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={{
                  color: "#fff", fontWeight: 800, fontSize: expanded ? 24 : 13,
                  fontFamily: "var(--font-anek), var(--font-barlow), sans-serif",
                  lineHeight: 1.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{a.name}</div>
                {expanded && a.houseName && (
                  <div style={{
                    fontFamily: "var(--font-rajdhani),sans-serif",
                    fontSize: 16, fontWeight: 600, color: "rgba(180,200,240,.75)",
                    lineHeight: 1.2, marginTop: 3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{a.houseName}</div>
                )}
              </div>
              <span style={{
                fontFamily: "var(--font-rajdhani),sans-serif",
                fontSize: expanded ? 19 : 12, color: "#eaf3ff", fontWeight: 700,
                whiteSpace: "nowrap", flexShrink: 0,
                textShadow: expanded ? "0 0 10px rgba(234,243,255,0.5)" : undefined,
              }}>
                {a.shakha}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, zIndex: 5 }}>
      <div style={{ width: 120, height: 120, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(124,92,255,0.10)", border: `1px solid ${C_VIOLET}55`, boxShadow: `0 0 60px ${C_VIOLET}33`, fontSize: 52 }}>
        🏆
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, background: GOLD_GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-oswald)" }}>
        No Results Yet
      </div>
      <div style={{ fontSize: 20, color: "rgba(157,176,216,0.8)", maxWidth: 600, textAlign: "center" }}>
        {message}
      </div>
    </div>
  );
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function SacredHeartSVG() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="#ffd24a" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" aria-hidden style={{ width: 48, height: 48, filter: "drop-shadow(0 0 6px rgba(255,210,74,0.6))", position: "relative" }}>
      <path d="M32 53 C13 41 15 25 25.5 25 C29.5 25 32 28 32 31 C32 28 34.5 25 38.5 25 C49 25 51 41 32 53 Z" fill="rgba(255,210,74,.16)" />
      <path d="M32 25 V9 M26 14 H38" />
      <path d="M30.4 9 C30 6 32 5 32 2.6 C32 5 34 6 33.6 9 Z" fill="#ffd24a" stroke="none" />
    </svg>
  );
}

function CrossSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10.5 2h3v5H18v3h-4.5v12h-3V10H6V7h4.5z" />
    </svg>
  );
}

function CathedralRose({ cx, cy, R }: { cx: number; cy: number; R: number }) {
  const inner = R * 0.62, hub = R * 0.30, petalR = R * 0.135, petalD = R * 0.80;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x1 = (cx + Math.cos(a) * hub).toFixed(1);
    const y1 = (cy + Math.sin(a) * hub).toFixed(1);
    const x2 = (cx + Math.cos(a) * R).toFixed(1);
    const y2 = (cy + Math.sin(a) * R).toFixed(1);
    const px = (cx + Math.cos(a) * petalD).toFixed(1);
    const py = (cy + Math.sin(a) * petalD).toFixed(1);
    els.push(<line key={`s${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />);
    els.push(<circle key={`p${i}`} cx={px} cy={py} r={petalR.toFixed(1)} />);
  }
  return (
    <>
      <circle cx={cx} cy={cy} r={R} />
      <circle cx={cx} cy={cy} r={inner.toFixed(1)} />
      <circle cx={cx} cy={cy} r={hub.toFixed(1)} />
      {els}
    </>
  );
}

function Lancet({ cx, by, sy, ty, w }: { cx: number; by: number; sy: number; ty: number; w: number }) {
  const arch = (k: number) =>
    `M${cx - w * k} ${by} L${cx - w * k} ${sy} Q${cx - w * k} ${ty + (1 - k) * 40},${cx} ${ty + (1 - k) * 40} Q${cx + w * k} ${ty + (1 - k) * 40},${cx + w * k} ${sy} L${cx + w * k} ${by}`;
  return (
    <>
      <path d={arch(1)} />
      <path d={arch(0.62)} />
      <circle cx={cx} cy={sy - w * 0.5} r={w * 0.22} />
    </>
  );
}

// ─── Photo frame (hexagonal, golden border) ──────────────────────────────────

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

function PhotoFrame({ url, name, size, medalColor }: {
  url: string | null;
  name: string;
  size: number;
  medalColor: string;
}) {
  const border = 8;
  const total = size + border * 2;
  return (
    <div style={{
      position: "relative", width: total, height: total, flexShrink: 0,
      filter: `drop-shadow(0 0 18px ${medalColor}bb) drop-shadow(0 0 40px ${medalColor}55)`,
    }}>
      {/* Golden conic ring */}
      <div style={{
        position: "absolute", inset: 0,
        clipPath: HEX_CLIP,
        background: `conic-gradient(from 0deg, ${medalColor}, #fff8c0 18%, #ffd700 36%, ${medalColor} 54%, #fff4a0 72%, ${medalColor} 90%, #fff8c0 100%)`,
      }} />
      {/* Image / placeholder */}
      <div style={{
        position: "absolute", inset: border,
        clipPath: HEX_CLIP, overflow: "hidden",
        background: "linear-gradient(145deg, #140d36, #0c0820)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" style={{ width: "52%", height: "52%", opacity: 0.55 }}>
            <circle cx="12" cy="8.5" r="4.5" fill={medalColor} />
            <path d="M2 21c0-5.5 4.5-8.5 10-8.5S22 15.5 22 21H2z" fill={medalColor} />
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const HUD_CLIP_STR = HUD_CLIP(16);
const HUD_CLIP_SM = HUD_CLIP(12);

const CSS = `
  :root {
    --gold: #3fe7ff;
    --gold-grad: ${GOLD_GRAD};
    --violet: #9db4ff;
    --notch: 16px;
  }

  /* ── Fonts ── */
  .sc-font-disp { font-family: var(--font-oswald), 'Arial Narrow', sans-serif; }
  .sc-font-hud  { font-family: var(--font-rajdhani), 'Arial', sans-serif; }

  /* ── Background ── */
  .sc-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }

  /* deep-space backdrop — matches reference neon #stage + .bg-grad */
  .sc-bg-grad {
    position: absolute; inset: 0;
    background:
      radial-gradient(60% 80% at 12% 14%, rgba(54,160,255,.30), transparent 60%),
      radial-gradient(62% 82% at 88% 86%, rgba(232,74,214,.24), transparent 62%),
      radial-gradient(46% 56% at 82% 18%, rgba(255,138,60,.16), transparent 60%),
      radial-gradient(50% 60% at 18% 84%, rgba(124,92,255,.22), transparent 60%),
      radial-gradient(120% 120% at 50% 50%, #0c0a28 0%, #070518 55%, #03020b 100%);
  }

  /* stained-glass neon colour wash — screen blend so it tints, not paints */
  .sc-glass-wash {
    position: absolute; inset: -12%; z-index: 0; pointer-events: none;
    mix-blend-mode: screen; opacity: .5; filter: blur(38px);
    background:
      radial-gradient(38% 48% at 13% 16%, rgba(63,231,255,.5),  transparent 60%),
      radial-gradient(36% 46% at 32% 82%, rgba(232,74,214,.48), transparent 60%),
      radial-gradient(42% 50% at 69% 20%, rgba(124,92,255,.46), transparent 62%),
      radial-gradient(40% 50% at 89% 76%, rgba(255,138,60,.34), transparent 60%),
      radial-gradient(32% 42% at 56% 54%, rgba(120,180,255,.26), transparent 60%);
    animation: washDrift 26s ease-in-out infinite alternate;
  }
  @keyframes washDrift {
    0%   { transform: translate(0,0) scale(1); }
    100% { transform: translate(-3%,2%) scale(1.08); }
  }

  /* holographic facets — conic neon prism, centred radial mask */
  .sc-glass-facets {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    opacity: .10; mix-blend-mode: screen;
    background: repeating-conic-gradient(from 8deg at 18% 22%,
      rgba(63,231,255,.9)  0 16deg,
      rgba(91,140,255,.9)  16deg 32deg,
      rgba(124,92,255,.9)  32deg 48deg,
      rgba(232,74,214,.9)  48deg 64deg);
    -webkit-mask: radial-gradient(60% 60% at 50% 35%, #000, transparent 75%);
            mask: radial-gradient(60% 60% at 50% 35%, #000, transparent 75%);
  }

  /* hex grid — masked to centre so it fades at edges */
  .sc-bg-hex {
    position: absolute; inset: -40px; opacity: .05;
    background-image:
      linear-gradient(60deg,  transparent 49.3%, rgba(140,200,255,.7) 49.5%, rgba(140,200,255,.7) 50.5%, transparent 50.7%),
      linear-gradient(-60deg, transparent 49.3%, rgba(140,200,255,.7) 49.5%, rgba(140,200,255,.7) 50.5%, transparent 50.7%);
    background-size: 60px 104px;
    -webkit-mask: radial-gradient(120% 100% at 50% 40%, #000, transparent 78%);
            mask: radial-gradient(120% 100% at 50% 40%, #000, transparent 78%);
  }

  /* scripture rain — screen blend + edge-fade mask */
  .sc-matrix {
    position: absolute; inset: 0; width: 100%; height: 100%;
    opacity: .14; z-index: 1; pointer-events: none; mix-blend-mode: screen;
    -webkit-mask:
      linear-gradient(90deg, #000, rgba(0,0,0,.28) 26%, rgba(0,0,0,.28) 74%, #000),
      linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent);
    mask:
      linear-gradient(90deg, #000, rgba(0,0,0,.28) 26%, rgba(0,0,0,.28) 74%, #000),
      linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent);
    -webkit-mask-composite: source-in; mask-composite: intersect;
  }

  /* light-ribbon beams — wide, blurred, screen blend, neon colour pulse */
  .sc-beam {
    position: absolute; top: -30%; width: 46%; height: 170%;
    filter: blur(60px); mix-blend-mode: screen; z-index: 2;
  }
  .sc-beam.b1 {
    left: 6%;
    background: linear-gradient(180deg, transparent, rgba(63,231,255,.55), transparent);
    transform: rotate(14deg);
    animation: neonBeam 7s ease-in-out infinite;
  }
  .sc-beam.b2 {
    right: 8%;
    background: linear-gradient(180deg, transparent, rgba(232,74,214,.5), transparent);
    transform: rotate(-12deg);
    animation: neonBeam 9s ease-in-out infinite reverse;
  }
  @keyframes neonBeam { 0%,100% { opacity: .35; } 50% { opacity: .9; } }

  /* cathedral rose + lancets */
  .sc-church {
    position: absolute; inset: 0; width: 100%; height: 100%;
    opacity: .085; z-index: 1; pointer-events: none;
  }

  /* neon orbital light trails — elliptical, screen blend, annular ring mask */
  .sc-orbit {
    position: absolute; left: 50%; top: 39%; width: 780px; height: 780px;
    transform: translate(-50%, -50%); pointer-events: none;
    opacity: .55; mix-blend-mode: screen; z-index: 1;
    filter: blur(.4px) drop-shadow(0 0 16px rgba(80,170,255,.5));
  }
  .sc-ring {
    position: absolute; inset: 0; border-radius: 50%;
    /* annular ring: only the outer 2px rim is visible */
    -webkit-mask: radial-gradient(closest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
            mask: radial-gradient(closest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  }
  .sc-ring.r1 {
    background: conic-gradient(from 0deg, transparent 0 52%,
      rgba(110,240,255,0) 52%, rgba(110,240,255,.95) 78%,
      rgba(124,92,255,.3) 90%, transparent 100%);
    transform: rotate(8deg) scaleY(.62);
    animation: orbSpin 17s linear infinite;
    --t: rotate(368deg) scaleY(.62);
  }
  .sc-ring.r2 {
    inset: 13%;
    background: conic-gradient(from 140deg, transparent 0 58%,
      rgba(124,92,255,0) 58%, rgba(124,92,255,.9) 82%,
      rgba(232,74,214,.32) 94%, transparent 100%);
    transform: rotate(-24deg) scaleY(.7);
    animation: orbSpin 23s linear infinite reverse;
    --t: rotate(-384deg) scaleY(.7);
  }
  .sc-ring.r3 {
    inset: -9%;
    background: conic-gradient(from 250deg, transparent 0 64%,
      rgba(232,74,214,0) 64%, rgba(232,74,214,.82) 84%,
      rgba(110,240,255,.3) 95%, transparent 100%);
    transform: rotate(34deg) scaleY(.5);
    animation: orbSpin 31s linear infinite;
    --t: rotate(394deg) scaleY(.5);
  }
  @keyframes orbSpin { to { transform: var(--t, rotate(360deg)); } }

  /* particles */
  .sc-particles {
    position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none;
  }

  /* vignette */
  .sc-vig {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    box-shadow: inset 0 0 220px 70px rgba(3,2,11,.85);
    background: radial-gradient(120% 120% at 50% 50%, transparent 58%, rgba(3,2,11,.62));
  }

  /* sunburst (used in podium + feat-stage) */
  .sc-sunburst {
    position: absolute; pointer-events: none;
    background: repeating-conic-gradient(from 0deg,
      rgba(255,210,74,.22) 0deg 2.4deg, transparent 2.4deg 9deg);
    -webkit-mask: radial-gradient(circle, #000 6%, rgba(0,0,0,.55) 26%, transparent 62%);
            mask: radial-gradient(circle, #000 6%, rgba(0,0,0,.55) 26%, transparent 62%);
    animation: sunspin 70s linear infinite;
  }

  /* ── HUD panels ── */
  .sc-hud {
    position: relative;
    background:
      repeating-linear-gradient(0deg, rgba(150,210,255,.05) 0 1px, transparent 1px 3px),
      linear-gradient(150deg, rgba(180,205,255,.16), rgba(180,205,255,0) 44%),
      linear-gradient(160deg, rgba(58,70,135,.15), rgba(10,8,28,.24));
    backdrop-filter: blur(30px) saturate(1.6) brightness(1.06);
    -webkit-backdrop-filter: blur(30px) saturate(1.6) brightness(1.06);
    box-shadow:
      inset 0 1px 0 rgba(205,225,255,.28),
      inset 0 0 40px rgba(90,160,255,.10),
      inset 0 0 0 1px rgba(150,200,255,.07);
    clip-path: ${HUD_CLIP_STR};
    overflow: hidden;
    animation: neonPanelPulse 5.5s ease-in-out infinite;
  }
  /* holographic light sweep across each panel */
  .sc-hud::before {
    content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
    clip-path: ${HUD_CLIP_STR}; mix-blend-mode: screen;
    background: linear-gradient(115deg,
      transparent 32%, rgba(150,210,255,.10) 47%,
      rgba(205,180,255,.18) 50%, rgba(150,210,255,.10) 53%, transparent 68%);
    background-size: 260% 100%; background-position: 200% 0;
    animation: holoSweep 7.5s ease-in-out infinite;
  }
  .sc-hud::after {
    content: ""; position: absolute; inset: 0; padding: 1.6px;
    clip-path: ${HUD_CLIP_STR};
    background: linear-gradient(135deg, #6ef2ff, #5b8cff 28%, #9d6eff 52%, #e84ad6 76%, #6ef2ff 100%);
    background-size: 300% 300%;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    pointer-events: none; opacity: .95;
    animation: neonFlow 9s linear infinite;
  }
  @keyframes neonFlow {
    0%   { background-position: 0%   50%; }
    100% { background-position: 300% 50%; }
  }
  @keyframes holoSweep {
    0%       { background-position: 200% 0; }
    60%,100% { background-position: -90% 0; }
  }
  @keyframes neonPanelPulse {
    0%,100% { box-shadow: inset 0 1px 0 rgba(205,225,255,.26), inset 0 0 38px rgba(90,160,255,.10), inset 0 0 0 1px rgba(150,200,255,.07); }
    50%     { box-shadow: inset 0 1px 0 rgba(216,232,255,.36), inset 0 0 62px rgba(124,150,255,.22), inset 0 0 0 1px rgba(172,210,255,.13); }
  }
  }
  .sc-tick {
    position: absolute; width: 18px; height: 18px;
    border: 2px solid var(--gold); opacity: .8; z-index: 4;
  }
  .sc-tick.tl { top: 8px; left: 8px; border-right: 0; border-bottom: 0; }
  .sc-tick.tr { top: 8px; right: 8px; border-left: 0; border-bottom: 0; }
  .sc-tick.bl { bottom: 8px; left: 8px; border-right: 0; border-top: 0; }
  .sc-tick.br { bottom: 8px; right: 8px; border-left: 0; border-top: 0; }

  /* ── Screens ── */
  .sc-screen {
    position: absolute; inset: 0; z-index: 5;
    padding: 0 46px; padding-bottom: 72px;
    opacity: 0; visibility: hidden;
    transition: opacity .7s ease;
    pointer-events: none;
  }
  .sc-screen.active {
    opacity: 1; visibility: visible; pointer-events: auto;
  }

  /* ── Header ── */
  .sc-hdr {
    position: absolute; top: 0; left: 0; right: 0;
    display: flex; align-items: center; gap: 26px;
    height: 104px; padding: 0 46px;
    z-index: 10;
    background: linear-gradient(180deg, rgba(3,2,11,.7) 0%, transparent 100%);
  }
  .sc-crest {
    width: 78px; height: 78px; flex: 0 0 auto;
    display: grid; place-items: center;
    position: relative;
  }
  .sc-crest::before { content: none; }
  .sc-hdr-txt { display: flex; flex-direction: column; line-height: 1; gap: 16px; }
  .sc-hdr-event {
    font-family: var(--font-anek), sans-serif;
    font-weight: 700; font-size: 45px; letter-spacing: .5px; color: #fff;
  }
  .sc-hdr-sub {
    font-family: var(--font-anek), sans-serif;
    font-weight: 600; font-size: 30px; letter-spacing: 1px;
    color: ${C_CYAN};
  }
  .sc-hdr-mid {
    flex: 1; display: flex; flex-direction: column; align-items: center; line-height: .96;
  }
  .sc-hdr-eyebrow {
    display: flex; align-items: center; gap: 12px;
    font-family: var(--font-rajdhani), sans-serif;
    font-weight: 600; font-size: 15px; letter-spacing: 8px;
    text-transform: uppercase; color: #9db4ff; margin-bottom: 6px;
  }
  .sc-hdr-eyebrow svg { color: #ffd24a; opacity: .9; }
  .sc-hdr-title {
    font-family: var(--font-oswald), sans-serif;
    font-weight: 700; font-size: 58px; letter-spacing: 2px;
    text-transform: uppercase; color: #fff;
    text-shadow: 0 0 26px rgba(139,92,246,.55), 0 4px 0 rgba(0,0,0,.25);
    line-height: 1;
  }
  .sc-hdr-title b {
    background: ${GOLD_GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .sc-hdr-right {
    display: flex; flex-direction: column; align-items: flex-end; gap: 9px; min-width: 230px;
  }
  .sc-live {
    display: inline-flex; align-items: center; gap: 9px; padding: 7px 16px;
    font-family: var(--font-rajdhani), sans-serif;
    font-weight: 700; font-size: 16px; letter-spacing: 3px; color: #fff;
    background: linear-gradient(135deg, #ff3b6b, #b3122e);
    clip-path: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));
    box-shadow: 0 0 20px rgba(255,59,107,.5);
  }
  .sc-live i {
    width: 10px; height: 10px; border-radius: 50%; background: #fff;
    box-shadow: 0 0 12px #fff; animation: scBlink 1.1s steps(1) infinite; flex-shrink: 0;
  }
  @keyframes scBlink { 50% { opacity: .25; } }
  .sc-clock {
    font-family: var(--font-rajdhani), sans-serif;
    font-weight: 600; font-size: 26px; letter-spacing: 2px; color: #eaf3ff;
  }
  .sc-clock small { color: #9db0d8; font-size: 15px; letter-spacing: 3px; margin-left: 6px; }

  /* ── Screen 1 body ── */
  .sc-s1-body {
    height: 100%; display: flex; flex-direction: column; gap: 15px;
    padding-bottom: 8px;
  }

  /* ── Podium ── */
  .sc-podium {
    position: relative; display: flex; align-items: flex-end; justify-content: center;
    gap: 22px; height: 270px; flex-shrink: 0;
  }
  .sc-podium .sc-sunburst {
    width: 600px; height: 600px; border-radius: 50%;
    left: 50%; top: 40%; transform: translate(-50%,-50%); z-index: 0;
  }
  .sc-feat-stage .sc-sunburst {
    width: 640px; height: 640px; border-radius: 50%;
    left: 50%; top: 48%; transform: translate(-50%,-50%); z-index: 1;
  }
  @keyframes sunspin { to { transform: translate(-50%,-50%) rotate(360deg); } }
  .sc-pod {
    position: relative; flex: 0 0 auto; width: 290px;
    padding: 22px 20px 18px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    z-index: 1;
    background: linear-gradient(165deg, rgba(34,22,64,.9), rgba(15,9,34,.92));
    clip-path: ${HUD_CLIP_STR};
    transition: transform .4s;
  }
  .sc-pod::after {
    content: ""; position: absolute; inset: 0; padding: 1.6px;
    clip-path: ${HUD_CLIP_STR};
    background: linear-gradient(135deg, #6ef2ff, #5b8cff 28%, #9d6eff 52%, #e84ad6 76%, #6ef2ff 100%);
    background-size: 300% 300%;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    pointer-events: none; animation: neonFlow 7s linear infinite;
  }
  .sc-pod.p1 { transform: translateY(-24px); box-shadow: 0 18px 56px rgba(60,120,255,.30), 0 0 40px rgba(124,92,255,.22); }
  .sc-pod.p2 { transform: translateY(-8px); }
  .sc-pod.p3 { transform: translateY(0); }
  .sc-pod-empty { flex: 0 0 290px; }
  .sc-medal {
    width: 56px; height: 56px; border-radius: 50%; border: 2px solid;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.3); margin-bottom: 8px;
  }
  .sc-medal span {
    font-family: var(--font-oswald), sans-serif; font-weight: 700; font-size: 26px;
  }
  .sc-pod-rank {
    font-family: var(--font-rajdhani), sans-serif;
    font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: #9db4ff; margin-bottom: 6px;
  }
  .sc-pod-name { font-size: 24px; font-weight: 700; letter-spacing: .5px; color: #fff; margin-bottom: 8px; }
  .sc-pod-pts { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; }
  .sc-pod-pts b { font-size: 40px; font-weight: 700; }
  .sc-pod-pts span { font-size: 12px; color: rgba(200,220,255,.6); letter-spacing: 2px; }
  .sc-pod-medals { display: flex; gap: 10px; }
  .sc-mtag {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: var(--font-rajdhani), sans-serif;
    font-size: 15px; font-weight: 700; color: rgba(200,220,255,.7);
  }
  .sc-mtag i { width: 8px; height: 8px; border-radius: 50%; }

  /* ── Table ── */
  .sc-tbl {
    display: flex; flex-direction: column; padding: 16px 20px; min-height: 0; overflow: hidden;
    flex: 1;
  }
  .sc-tbl-h {
    display: flex; align-items: baseline; gap: 14px; margin-bottom: 10px; flex-shrink: 0;
  }
  .sc-tbl-h h3 {
    font-size: 22px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #fff;
  }
  .sc-tbl-h h3 b { background: ${GOLD_GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sc-tbl-cnt { font-size: 16px; color: rgba(170,190,230,.8); font-family: var(--font-rajdhani); }
  .sc-tcols {
    display: grid; grid-template-columns: 52px 1fr 64px 64px 64px 64px 64px 92px 104px 130px;
    gap: 0 8px; padding: 10px 10px; border-bottom: 2px solid rgba(120,180,255,.28);
    font-family: var(--font-rajdhani), sans-serif; font-size: 15px; letter-spacing: 1.2px;
    text-transform: uppercase; color: rgba(200,218,255,.85); flex-shrink: 0;
    background: rgba(30,40,100,.22); border-radius: 4px 4px 0 0;
  }
  .sc-tviewport { flex: 1; overflow: hidden; min-height: 0; position: relative; }
  .sc-ttrack {
    display: flex; flex-direction: column; gap: 4px;
    animation: tableScroll 45s linear infinite;
  }
  @keyframes tableScroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  .sc-trow {
    display: grid; grid-template-columns: 52px 1fr 64px 64px 64px 64px 64px 92px 104px 130px;
    gap: 0 8px; padding: 8px 10px; border-radius: 4px;
    background: linear-gradient(120deg, rgba(58,72,140,.22), rgba(10,8,26,.20));
    border-left: 2px solid rgba(63,231,255,.3);
    align-items: center; flex-shrink: 0;
    transition: background .3s;
  }
  .sc-trow.top {
    background: linear-gradient(120deg, rgba(63,231,255,.14), rgba(124,92,255,.10));
    box-shadow: 0 0 20px rgba(80,170,255,.14);
  }
  .sc-r-rank { font-size: 24px; font-weight: 700; }
  .sc-r-name { font-size: 28px; font-weight: 700; color: #eaf3ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* Total points — gold, prominent */
  .sc-r-pts {
    font-family: var(--font-oswald), sans-serif;
    font-size: 26px; font-weight: 700; color: #FFD24A;
    text-shadow: 0 0 18px rgba(255,210,74,.55); text-align: center;
  }
  .sc-r-pts small { font-size: 12px; color: rgba(255,210,74,.5); display: block; letter-spacing: 1px; }
  /* Category points — compact, white value + coloured label */
  .sc-r-catpts {
    font-family: var(--font-oswald), sans-serif; font-size: 24px; font-weight: 700;
    text-align: center; line-height: 1;
  }
  .sc-r-catpts small { font-size: 11px; display: block; letter-spacing: 1px; opacity: 0.75; margin-top: 2px; }
  .sc-r-medals { display: flex; gap: 8px; justify-content: center; }
  .sc-mm {
    display: inline-flex; align-items: center; gap: 3px;
    font-family: var(--font-oswald); font-size: 24px; font-weight: 700;
  }
  .sc-mm i { width: 7px; height: 7px; border-radius: 50%; }
  /* A/B/C grade counts */
  .sc-r-grades { display: flex; gap: 6px; justify-content: center; align-items: center; }
  .sc-grade-ct {
    display: flex; flex-direction: column; align-items: center;
    font-family: var(--font-oswald), sans-serif; font-size: 34px; font-weight: 700; line-height: 1;
  }
  .sc-grade-ct span { font-family: var(--font-rajdhani); font-size: 18px; font-weight: 700; letter-spacing: 1px; opacity: 0.8; }
  /* legacy pill (kept for grade column compact view) */
  .sc-grade-pill {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 6px;
    font-size: 15px; font-weight: 700; color: #fff; letter-spacing: 0;
    clip-path: polygon(0 5px,5px 0,calc(100% - 5px) 0,100% 5px,100% calc(100% - 5px),calc(100% - 5px) 100%,5px 100%,0 calc(100% - 5px));
  }

  /* ── Category panel ── */
  .sc-cat-panel {
    display: flex; flex-direction: column; padding: 22px 24px; gap: 0; height: 100%;
  }
  .sc-cat-panel h3 {
    font-size: 20px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #fff; margin-bottom: 4px;
  }
  .sc-cat-panel h3 b { background: ${GOLD_GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sc-cat-sub { font-family: var(--font-rajdhani); font-size: 12px; color: #9db0d8; letter-spacing: 2px; margin-bottom: 16px; }
  .sc-cat-total {
    display: flex; align-items: center; gap: 16px;
    background: linear-gradient(120deg, rgba(60,72,140,.22), rgba(10,8,26,.20));
    clip-path: ${HUD_CLIP_SM};
    padding: 12px 18px; margin-bottom: 16px;
    box-shadow: inset 0 1px 0 rgba(200,225,255,.20), inset 0 0 26px rgba(90,160,255,.08);
  }
  .sc-cat-total b {
    font-family: var(--font-oswald); font-size: 44px; font-weight: 700;
    background: ${GOLD_GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .sc-cat-total span { font-size: 13px; color: rgba(150,180,240,.8); line-height: 1.4; }
  .sc-cat-list { display: flex; flex-direction: column; gap: 12px; flex: 1; }
  .sc-catrow { display: flex; flex-direction: column; gap: 5px; }
  .sc-crow-top { display: flex; justify-content: space-between; align-items: center; }
  .sc-cat-lbl {
    display: flex; align-items: center; gap: 8px;
    font-family: var(--font-rajdhani); font-size: 13px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase; color: rgba(200,220,255,.85);
  }
  .sc-cat-lbl i { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .sc-cat-val {
    font-family: var(--font-rajdhani); font-size: 14px; font-weight: 700; color: ${C_CYAN};
  }
  .sc-ctrack {
    height: 8px; border-radius: 4px; overflow: hidden;
    background: rgba(8,8,24,.72); box-shadow: inset 0 0 0 1px rgba(120,180,255,.30);
  }
  .sc-cfill {
    height: 100%; border-radius: 4px;
    box-shadow: 0 0 12px rgba(90,160,255,.5);
    transition: width 1.2s cubic-bezier(.2,.8,.2,1);
    position: relative;
  }
  .sc-cfill::after {
    content: ""; position: absolute; right: 0; top: 50%; transform: translateY(-50%);
    width: 4px; height: 4px; border-radius: 50%; background: #eafcff; box-shadow: 0 0 8px #6ef2ff;
  }

  /* ── Screen 2 column heads ── */
  .sc-col-head { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
  .sc-col-head h3 {
    font-size: 17px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: #fff;
  }
  .sc-col-head h3 b { background: ${GOLD_GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sc-col-bar { height: 2px; background: linear-gradient(90deg, ${C_CYAN}, ${C_VIOLET} 40%, transparent); }

  /* ── Featured stage (Screen 2 centre) ── */
  .sc-feat-stage { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .sc-feat-label {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-rajdhani), sans-serif;
    font-size: 13px; font-weight: 600; letter-spacing: 6px;
    text-transform: uppercase; color: #9db4ff; margin-bottom: 6px;
  }
  .sc-feat-card { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 6px 24px; }

  /* ── Spinner ── */
  .sc-spinner {
    width: 64px; height: 64px; border-radius: 50%;
    border: 4px solid rgba(255,255,255,.12);
    border-top-color: ${C_CYAN};
    animation: spin .9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Fade-in animation (used by keyed sub-screen elements) ── */
  @keyframes scFadeIn {
    from { opacity: 0; transform: translateY(18px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .sc-fade-in { animation: scFadeIn .45s cubic-bezier(.22,1,.36,1) both; }

  .sc-achiever-row { animation: scFadeIn .38s cubic-bezier(.22,1,.36,1) both; }

  /* ── Ticker scroll (used by outside-canvas ticker) ── */
  .sc-tk-move {
    display: flex; gap: 0; white-space: nowrap;
    font-family: var(--font-rajdhani), sans-serif; font-size: 29px;
    font-weight: 700; color: rgba(210,228,255,.95);
    animation: tickerScroll 48s linear infinite;
  }
  .sc-tk-move span { padding: 0 40px; display: inline-flex; align-items: center; gap: 22px; }
  .sc-tk-move b { color: ${C_CYAN}; font-weight: 800; }
  .sc-cross { color: rgba(200,180,255,.6); font-size: 18px; }
  @keyframes tickerScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
`;
