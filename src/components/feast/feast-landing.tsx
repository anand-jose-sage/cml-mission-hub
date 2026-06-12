"use client";

import { ArrowRight, Calendar, ChevronRight, Search, Loader2 } from "lucide-react";
import type { Feast } from "@/lib/feast-data";
import { useFeasts } from "@/hooks/use-feast";
import {
  GlassPanel, StatusPill, SectionTitle,
  FeastTopBar, FeastIcon, type FeastTheme,
} from "./feast-shared";

function FeastCard({ feast, theme, onOpen }: { feast: Feast; theme: FeastTheme; onOpen: () => void }) {
  const eventCount = feast.eventCount ?? feast.competitions.length;
  const regCount = feast.registrations;
  return (
    <GlassPanel theme={theme} pressable glow={feast.accent} onClick={onOpen} style={{ overflow: "hidden", marginBottom: 12 }}>
      <div className="relative p-[15px] pb-[13px]">
        <div className="absolute -top-5 -right-2.5 w-[120px] h-[120px] rounded-full" style={{ background: feast.accent + "40", filter: "blur(30px)" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-[14px] flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${feast.tint[0]}, ${feast.tint[1]})`, boxShadow: `0 8px 22px ${feast.accent}60` }}>
            <FeastIcon name={feast.icon} size={24} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[20px] tracking-tight leading-tight" style={{ fontFamily: "var(--font-anek), sans-serif", color: theme.text }}>
              {feast.name} <span className="font-semibold text-[20px]" style={{ color: theme.faint }}>{feast.year}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 mt-[3px] text-[11.5px]" style={{ color: theme.sub }}>
              <Calendar size={11} color={theme.sub} /> {feast.date}
            </div>
          </div>
        </div>
        <p className="relative text-[12px] leading-snug mt-2.5 mb-2.5 line-clamp-2" style={{ color: theme.sub }}>{feast.blurb}</p>
        <div className="relative flex items-center gap-2 mb-3">
          <StatusPill label={feast.status} color={theme.cyan} />
          <div className="flex gap-3 ml-auto">
            <div className="text-right">
              <span className="font-bold text-[14px]" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{regCount}</span>
              <span className="text-[10px] ml-1" style={{ color: theme.faint }}>registered</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-[14px]" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{eventCount}</span>
              <span className="text-[10px] ml-1" style={{ color: theme.faint }}>events</span>
            </div>
          </div>
        </div>
        <button
          className="relative w-full active:scale-95 transition-transform flex items-center justify-center gap-[7px]"
          style={{
            padding: "12px 18px",
            borderRadius: 13,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-poppins), sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: "#fff",
            background: `linear-gradient(135deg, ${feast.tint[0]}, ${feast.tint[1]})`,
            boxShadow: `0 8px 22px ${feast.accent}55`,
          }}
        >
          View Details
          <ArrowRight size={15} color="#fff" />
        </button>
      </div>
    </GlassPanel>
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

      <SectionTitle theme={theme} right={
        loading
          ? <Loader2 size={13} className="animate-spin" style={{ color: theme.faint }} />
          : <span className="text-[12px]" style={{ color: theme.faint }}>{visibleFeasts.length} active</span>
      }>
        Active Feasts
      </SectionTitle>

      {visibleFeasts.map((f) => (
        <FeastCard key={f.slug} feast={f} theme={theme} onOpen={() => onOpen(f.slug)} />
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
