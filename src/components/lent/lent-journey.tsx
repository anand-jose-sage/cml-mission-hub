"use client";

import { LentIcon, LentTopBar, type LentTheme } from "./lent-shared";
import { useLentContent } from "@/hooks/use-lent";
import { useLentProgress, getStageForDay } from "@/hooks/use-lent-progress";
import { getLentStatus } from "@/lib/lent-dates";

// Read-only progress map — matches the design reference exactly: no tap
// navigation into an arbitrary day. Only "Today" is ever enterable; this
// view exists to show the shape of the whole 40-day pilgrimage.
export function LentJourney({ theme, onExit }: { theme: LentTheme; onExit: () => void }) {
  const { days, loading } = useLentContent();
  const progress = useLentProgress();
  const status = getLentStatus(new Date());
  const todayDay = status.phase === "day" ? status.day : status.phase === "sunday" ? status.mostRecentDay : null;

  return (
    <>
      <LentTopBar day={todayDay ?? 0} onExit={onExit} theme={theme} />
      <div className="px-6 pt-2">
        <div className="font-semibold" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 22, lineHeight: 1.62, color: theme.text, margin: "8px 0 4px" }}>
          40 ദിനങ്ങളുടെ പാത
        </div>
        <div className="mb-5 font-light" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 12, color: theme.muted }}>
          {`A pilgrimage, not a streak · ${progress.completedDaysCount} days walked`}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><LentIcon name="Loader2" size={26} color={theme.muted} className="animate-spin" /></div>
        ) : (
          Array.from({ length: 40 }, (_, i) => {
            const n = i + 1;
            const entry = days.find((d) => d.day === n);
            const done = getStageForDay(progress.dayProgress(n)) === "done";
            const isToday = n === todayDay;
            return (
              <div
                key={n}
                className="flex items-center gap-[13px] px-3.5 py-3 mb-[7px]"
                style={{
                  borderRadius: 15,
                  background: isToday ? theme.surf2 : "transparent",
                  border: `1px solid ${isToday ? theme.accent : theme.line}`,
                }}
              >
                <div className="w-[26px]" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 11, letterSpacing: ".06em", color: done ? theme.accent2 : theme.muted }}>{`D${n}`}</div>
                <div className="flex-1 text-[13.5px]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", lineHeight: 1.62, color: done ? theme.muted : theme.text }}>
                  {entry?.ml.themeTitle ?? "—"}
                </div>
                <div className="text-[10px]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", color: theme.accent2 }}>
                  {isToday ? "ഇന്ന്" : done ? "✓" : ""}
                </div>
              </div>
            );
          })
        )}
        <div style={{ height: 20 }} />
      </div>
    </>
  );
}
