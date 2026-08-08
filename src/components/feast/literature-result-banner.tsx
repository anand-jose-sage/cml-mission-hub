"use client";

import { Trophy, ArrowRight } from "lucide-react";

export function LiteratureResultBanner({ onClick }: { onClick: () => void }) {
  return (
    <div className="px-5 pb-1">
      <button
        onClick={onClick}
        className="relative block w-full text-left cursor-pointer active:scale-[0.98] transition-transform overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(115deg, #F0578A 0%, #FF7A6B 55%, #FFB454 100%)",
          boxShadow: "0 10px 24px rgba(240,87,138,0.4)",
        }}
      >
        {/* Decorative glow + sparkle confetti, echoing the candy-banner reference */}
        <div className="absolute -top-[26px] -right-[6px] w-[120px] h-[120px] rounded-full" style={{ background: "rgba(255,255,255,0.22)", filter: "blur(24px)" }} />
        <span className="absolute top-[14px] left-[62%] w-[5px] h-[5px] rounded-full" style={{ background: "#FFE9A8" }} />
        <span className="absolute top-[34px] left-[54%] w-[3px] h-[3px] rounded-full bg-white/70" />
        <span className="absolute bottom-[12px] left-[68%] w-[3px] h-[3px] rounded-full bg-white/60" />
        <span className="absolute top-[10px] right-[14px] w-[4px] h-[4px] rounded-full bg-white/50" />

        <div className="relative flex items-center gap-3 px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[20px] text-white leading-tight tracking-tight truncate" style={{ fontFamily: "var(--font-anek), sans-serif" }}>
              സാഹിത്യ മത്സരം 2026
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/75 mt-0.5" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
              Results Announced
            </div>
            <div
              className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 rounded-full text-[11.5px] font-bold"
              style={{ background: "#fff", color: "#E0447A" }}
            >
              View Results
              <ArrowRight size={12} />
            </div>
          </div>

          <div className="relative shrink-0 w-[64px] h-[64px] flex items-center justify-center">
            <div
              className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #5EEAD4, #14B8A6)", boxShadow: "0 8px 20px rgba(20,184,166,0.45)" }}
            >
              <Trophy size={30} color="#053B34" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
