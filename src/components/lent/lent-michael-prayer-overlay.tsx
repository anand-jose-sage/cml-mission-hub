"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LentIcon, type LentTheme } from "./lent-shared";
import type { LentMeta } from "@/types";

type Lang = "ml" | "en";

// Decorated bottom-sheet for the classic Prayer to St. Michael — pulled out
// of the chat/inline-content flow because the prayer itself is long; shown
// one language at a time via the toggle rather than both stacked.
export function LentMichaelPrayerOverlay({ theme, meta, onClose }: { theme: LentTheme; meta: LentMeta; onClose: () => void }) {
  const [lang, setLang] = useState<Lang>("ml");
  const text = lang === "ml" ? meta.prayerToMichaelMl : meta.prayerToMichaelEn;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60]" style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 0.9, 0.24, 1] }}
        className="fixed left-0 right-0 bottom-0 z-[61] max-w-md mx-auto flex flex-col"
        style={{
          borderRadius: "28px 28px 0 0", background: theme.bg2,
          border: `1px solid ${theme.line}`, boxShadow: "0 -30px 60px -20px rgba(0,0,0,.7)",
          maxHeight: "82%",
        }}
      >
        <div
          className="relative shrink-0 flex flex-col items-center pt-7 pb-5 px-6"
          style={{ borderRadius: "28px 28px 0 0", background: `linear-gradient(160deg, ${theme.accent}26, transparent 75%)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: theme.surf, border: `1px solid ${theme.line}` }}
            aria-label="Close"
          >
            <LentIcon name="X" size={14} color={theme.muted} />
          </button>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `linear-gradient(150deg, ${theme.accent}, ${theme.accent2})`, boxShadow: `0 10px 26px -8px ${theme.glow}` }}
          >
            <LentIcon name="ShieldCheck" size={24} color="#fff" />
          </div>
          <div className="text-center font-semibold" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 17, color: theme.text }}>
            വിശുദ്ധ മിഖായേലിനോടുള്ള പ്രാർത്ഥന
          </div>
          <div className="text-center mt-0.5 uppercase" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 10.5, letterSpacing: ".1em", color: theme.muted }}>
            Prayer to St. Michael the Archangel
          </div>

          <div className="flex gap-1 p-1 rounded-full mt-5" style={{ background: theme.surf, border: `1px solid ${theme.line}` }}>
            {(["ml", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-5 py-1.5 rounded-full cursor-pointer border-none"
                style={{
                  fontFamily: "var(--font-lent-outfit), sans-serif", fontSize: 11.5, fontWeight: 600,
                  background: lang === l ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` : "transparent",
                  color: lang === l ? "#fff" : theme.muted,
                }}
              >
                {l === "ml" ? "മലയാളം" : "English"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8 pt-2">
          <div
            className="whitespace-pre-line"
            style={{
              fontFamily: lang === "ml" ? "var(--font-lent-malayalam), sans-serif" : "var(--font-lent-scripture), Georgia, serif",
              fontStyle: lang === "en" ? "italic" : "normal",
              fontSize: lang === "ml" ? 15.5 : 15,
              lineHeight: 1.9,
              color: theme.text,
            }}
          >
            {text}
          </div>
        </div>
      </motion.div>
    </>
  );
}
