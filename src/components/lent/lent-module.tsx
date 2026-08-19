"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CMLTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { getLentStatus, LENT_TOTAL_DAYS } from "@/lib/lent-dates";
import { useLentContent } from "@/hooks/use-lent";
import { useLentProgress, getStageForDay, type DayProgress } from "@/hooks/use-lent-progress";
import { buildLentTheme, LentIcon, LentPresenceLayer, type LentAdminDayNav } from "./lent-shared";
import { LENT_FONT_CLASS } from "./lent-fonts";
import { companionMessage } from "./lent-ai";

const EMPTY_PREVIEW_PROGRESS: DayProgress = { reading: false, prayer: false, activity: false, reflectionDone: false, reflection: "", michael: false };

const LentToday = dynamic(() => import("./lent-today").then((m) => ({ default: m.LentToday })));
const LentJourney = dynamic(() => import("./lent-journey").then((m) => ({ default: m.LentJourney })));
const LentCompanionSheet = dynamic(() => import("./lent-companion-sheet").then((m) => ({ default: m.LentCompanionSheet })));
const LentMichaelPrayerOverlay = dynamic(() => import("./lent-michael-prayer-overlay").then((m) => ({ default: m.LentMichaelPrayerOverlay })));

type Screen = "today" | "journey";

export function LentModule({ onExit, parentTheme }: { onExit: () => void; parentTheme: CMLTheme }) {
  const theme = buildLentTheme(parentTheme);
  const [screen, setScreen] = useState<Screen>("today");
  const [sheetSeed, setSheetSeed] = useState<{ question: string | null } | null>(null);
  // Owned here (not inside LentToday) since the sheet — a sibling of
  // LentToday, not a child — also needs to be able to open this popup.
  const [showMichaelPrayer, setShowMichaelPrayer] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);

  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin", "me_admin", "sa_admin");
  // Admin-only day override so any of the 40 days can be previewed, not just
  // the real calendar day. Walking through it uses its own throwaway
  // progress bucket (below) rather than the visitor's real localStorage
  // progress, so previewing a day never marks it done or overwrites journal
  // text for their actual walk.
  const [manualDay, setManualDay] = useState<number | null>(null);
  const [previewProgress, setPreviewProgress] = useState<DayProgress>(EMPTY_PREVIEW_PROGRESS);
  const previewing = isAdmin && manualDay !== null;

  const { meta, days, loading } = useLentContent();
  const progress = useLentProgress();
  const autoStatus = getLentStatus(new Date());
  const status = previewing ? ({ phase: "day", day: manualDay! } as const) : autoStatus;
  const day = status.phase === "day" ? status.day : status.phase === "sunday" ? status.mostRecentDay : status.phase === "after" ? 40 : 0;
  const entry = days.find((d) => d.day === day);
  const nextEntry = days.find((d) => d.day === day + 1);
  const dp = previewing ? previewProgress : progress.dayProgress(day);
  const stage = getStageForDay(dp);
  const doneMap = { read: dp.reading, pray: dp.prayer, act: dp.activity, reflect: dp.reflectionDone, michael: dp.michael };
  const defaultCompanionMessage = entry ? companionMessage(stage, entry, nextEntry) : "";

  const markDone = previewing
    ? (_day: number, s: "read" | "pray" | "act" | "michael") =>
        setPreviewProgress((p) => ({ ...p, [s === "read" ? "reading" : s === "pray" ? "prayer" : s === "act" ? "activity" : "michael"]: true }))
    : progress.markDone;
  const saveReflection = previewing
    ? (_day: number, text: string) => setPreviewProgress((p) => ({ ...p, reflection: text, reflectionDone: true }))
    : progress.saveReflection;
  const restartDay = previewing ? () => setPreviewProgress(EMPTY_PREVIEW_PROGRESS) : () => progress.resetDay(day);

  const jumpToDay = (n: number) => setManualDay(Math.min(LENT_TOTAL_DAYS, Math.max(1, n)));
  const adminNav: LentAdminDayNav | undefined = isAdmin
    ? {
        overridden: previewing,
        onPrev: () => jumpToDay((manualDay ?? day) - 1),
        onNext: () => jumpToDay((manualDay ?? day) + 1),
        onJump: jumpToDay,
        onResetToday: () => setManualDay(null),
      }
    : undefined;

  // Previewing a fresh day always starts from "read" with an empty journal draft.
  useEffect(() => {
    setPreviewProgress(EMPTY_PREVIEW_PROGRESS);
  }, [manualDay]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [screen]);

  const openSheet = (question: string | null) => setSheetSeed({ question });

  return (
    <div className={`absolute inset-0 overflow-hidden ${LENT_FONT_CLASS}`} style={{ background: theme.pageBg }}>
      {screen === "today" && <LentPresenceLayer />}
      <main ref={scrollRef} className="relative h-full overflow-y-auto overflow-x-hidden pb-[150px] scrollbar-hide">
        {screen === "today" ? (
          <LentToday
            theme={theme}
            onExit={onExit}
            onOpenJourney={() => setScreen("journey")}
            onOpenSheet={openSheet}
            loading={loading}
            meta={meta}
            status={status}
            day={day}
            entry={entry}
            nextEntry={nextEntry}
            stage={stage}
            doneMap={doneMap}
            completedDaysCount={progress.completedDaysCount}
            markDone={markDone}
            saveReflection={saveReflection}
            onRestartDay={restartDay}
            onShowMichaelPrayer={() => setShowMichaelPrayer(true)}
            adminNav={adminNav}
          />
        ) : (
          <LentJourney theme={theme} onExit={onExit} />
        )}
      </main>

      {/* bottom bar: ask the companion, or toggle Today/Journey */}
      <div className="absolute left-0 right-0 bottom-0 z-[8] px-5 pt-[22px] pb-5" style={{ background: `linear-gradient(180deg, transparent, ${theme.bg} 18%, ${theme.bg})` }}>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openSheet(null)}
            className="flex-1 flex items-center gap-2.5 px-[17px] py-3.5 rounded-full cursor-pointer"
            style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 13.5, color: theme.text, background: theme.surf2, border: `1px solid ${theme.line}`, backdropFilter: "blur(10px)" }}
          >
            <span className="text-[12px]" style={{ animation: "ev-shim 3.4s ease-in-out infinite" }}>✨</span>
            <span>ചോദിക്കാം…</span>
          </button>
          <button
            onClick={() => setScreen(screen === "today" ? "journey" : "today")}
            className="w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-pointer"
            style={{ color: theme.text, background: theme.surf2, border: `1px solid ${theme.line}` }}
            aria-label="Toggle journey view"
          >
            <LentIcon name="Map" size={19} color={theme.text} />
          </button>
        </div>
      </div>
      <style>{`@keyframes ev-shim{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}`}</style>

      {sheetSeed && (
        <LentCompanionSheet
          theme={theme}
          seedQuestion={sheetSeed.question}
          defaultMessage={defaultCompanionMessage}
          aiContext={{ entry, meta, actDone: doneMap.act }}
          onRestartDay={restartDay}
          onShowMichaelPrayer={() => setShowMichaelPrayer(true)}
          onClose={() => setSheetSeed(null)}
        />
      )}
      {showMichaelPrayer && meta && (
        <LentMichaelPrayerOverlay theme={theme} meta={meta} onClose={() => setShowMichaelPrayer(false)} />
      )}
    </div>
  );
}
