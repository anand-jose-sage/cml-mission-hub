"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Trophy, ChevronDown } from "lucide-react";
import { getLeaderboard, getOverallLeaderboard, type LeaderboardRow } from "@/actions/results";
import { useFeasts } from "@/hooks/use-feast";
import { SHAKHA_COLOR_MAP } from "@/lib/feast-data";
import { FeastTopBar, FeastTabs, type FeastTheme } from "./feast-shared";
import { motion } from "framer-motion";
import { type MedalPos, MedalCounts, Medal, NB, TONE_BAR, isMedalPos, toneStyle, toneText } from "./nebula-ui";

// ─── Category breakdown config ────────────────────────────────────────────────

const CATS: { key: keyof LeaderboardRow; label: string; color: string; track: string }[] = [
  { key: "subJunior",   label: "Sub Junior",  color: "#38BDF8", track: "rgba(56,189,248,0.14)" },
  { key: "junior",      label: "Junior",       color: "#22C55E", track: "#DCFCE7" },
  { key: "senior",      label: "Senior",       color: "#B44CFF", track: "#1E1048" },
  { key: "superSenior", label: "Super Senior", color: "#F59E0B", track: "rgba(245,197,66,0.18)" },
  { key: "elder",       label: "Elder",        color: "#FF6FB0", track: "rgba(255,63,180,0.14)" },
];


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

// ─── Podium (fest_hub standings trophy podium, Nebula Glass, phone size) ──────

const PED: Record<MedalPos, { bg: string; line: string }> = {
  1: { bg: "linear-gradient(180deg, rgba(255,214,107,0.42) 0%, rgba(245,197,66,0.16) 42%, rgba(245,197,66,0.03) 100%)", line: "rgba(255,214,107,0.55)" },
  2: { bg: "linear-gradient(180deg, rgba(220,226,236,0.28) 0%, rgba(220,226,236,0.09) 50%, rgba(220,226,236,0.02) 100%)", line: "rgba(235,238,244,0.3)" },
  3: { bg: "linear-gradient(180deg, rgba(199,138,90,0.3) 0%, rgba(199,138,90,0.1) 50%, rgba(199,138,90,0.02) 100%)", line: "rgba(227,170,124,0.32)" },
};
// [2nd, 1st, 3rd], like the podium.
const PS = { medal: [46, 64, 42], name: [17, 23, 17], pts: [30, 48, 27], ped: [104, 150, 78], numeral: [62, 92, 50], gap: 8 };
const GOLD_INK = "#FFD66B";

function RibbonMedal({ pos, size }: { pos: MedalPos; size: number }) {
  const tailW = Math.round(size * 0.24);
  const tailH = Math.round(size * 0.58);
  const inset = Math.round(size * 0.2);
  const ribbon = "linear-gradient(90deg, #5A1FB8 0 34%, #F5C542 34% 66%, #5A1FB8 66%)";
  return (
    <span aria-hidden="true" className="relative block" style={{ width: size + 4, height: size + tailH * 0.5 }}>
      <span className="absolute top-0 rounded-[2px]" style={{ left: inset, width: tailW, height: tailH, transform: "skewX(16deg)", background: ribbon }} />
      <span className="absolute top-0 rounded-[2px]" style={{ right: inset, width: tailW, height: tailH, transform: "skewX(-16deg)", background: ribbon }} />
      <span className="absolute bottom-0 left-[2px]"><Medal pos={pos} size={size} /></span>
    </span>
  );
}

function Sparkle({ size, color, style, delay }: { size: number; color: string; style: React.CSSProperties; delay: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute"
      style={{ color, ...style }}
      animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.1, 0.7] }}
      transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path fill="currentColor" d="M12 2 13.8 10.2 22 12 13.8 13.8 12 22 10.2 13.8 2 12 10.2 10.2Z" />
      </svg>
    </motion.span>
  );
}

function PodiumColumn({ row, pos, lead, behind, animated, delay }: {
  row: LeaderboardRow; pos: MedalPos; lead: number; behind: number; animated: boolean; delay: number;
}) {
  const i = pos === 1 ? 1 : pos === 2 ? 0 : 2;
  const val = useCountUp(row.points, 1300, animated);
  const first = pos === 1;
  const longest = Math.max(4, ...row.name.split(/\s+/).map((w) => w.length));
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex min-w-0 flex-col items-center text-center [container-type:inline-size]"
    >
      {first && (
        <span className="mb-3 inline-flex h-[22px] items-center rounded-full px-2.5 text-[9.5px] font-extrabold tracking-[0.2em]" style={{ background: "rgba(245,197,66,0.16)", border: "1px solid rgba(217,144,26,0.35)", color: GOLD_INK }}>
          LEADING
        </span>
      )}
      <RibbonMedal pos={pos} size={PS.medal[i]} />
      <span
        className="mt-3 line-clamp-2 max-w-full font-black uppercase [overflow-wrap:break-word]"
        style={{ fontSize: `min(${PS.name[i]}px, calc(100cqi / ${(longest * 0.64).toFixed(2)}))`, lineHeight: 1, color: NB.text, fontFamily: NB.ml }}
        title={row.name}
      >
        {row.name}
      </span>
      <span className="mt-2 flex items-baseline gap-1">
        <span className="font-extrabold tabular-nums leading-none" style={{ fontFamily: NB.num, fontSize: PS.pts[i], ...(first ? toneText(1) : { color: NB.text }) }}>{val}</span>
        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.12em]" style={{ color: first ? GOLD_INK : NB.faint }}>pts</span>
      </span>
      <span className="mt-1 text-[11.5px]" style={{ color: first ? GOLD_INK : NB.faint, fontWeight: first ? 800 : 700 }}>
        {first ? (lead > 0 ? `+${lead} lead` : "Tied") : behind > 0 ? `${behind} behind` : "Tied"}
      </span>
      <span
        className="relative mt-3 flex w-full justify-center overflow-hidden"
        style={{
          height: PS.ped[i],
          paddingTop: Math.round(PS.ped[i] * 0.08),
          borderRadius: first ? "16px 16px 0 0" : "14px 14px 0 0",
          border: `1px solid ${PED[pos].line}`,
          borderBottom: 0,
          background: PED[pos].bg,
          boxShadow: first ? "inset 0 1px 0 rgba(255,246,214,.6), 0 -10px 40px rgba(245,197,66,.2)" : undefined,
        }}
      >
        <span aria-hidden="true" className="font-black leading-[0.92]" style={{ fontSize: PS.numeral[i], fontFamily: NB.num, ...toneText(pos) }}>{pos}</span>
        {first && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[45%]"
            style={{ background: "linear-gradient(90deg, rgba(255,246,214,0), rgba(255,246,214,.45), rgba(255,246,214,0))", skewX: -18 }}
            initial={{ x: "-160%" }}
            animate={{ x: "320%" }}
            transition={{ duration: 1.8, delay: 1.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          />
        )}
      </span>
    </motion.div>
  );
}

function Podium({ top, animated }: { top: LeaderboardRow[]; animated: boolean }) {
  const [p1, p2, p3] = top;
  if (!p1) return null;
  return (
    <section aria-label="Top three shakhas" className="relative mb-5">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 rounded-full"
        style={{
          width: 440, height: 440, marginLeft: -220, top: -70,
          background: "repeating-conic-gradient(from 0deg, rgba(180,76,255,0.12) 0deg 3deg, rgba(0,0,0,0) 3deg 15deg)",
          WebkitMaskImage: "radial-gradient(circle, #000 0%, rgba(0,0,0,0.55) 32%, transparent 64%)",
          maskImage: "radial-gradient(circle, #000 0%, rgba(0,0,0,0.55) 32%, transparent 64%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 rounded-full" style={{ width: 270, height: 270, marginLeft: -135, top: -10, background: "radial-gradient(circle, rgba(255,214,107,0.36) 0%, transparent 70%)" }} />
      <Sparkle size={13} color="#F5C542" style={{ left: "30%", top: 12 }} delay={0.2} />
      <Sparkle size={9} color="#FF3FB4" style={{ right: "28%", top: 56 }} delay={1.1} />
      <Sparkle size={8} color="#E08BFF" style={{ left: "33%", top: 136 }} delay={1.8} />
      <Sparkle size={10} color="#F5C542" style={{ right: "32%", top: 152 }} delay={0.7} />
      <div className="relative grid items-end" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.22fr) minmax(0,1fr)", gap: PS.gap }}>
        {p2 ? <PodiumColumn row={p2} pos={2} lead={0} behind={p1.points - p2.points} animated={animated} delay={0.2} /> : <div />}
        <PodiumColumn row={p1} pos={1} lead={p2 ? p1.points - p2.points : p1.points} behind={0} animated={animated} delay={0.45} />
        {p3 ? <PodiumColumn row={p3} pos={3} lead={0} behind={p1.points - p3.points} animated={animated} delay={0.05} /> : <div />}
      </div>
      <div aria-hidden="true" className="relative h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #F5C542, transparent)" }} />
      <div aria-hidden="true" className="mx-1.5 h-[30px]" style={{ background: "linear-gradient(180deg, rgba(245,197,66,0.16), transparent)" }} />
    </section>
  );
}

// ─── Drill-down panel ─────────────────────────────────────────────────────────

function DrillDown({ row, animated }: { row: LeaderboardRow; animated: boolean }) {
  // Each category bar = that category's share of the shakha's TOTAL points.
  const total = row.points;
  const hasAchievements = row.firstCount + row.secondCount + row.thirdCount + row.aGrade + row.bGrade + row.cGrade > 0;

  return (
    <div className="pt-1 pb-3 px-3">
      <p className="text-[12px] font-black uppercase tracking-widest mb-2.5" style={{ color: "#E08BFF" }}>Category Breakdown</p>
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
          <p className="text-[12px] font-black uppercase tracking-widest mt-4 mb-2" style={{ color: "#E08BFF" }}>Achievements</p>
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(180,76,255,0.1)" }}>
            <div className="flex-1 flex items-center justify-around py-2.5 px-2" style={{ background: "rgba(30,18,72,0.7)" }}>
              {([["🥇", row.firstCount, "#FFD66B"], ["🥈", row.secondCount, "#E4E0FA"], ["🥉", row.thirdCount, "#F4B98A"]] as const).map(([e, c, t]) => (
                <div key={String(e)} className="text-center">
                  <p className="text-[14px]">{e}</p>
                  <p className="text-[14px] font-black" style={{ color: t }}>{c}</p>
                </div>
              ))}
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(180,76,255,0.12)" }} />
            <div className="flex-1 flex items-center justify-around py-2.5 px-2" style={{ background: "rgba(30,18,72,0.5)" }}>
              {([["A", row.aGrade, "#16A34A"], ["B", row.bGrade, "#D97706"], ["C", row.cGrade, "#E08BFF"]] as const).map(([g, c, t]) => (
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

// ─── Shakha row (fest_hub MobileRow, shakha only) ─────────────────────────────

function ShakhaRow({ row, top, animated, defaultOpen, divider }: {
  row: LeaderboardRow; top: number; animated: boolean; defaultOpen?: boolean; divider?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const val = useCountUp(row.points, 900, animated);
  const podium = isMedalPos(row.rank) ? row.rank : null;
  const color = shakhaColor(row.name);
  const pct = Math.max(3, top > 0 ? Math.round((row.points / top) * 100) : 0);

  return (
    <div
      className="relative overflow-hidden"
      style={podium
        ? { ...toneStyle(podium), borderRadius: 18, marginBottom: podium === 3 ? 16 : 8, boxShadow: podium === 1 ? "0 12px 30px rgba(245,197,66,.2)" : undefined }
        : { background: open ? NB.rowOpen : "transparent", borderTop: divider ? `1px solid ${NB.line}` : undefined }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full items-center gap-x-3 gap-y-1.5 text-left border-none bg-transparent cursor-pointer"
        style={{
          gridTemplateColumns: podium ? "auto auto minmax(0,1fr) auto auto" : "auto minmax(0,1fr) auto auto",
          padding: podium ? "15px 14px 10px" : "11px 14px 8px",
          color: NB.text,
        }}
      >
        <span className="row-span-2 w-[34px] font-extrabold tabular-nums leading-none" style={{ fontFamily: NB.num, fontSize: podium ? 30 : 21, ...(podium ? toneText(podium) : { color: NB.faint }) }}>
          {String(row.rank).padStart(2, "0")}
        </span>
        {podium && <Medal pos={podium} size={30} />}
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate font-extrabold leading-tight tracking-[-0.01em]" style={{ fontSize: podium ? 17 : 15.5, fontFamily: NB.ml }}>{row.name}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="font-extrabold tabular-nums leading-none" style={{ fontFamily: NB.num, fontSize: podium ? 30 : 22 }}>{val}</span>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em]" style={{ color: NB.faint }}>pts</span>
        </span>
        <ChevronDown className="row-span-2 h-[18px] w-[18px] transition-transform duration-300" style={{ color: NB.faint, transform: open ? "rotate(180deg)" : undefined }} />
        <span className={`flex items-center gap-x-3 ${podium ? "col-span-3 col-start-2" : "col-span-2 col-start-2"}`}>
          <MedalCounts g={row.firstCount} s={row.secondCount} b={row.thirdCount} size={11} className="text-[12.5px]" />
        </span>
      </button>
      <div aria-hidden="true" className="mx-4 mb-[11px] h-[2px] rounded-sm" style={{ background: NB.track }}>
        <div className="h-full rounded-sm" style={{ width: animated ? `${pct}%` : 0, transition: "width 0.8s cubic-bezier(.2,.8,.2,1)", background: podium ? TONE_BAR[podium] : "#E08BFF" }} />
      </div>
      {open && (
        <div className="px-1 pb-2">
          <DrillDown row={row} animated={animated} />
        </div>
      )}
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
  const [mode, setMode] = useState<"feast" | "overall">("feast");
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

  // Load the overall (all-feast) leaderboard whenever that mode is active.
  useEffect(() => {
    if (mode !== "overall") return;

    setLoading(true);
    setRows([]);
    setAnimated(false);
    if (animTimer.current) clearTimeout(animTimer.current);

    getOverallLeaderboard()
      .then(({ data, error }) => {
        if (error) console.error("[overall-leaderboard]", error);
        setRows(data ?? []);
        setLoading(false);
        animTimer.current = setTimeout(() => setAnimated(true), 100);
      })
      .catch(err => {
        console.error("[overall-leaderboard]", err);
        setLoading(false);
      });

    return () => { if (animTimer.current) clearTimeout(animTimer.current); };
  }, [mode]);

  // Load leaderboard once feasts are loaded AND activeSlug is a confirmed feast.
  // Fetching before the slug is validated would briefly return an empty result
  // (feast-not-found) and flash the "No standings" state before the real data.
  useEffect(() => {
    if (mode !== "feast") return;
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
  }, [activeSlug, feastsLoading, feasts, mode]);

  const handlePick = (s: string) => {
    setMode("feast");
    setActiveSlug(s);
    setFeastSlug(s);
  };

  // getLeaderboard returns every shakha (0 pts when nothing is published yet),
  // so "empty" means no points anywhere — not an empty array.
  const hasResults = rows.some((r) => r.points > 0);
  const top3 = rows.slice(0, 3);

  return (
    <div className="px-4">
      <FeastTopBar title="Rankings" onBack={onBack} onExit={onExit} theme={theme} />

      {/* This Feast / Overall toggle */}
      <div className="flex gap-2 mb-3 p-1 rounded-[14px]" style={{ background: "rgba(180,76,255,0.06)" }}>
        {([["feast", "Feasts"], ["overall", "Overall"]] as const).map(([m, label]) => {
          const on = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-[11px] font-bold text-[13px] cursor-pointer active:scale-95 transition-transform"
              style={{
                fontFamily: "var(--font-poppins), sans-serif",
                background: on ? "linear-gradient(135deg, #B44CFF, #A78BFA)" : "transparent",
                color: on ? "#fff" : "#C9C2F0",
                boxShadow: on ? "0 6px 16px rgba(180,76,255,0.3)" : "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Feast selector from DB — only meaningful in "This Feast" mode */}
      {mode === "feast" && (
        <FeastTabs theme={theme} feasts={feasts} active={activeSlug} onPick={handlePick} loading={feastsLoading} />
      )}

      {loading || (mode === "feast" && feastsLoading) ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin" style={{ color: theme.lavender }} />
        </div>
      ) : !hasResults ? (
        <div className="flex justify-center py-10">
          <div
            className="relative overflow-hidden rounded-[24px] px-7 pt-9 pb-8 flex flex-col items-center text-center w-full max-w-[320px]"
            style={{ background: "linear-gradient(145deg,#1E1048,#1A0E40,#1A0E40)", border: "1px solid rgba(180,76,255,0.12)" }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-10 right-0 w-40 h-40 pointer-events-none rounded-full"
              style={{ background: "radial-gradient(circle,rgba(167,139,250,0.28) 0%,transparent 70%)", filter: "blur(22px)" }} />
            <div className="absolute -bottom-8 -left-6 w-32 h-32 pointer-events-none rounded-full"
              style={{ background: "radial-gradient(circle,rgba(245,197,66,0.18) 0%,transparent 70%)", filter: "blur(20px)" }} />

            <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg,#B44CFF,#A78BFA)", boxShadow: "0 8px 22px rgba(180,76,255,0.35)" }}>
              <Trophy size={28} color="#fff" />
            </div>
            <p className="relative text-[18px] font-black mb-1.5" style={{ color: "#F4F1FF", fontFamily: "var(--font-anek),sans-serif" }}>
              No standings yet
            </p>
            <p className="relative text-[13.5px] leading-relaxed" style={{ color: "#C9C2F0" }}>
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
                <p className="text-[14px] font-black uppercase tracking-widest" style={{ color: "#E08BFF" }}>Top Shakhas</p>
              </div>
              <Podium top={rows.slice(0, 3)} animated={animated} />
            </div>
          )}

          {/* Full list */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[14px] font-black uppercase tracking-widest" style={{ color: "#E08BFF" }}>All Shakhas</p>
            <div className="flex-1 h-px" style={{ background: "rgba(180,76,255,0.1)" }} />
            <p className="text-[12px] font-bold" style={{ color: "#6D28D9" }}>{rows.length} shakhas</p>
          </div>

          {rows.filter((r) => isMedalPos(r.rank)).map((row, i) => (
            <ShakhaRow key={row.shakhaId} row={row} top={rows[0]?.points ?? 0} animated={animated} defaultOpen={i === 0} />
          ))}
          {rows.some((r) => !isMedalPos(r.rank)) && (
            <div className="overflow-hidden rounded-[18px]" style={{ background: "rgba(24,14,60,0.8)", border: "1px solid rgba(214,170,255,0.22)" }}>
              {rows.filter((r) => !isMedalPos(r.rank)).map((row, i) => (
                <ShakhaRow key={row.shakhaId} row={row} top={rows[0]?.points ?? 0} animated={animated} divider={i > 0} />
              ))}
            </div>
          )}
        </>
      )}
      <div className="h-6" />
    </div>
  );
}
