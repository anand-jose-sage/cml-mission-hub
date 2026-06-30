"use client";

import { Trophy, Sparkles, ArrowRight } from "lucide-react";

export function FeastPortalCard({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="px-5 pt-2 pb-1" data-tour="feast-portal-card">
      <button
        onClick={onEnter}
        className="relative overflow-hidden w-full text-left cursor-pointer rounded-[26px] p-[18px] active:scale-[0.98] transition-transform"
        style={{
          border: "1px solid rgba(255,255,255,0.5)",
          background: "linear-gradient(135deg, #6B46FF 0%, #8B5CF6 55%, #A78BFA 100%)",
        }}
      >
        <div className="absolute -top-[30px] -right-[10px] w-[130px] h-[130px] rounded-full" style={{ background: "rgba(245,197,66,0.28)", filter: "blur(26px)" }} />
        <div className="relative flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-2xl flex-shrink-0 flex items-center justify-center animate-bounce" style={{ background: "linear-gradient(135deg, #F7D26B, #F0A500)", boxShadow: "0 10px 24px rgba(245,197,66,0.45)", animationDuration: "5.5s" }}>
            <Trophy size={26} color="#3a2a00" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 font-bold text-[9.5px] tracking-wider text-[#F5C542] uppercase whitespace-nowrap" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
              <Sparkles size={12} color="#F5C542" fill="#F5C542" /> New &middot; 2026 Season
            </div>
            <div className="font-semibold text-[19px] text-white mt-0.5 mb-0.5 tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>Feast Portal</div>
            <div className="text-[12px] text-white/70">2 active feasts &middot; Literature &amp; Arts</div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)" }}>
              <ArrowRight size={17} color="#fff" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
