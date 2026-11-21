"use client";

import { Calendar, ChevronRight, Search, Loader2, Clock3, Users, ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import type { Feast } from "@/lib/feast-data";
import { useFeasts } from "@/hooks/use-feast";
import {
  GlassPanel,
  FeastTopBar, FeastIcon, type FeastTheme,
} from "./feast-shared";

// fest_hub "Active Fests" card: the fest's colours run down a spine on the
// left (icon + year); the glass body carries status, name, date, results
// progress (or the blurb) and registrations/events. The whole card opens it.
const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

function StatusChip({ status, daysLeft, accent, theme }: { status: string; daysLeft: number; accent: string; theme: FeastTheme }) {
  const live = status === "Ongoing";
  const label = !live && status !== "Completed" && daysLeft > 0 ? `${daysLeft}d left` : status;
  return (
    <span
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-extrabold"
      style={live
        ? { background: "rgba(255,79,216,0.12)", color: "#FF4FD8", border: "1px solid rgba(255,79,216,0.38)" }
        : { background: mix(accent, 14), color: theme.text, border: `1px solid ${mix(accent, 30)}` }}
    >
      {live ? <span className="h-[7px] w-[7px] rounded-full animate-pulse" style={{ background: "#FF4FD8" }} /> : status !== "Completed" && daysLeft > 0 ? <Clock3 className="h-3 w-3" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function Stat({ icon: Icon, value, label, theme }: { icon: typeof Users; value: number; label: string; theme: FeastTheme }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-bold" style={{ color: theme.sub }}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="text-[16px] font-extrabold tabular-nums" style={{ color: theme.text, fontFamily: "var(--font-poppins), sans-serif" }}>{value}</span>
      {label}
    </span>
  );
}

function FeastCard({ feast: f, theme, onOpen, dataTour, index }: { feast: Feast; theme: FeastTheme; onOpen: () => void; dataTour?: string; index: number }) {
  const spine = `linear-gradient(180deg, ${f.tint[0]}, ${f.tint[1]} 60%, ${f.accent})`;
  const live = f.status === "Ongoing";
  const done = f.status === "Completed";
  const events = f.eventCount ?? f.competitions.length;
  const published = f.competitions.filter((c) => c.compStatus === "published").length;
  const showProgress = (live || done) && events > 0 && f.competitions.length > 0;
  const pct = showProgress ? Math.min(100, Math.round((published / events) * 100)) : 0;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      data-tour={dataTour}
      aria-label={`${f.name} ${f.year}, ${f.status}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 + index * 0.08 }}
      className="group relative mb-3.5 flex w-full overflow-hidden rounded-[24px] text-left cursor-pointer transition-transform active:scale-[0.99]"
      style={{
        ...theme.glassStrong,
        border: `1px solid ${mix(f.accent, 26)}`,
        boxShadow: `0 18px 40px ${mix(f.accent, 16)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <div className="relative flex w-[72px] shrink-0 flex-col items-center justify-between py-4" style={{ background: spine }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.35), transparent 70%)" }} />
        <span aria-hidden="true" className="relative flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.45)", boxShadow: "0 8px 18px rgba(0,0,0,0.18)" }}>
          <FeastIcon name={f.icon} size={24} color="#fff" />
        </span>
        <span className="relative text-[15px] font-extrabold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.25)", fontFamily: "var(--font-poppins), sans-serif" }}>{f.year}</span>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[72px] w-1/2" style={{ background: `linear-gradient(90deg, ${mix(f.accent, 18)}, transparent)` }} />

      <div className="relative flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <StatusChip status={f.status} daysLeft={f.daysLeft} accent={f.accent} theme={theme} />
          <span
            aria-hidden="true"
            data-tour={dataTour ? `${dataTour}-view-btn` : undefined}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5"
            style={{ background: mix(f.accent, 22), border: `1px solid ${mix(f.accent, 55)}`, color: theme.text, boxShadow: `0 0 14px ${mix(f.accent, 30)}` }}
          >
            <ChevronRight className="h-5 w-5" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="m-0 text-[22px] font-extrabold leading-[1.2]" style={{ color: theme.text, fontFamily: "var(--font-anek), sans-serif" }}>{f.name}</p>
          {f.date && (
            <p className="m-0 mt-1 flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-bold" style={{ color: theme.sub }}>
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {f.date}
            </p>
          )}
        </div>

        {showProgress ? (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="whitespace-nowrap text-[12.5px] font-bold" style={{ color: theme.sub }}>
                <span className="text-[18px] font-extrabold" style={{ color: theme.text, fontFamily: "var(--font-poppins), sans-serif" }}>{published}</span>/{events} results out
              </span>
              <span className="text-[13px] font-extrabold" style={{ color: f.accent, fontFamily: "var(--font-poppins), sans-serif" }}>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: theme.track }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Results published">
              <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${f.tint[0]}, ${f.accent})`, boxShadow: `0 0 10px ${mix(f.accent, 55)}` }} />
            </div>
          </div>
        ) : (
          f.blurb && <p className="m-0 line-clamp-2 text-[13px] font-semibold leading-normal" style={{ color: theme.sub }}>{f.blurb}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1">
          <Stat icon={Users} value={f.registrations} label="registered" theme={theme} />
          <Stat icon={ListChecks} value={events} label="events" theme={theme} />
        </div>
      </div>
    </motion.button>
  );
}

export function FeastLanding({ theme, onOpen, onExit, onSearch }: {
  theme: FeastTheme;
  onOpen: (slug: string) => void;
  onExit: () => void;
  onSearch?: () => void;
}) {
  const { feasts: visibleFeasts, loading } = useFeasts();

  return (
    <div className="px-5">
      <FeastTopBar title="Feast Portal" onExit={onExit} theme={theme} />
      <div className="mb-[18px]">
        <h1 className="font-bold text-[32px] m-0 tracking-tight leading-[1.08]" style={{ fontFamily: "var(--font-anek), sans-serif", color: theme.text }}>
          മേഖല  കലാരവം<br />
          <span style={{ background: "linear-gradient(100deg, #F5C542, #EC4899, #A855F7)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>ഉയരുന്നിടം.</span>
        </h1>
        <p className="text-[14px] mt-3 leading-relaxed" style={{ color: theme.sub }}>Register, compete and follow live results across the 2026 feast season.</p>
      </div>

      <div className="flex items-end justify-between px-1 pb-3 pt-2">
        <h2 className="m-0 text-[34px] font-black uppercase leading-[0.92]" style={{ color: theme.text, fontFamily: "var(--font-poppins), sans-serif", letterSpacing: "-0.01em" }}>Active Feasts</h2>
        <span className="pb-[3px] text-[12.5px] font-bold" style={{ color: theme.faint }}>
          {loading ? <Loader2 size={16} className="animate-spin" style={{ color: theme.lavender }} aria-label="Loading" /> : `${visibleFeasts.length} active`}
        </span>
      </div>

      {visibleFeasts.map((f, i) => (
        <FeastCard
          key={f.slug}
          feast={f}
          theme={theme}
          onOpen={() => onOpen(f.slug)}
          dataTour={i === 0 ? "feast-listing-first" : undefined}
          index={i}
        />
      ))}

      <GlassPanel
        theme={theme}
        pressable
        onClick={onSearch}
        style={{ padding: "14px 16px", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}
      >
        <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,197,66,0.16)" }}>
          <Search size={18} color={theme.gold} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[13.5px]" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>Already registered?</div>
          <div className="text-[11.5px]" style={{ color: theme.sub }}>Look up your registration number</div>
        </div>
        <ChevronRight size={18} color={theme.faint} />
      </GlassPanel>
    </div>
  );
}
