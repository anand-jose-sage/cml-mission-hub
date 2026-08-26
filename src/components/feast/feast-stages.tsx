"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, Clock, CheckCircle2, Circle } from "lucide-react";
import { useFeasts } from "@/hooks/use-feast";
import {
  useCompetitionStages,
  type CompetitionStage, type StageCompetition, type RunState, type RunningItem,
} from "@/hooks/use-competition-stages";
import { FeastTopBar, FeastTabs, StatusPill, SectionTitle, type FeastTheme } from "./feast-shared";

const anek: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 600 };
const anekBold: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 700 };

const RUN_STATE_STYLE: Record<RunState, { label: string; bg: string; color: string }> = {
  upcoming: { label: "Upcoming", bg: "rgba(156,163,175,0.18)", color: "#6B7280" },
  running: { label: "Live", bg: "rgba(251,146,60,0.18)", color: "#D97706" },
  completed: { label: "Completed", bg: "rgba(34,197,94,0.18)", color: "#16A34A" },
};

function ProgressBar({ pct, state }: { pct: number; state: RunState }) {
  const fill =
    state === "completed" ? "#16A34A"
    : state === "running" ? "linear-gradient(90deg,#F59E0B,#FBBF24)"
    : "rgba(107,70,255,0.25)";
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(107,70,255,0.1)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: fill }} />
    </div>
  );
}

function ItemStatusIcon({ status, color }: { status: RunState; color: string }) {
  if (status === "completed") return <CheckCircle2 size={17} color="#16A34A" />;
  if (status === "running") return <span className="relative flex h-[11px] w-[11px] shrink-0">
    <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#D97706" }} />
    <span className="relative inline-flex rounded-full h-[11px] w-[11px]" style={{ background: "#D97706" }} />
  </span>;
  return <Circle size={16} color={color} />;
}

// Large numbered badge — the primary visual anchor for a stage, so the eye
// lands on "which stage" before anything else. Pulses while live.
function StageBadge({ number, status }: { number: number; status: RunState }) {
  const bg =
    status === "completed" ? "linear-gradient(135deg,#16A34A,#22C55E)"
    : status === "running" ? "linear-gradient(135deg,#F59E0B,#FBBF24)"
    : "linear-gradient(135deg,#C4B5FD,#A78BFA)";
  const glow =
    status === "completed" ? "rgba(22,163,74,0.4)"
    : status === "running" ? "rgba(245,158,11,0.5)"
    : "rgba(167,139,250,0.35)";
  return (
    <div className="relative shrink-0">
      {status === "running" && (
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#F59E0B", opacity: 0.35 }} />
      )}
      <div
        className="relative w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: bg, boxShadow: `0 6px 16px ${glow}`, fontFamily: "var(--font-poppins), sans-serif" }}
      >
        {status === "completed"
          ? <CheckCircle2 size={22} color="#fff" />
          : <span className="text-[19px] font-black text-white">{number}</span>}
      </div>
    </div>
  );
}

// ─── Live Now / Up Next hero ────────────────────────────────────────────────

function RunningCard({ item, theme }: { item: RunningItem; theme: FeastTheme }) {
  const { stage, competition } = item;
  return (
    <div
      className="rounded-2xl p-4 mb-2.5"
      style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(251,191,36,0.08))",
        border: "1.5px solid rgba(245,158,11,0.4)",
        boxShadow: "0 8px 24px rgba(245,158,11,0.18)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <StageBadge number={stage.stageNumber} status="running" />
        <div className="min-w-0 flex-1">
          <StatusPill label="LIVE NOW" color="#D97706" />
          <p className="text-[19px] leading-tight mt-1 truncate" style={{ color: "#92400E", ...anekBold }}>
            Stage {stage.stageNumber} &middot; {stage.title}
          </p>
        </div>
      </div>

      <p className="text-[24px] leading-tight mb-1" style={{ color: "#1E1B4B", ...anekBold }}>
        {competition.label}
      </p>
      <p className="text-[12px] mb-3" style={{ color: theme.sub, ...anek }}>
        Stage: {stage.completedCount} of {stage.totalCount} competitions completed
      </p>

      {/* Participants marked present for THIS competition, out of everyone
          with a chance number — feast_competitions.progress_pct, computed by
          the admin's attendance marking. This is the live figure people are
          actually watching, not how many competitions the stage has gotten
          through. */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wide" style={{ color: theme.faint, ...anekBold }}>Participants Completed</span>
        <span className="text-[12.5px]" style={{ color: "#D97706", ...anekBold }}>
          {competition.itemProgressPct != null ? `${competition.itemProgressPct}%` : "—"}
        </span>
      </div>
      <ProgressBar pct={competition.itemProgressPct ?? 0} state="running" />
    </div>
  );
}

function LiveNowPanel({ runningItems, upNext, allDone, theme }: {
  runningItems: RunningItem[]; upNext: RunningItem | null; allDone: boolean; theme: FeastTheme;
}) {
  if (runningItems.length > 0) {
    return (
      <div className="mb-5">
        {runningItems.map((item) => <RunningCard key={item.competition.id} item={item} theme={theme} />)}
      </div>
    );
  }

  if (allDone) {
    return (
      <div
        className="rounded-2xl p-5 mb-5 text-center"
        style={{ background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.35)" }}
      >
        <p className="text-[17px]" style={{ color: "#16A34A", ...anekBold }}>🎉 All competitions completed!</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{ background: "rgba(107,70,255,0.06)", border: `1px solid ${theme.hairline}` }}
    >
      <p className="text-[14px] mb-1" style={{ color: theme.sub, ...anek }}>No competition is currently running.</p>
      {upNext && (
        <>
          <p className="text-[11px] uppercase tracking-wider mt-3 mb-1" style={{ color: theme.faint, ...anekBold }}>Up Next</p>
          <p className="text-[16px]" style={{ color: theme.text, ...anekBold }}>
            Stage {upNext.stage.stageNumber} &middot; {upNext.stage.title} — {upNext.competition.label}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Overall progress ────────────────────────────────────────────────────────

function OverallProgress({ completed, total, pct, theme }: {
  completed: number; total: number; pct: number; theme: FeastTheme;
}) {
  if (total === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: theme.faint, ...anekBold }}>Overall Progress</span>
        <span className="text-[12.5px]" style={{ color: theme.sub, ...anek }}>{completed} / {total} completed &middot; {pct}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(107,70,255,0.1)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6B46FF,#A78BFA)" }} />
      </div>
    </div>
  );
}

// ─── Stage card ───────────────────────────────────────────────────────────────

function CompetitionRow({ comp, last }: { comp: StageCompetition; last: boolean }) {
  const style = RUN_STATE_STYLE[comp.status];
  const showAttendance = comp.status === "running" && comp.itemProgressPct != null;
  return (
    <div
      className="py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid rgba(30,27,75,0.06)" }}
    >
      <div className="flex items-center gap-2.5">
        <ItemStatusIcon status={comp.status} color={comp.categoryColor} />
        <span className="flex-1 min-w-0 text-[15px] truncate" style={{ color: "#1E1B4B", ...anek }}>{comp.label}</span>
        <span className="shrink-0 text-[11.5px] px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.color, ...anekBold }}>
          {comp.status === "running" ? "NOW RUNNING" : style.label.toUpperCase()}
        </span>
      </div>
      {showAttendance && (
        <div className="flex items-center gap-2 mt-1.5 pl-[26px]">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(217,119,6,0.15)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${comp.itemProgressPct}%`, background: "#F59E0B" }} />
          </div>
          <span className="shrink-0 text-[10.5px]" style={{ color: "#D97706", ...anekBold }}>{comp.itemProgressPct}% attended</span>
        </div>
      )}
    </div>
  );
}

function StageCard({ stage, expanded, onToggle, theme }: {
  stage: CompetitionStage; expanded: boolean; onToggle: () => void; theme: FeastTheme;
}) {
  const style = RUN_STATE_STYLE[stage.status];
  // Still styled as neutral "upcoming" gray (nothing is actually live), just
  // worded so a partly-finished stage doesn't flatly say "Upcoming".
  const pillLabel = stage.hasPartialProgress ? "In Progress" : style.label;
  const accent = stage.status === "completed" ? "#16A34A" : stage.status === "running" ? "#D97706" : "#9D99BC";

  return (
    <div
      className="relative overflow-hidden mb-3"
      style={{
        background: stage.status === "running" ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.52)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 18,
        border: stage.status === "running" ? "1.5px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.7)",
        boxShadow: stage.status === "running" ? "0 6px 20px rgba(245,158,11,0.14)" : "0 2px 12px rgba(107,70,255,0.06)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />

      <button
        onClick={onToggle}
        className="w-full text-left border-none bg-transparent pl-4 pr-3.5 pt-3.5 pb-3.5 cursor-pointer active:scale-[0.985] transition-transform"
      >
        <div className="flex items-center gap-3 mb-2.5">
          <StageBadge number={stage.stageNumber} status={stage.status} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: theme.faint, ...anekBold }}>Stage {stage.stageNumber}</p>
            <p className="text-[20px] leading-tight truncate" style={{ color: "#1E1B4B", ...anekBold }}>{stage.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: style.bg, color: style.color, ...anekBold }}>
              {pillLabel}
            </span>
            <ChevronDown
              size={16} color={theme.faint}
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s cubic-bezier(.2,.8,.2,1)" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap mb-2">
          <span className="text-[13px]" style={{ color: theme.sub, ...anek }}>
            {stage.completedCount} / {stage.totalCount} completed
          </span>
          {stage.scheduledTime && (
            <span className="inline-flex items-center gap-1 text-[13px]" style={{ color: theme.sub, ...anek }}>
              <Clock size={12} color={theme.faint} />Scheduled {stage.scheduledTime}
            </span>
          )}
        </div>

        <ProgressBar pct={stage.progressPct} state={stage.status} />

        {stage.runningCompetition && (
          <div className="mt-2 flex items-center gap-1.5">
            <ItemStatusIcon status="running" color={accent} />
            <span className="text-[14px]" style={{ color: "#92400E", ...anekBold }}>{stage.runningCompetition.label} — Now Running</span>
          </div>
        )}
      </button>

      <div
        className="overflow-hidden transition-all"
        style={{ maxHeight: expanded ? 800 : 0, transitionDuration: "0.32s", transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}
      >
        <div className="px-4 pb-3 pt-0.5" style={{ borderTop: "1px solid rgba(30,27,75,0.06)" }}>
          {stage.competitions.map((c, i) => (
            <CompetitionRow key={c.id} comp={c} last={i === stage.competitions.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function FeastStages({ slug, theme, onBack, onExit, setFeastSlug }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  setFeastSlug: (s: string) => void;
}) {
  const { feasts, loading: feastsLoading } = useFeasts();
  const { stages, loading, totalCount, completedCount, overallPct, runningItems, upNext } = useCompetitionStages(slug);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const autoExpandedRef = useRef<Set<string>>(new Set());

  // Open a stage automatically the moment it goes live, so the thing people
  // opened this screen to see doesn't need a tap — but only ever force it
  // open once per stage, so re-collapsing a live stage by hand sticks.
  useEffect(() => {
    const newlyLive = stages.filter((s) => s.status === "running" && !autoExpandedRef.current.has(s.key));
    if (newlyLive.length === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const s of newlyLive) { next.add(s.key); autoExpandedRef.current.add(s.key); }
      return next;
    });
  }, [stages]);

  const toggle = (key: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const allDone = stages.length > 0 && stages.every((s) => s.status === "completed");

  return (
    <div className="px-5">
      <FeastTopBar title="Competition Stages" onBack={onBack} onExit={onExit} theme={theme} />
      <p className="text-[12.5px] -mt-2 mb-4" style={{ color: theme.faint }}>Live competition schedule &amp; progress</p>

      <FeastTabs
        feasts={feasts.map((f) => ({ slug: f.slug, name: f.name, icon: f.icon, tint: f.tint, accent: f.accent }))}
        active={slug}
        onPick={setFeastSlug}
        loading={feastsLoading}
      />

      {loading && stages.length === 0 ? (
        <div className="flex items-center justify-center pt-24">
          <Loader2 size={28} className="animate-spin" style={{ color: theme.lavender }} />
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl" style={{ background: "rgba(107,70,255,0.05)", border: `1px dashed ${theme.hairline}` }}>
          <p className="text-[14px]" style={{ color: theme.sub, ...anek }}>Stage schedule hasn&rsquo;t been published yet.</p>
          <p className="text-[12.5px] mt-1" style={{ color: theme.faint }}>Check back closer to the event.</p>
        </div>
      ) : (
        <>
          <LiveNowPanel runningItems={runningItems} upNext={upNext} allDone={allDone} theme={theme} />
          <OverallProgress completed={completedCount} total={totalCount} pct={overallPct} theme={theme} />

          <SectionTitle theme={theme} right={<span className="text-[12px]" style={{ color: theme.faint }}>{stages.length} stages</span>}>
            All Stages
          </SectionTitle>

          <div>
            {stages.map((stage) => (
              <StageCard
                key={stage.key}
                stage={stage}
                expanded={expanded.has(stage.key)}
                onToggle={() => toggle(stage.key)}
                theme={theme}
              />
            ))}
          </div>
        </>
      )}
      <div className="h-2" />
    </div>
  );
}
