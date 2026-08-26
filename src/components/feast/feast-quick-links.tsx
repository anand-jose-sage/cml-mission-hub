"use client";

import { Trophy, Medal, ArrowRight } from "lucide-react";

// Small themed pair sitting right under FeastPortalCard — same gradient +
// icon-badge + glow-blob recipe as that card, just compact and half-width,
// so these read as decorated shortcuts rather than flat utility buttons.
export function FeastQuickLinks({
  feastName, onFeast, onResults,
}: {
  feastName: string;
  onFeast: () => void;
  onResults: () => void;
}) {
  return (
    <div className="px-5 flex gap-2.5 pb-1">
      <button
        onClick={onFeast}
        className="relative overflow-hidden flex-1 text-left cursor-pointer rounded-[18px] p-3 active:scale-[0.97] transition-transform"
        style={{
          border: "1px solid rgba(255,255,255,0.5)",
          background: "linear-gradient(135deg, #C026D3 0%, #DB2777 55%, #EC4899 100%)",
          boxShadow: "0 6px 16px rgba(219,39,119,0.35)",
        }}
      >
        <div className="absolute -top-4 -right-3 w-16 h-16 rounded-full pointer-events-none" style={{ background: "rgba(245,197,66,0.3)", filter: "blur(16px)" }} />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
            <Trophy size={17} color="#fff" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="relative flex h-[6px] w-[6px] shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#F5C542" }} />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px]" style={{ background: "#F5C542" }} />
              </span>
              <span className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: "#F5C542", fontFamily: "var(--font-poppins), sans-serif" }}>Live Now</span>
            </div>
            <p className="font-semibold text-[13px] text-white truncate" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{feastName}</p>
          </div>
          <ArrowRight size={14} color="rgba(255,255,255,0.7)" className="shrink-0" />
        </div>
      </button>

      <button
        onClick={onResults}
        className="relative overflow-hidden flex-1 text-left cursor-pointer rounded-[18px] p-3 active:scale-[0.97] transition-transform"
        style={{
          border: "1px solid rgba(255,255,255,0.5)",
          background: "linear-gradient(135deg, #F7D26B 0%, #F0A500 100%)",
          boxShadow: "0 6px 16px rgba(245,197,66,0.35)",
        }}
      >
        <div className="absolute -top-4 -right-3 w-16 h-16 rounded-full pointer-events-none" style={{ background: "rgba(107,70,255,0.2)", filter: "blur(16px)" }} />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(58,42,0,0.14)" }}>
            <Medal size={17} color="#3a2a00" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[8.5px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(58,42,0,0.7)", fontFamily: "var(--font-poppins), sans-serif" }}>Standings</span>
            <p className="font-semibold text-[13px] truncate" style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#3a2a00" }}>Results</p>
          </div>
          <ArrowRight size={14} color="rgba(58,42,0,0.5)" className="shrink-0" />
        </div>
      </button>
    </div>
  );
}
