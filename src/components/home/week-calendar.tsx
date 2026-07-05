"use client";

import { useEffect, useState } from "react";
import { COLORS, type CMLTheme } from "@/lib/theme";

const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface WeekCalendarProps {
  theme: CMLTheme;
  sel: number | null;        // null = "all week" (no day selected)
  setSel: (i: number | null) => void;
  dates: Date[];             // the 8 dates to render
}

export function WeekCalendar({ theme, sel, setSel, dates }: WeekCalendarProps) {
  // Computed client-side only, post-hydration: `new Date()` depends on the
  // runtime's clock/timezone, so evaluating it during render would let the
  // server (e.g. UTC on Vercel) and the client (the visitor's local
  // timezone) disagree on which cell is "today" — a hydration mismatch.
  // Starting at `null` renders identically on both passes; the effect fills
  // in the real value right after mount.
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    const n = new Date();
    setToday(new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime());
  }, []);

  return (
    <div className="flex gap-2 justify-center px-5 py-0.5 scrollbar-hide">
      {dates.map((d, i) => {
        const active = sel === i;
        const isToday = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() === today;
        const isSunday = d.getDay() === 0;

        return (
          <button
            key={i}
            onClick={() => setSel(sel === i ? null : i)}
            className="shrink-0 w-[48px] py-2.5 cursor-pointer flex flex-col items-center gap-[6px] transition-transform"
            style={{
              borderRadius: 16,
              border: active ? "none" : theme.card.border,
              background: active
                ? "linear-gradient(160deg, #6B46FF, #A78BFA)"
                : theme.card.background,
              color: active ? "#fff" : isSunday ? "#DC2626" : COLORS.text,
              boxShadow: active
                ? "0 10px 22px rgba(107,70,255,0.35)"
                : theme.softShadow,
              backdropFilter: theme.card.backdropFilter,
              WebkitBackdropFilter: theme.card.backdropFilter,
              transform: active ? "translateY(-2px)" : "none",
            }}
          >
            <span
              className="text-[10.5px] font-semibold font-[family-name:var(--font-poppins)]"
              style={{ opacity: active ? 0.85 : 0.55 }}
            >
              {DOW_LABELS[d.getDay()]}
            </span>
            <span className="font-[family-name:var(--font-poppins)] font-bold text-[17px]">
              {d.getDate()}
            </span>
            <span
              className="w-[5px] h-[5px] rounded-full"
              style={{
                background: active
                  ? "#fff"
                  : isToday
                    ? COLORS.success
                    : "rgba(107,70,255,0.3)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
