"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { FEASTS } from "@/lib/feast-data";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";
import { GlassPanel, GlowBtn, type FeastTheme } from "./feast-shared";
import type { RegResult } from "./feast-register";

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 44 }, () => ({
      left: Math.random() * 100,
      delay: (Math.random() * 0.6).toFixed(2),
      dur: (1.8 + Math.random() * 1.6).toFixed(2),
      color: ["#F5C542", "#A855F7", "#EC4899", "#34D3EE", "#7C3AED", "#fff"][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 7,
      rot: Math.random() * 360,
      round: Math.random() > 0.5,
    }))
  ).current;

  return (
    <>
      <style>{`
        @keyframes feastConfetti { 0% { transform: translateY(-30px) rotate(0); opacity: 1; } 100% { transform: translateY(620px) rotate(620deg); opacity: 0; } }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
        {pieces.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute", top: -20, left: p.left + "%",
              width: p.size, height: p.round ? p.size : p.size * 0.45,
              background: p.color, borderRadius: p.round ? "50%" : 2,
              transform: `rotate(${p.rot}deg)`,
              animation: `feastConfetti ${p.dur}s linear ${p.delay}s forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export function FeastSuccess({ slug, theme, result, onDone, onRegisterAnother }: {
  slug: string;
  theme: FeastTheme;
  result: RegResult | null;
  onDone: () => void;
  onRegisterAnother: () => void;
}) {
  const feast = FEASTS[slug];
  const r = result || { regNo: "REG-0000", name: "—", houseName: "—", shakha: "—", dob: "—", gender: "—", category: "", phone: "—", comps: [] };
  return (
    <div className="px-5 relative">
      <Confetti />
      <div className="relative text-center pt-4">
        <div className="w-[84px] h-[84px] rounded-full mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, #34D3AE, #16A34A)", boxShadow: "0 14px 38px rgba(34,197,94,0.5)" }}>
          <Check size={42} color="#fff" strokeWidth={3} />
        </div>
        <h2 className="font-semibold text-[24px] mt-[18px] mb-1.5 tracking-tight" style={{ fontFamily: "var(--font-anek), sans-serif", color: theme.text }}>You&apos;re registered!</h2>
        <p className="text-[13.5px] leading-relaxed mx-auto max-w-[280px]" style={{ color: theme.sub }}>
          Welcome to <strong style={{ color: theme.text }}>{feast?.name} {feast?.year}</strong>.
        </p>
      </div>

      <GlassPanel theme={theme} style={{ padding: 16, marginTop: 14 }}>
        {([
          ["Participant", r.name, ""],
          ["House Name", r.houseName || "—", ""],
          ["Shakha", r.shakha, ""],
          ["Date of Birth", r.dob || "—", ""],
          ["Gender", r.gender ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1) : "—", ""],
          ["Category", CATEGORY_LABELS[r.category] || r.category || "—", CATEGORY_COLORS[r.category] || ""],
          ["Phone", r.phone, ""],
        ] as [string, string, string][]).map(([k, v, accent]) => (
          <div key={k} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${theme.hairline}` }}>
            <span className="text-[12.5px]" style={{ color: theme.faint }}>{k}</span>
            <span className="text-[13.5px] font-semibold" style={{ fontFamily: "var(--font-poppins), sans-serif", color: accent || theme.text }}>{v}</span>
          </div>
        ))}
        <div className="mt-3">
          <div className="text-[12.5px] mb-2" style={{ color: theme.faint }}>Your competitions ({r.comps.length})</div>
          <div className="flex flex-wrap gap-[7px]">
            {r.comps.map((c, i) => (
              <span key={i} className="font-semibold text-[11.5px] px-[11px] py-1.5 rounded-full" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text, background: theme.purple + "2e", border: `1px solid ${theme.purple}55` }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </GlassPanel>

      <div className="flex gap-2.5 mt-4">
        <GlowBtn variant="ghost" full icon="UserPlus" onClick={onRegisterAnother}>Register another</GlowBtn>
        <GlowBtn variant="primary" full iconRight="ArrowRight" onClick={onDone}>Done</GlowBtn>
      </div>
      <div className="h-2" />
    </div>
  );
}
