"use client";

import { Sparkles, ArrowRight } from "lucide-react";

// Home-page entry point for the St. Thérèse Novena — matches LentPortalCard's
// recipe (portrait artwork bleeding into the card's own palette, copy +
// CTA pinned to the other side) using the "Rose Garden" pink palette (see
// src/lib/novena-theme.ts).
export function NovenaPortalCard({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="px-5 pt-2 pb-1" data-tour="novena-portal-card">
      <button
        onClick={onEnter}
        className="relative overflow-hidden w-full text-left cursor-pointer rounded-[22px] active:scale-[0.98] transition-transform"
        style={{
          height: 148,
          background: "linear-gradient(120deg, #BE185D 0%, #DB2777 55%, #F472B6 100%)",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "0 14px 30px rgba(219,39,119,0.35)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/novena/st-theresa-hero.jpg"
          alt=""
          className="absolute left-0 top-0 h-full pointer-events-none"
          style={{ width: "50%", objectFit: "cover", objectPosition: "50% 12%" }}
        />
        <div
          className="absolute left-0 top-0 h-full pointer-events-none"
          style={{ width: "50%", background: "linear-gradient(90deg, transparent 55%, #DB2777 96%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,.1) 0%, transparent 30%, rgba(190,24,93,.35) 90%)" }}
        />

        {/* glow blob behind the copy */}
        <div
          className="absolute pointer-events-none"
          style={{ right: -20, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(245,197,66,0.28)", filter: "blur(26px)" }}
        />

        {/* badge, top-left */}
        <div
          className="absolute left-3.5 top-3 inline-flex items-center gap-1 font-bold text-[8.5px] tracking-wider uppercase px-2 py-[3px] rounded-full"
          style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#F5C542", border: "1px solid rgba(245,197,66,0.4)", background: "rgba(0,0,0,0.28)" }}
        >
          <Sparkles size={10} color="#F5C542" fill="#F5C542" /> Novena &middot; Oct 1
        </div>

        {/* right-aligned copy + CTA */}
        <div className="absolute right-5 top-0 bottom-0 flex flex-col items-end justify-center gap-2 text-right max-w-[58%]">
          <div className="font-bold text-[19px] leading-tight tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#fff" }}>
            വി. കൊച്ചുത്രേസ്യാ നൊവേന
          </div>
          <div className="text-[12px] text-white/75">St. Little Thérèse &middot; Novena Prayer</div>
          <div
            className="mt-1 inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full font-bold text-[12.5px]"
            style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#831843", background: "linear-gradient(135deg, #FBCFE8, #F5C542)" }}
          >
            പ്രാർത്ഥിക്കാം <ArrowRight size={13} color="#831843" />
          </div>
        </div>
      </button>
    </div>
  );
}
