"use client";

import { ArrowRight } from "lucide-react";
import { getLentStatus } from "@/lib/lent-dates";
import { LENT } from "@/lib/lent-theme";

function subtitle(): string {
  const status = getLentStatus(new Date());
  switch (status.phase) {
    case "day": return `Day ${status.day} of 40 · ഇന്ന്`;
    case "sunday": return "ഇന്ന് ഒരു വിശ്രമ ദിനം · നാളെ തുടരാം";
    case "before": return `Begins in ${status.daysUntilStart} days`;
    case "after": return "40/40 · ക്രിസ്തു ജയിച്ചു";
  }
}

// Dashboard entry card — matches the Lent Portal's own "Ember Vigil" palette
// (near-black + ember/gold, see src/lib/lent-theme.ts) rather than a
// standalone banner style, since this card is the doorway into that themed
// experience. The archangel artwork sits on the left, fading into the card's
// dark background on the right where the copy and CTA sit.
export function LentPortalCard({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="px-5 pt-2 pb-1">
      <button
        onClick={onEnter}
        className="relative overflow-hidden w-full text-left cursor-pointer rounded-[22px] active:scale-[0.98] transition-transform"
        style={{
          height: 148,
          background: `linear-gradient(120deg, ${LENT.page} 0%, ${LENT.bg} 55%, ${LENT.bg2} 100%)`,
          border: `1px solid ${LENT.line}`,
          boxShadow: `0 14px 30px ${LENT.glow}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lent/michael-hero.jpg"
          alt=""
          className="absolute left-0 top-0 h-full pointer-events-none"
          style={{ width: "58%", objectFit: "cover", objectPosition: "30% 15%" }}
        />
        <div
          className="absolute left-0 top-0 h-full pointer-events-none"
          style={{ width: "58%", background: `linear-gradient(90deg, transparent 58%, ${LENT.bg} 96%)` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(180deg, rgba(0,0,0,.12) 0%, transparent 30%, ${LENT.bg} 88%)` }}
        />

        {/* radial ember glow behind the copy */}
        <div
          className="absolute pointer-events-none"
          style={{ right: -20, top: -30, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${LENT.glow} 0%, transparent 70%)`, filter: "blur(10px)" }}
        />

        {/* date badge, top-left */}
        <div
          className="absolute left-3.5 top-3 font-bold text-[8px] tracking-wider uppercase px-2 py-[3px] rounded-full"
          style={{ fontFamily: "var(--font-poppins), sans-serif", color: LENT.accent2, border: `1px solid ${LENT.line}`, background: "rgba(0,0,0,0.35)" }}
        >
          40 Days
        </div>

        {/* right-aligned copy + CTA */}
        <div className="absolute right-5 top-0 bottom-0 flex flex-col items-end justify-center gap-2.5 text-right max-w-[58%]">
          <div className="font-bold text-[22px] leading-tight tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif", color: LENT.text }}>
            St. Michael&apos;s Lent
          </div>
          <div className="text-[13px]" style={{ color: LENT.muted }}>{subtitle()}</div>
          <div
            className="mt-1.5 inline-flex items-center gap-1.5 px-5 py-2 rounded-full font-bold text-[13px]"
            style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#2A1300", background: `linear-gradient(135deg, ${LENT.accent2}, ${LENT.accent})` }}
          >
            തുടരാം <ArrowRight size={14} color="#2A1300" />
          </div>
        </div>
      </button>
    </div>
  );
}
