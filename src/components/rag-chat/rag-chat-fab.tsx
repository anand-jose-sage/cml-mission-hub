"use client";

import { Bot } from "lucide-react";

// Small floating action button — hovers above BottomNav, visible on every
// tab. Deliberately minimal footprint (unlike FeastPortalCard's full-width
// home card) since this is a secondary, always-available entry point.
export function RagChatFab({ onEnter }: { onEnter: () => void }) {
  return (
    <button
      onClick={onEnter}
      aria-label="Ask the CML Document Assistant"
      className="fixed md:absolute z-[80] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
      style={{
        bottom: 108,
        right: 18,
        width: 46,
        height: 46,
        borderRadius: "50%",
        background: "linear-gradient(145deg, #22D3EE, #0E7490)",
        boxShadow: "0 8px 20px rgba(14,116,144,0.45), inset 0 1.5px 2px rgba(255,255,255,0.4)",
        border: "1px solid rgba(255,255,255,0.35)",
      }}
    >
      <Bot size={21} color="#fff" />
    </button>
  );
}
