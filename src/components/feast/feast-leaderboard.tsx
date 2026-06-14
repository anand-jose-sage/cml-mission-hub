"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Trophy, ChevronDown } from "lucide-react";
import { getLeaderboard, type LeaderboardRow } from "@/actions/results";
import { useFeasts } from "@/hooks/use-feast";
import { SHAKHA_COLOR_MAP } from "@/lib/feast-data";
import { FeastTopBar, FeastTabs, type FeastTheme } from "./feast-shared";

// ─── Category breakdown config ────────────────────────────────────────────────

const CATS: { key: keyof LeaderboardRow; label: string; color: string; track: string }[] = [
  { key: "subJunior",   label: "Sub Junior",  color: "#0369A1", track: "#E0F2FE" },
  { key: "junior",      label: "Junior",       color: "#22C55E", track: "#DCFCE7" },
  { key: "senior",      label: "Senior",       color: "#8B5CF6", track: "#EDE9FE" },
  { key: "superSenior", label: "Super Senior", color: "#F59E0B", track: "#FEF3C7" },
  { key: "elder",       label: "Elder",        color: "#BE185D", track: "#FCE7F3" },
];

const MEDAL_EMOJI = ["🥇", "🥈", "🥉"] as const;
const MEDAL_COLOR  = ["#F5C542", "#9CA3AF", "#E0936A"];
const MEDAL_BG     = ["#FFFBEB", "#F9FAFB", "#FFF7ED"];
const MEDAL_BORDER = ["#F5C54266", "#9CA3AF44", "#E0936A44"];
const MEDAL_TEXT   = ["#92400E", "#1f2937", "#431407"];

function shakhaColor(name: string) {
  return SHAKHA_COLOR_MAP[name] ?? "#A78BFA";
}

// ─── Animated count-up ────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return val;
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

// Darken a #rrggbb hex by `amt` (0–1): each channel × (1 - amt).
function darken(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function AnimBar({ pct, color, track, delay = 0, animated }: {
  pct: number; color: string; track: string; delay?: number; animated: boolean;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!animated) { setW(0); return; }
    const t = setTimeout(() => setW(pct), delay);
    return () => clearTimeout(t);
  }, [pct, animated, delay]);
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: track }}>
      <div className="h-full rounded-full"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg, ${color}, ${darken(color, 0.42)})`,
          boxShadow: `0 0 8px ${darken(color, 0.3)}88`,
          transition: "width 0.8s cubic-bezier(.2,.8,.2,1)",
        }} />
    </div>
  );
}

// ─── Podium card ──────────────────────────────────────────────────────────────

function PodiumCard({ row, rankIdx, animated }: { row: LeaderboardRow; rankIdx: number; animated: boolean }) {
  const val = useCountUp(row.points, 900, animated);
  const isFirst = rankIdx === 0;
  const mc = MEDAL_COLOR[rankIdx];

  return (
    <div className="flex-1 flex flex-col items-center rounded-[18px] pt-4 pb-3 px-2 relative overflow-hidden"
      style={{
        background: MEDAL_BG[rankIdx],
        border: `1.5px solid ${MEDAL_BORDER[rankIdx]}`,
        boxShadow: isFirst ? `0 8px 28px ${mc}44, 0 0 0 1px ${mc}22` : `0 4px 14px rgba(0,0,0,0.06)`,
        marginTop: isFirst ? 0 : 14, minWidth: 0,
      }}
    >
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: `${mc}28`, filter: "blur(18px)" }} />
      <div className="relative w-11 h-11 rounded-full flex items-center justify-center mb-2 text-[20px]"
        style={{ background: `linear-gradient(135deg,${mc},${mc}88)`, boxShadow: `0 6px 18px ${mc}66` }}>
        {MEDAL_EMOJI[rankIdx]}
      </div>
      <p className="text-center leading-tight mb-1 w-full px-1 truncate"
        style={{ fontFamily: "var(--font-anek),sans-serif", fontWeight: 700, fontSize: isFirst ? 15 : 13, color: "#1E1B4B" }}>
        {row.name}
      </p>
      <p className="font-black tabular-nums"
        style={{ fontFamily: "var(--font-poppins),sans-serif", fontSize: isFirst ? 22 : 17, color: mc, lineHeight: 1.1 }}>
        {val}
      </p>
      <p className="text-[9px] font-semibold mt-0.5" style={{ color: mc + "aa" }}>pts</p>
      {isFirst && (row.firstCount > 0 || row.aGrade > 0) && (
        <div className="flex gap-2 mt-1.5 text-[10px] font-semibold" style={{ color: "#6B7280" }}>
          {row.firstCount > 0 && <span>🥇{row.firstCount}</span>}
          {row.aGrade > 0 && <span style={{ color: "#16A34A" }}>A:{row.aGrade}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Drill-down panel ─────────────────────────────────────────────────────────

function DrillDown({ row, animated }: { row: LeaderboardRow; animated: boolean }) {
  // Each category bar = that category's share of the shakha's TOTAL points.
  const total = row.points;
  const hasAchievements = row.firstCount + row.secondCount + row.thirdCount + row.aGrade + row.bGrade + row.cGrade > 0;

  return (
    <div className="pt-1 pb-3 px-3">
      <p className="text-[12px] font-black uppercase tracking-widest mb-2.5" style={{ color: "#5B21B6" }}>Category Breakdown</p>
      <div className="space-y-2.5">
        {CATS.map((cat, i) => {
          const pts = row[cat.key] as number;
          const pct = total > 0 ? (pts / total) * 100 : 0;
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-black" style={{ color: cat.color }}>{cat.label}</span>
                <span className="text-[14px] font-black tabular-nums" style={{ color: pts > 0 ? cat.color : "#D1D5DB" }}>
                  {pts > 0 ? `${pts} pts` : "—"}
                </span>
              </div>
              <AnimBar pct={pct} color={cat.color} track={cat.track} delay={i * 60} animated={animated} />
            </div>
          );
        })}
      </div>

      {hasAchievements && (
        <>
          <p className="text-[12px] font-black uppercase tracking-widest mt-4 mb-2" style={{ color: "#5B21B6" }}>Achievements</p>
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(107,70,255,0.1)" }}>
            <div className="flex-1 flex items-center justify-around py-2.5 px-2" style={{ background: "rgba(255,255,255,0.7)" }}>
              {([["🥇", row.firstCount, "#92400E"], ["🥈", row.secondCount, "#374151"], ["🥉", row.thirdCount, "#7C2D12"]] as const).map(([e, c, t]) => (
                <div key={String(e)} className="text-center">
                  <p className="text-[14px]">{e}</p>
                  <p className="text-[14px] font-black" style={{ color: t }}>{c}</p>
                </div>
              ))}
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(107,70,255,0.12)" }} />
            <div className="flex-1 flex items-center justify-around py-2.5 px-2" style={{ background: "rgba(255,255,255,0.5)" }}>
              {([["A", row.aGrade, "#16A34A"], ["B", row.bGrade, "#D97706"], ["C", row.cGrade, "#7C3AED"]] as const).map(([g, c, t]) => (
                <div key={g} className="text-center">
                  <p className="text-[11px] font-black px-1.5 py-0.5 rounded-md mb-0.5" style={{ background: t, color: "#fff" }}>{g}</p>
                  <p className="text-[14px] font-black" style={{ color: t }}>{c}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Shakha row ───────────────────────────────────────────────────────────────

function ShakhaRow({ row, animated, defaultOpen }: {
  row: LeaderboardRow; animated: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const val = useCountUp(row.points, 900, animated);
  const rankIdx = row.rank - 1;
  const isTop3 = rankIdx >= 0 && rankIdx < 3;
  const mc = isTop3 ? MEDAL_COLOR[rankIdx] : "#8B5CF6";
  const color = shakhaColor(row.name);
  const anek: React.CSSProperties = { fontFamily: "var(--font-anek),sans-serif", fontWeight: 700 };

  return (
    <div className="relative overflow-hidden mb-2.5"
      style={{
        borderRadius: 18,
        background: open ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.58)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        border: open ? `1.5px solid ${mc}44` : "1.5px solid rgba(255,255,255,0.75)",
        boxShadow: open ? `0 8px 28px ${mc}22, 0 2px 8px rgba(107,70,255,0.08)` : "0 2px 10px rgba(107,70,255,0.05)",
        transition: "box-shadow 0.3s,border-color 0.3s,background 0.3s",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-[18px]" style={{ background: color }} />
      <button onClick={() => setOpen(o => !o)} className="w-full border-none bg-transparent pl-4 pr-3 pt-3 pb-2.5 cursor-pointer">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black"
            style={{
              fontSize: isTop3 ? 16 : 13,
              background: isTop3 ? `linear-gradient(135deg,${MEDAL_COLOR[rankIdx]},${MEDAL_COLOR[rankIdx]}99)` : "rgba(107,70,255,0.1)",
              color: isTop3 ? MEDAL_TEXT[rankIdx] : "#8B5CF6",
              boxShadow: isTop3 ? `0 4px 12px ${MEDAL_COLOR[rankIdx]}55` : "none",
            }}>
            {isTop3 ? MEDAL_EMOJI[rankIdx] : row.rank}
          </div>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 7px ${color}` }} />
            <span className="text-[15px] truncate" style={{ color: "#1E1B4B", ...anek }}>{row.name}</span>
          </div>
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="font-black tabular-nums text-[18px]" style={{ fontFamily: "var(--font-poppins),sans-serif", color: mc }}>{val}</span>
            <span className="text-[10px] font-semibold" style={{ color: mc + "aa" }}>pts</span>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300"
            style={{ background: "rgba(107,70,255,0.08)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <ChevronDown size={13} color="#8B5CF6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {([["🥇", row.firstCount, 0], ["🥈", row.secondCount, 1], ["🥉", row.thirdCount, 2]] as const).map(([emoji, count, mi]) => (
            <div key={emoji} className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: MEDAL_BG[mi], border: `1px solid ${MEDAL_BORDER[mi]}` }}>
              <span className="text-[12px] leading-none">{emoji}</span>
              <span className="text-[12px] font-black tabular-nums leading-none"
                style={{ color: count > 0 ? MEDAL_TEXT[mi] : "#C4B5FD" }}>{count}</span>
            </div>
          ))}
        </div>
      </button>
      <div className="overflow-hidden transition-all"
        style={{ maxHeight: open ? 560 : 0, transitionDuration: "0.34s", transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}>
        <div className="mx-3 mb-1 rounded-xl" style={{ background: "rgba(107,70,255,0.04)", border: "1px solid rgba(107,70,255,0.08)" }}>
          <DrillDown row={row} animated={open && animated} />
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function FeastLeaderboard({ slug, theme, onBack, onExit, setFeastSlug }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  setFeastSlug: (s: string) => void;
}) {
  const { feasts, loading: feastsLoading } = useFeasts();
  const [activeSlug, setActiveSlug] = useState(slug);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-select first feast once DB feasts are loaded
  useEffect(() => {
    if (feasts.length > 0 && !feasts.find(f => f.slug === activeSlug)) {
      setActiveSlug(feasts[0].slug);
    }
  }, [feasts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load leaderboard once feasts are loaded AND activeSlug is a confirmed feast.
  // Fetching before the slug is validated would briefly return an empty result
  // (feast-not-found) and flash the "No standings" state before the real data.
  useEffect(() => {
    if (feastsLoading) return;                       // wait for the feast list
    if (!feasts.some(f => f.slug === activeSlug)) {   // slug not (yet) valid
      if (feasts.length === 0) setLoading(false);     // truly no feasts → stop spinner
      return;                                         // else auto-select will fix it
    }

    setLoading(true);
    setRows([]);
    setAnimated(false);
    if (animTimer.current) clearTimeout(animTimer.current);

    getLeaderboard(activeSlug)
      .then(({ data, error }) => {
        if (error) console.error("[leaderboard]", error);
        setRows(data ?? []);
        setLoading(false);
        animTimer.current = setTimeout(() => setAnimated(true), 100);
      })
      .catch(err => {
        console.error("[leaderboard]", err);
        setLoading(false);
      });

    return () => { if (animTimer.current) clearTimeout(animTimer.current); };
  }, [activeSlug, feastsLoading, feasts]);

  const handlePick = (s: string) => {
    setActiveSlug(s);
    setFeastSlug(s);
  };

  // getLeaderboard returns every shakha (0 pts when nothing is published yet),
  // so "empty" means no points anywhere — not an empty array.
  const hasResults = rows.some((r) => r.points > 0);
  const top3 = rows.slice(0, 3);
  const podiumSlots: [LeaderboardRow | undefined, number][] = [
    [top3[1], 1], [top3[0], 0], [top3[2], 2],
  ];

  return (
    <div className="px-4">
      <FeastTopBar title="Rankings" onBack={onBack} onExit={onExit} theme={theme} />

      {/* Feast selector from DB */}
      <FeastTabs feasts={feasts} active={activeSlug} onPick={handlePick} loading={feastsLoading} />

      {loading || feastsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin" style={{ color: theme.lavender }} />
        </div>
      ) : !hasResults ? (
        <div className="flex justify-center py-10">
          <div
            className="relative overflow-hidden rounded-[24px] px-7 pt-9 pb-8 flex flex-col items-center text-center w-full max-w-[320px]"
            style={{ background: "linear-gradient(145deg,#ede9fe,#f5f3ff,#fdf4ff)", border: "1px solid rgba(107,70,255,0.12)" }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-10 right-0 w-40 h-40 pointer-events-none rounded-full"
              style={{ background: "radial-gradient(circle,rgba(167,139,250,0.28) 0%,transparent 70%)", filter: "blur(22px)" }} />
            <div className="absolute -bottom-8 -left-6 w-32 h-32 pointer-events-none rounded-full"
              style={{ background: "radial-gradient(circle,rgba(245,197,66,0.18) 0%,transparent 70%)", filter: "blur(20px)" }} />

            <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg,#6B46FF,#A78BFA)", boxShadow: "0 8px 22px rgba(107,70,255,0.35)" }}>
              <Trophy size={28} color="#fff" />
            </div>
            <p className="relative text-[18px] font-black mb-1.5" style={{ color: "#1E1B4B", fontFamily: "var(--font-anek),sans-serif" }}>
              No standings yet
            </p>
            <p className="relative text-[13.5px] leading-relaxed" style={{ color: "#6D5BA6" }}>
              Rankings will appear here once competition results are published for this feast.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={13} color="#F5C542" />
                <p className="text-[14px] font-black uppercase tracking-widest" style={{ color: "#5B21B6" }}>Top Shakhas</p>
              </div>
              <div className="rounded-[22px] p-3 relative overflow-hidden"
                style={{ background: "linear-gradient(145deg,#ede9fe,#f5f3ff,#fdf4ff)", border: "1px solid rgba(107,70,255,0.1)" }}>
                <div className="absolute -top-8 right-0 w-40 h-40 pointer-events-none rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(167,139,250,0.22) 0%,transparent 70%)", filter: "blur(22px)" }} />
                <div className="absolute bottom-0 -left-6 w-32 h-32 pointer-events-none rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(245,197,66,0.18) 0%,transparent 70%)", filter: "blur(20px)" }} />
                <div className="relative flex gap-2 items-end">
                  {podiumSlots.map(([row, rankIdx]) =>
                    row
                      ? <PodiumCard key={row.shakhaId} row={row} rankIdx={rankIdx} animated={animated} />
                      : <div key={rankIdx} className="flex-1" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[14px] font-black uppercase tracking-widest" style={{ color: "#5B21B6" }}>All Shakhas</p>
            <div className="flex-1 h-px" style={{ background: "rgba(107,70,255,0.1)" }} />
            <p className="text-[12px] font-bold" style={{ color: "#6D28D9" }}>{rows.length} shakhas</p>
          </div>

          {rows.map((row, i) => (
            <ShakhaRow key={row.shakhaId} row={row} animated={animated} defaultOpen={i === 0} />
          ))}
        </>
      )}
      <div className="h-6" />
    </div>
  );
}
