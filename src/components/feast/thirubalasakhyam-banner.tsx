"use client";

import { ArrowRight, Sparkles } from "lucide-react";

export const THIRUBALASAKHYAM_SLUG = "thirubalasakhyam-2026";

// Home-page banner for the Thirubalasakhyam feast (Poombatta 1 & 2): artwork
// with a dark bottom fade carrying the title. Opens the portal on that feast.
export function ThirubalasakhyamBanner({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="px-5 pt-2 pb-1">
      <button
        onClick={onEnter}
        className="relative overflow-hidden w-full text-left cursor-pointer rounded-[22px] active:scale-[0.98] transition-transform"
        style={{
          height: 200,
          backgroundColor: "#1a0e40",
          backgroundImage: "url(/thirubalasakhyam-banner.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center 22%",
          border: "1px solid rgba(214,170,255,0.35)",
          boxShadow: "0 14px 30px rgba(180,76,255,0.35)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(20,8,48,0) 35%, rgba(20,8,48,0.88) 100%)" }} />

        <div
          className="absolute left-3.5 top-3 inline-flex items-center gap-1 font-bold text-[8.5px] tracking-wider uppercase px-2 py-[3px] rounded-full"
          style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#F5C542", border: "1px solid rgba(245,197,66,0.5)", background: "rgba(0,0,0,0.45)" }}
        >
          <Sparkles size={10} color="#F5C542" fill="#F5C542" /> New Feast &middot; 2026
        </div>

        <div className="absolute left-4 right-4 bottom-3.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-[22px] leading-tight text-white" style={{ fontFamily: "var(--font-anek), sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              തിരുബാലസഖ്യം
            </div>
            <div className="text-[12px]" style={{ color: "#E4E0FA", fontFamily: "var(--font-anek), sans-serif" }}>പൂമ്പാറ്റ 1 &middot; പൂമ്പാറ്റ 2</div>
          </div>
          <div
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full font-bold text-[12.5px] text-white"
            style={{ fontFamily: "var(--font-poppins), sans-serif", background: "linear-gradient(135deg, #FF3FB4, #B44CFF)", boxShadow: "0 6px 18px rgba(255,63,180,0.4)" }}
          >
            View Feast <ArrowRight size={13} color="#fff" />
          </div>
        </div>
      </button>
    </div>
  );
}
