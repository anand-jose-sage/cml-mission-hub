"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Megaphone,
  Users,
  BookOpen,
  Heart,
  Volume2,
  Flame,
  Loader2,
} from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import { useActivities, type ActivityItem } from "@/hooks/use-activities";

/* ─── constants ────────────────────────────────────────── */
const INK = "#241F4D";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ─── activity tint system ─────────────────────────────── */
const AT: Record<string, { pale: string; ink: string; dot: string; soft: string }> = {
  purple: { pale: "#EDE7FF", ink: "#5B3FCC", dot: "#7C5CFF", soft: "rgba(91,63,204,0.12)" },
  coral:  { pale: "#FFE7DC", ink: "#B5402B", dot: "#F4663F", soft: "rgba(181,64,43,0.12)" },
  gold:   { pale: "#FFF1CB", ink: "#9A6A00", dot: "#E2A312", soft: "rgba(154,106,0,0.14)" },
  mint:   { pale: "#DCF6E6", ink: "#15803D", dot: "#2FB269", soft: "rgba(21,128,61,0.12)" },
  sky:    { pale: "#DCEDFF", ink: "#0B6BB8", dot: "#3DA0F0", soft: "rgba(11,107,184,0.12)" },
};

/* ─── icon lookup ──────────────────────────────────────── */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Calendar, Sparkles, Megaphone, Users, BookOpen, Heart, Volume2, Flame, Clock, MapPin,
};

/* ─── today ────────────────────────────────────────────── */
const NOW = new Date();
const TODAY = { y: NOW.getFullYear(), m: NOW.getMonth(), d: NOW.getDate() };

/* ─── helpers ──────────────────────────────────────────── */
function covers(act: ActivityItem, d: number) {
  return act.end ? (d >= act.d && d <= act.end) : act.d === d;
}

function listFor(items: ActivityItem[], y: number, m: number) {
  return items.filter((a) => a.year === y && a.month === m).sort((a, b) => a.d - b.d);
}

/* ─── DayCell ──────────────────────────────────────────── */
function DayCell({
  d,
  acts,
  isToday,
  selected,
  isSunday,
  onSelect,
}: {
  d: number | null;
  acts: ActivityItem[];
  isToday: boolean;
  selected: boolean;
  isSunday: boolean;
  onSelect: (d: number) => void;
}) {
  if (d == null) return <div className="aspect-square" />;

  const special = acts.some((a) => a.special);
  const dotTints = [...new Set(acts.filter((a) => !a.saint).map((a) => a.tint))].slice(0, 3);

  let bgStyle = "transparent";
  let numColor = isSunday ? "#DC2626" : INK;
  let numWeight = 600;
  let shadow = "none";

  if (selected) {
    bgStyle = "linear-gradient(155deg, #6B46FF, #A78BFA)";
    shadow = "0 8px 18px rgba(107,70,255,0.42)";
    numColor = "#fff";
    numWeight = 700;
  } else if (isToday) {
    bgStyle = "transparent";
    shadow = "inset 0 0 0 2px #16A34A";
    numColor = "#15803D";
    numWeight = 700;
  } else if (acts.length > 0) {
    bgStyle = "rgba(107,70,255,0.05)";
  }

  return (
    <button
      onClick={() => onSelect(d)}
      className="aspect-square rounded-full border-none cursor-pointer p-0 flex items-center justify-center relative active:scale-[0.92] transition-transform"
      style={{
        background: bgStyle,
        boxShadow: shadow,
      }}
    >
      {/* saint gold ring when selected */}
      {acts.some((a) => a.saint) && selected && (
        <span
          className="absolute rounded-full"
          style={{ inset: -3, border: "2px solid #F5C542" }}
        />
      )}

      <span
        className="relative font-[family-name:var(--font-poppins)] leading-none"
        style={{ fontSize: 14.5, fontWeight: numWeight, color: numColor }}
      >
        {d}
      </span>

      {/* markers */}
      {(special || dotTints.length > 0) && (
        <span className="absolute bottom-[4%] left-0 right-0 flex justify-center items-center gap-[2.5px] h-[6px]">
          {special && (
            <Sparkles
              size={8.5}
              fill={selected ? "#fff" : "#E2A312"}
              color={selected ? "#fff" : "#E2A312"}
            />
          )}
          {dotTints.map((tn, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 4.5,
                height: 4.5,
                background: selected ? "rgba(255,255,255,0.9)" : AT[tn].dot,
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

/* ─── MonthGrid ────────────────────────────────────────── */
function MonthGrid({
  y,
  m,
  sel,
  acts,
  onSelect,
}: {
  y: number;
  m: number;
  sel: number | null;
  acts: ActivityItem[];
  onSelect: (d: number) => void;
}) {
  const monthActs = listFor(acts, y, m);
  const first = new Date(y, m, 1).getDay(); // 0=Sun already
  const offset = first; // Sunday-first
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="grid grid-cols-7 gap-y-1 gap-x-[2px]">
      {cells.map((d, i) => (
        <DayCell
          key={i}
          d={d}
          acts={d == null ? [] : monthActs.filter((a) => covers(a, d))}
          isToday={y === TODAY.y && m === TODAY.m && d === TODAY.d}
          selected={sel != null && d === sel}
          isSunday={i % 7 === 0}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/* ─── ActivityRow ──────────────────────────────────────── */
function ActivityRow({ a, m }: { a: ActivityItem; m: number }) {
  const t = AT[a.tint];
  const IconComp = ICON_MAP[a.icon];
  const dateLabel = a.end ? `${a.d}–${a.end}` : String(a.d);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex overflow-hidden mb-[11px]"
      style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 8px 22px rgba(36,31,77,0.07)",
        borderLeft: `4px solid ${t.dot}`,
      }}
    >
      {/* date block */}
      <div
        className="shrink-0 flex flex-col items-center justify-center gap-[1px]"
        style={{
          width: 62,
          background: t.pale,
          padding: "12px 4px",
        }}
      >
        <span
          className="font-[family-name:var(--font-poppins)] font-bold leading-none"
          style={{ fontSize: a.end ? 17 : 22, color: t.ink }}
        >
          {dateLabel}
        </span>
        <span
          className="font-bold tracking-wide"
          style={{ fontSize: 9.5, letterSpacing: 0.8, color: t.ink, opacity: 0.75 }}
        >
          {MABBR[m]}
        </span>
      </div>

      {/* body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ padding: "11px 14px 11px 12px" }}>
        <div className="flex items-center gap-1.5 mb-1">
          {IconComp && <IconComp size={12.5} color={t.ink} strokeWidth={2} />}
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold uppercase tracking-wide"
            style={{ fontSize: 10.5, letterSpacing: 0.3, color: t.ink }}
          >
            {a.cat}
          </span>
          {a.allDay && (
            <span
              className="ml-auto font-bold uppercase tracking-wide rounded-full"
              style={{
                fontSize: 9.5,
                letterSpacing: 0.3,
                color: t.ink,
                background: t.soft,
                padding: "2px 7px",
              }}
            >
              All day
            </span>
          )}
        </div>
        <div
          className="font-[family-name:var(--font-poppins)] font-semibold leading-[1.25] tracking-[-0.2px]"
          style={{ fontSize: 14.5, color: INK }}
        >
          {a.title}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: COLORS.sub }}>
            <Clock size={12.5} color={COLORS.faint} strokeWidth={2} />
            {a.time}
          </span>
          {a.venue && (
            <span className="inline-flex items-center gap-1 text-[11.5px] min-w-0" style={{ color: COLORS.sub }}>
              <MapPin size={12.5} color={COLORS.faint} strokeWidth={2} className="shrink-0" />
              <span className="truncate">{a.venue}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITIES SCREEN
   ═══════════════════════════════════════════════════════════ */
interface ActivitiesScreenProps {
  theme: CMLTheme;
}

export function ActivitiesScreen({ theme }: ActivitiesScreenProps) {
  const { items: allActivities, loading } = useActivities();
  const [view, setView] = useState({ y: TODAY.y, m: TODAY.m });
  const [sel, setSel] = useState<number | null>(null);
  const [drag, setDrag] = useState(0);
  const dragRef = useRef<{ x: number; y: number; active: boolean; axis: string | null }>({
    x: 0, y: 0, active: false, axis: null,
  });

  const changeMonth = useCallback((delta: number) => {
    setSel(null);
    setView((v) => {
      let m = v.m + delta;
      let y = v.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  }, []);

  const jumpToday = useCallback(() => {
    setView({ y: TODAY.y, m: TODAY.m });
    setSel(TODAY.d);
  }, []);

  /* ─ swipe handlers ─ */
  const onDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, active: true, axis: null };
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    const r = dragRef.current;
    if (!r.active) return;
    const dx = e.clientX - r.x;
    const dy = e.clientY - r.y;
    if (!r.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      r.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (r.axis === "x") {
      e.preventDefault();
      setDrag(Math.max(-90, Math.min(90, dx)));
    }
  }, []);

  const onUp = useCallback((e: React.PointerEvent) => {
    const r = dragRef.current;
    if (r.active && r.axis === "x") {
      const dx = e.clientX - r.x;
      if (dx <= -55) changeMonth(1);
      else if (dx >= 55) changeMonth(-1);
    }
    dragRef.current.active = false;
    setDrag(0);
  }, [changeMonth]);

  /* ─ derived ─ */
  const monthActs = listFor(allActivities, view.y, view.m);
  const shown = sel != null ? monthActs.filter((a) => covers(a, sel)) : monthActs;
  const isCurMonth = view.y === TODAY.y && view.m === TODAY.m;

  const selLabel = sel != null
    ? `${WEEKDAY[new Date(view.y, view.m, sel).getDay()]}, ${sel} ${MABBR[view.m]}`
    : `${MONTHS[view.m]} '${String(view.y).slice(2)}`;

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pt-[54px] pb-[112px] scrollbar-hide">
      {/* ── header ── */}
      <div className="px-5 pt-1.5">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-[family-name:var(--font-poppins)] font-semibold text-[30px] tracking-[-0.5px] m-0"
              style={{ color: COLORS.text }}
            >
              Activities
            </h1>
            <p className="mt-1 mb-0 text-[13.5px]" style={{ color: COLORS.sub }}>
              Feast days, gatherings &amp; mission events
            </p>
          </div>
          <button
            onClick={jumpToday}
            className="shrink-0 border-none cursor-pointer h-[42px] px-3.5 rounded-full inline-flex items-center gap-1.5 font-[family-name:var(--font-poppins)] font-semibold text-[12.5px] active:scale-[0.92] transition-transform"
            style={{
              background: theme.chip,
              color: COLORS.purple,
              boxShadow: theme.softShadow,
            }}
          >
            <Calendar size={15} color={COLORS.purple} strokeWidth={2} />
            Today
          </button>
        </div>
      </div>

      {/* ── calendar card ── */}
      <div className="px-5 pt-[18px]">
        <div
          className="p-4 pb-3.5"
          style={{
            background: theme.card.background,
            border: theme.card.border,
            borderRadius: theme.radius + 4,
            boxShadow: theme.softShadow,
            backdropFilter: theme.card.backdropFilter,
            WebkitBackdropFilter: theme.card.backdropFilter,
          }}
        >
          {/* month nav */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-[family-name:var(--font-poppins)] font-semibold text-[19px] tracking-[-0.3px]"
                style={{ color: COLORS.text }}
              >
                {MONTHS[view.m]}
              </span>
              <span
                className="font-[family-name:var(--font-poppins)] font-semibold text-[14px]"
                style={{ color: COLORS.faint }}
              >
                &lsquo;{String(view.y).slice(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer shrink-0 active:scale-[0.92] transition-transform"
                style={{
                  border: "1px solid rgba(107,70,255,0.14)",
                  background: theme.card.background === "#ffffff" ? "#F4F1FD" : "rgba(255,255,255,0.6)",
                }}
              >
                <ChevronLeft size={17} color={COLORS.purple} strokeWidth={2.4} />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer shrink-0 active:scale-[0.92] transition-transform"
                style={{
                  border: "1px solid rgba(107,70,255,0.14)",
                  background: theme.card.background === "#ffffff" ? "#F4F1FD" : "rgba(255,255,255,0.6)",
                }}
              >
                <ChevronRight size={17} color={COLORS.purple} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {/* weekday header */}
          <div className="grid grid-cols-7 gap-[2px] mb-1.5">
            {DOW.map((d, i) => (
              <div
                key={i}
                className="text-center font-[family-name:var(--font-poppins)] font-semibold text-[11px]"
                style={{ color: i === 0 ? "#DC2626" : i === 6 ? "#C0708A" : COLORS.faint }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* swipeable grid */}
          <div
            className="overflow-hidden"
            style={{
              touchAction: "pan-y",
              transform: `translateX(${drag}px)`,
              transition: drag === 0 ? "transform .26s ease" : "none",
            }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={onUp}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} color={COLORS.purple} className="animate-spin" />
              </div>
            ) : (
              <MonthGrid
                key={`${view.y}-${view.m}`}
                y={view.y}
                m={view.m}
                sel={sel}
                acts={allActivities}
                onSelect={setSel}
              />
            )}
          </div>

          {/* legend */}
          <div
            className="flex items-center justify-center gap-4 mt-3.5 pt-3"
            style={{ borderTop: "1px solid rgba(36,31,77,0.06)" }}
          >
            <span className="inline-flex items-center gap-[5px] text-[11px]" style={{ color: COLORS.sub }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: "#7C5CFF" }} />
              Activity
            </span>
            <span className="inline-flex items-center gap-[5px] text-[11px]" style={{ color: COLORS.sub }}>
              <Sparkles size={10} fill="#E2A312" color="#E2A312" />
              Feast
            </span>
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: COLORS.faint }}>
              <ChevronLeft size={11} color={COLORS.faint} strokeWidth={2.4} />
              Swipe
              <ChevronRight size={11} color={COLORS.faint} strokeWidth={2.4} />
            </span>
          </div>
        </div>
      </div>

      {/* ── list header ── */}
      <div className="flex items-center justify-between px-5 mt-6 mb-3.5">
        <div className="flex items-baseline gap-2">
          <h3
            className="font-[family-name:var(--font-poppins)] font-semibold text-[18px] tracking-[-0.3px] m-0"
            style={{ color: COLORS.text }}
          >
            {sel != null ? selLabel : "This Month"}
          </h3>
          {sel != null && isCurMonth && sel === TODAY.d && (
            <span
              className="font-[family-name:var(--font-poppins)] font-bold text-[10px] tracking-wide uppercase rounded-full"
              style={{ color: "#15803D", background: "rgba(22,163,74,0.14)", padding: "3px 8px" }}
            >
              Today
            </span>
          )}
        </div>
        {sel != null ? (
          <button
            onClick={() => setSel(null)}
            className="bg-transparent border-none cursor-pointer font-[family-name:var(--font-poppins)] font-semibold text-[13px] inline-flex items-center gap-[2px]"
            style={{ color: COLORS.purple }}
          >
            Show all
            <ChevronRight size={14} color={COLORS.purple} />
          </button>
        ) : (
          <span className="text-[13px]" style={{ color: COLORS.faint }}>
            <b
              className="font-[family-name:var(--font-poppins)] text-[18px] font-bold"
              style={{ color: COLORS.text }}
            >
              {monthActs.length}
            </b>{" "}
            events
          </span>
        )}
      </div>

      {/* ── list ── */}
      <div className="px-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} color={COLORS.purple} className="animate-spin" />
          </div>
        ) : shown.length > 0 ? (
          shown.map((a, i) => (
            <ActivityRow key={`${a.id}-${sel}`} a={a} m={view.m} />
          ))
        ) : (
          <div className="text-center py-[34px]" style={{ color: COLORS.faint }}>
            <div
              className="w-14 h-14 rounded-[18px] mx-auto mb-3 flex items-center justify-center"
              style={{ background: "rgba(107,70,255,0.07)" }}
            >
              <Calendar size={24} color={COLORS.faint} strokeWidth={1.8} />
            </div>
            <div
              className="font-[family-name:var(--font-poppins)] font-semibold text-[14.5px]"
              style={{ color: COLORS.sub }}
            >
              {sel != null ? "No activities on this day" : "No activities this month"}
            </div>
            {sel != null && (
              <button
                onClick={() => setSel(null)}
                className="bg-transparent border-none cursor-pointer font-[family-name:var(--font-poppins)] font-semibold text-[13px] inline-flex items-center gap-[2px] mx-auto mt-2.5"
                style={{ color: COLORS.purple }}
              >
                See the whole month
                <ChevronRight size={14} color={COLORS.purple} />
              </button>
            )}
          </div>
        )}
        <div className="text-center text-[11.5px] py-3.5 pb-1" style={{ color: COLORS.faint }}>
          {sel != null ? "Tap a date to explore other days" : "Swipe the calendar to change month"}
        </div>
      </div>
    </div>
  );
}
