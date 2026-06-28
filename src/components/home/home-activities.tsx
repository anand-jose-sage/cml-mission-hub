"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
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
  ChevronRight,
} from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import { useActivities, type ActivityItem } from "@/hooks/use-activities";

/* ─── activity tint system ─────────────────────────────── */
// Must stay in sync with the keys in src/hooks/use-activities.ts (ActivityItem.tint).
// Activities-screen has its own copy with the same set — if a tint key is missing
// here, the home-page row crashes on `t.dot`. The runtime lookup below uses a
// `|| AT.purple` fallback so any future key drift degrades gracefully.
const AT: Record<string, { pale: string; ink: string; dot: string; soft: string }> = {
  purple:    { pale: "#EDE7FF", ink: "#5B3FCC", dot: "#7C5CFF", soft: "rgba(91,63,204,0.12)" },
  coral:     { pale: "#FFE7DC", ink: "#B5402B", dot: "#F4663F", soft: "rgba(181,64,43,0.12)" },
  gold:      { pale: "#FFF1CB", ink: "#9A6A00", dot: "#E2A312", soft: "rgba(154,106,0,0.14)" },
  mint:      { pale: "#DCF6E6", ink: "#15803D", dot: "#2FB269", soft: "rgba(21,128,61,0.12)" },
  sky:       { pale: "#DCEDFF", ink: "#0B6BB8", dot: "#3DA0F0", soft: "rgba(11,107,184,0.12)" },
  feast:     { pale: "#FCE7F3", ink: "#BE185D", dot: "#DB2777", soft: "rgba(190,24,93,0.12)" },
  solemnity: { pale: "#FDE3E1", ink: "#B42318", dot: "#D64541", soft: "rgba(180,35,24,0.12)" },
  memorial:  { pale: "#DCEDFF", ink: "#0B6BB8", dot: "#3FA3F0", soft: "rgba(11,107,184,0.12)" },
};

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Calendar, Sparkles, Megaphone, Users, BookOpen, Heart, Volume2, Flame, Clock, MapPin,
};

const MABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/* ─── ActivityCard ─────────────────────────────────────── */
function ActivityCard({ a, idx }: { a: ActivityItem; idx: number }) {
  const t = AT[a.tint] ?? AT.purple;
  const IconComp = ICON_MAP[a.icon];
  const dateLabel = a.end ? `${a.d}–${a.end}` : String(a.d);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeOut" }}
      className="flex overflow-hidden mb-[10px]"
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
        style={{ width: 56, background: t.pale, padding: "10px 4px" }}
      >
        <span
          className="font-[family-name:var(--font-poppins)] font-bold leading-none"
          style={{ fontSize: a.end ? 15 : 20, color: t.ink }}
        >
          {dateLabel}
        </span>
        <span
          className="font-bold tracking-wide"
          style={{ fontSize: 9, letterSpacing: 0.8, color: t.ink, opacity: 0.75 }}
        >
          {MABBR[a.month]}
        </span>
      </div>

      {/* body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ padding: "10px 12px 10px 10px" }}>
        <div className="flex items-center gap-1.5 mb-0.5">
          {IconComp && <IconComp size={11} color={t.ink} strokeWidth={2} />}
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold uppercase tracking-wide"
            style={{ fontSize: 10, letterSpacing: 0.3, color: t.ink }}
          >
            {a.cat}
          </span>
          {a.allDay && (
            <span
              className="ml-auto font-bold uppercase tracking-wide rounded-full"
              style={{
                fontSize: 9,
                letterSpacing: 0.3,
                color: t.ink,
                background: t.soft,
                padding: "2px 6px",
              }}
            >
              All day
            </span>
          )}
        </div>
        <div
          className="font-[family-name:var(--font-poppins)] font-semibold leading-[1.25] tracking-[-0.2px]"
          style={{ fontSize: 13.5, color: "#241F4D" }}
        >
          {a.title}
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          <span className="inline-flex items-center gap-1 text-[10.5px]" style={{ color: COLORS.sub }}>
            <Clock size={11} color={COLORS.faint} strokeWidth={2} />
            {a.time}
          </span>
          {a.venue && (
            <span className="inline-flex items-center gap-1 text-[10.5px] min-w-0" style={{ color: COLORS.sub }}>
              <MapPin size={11} color={COLORS.faint} strokeWidth={2} className="shrink-0" />
              <span className="truncate">{a.venue}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME ACTIVITIES
   ═══════════════════════════════════════════════════════════ */
interface HomeActivitiesProps {
  theme: CMLTheme;
  dates: Date[];             // the 8-day range
  sel: number | null;        // selected index into dates, or null for "all week"
  onViewAll: () => void;     // navigate to activities tab
}

export function HomeActivities({ theme, dates, sel, onViewAll }: HomeActivitiesProps) {
  const { items: allActivities, loading } = useActivities();

  const filtered = useMemo(() => {
    if (dates.length === 0) return [];

    if (sel != null && dates[sel]) {
      // Filter to selected day
      const d = dates[sel];
      const day = d.getDate();
      const month = d.getMonth();
      const year = d.getFullYear();
      return allActivities.filter((a) => {
        if (a.year !== year || a.month !== month) return false;
        if (a.end) return day >= a.d && day <= a.end;
        return a.d === day;
      });
    }

    // All week — filter to the 8-day date range
    const start = dates[0];
    const end = dates[dates.length - 1];
    const startTs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTs = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    return allActivities.filter((a) => {
      const aDate = new Date(a.year, a.month, a.d).getTime();
      return aDate >= startTs && aDate <= endTs;
    });
  }, [allActivities, dates, sel]);

  // Label
  const label = useMemo(() => {
    if (sel != null && dates[sel]) {
      const d = dates[sel];
      const now = new Date();
      const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const selTs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (selTs === todayTs) return "Today";
      const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return `${WEEKDAY[d.getDay()]}, ${d.getDate()} ${MABBR[d.getMonth()]}`;
    }
    return "This Week";
  }, [sel, dates]);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-baseline justify-between px-5 mt-5 mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} color={COLORS.purple} strokeWidth={2} />
          <h3
            className="font-[family-name:var(--font-poppins)] font-semibold text-[17px] tracking-tight m-0"
            style={{ color: COLORS.text }}
          >
            Activities
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 bg-transparent border-none cursor-pointer font-[family-name:var(--font-poppins)] font-semibold text-[12px]"
          style={{ color: COLORS.purple }}
        >
          See all
          <ChevronRight size={14} color={COLORS.purple} />
        </button>
      </div>

      {/* Day label + count */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sel ?? "all"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="px-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1.5 h-5 rounded-full"
              style={{ background: "linear-gradient(180deg, #6B46FF, #A78BFA)" }}
            />
            <span
              className="font-[family-name:var(--font-poppins)] font-semibold text-[13px]"
              style={{ color: COLORS.text }}
            >
              {label}
            </span>
            <span className="text-[12px]" style={{ color: COLORS.faint }}>
              &middot; {loading ? "..." : `${filtered.length} ${filtered.length === 1 ? "event" : "events"}`}
            </span>
          </div>

          {loading ? (
            <div
              className="flex items-center justify-center py-10 rounded-2xl"
              style={{
                background: theme.card.background,
                border: theme.card.border,
                backdropFilter: theme.card.backdropFilter,
              }}
            >
              <Loader2 size={24} color={COLORS.purple} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-2xl"
              style={{
                background: theme.card.background,
                border: theme.card.border,
                backdropFilter: theme.card.backdropFilter,
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: "rgba(107,70,255,0.08)" }}
              >
                <Calendar size={22} color={COLORS.faint} />
              </div>
              <span className="text-[13px] font-medium" style={{ color: COLORS.faint }}>
                {sel != null ? "No activities on this day" : "No activities this week"}
              </span>
            </div>
          ) : (
            <div>
              {filtered.map((a, i) => (
                <ActivityCard key={a.id} a={a} idx={i} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
