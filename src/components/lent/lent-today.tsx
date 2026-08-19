"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { LentTrailStage } from "@/hooks/use-lent-progress";
import { LENT_TOTAL_DAYS } from "@/lib/lent-dates";
import { LentTopBar, LentGlassPanel, LentGlowBtn, LentIcon, LentChip, type LentTheme, type LentAdminDayNav } from "./lent-shared";
import { companionMessage, AI_ACTIONS } from "./lent-ai";
import type { LentDay, LentMeta } from "@/types";
import type { LentStage } from "@/hooks/use-lent-progress";

const LentPosterOverlay = dynamic(() => import("./poster/lent-poster-overlay").then((m) => ({ default: m.LentPosterOverlay })));

const STAGE_COPY = {
  read: { kind: "Next step · Scripture", title: "ദൈവവചനം വായിക്കാം", cta: "യാത്ര ആരംഭിക്കാം" },
  pray: { kind: "Next step · Prayer", title: "ഇന്നത്തെ പ്രാർത്ഥന", cta: "പ്രാർത്ഥിക്കാം" },
  act: { kind: "Next step · Action", title: "ഇന്നത്തെ പ്രവർത്തനം", cta: "ഇന്നത്തെ പ്രവർത്തനം ചെയ്യാം" },
  reflect: { kind: "Next step · Reflection", title: "ഇന്നത്തെ ചിന്ത", cta: "സൂക്ഷിക്കാം" },
  michael: { kind: "Next step · Prayer to St. Michael", title: "വിശുദ്ധ മിഖായേലിനോടുള്ള പ്രാർത്ഥന", cta: "ആമേൻ" },
  done: { kind: "Today · Complete", title: "എന്റെ യാത്ര തുടരാം", cta: "40 ദിനങ്ങളുടെ പാത" },
} as const;

const TRAIL: { key: LentTrailStage; label: string }[] = [
  { key: "read", label: "ദൈവവചനം" },
  { key: "reflect", label: "ചിന്ത" },
  { key: "pray", label: "പ്രാർത്ഥന" },
  { key: "act", label: "പ്രവർത്തനം" },
  { key: "michael", label: "മിഖായേൽ" },
];

function Eyebrow({ children, theme }: { children: React.ReactNode; theme: LentTheme }) {
  return (
    <div
      className="text-[9.5px] uppercase"
      style={{ fontFamily: "var(--font-lent-outfit), sans-serif", letterSpacing: ".16em", color: theme.muted, marginBottom: 4 }}
    >
      {children}
    </div>
  );
}

function NonDayCard({
  theme, meta, headline, sub, cta, onCta,
}: { theme: LentTheme; meta: LentMeta; headline: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <div className="px-6 pt-2">
      <div className="mb-4">
        <h1 className="font-semibold leading-[1.62] tracking-[-.01em]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 27, color: theme.text }}>
          {headline}
        </h1>
        <div className="mt-2 font-light" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{sub}</div>
      </div>
      <div style={{ padding: 2, borderRadius: 22, background: `linear-gradient(150deg, ${theme.line}, transparent 60%)` }}>
        <div style={{ borderRadius: 20, padding: 20, background: theme.bg2, border: `1px solid ${theme.line}` }}>
          <div className="font-semibold" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 15, lineHeight: 1.7, color: theme.text }}>{meta.heroBodyMl}</div>
          <div className="mt-2" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 12, fontWeight: 300, color: theme.muted, lineHeight: 1.5 }}>{meta.heroBodyEn}</div>
          <div className="mt-4"><LentGlowBtn variant="primary" full iconRight="ArrowRight" onClick={onCta}>{cta}</LentGlowBtn></div>
        </div>
      </div>
    </div>
  );
}

export interface LentTodayProps {
  theme: LentTheme;
  onExit: () => void;
  onOpenJourney: () => void;
  onOpenSheet: (question: string | null) => void;
  loading: boolean;
  meta: LentMeta | null;
  status: { phase: "before" | "day" | "sunday" | "after"; day?: number; daysUntilStart?: number; mostRecentDay?: number };
  day: number;
  entry: LentDay | undefined;
  nextEntry: LentDay | undefined;
  stage: LentStage;
  doneMap: { read: boolean; pray: boolean; act: boolean; reflect: boolean; michael: boolean };
  completedDaysCount: number;
  markDone: (day: number, stage: "read" | "pray" | "act" | "michael") => void;
  saveReflection: (day: number, text: string) => void;
  onRestartDay: () => void;
  onShowMichaelPrayer: () => void;
  adminNav?: LentAdminDayNav;
}

export function LentToday({
  theme, onExit, onOpenJourney, onOpenSheet, loading, meta, status, day, entry, nextEntry, stage, doneMap, completedDaysCount, markDone, saveReflection, onRestartDay, onShowMichaelPrayer, adminNav,
}: LentTodayProps) {
  const [peek, setPeek] = useState<LentTrailStage | null>(null);
  const [draft, setDraft] = useState("");
  const [sharing, setSharing] = useState(false);

  if (loading || !meta) {
    return (
      <>
        <LentTopBar day={0} onExit={onExit} theme={theme} />
        <div className="flex justify-center py-24"><LentIcon name="Loader2" size={26} color={theme.muted} className="animate-spin" /></div>
      </>
    );
  }

  if (status.phase !== "day") {
    const headline = status.phase === "before" ? "യാത്ര ഇനിയും ആരംഭിച്ചിട്ടില്ല."
      : status.phase === "sunday" ? "ഇന്ന് ഒരു വിശ്രമ ദിനം."
      : "40 ദിനത്തെ യാത്ര പൂർത്തിയായി.";
    const sub = status.phase === "before" ? `Begins in ${status.daysUntilStart} days.`
      : status.phase === "sunday" ? "A pilgrimage, not a streak — today needs no step. Continue tomorrow."
      : "Christ has won. The journey is complete.";
    return (
      <>
        <LentTopBar day={day} onExit={onExit} theme={theme} adminNav={adminNav} />
        <NonDayCard theme={theme} meta={meta} headline={headline} sub={sub} cta="40 ദിനങ്ങളുടെ പാത" onCta={onOpenJourney} />
      </>
    );
  }

  if (!entry) {
    return (
      <>
        <LentTopBar day={day} onExit={onExit} theme={theme} adminNav={adminNav} />
        <div className="px-6">
          <LentGlassPanel theme={theme} strong style={{ padding: 24 }} className="text-center mt-4">
            <p className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", color: theme.text }}>ഈ ദിവസത്തെ ഉള്ളടക്കം ഉടൻ വരും</p>
            <p className="text-[12.5px]" style={{ color: theme.muted }}>Content for this day is coming soon.</p>
          </LentGlassPanel>
        </div>
      </>
    );
  }

  const peeking = peek && peek !== stage && doneMap[peek] ? peek : null;
  const active = peeking ?? stage;
  const copy = peeking
    ? { ...STAGE_COPY[peeking], kind: "Revisit · earlier step", cta: STAGE_COPY[stage].cta }
    : STAGE_COPY[stage];

  const advance = () => {
    if (peeking) return setPeek(null);
    if (stage === "read") return markDone(day, "read");
    if (stage === "pray") return markDone(day, "pray");
    if (stage === "act") return markDone(day, "act");
    if (stage === "michael") return markDone(day, "michael");
    if (stage === "reflect") return saveReflection(day, draft);
    onOpenJourney();
  };

  const heroMl = active === "read" ? (day === 1 ? "ഈശോയോടൊപ്പമുള്ള ഈ ആത്മീയ യാത്രയിലെ ആദ്യ ദിനം" : `ഇന്ന് നമുക്ക് ${day}-ാം ദിനം ആരംഭിക്കാം.`)
    : active === "reflect" ? "ദൈവവചനം വായിച്ചു. ഒരു നിമിഷം ചിന്തിക്കാമോ?"
    : active === "pray" ? "ഇനി ഒരു നിമിഷം നിശ്ശബ്ദമായി പ്രാർത്ഥിക്കാം."
    : active === "act" ? "ഇനി ഇന്നത്തെ വിശ്വാസം ഒരു ചെറിയ പ്രവർത്തിയായി മാറ്റാം."
    : active === "michael" ? "ഇന്ന് അവസാനമായി വിശുദ്ധ മിഖായേലിനോട് പ്രാർത്ഥിക്കാം."
    : "ഇന്നത്തെ ദിനം പൂർത്തിയായി.";
  const heroEn = active === "read" ? (day === 1 ? "Day one of this spiritual journey with Jesus." : `${completedDaysCount} days walked. Today needs only one step — the Word.`)
    : active === "reflect" ? "The Word is read. Let's pause and reflect for a moment."
    : active === "pray" ? "That reflection is done. Now a quiet moment of prayer."
    : active === "act" ? "Let today's faith become one small act."
    : active === "michael" ? "Let's close today by praying to St. Michael."
    : `Day ${day} complete. The journey continues tomorrow.`;

  return (
    <>
      <LentTopBar day={day} onExit={onExit} theme={theme} adminNav={adminNav} />

      <div className="px-6 pt-1.5">
        <div className="flex gap-[3px] items-end mb-6" style={{ height: 22 }}>
          {Array.from({ length: LENT_TOTAL_DAYS }, (_, i) => {
            const n = i + 1;
            const isToday = n === day;
            const walked = n < day; // days before today are always resolved one way or another
            const h = isToday ? 22 : walked ? 13 : 7;
            const bg = isToday ? theme.accent : walked ? theme.accent2 : theme.line;
            return <div key={n} className="flex-1 rounded-[2px]" style={{ height: h, background: bg, boxShadow: isToday ? `0 0 12px ${theme.accent}` : "none" }} />;
          })}
        </div>

        <div style={{ animation: "ev-rise .6s ease both" }}>
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="inline-flex items-center gap-1.5 text-[9.5px] uppercase whitespace-nowrap" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", letterSpacing: ".18em", color: theme.accent }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: theme.accent, boxShadow: `0 0 10px ${theme.accent}` }} />
              <span>{`Day ${day} · ${entry.en.themeTitle}`}</span>
            </div>
            <div className="text-[12.5px]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", lineHeight: 1.7, color: theme.accent2 }}>{entry.ml.themeTitle}</div>
          </div>
          <div className="font-semibold tracking-[-.01em]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 27, lineHeight: 1.62, color: theme.text }}>{heroMl}</div>
          <div className="mt-2 font-light" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{heroEn}</div>
        </div>

        <div className="mt-6" style={{ padding: 2, borderRadius: 22, background: `linear-gradient(150deg, ${theme.line}, transparent 60%)` }}>
          <div style={{ borderRadius: 20, padding: 20, background: theme.bg2, border: `1px solid ${theme.line}` }}>
            <div className="flex items-start justify-between gap-2">
              <Eyebrow theme={theme}>{copy.kind}</Eyebrow>
              {active !== "done" && (
                <button onClick={() => setSharing(true)} className="shrink-0 -mt-1 cursor-pointer" aria-label="Share">
                  <LentIcon name="Share2" size={14} color={theme.muted} />
                </button>
              )}
            </div>
            <div className="font-semibold mb-3" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 15, lineHeight: 1.62, color: theme.text }}>{copy.title}</div>
            {peeking && (
              <div className="-mt-1.5 mb-3 text-[11.5px]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", lineHeight: 1.6, color: theme.accent2 }}>ഇന്നത്തെ ചുവടിലേക്ക് മടങ്ങാം</div>
            )}

            {active === "read" && (
              <>
                <div style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 16.5, lineHeight: 1.75, color: theme.text }}>&ldquo;{entry.ml.reading.text}&rdquo;</div>
                <div className="mt-2.5 italic" style={{ fontFamily: "var(--font-lent-scripture), Georgia, serif", fontSize: 16, color: theme.muted }}>&ldquo;{entry.en.reading.text}&rdquo;</div>
                <div className="mt-2" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 11, letterSpacing: ".08em", color: theme.accent2 }}>{entry.ml.reading.reference} &middot; {entry.en.reading.reference}</div>
              </>
            )}

            {(active === "pray" || active === "act" || active === "michael") && (
              <>
                <div className="whitespace-pre-line" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 15.5, lineHeight: 1.8, color: theme.text }}>
                  {active === "pray" ? entry.ml.prayer : active === "act" ? entry.ml.activity : meta.prayerToMichaelMl}
                </div>
                <div className="mt-2.5 font-light whitespace-pre-line" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 12.5, lineHeight: 1.6, color: theme.muted }}>
                  {active === "pray" ? entry.en.prayer : active === "act" ? entry.en.activity : meta.prayerToMichaelEn}
                </div>
              </>
            )}

            {active === "reflect" && (
              <>
                <div style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 15.5, lineHeight: 1.8, color: theme.text }}>{entry.ml.reflection}</div>
                <div className="mt-2.5 font-light" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 12.5, lineHeight: 1.6, color: theme.muted }}>{entry.en.reflection}</div>
                <div className="mt-4 mb-3.5" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 15, lineHeight: 1.7, color: theme.accent2 }}>&ldquo;{entry.ml.reflectionQuestion}&rdquo;</div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="ഇവിടെ എഴുതാം… (സ്വകാര്യം)"
                  style={{ width: "100%", minHeight: 96, resize: "none", borderRadius: 14, padding: "13px 14px", fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 14, lineHeight: 1.6, color: theme.text, background: theme.surf, border: `1px solid ${theme.line}`, outline: "none" }}
                />
                <div className="flex items-center gap-1.5 mt-2" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 10.5, color: theme.muted }}>
                  <LentIcon name="Lock" size={11} color={theme.muted} />
                  <span>Private to you. Never shown anywhere else.</span>
                </div>
              </>
            )}

            {active === "done" && (
              <div style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 15.5, lineHeight: 1.8, color: theme.muted }}>
                {nextEntry ? `യാത്ര തുടരുന്നു. നാളെ വീണ്ടും ഒരു ദിനം — ${nextEntry.ml.themeTitle}.` : "40 ദിനത്തെ യാത്ര പൂർത്തിയായി. വിജയം ക്രിസ്തുവിന്റേതാണ്."}
              </div>
            )}

            <div className="mt-[18px]"><LentGlowBtn variant="primary" full iconRight="ArrowRight" onClick={advance}>{copy.cta}</LentGlowBtn></div>
          </div>
        </div>

        <div className="mt-[18px] flex flex-col gap-[1px]">
          <Eyebrow theme={theme}>Today&apos;s steps · tap to revisit</Eyebrow>
          {TRAIL.map((t) => {
            const done = doneMap[t.key];
            const tappable = done || t.key === stage;
            return (
              <div
                key={t.key}
                onClick={tappable ? () => setPeek(t.key === stage ? null : t.key) : undefined}
                className="flex items-center gap-[11px] py-[11px] px-1"
                style={{ cursor: tappable ? "pointer" : "default", opacity: t.key === active ? 1 : done ? 0.72 : 0.34 }}
              >
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ border: `1px solid ${done ? theme.accent : theme.line}`, background: done ? theme.accent : "transparent" }}>
                  <span className="text-[8px]" style={{ color: done ? "#fff" : "transparent" }}>✓</span>
                </div>
                <div className="flex-1 text-[13px]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", lineHeight: 1.62, color: done ? theme.muted : theme.text, textDecoration: done ? "line-through" : "none" }}>{t.label}</div>
                <div className="text-[10.5px]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", color: theme.muted }}>
                  {t.key === peeking ? "വീണ്ടും" : done ? "വീണ്ടും വായിക്കാം" : t.key === stage ? "now" : ""}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-[22px]" style={{ borderRadius: 20, padding: 18, background: theme.surf, border: `1px solid ${theme.line}` }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px]">✨</span>
            <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", color: theme.accent2 }}>ഇന്നത്തെ വഴികാട്ടി</span>
            <span className="flex-1" style={{ height: 1, background: theme.line }} />
          </div>
          <div className="whitespace-pre-line" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 15, lineHeight: 1.78, color: theme.text }}>
            {companionMessage(stage, entry, nextEntry)}
          </div>
          <div className="flex flex-wrap gap-[7px] mt-[15px]">
            {AI_ACTIONS.map((label) => (
              <LentChip
                key={label}
                label={label}
                onClick={() => {
                  // These two trigger a real action directly instead of a chat
                  // reply — restarting today's progress or opening the prayer
                  // popup wouldn't make sense as text in a chat bubble.
                  if (label.includes("മിഖായേ")) return onShowMichaelPrayer();
                  if (label.includes("വീണ്ടും ആരംഭ")) return onRestartDay();
                  onOpenSheet(label.replace(/^[^ഀ-ൿa-zA-Z]+/, ""));
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 px-4 py-[15px]" style={{ borderRadius: 16, border: `1px dashed ${theme.line}` }}>
          <span className="text-[11px] mt-0.5">🕯</span>
          <div>
            <Eyebrow theme={theme}>Journey memory</Eyebrow>
            <div className="text-[13px]" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", lineHeight: 1.7, color: theme.muted }}>
              {completedDaysCount > 0
                ? `നീ ${completedDaysCount} ദിനങ്ങൾ നടന്നു. യാത്രയിൽ ഇടവേള വന്നാലും കുഴപ്പമില്ല — ഇന്ന് വീണ്ടും ഒരു ദിനത്തിൽ നിന്ന് തുടങ്ങാം.`
                : "ഇതാണ് നിന്റെ ആദ്യ ദിനം. ഒരു ദിനം മാത്രം മതി തുടങ്ങാൻ."}
            </div>
          </div>
        </div>
      </div>

      {sharing && <LentPosterOverlay day={day} entry={entry} onClose={() => setSharing(false)} />}
    </>
  );
}
