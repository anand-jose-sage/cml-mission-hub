"use client";

import { useEffect, useState } from "react";
import { POSTER_FONT_CLASS, posterTitle } from "./poster-fonts";

export interface ResultPosterProps {
  rank: 1 | 2 | 3;
  winnerName: string;
  houseName: string | null;
  shakhaName: string;
  competitionName: string;
  categoryLabel: string;
  feastName: string;
  photoSrc: string | null;
}

const RANK_MEDAL: Record<1 | 2 | 3, { src: string; top: number; height: number; shadow: string; label: string }> = {
  1: { src: "/poster/medal-gold.png", top: 388, height: 337, shadow: "rgba(110,15,31,.3)", label: "FIRST PRIZE" },
  2: { src: "/poster/medal-silver.png", top: 388, height: 382, shadow: "rgba(60,60,70,.3)", label: "SECOND PRIZE" },
  3: { src: "/poster/medal-bronze.png", top: 388, height: 381, shadow: "rgba(90,55,25,.3)", label: "THIRD PRIZE" },
};

const TITLE_MAX_WIDTH = 1124; // available width for the single-line title
const TITLE_MAX_SIZE = 253; // safety cap for very short feast names
const TITLE_MEASURE_BASELINE = 100;

// Measures the feast-name text with the actual title font (via canvas
// measureText) and returns the largest font size that keeps it on one line
// within TITLE_MAX_WIDTH — rather than guessing from character count, which
// is unreliable across scripts (Malayalam glyph widths vary a lot).
function useTitleFontSize(text: string): number {
  const [size, setSize] = useState(TITLE_MAX_SIZE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await document.fonts.ready;
      } catch {
        // fall through and measure with whatever is loaded
      }
      if (cancelled || !text) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = `700 ${TITLE_MEASURE_BASELINE}px ${posterTitle.style.fontFamily}, "Noto Sans Malayalam", sans-serif`;
      const measuredWidth = ctx.measureText(text).width;
      if (!measuredWidth) return;
      const fitted = Math.min(TITLE_MAX_SIZE, (TITLE_MAX_WIDTH / measuredWidth) * TITLE_MEASURE_BASELINE);
      if (!cancelled) setSize(fitted);
    })();
    return () => { cancelled = true; };
  }, [text]);

  return size;
}

function nameFontSize(name: string): number {
  if (name.length > 15) return 95;
  if (name.length > 10) return 115;
  return 200;
}

function competitionFontSize(name: string): number {
  if (name.length > 30) return 30;
  if (name.length > 20) return 40;
  return 58;
}

function LeafSprig({
  mirrored, fill = "#B98A34", width, height, viewBox,
}: { mirrored?: boolean; fill?: string; width: number; height: number; viewBox: string }) {
  return (
    <svg width={width} height={height} viewBox={viewBox} style={mirrored ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <g fill={fill}>
        <ellipse cx="0" cy="0" rx="9" ry="4" transform="rotate(-22)" />
        <ellipse cx="16" cy="-4" rx="8" ry="3.6" transform="rotate(-30 16 -4)" />
        <ellipse cx="30" cy="-10" rx="7" ry="3.2" transform="rotate(-40 30 -10)" />
      </g>
    </svg>
  );
}

export function ResultPoster({
  rank, winnerName, houseName, shakhaName, competitionName, categoryLabel, feastName, photoSrc,
}: ResultPosterProps) {
  const medal = RANK_MEDAL[rank];
  const titleSize = useTitleFontSize(feastName);

  return (
    <div
      className={POSTER_FONT_CLASS}
      style={{
        width: 1080,
        height: 1920,
        position: "relative",
        overflow: "hidden",
        background: "#FBF2DE",
        fontFamily: "var(--font-poster-serif), Georgia, serif",
        color: "#4A3524",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 46% at 50% 30%, #FEFAEE 0%, #FBF2DE 52%, #F2E2C2 100%)", pointerEvents: "none" }} />
      <div
        style={{
          position: "absolute", top: 300, left: "50%", transform: "translateX(-50%)",
          width: 1200, height: 660,
          background: "repeating-conic-gradient(from 0deg at 50% 45%, rgba(255,255,255,.85) 0deg 1.5deg, rgba(255,255,255,0) 1.5deg 7deg)",
          WebkitMaskImage: "radial-gradient(circle at 50% 45%, rgba(0,0,0,.9) 12%, rgba(0,0,0,.35) 40%, transparent 66%)",
          maskImage: "radial-gradient(circle at 50% 45%, rgba(0,0,0,.9) 12%, rgba(0,0,0,.35) 40%, transparent 66%)",
          pointerEvents: "none",
        }}
      />

      {/* eslint-disable @next/next/no-img-element */}
      <img src="/poster/vine-border.png" alt="" style={{ position: "absolute", bottom: 0, left: 0, width: 238, height: 962, pointerEvents: "none" }} />
      <img src="/poster/vine-border.png" alt="" style={{ position: "absolute", bottom: 0, right: 0, width: 238, height: 962, transform: "scaleX(-1)", pointerEvents: "none" }} />
      <img src="/poster/corner-top-left.png" alt="" style={{ position: "absolute", top: 4, left: 4, width: 198, height: 200, transform: "rotate(-90deg)", pointerEvents: "none" }} />
      <img src="/poster/corner-top-right.png" alt="" style={{ position: "absolute", top: 4, right: 4, width: 219, height: 200, transform: "rotate(90deg)", pointerEvents: "none" }} />
      {/* eslint-enable @next/next/no-img-element */}

      <div style={{ position: "absolute", top: 20, left: 20, right: 20, height: 936, border: "2.5px solid #C9963F", borderBottom: "none", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 31, left: 31, right: 31, height: 914, border: "1px solid rgba(169,120,46,.45)", borderBottom: "none", pointerEvents: "none" }} />

      {/* Org header */}
      <div style={{ position: "absolute", top: 56, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: "var(--font-poster-malayalam), sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1.25, color: "#6E0F1F" }}>ചെറുപുഷ്പ മിഷൻ ലീഗ്</div>
        <div style={{ fontFamily: "var(--font-poster-malayalam), sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1.25, color: "#6E0F1F" }}>കൽപ്പറ്റ മേഖല</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <div style={{ width: 120, height: 1, background: "linear-gradient(90deg,rgba(201,150,63,0),#C9963F)" }} />
          <div style={{ width: 8, height: 8, background: "#C9963F", transform: "rotate(45deg)" }} />
          <div style={{ width: 11, height: 11, background: "#A9782E", transform: "rotate(45deg)" }} />
          <div style={{ width: 8, height: 8, background: "#C9963F", transform: "rotate(45deg)" }} />
          <div style={{ width: 120, height: 1, background: "linear-gradient(90deg,#C9963F,rgba(201,150,63,0))" }} />
        </div>
      </div>

      {/* Title — feast name, single line, scaled to fill the available width */}
      <div style={{ position: "absolute", top: 168, left: 50, right: 50, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", fontFamily: "var(--font-poster-title), var(--font-poster-malayalam), sans-serif", fontWeight: 700, fontSize: titleSize, lineHeight: 0.95, letterSpacing: "normal", color: "#6E0F1F", textShadow: "2px 2px 0 rgba(110,15,31,.22)" }}>
        {feastName}
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 380, left: 120, right: 120, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 9, height: 9, background: "#C9963F", transform: "rotate(45deg)", flex: "none" }} />
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(201,150,63,.25),#C9963F 22%,#C9963F 78%,rgba(201,150,63,.25))" }} />
        <div style={{ width: 9, height: 9, background: "#C9963F", transform: "rotate(45deg)", flex: "none" }} />
      </div>

      {/* Medal */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={medal.src}
        alt={`${medal.label} medal`}
        style={{
          position: "absolute", top: medal.top, left: "50%", transform: "translateX(-50%)",
          width: 300, height: medal.height,
          filter: `drop-shadow(0 26px 34px ${medal.shadow})`,
        }}
      />

      {/* Prize ribbon */}
      <div style={{ position: "absolute", top: 750, left: "50%", transform: "translateX(-50%)", width: 760, height: 180 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/poster/ribbon-banner.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 70, right: 70, top: 20, bottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <LeafSprig width={44} height={24} viewBox="-6 -16 58 30" fill="#E8C67C" />
          <div style={{ fontFamily: "var(--font-poster-serif), Georgia, serif", fontWeight: 700, fontSize: 60, letterSpacing: ".1em", color: "#F4DCA4", paddingLeft: ".1em", whiteSpace: "nowrap" }}>{medal.label}</div>
          <LeafSprig mirrored width={44} height={24} viewBox="-6 -16 58 30" fill="#E8C67C" />
        </div>
      </div>

      {/* Winner name */}
      <div
        style={{
          position: "absolute", top: 920, left: 60, right: 60, textAlign: "center",
          fontFamily: "var(--font-poster-script), cursive", fontSize: nameFontSize(winnerName), lineHeight: 1, color: "#6E0F1F",
        }}
      >
        {winnerName}
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 1110, left: 150, right: 150, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(201,150,63,0),#C9963F)" }} />
        <div style={{ width: 7, height: 7, background: "#C9963F", transform: "rotate(45deg)" }} />
        <div style={{ width: 10, height: 10, background: "#A9782E", transform: "rotate(45deg)" }} />
        <div style={{ width: 7, height: 7, background: "#C9963F", transform: "rotate(45deg)" }} />
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#C9963F,rgba(201,150,63,0))" }} />
      </div>

      {/* House + Shakha */}
      <div style={{ position: "absolute", top: 1150, left: 120, right: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
        {houseName && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid #C9963F", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A9782E" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 11 12 4l9 7" />
                <path d="M5.5 10.5V20h13v-9.5" />
                <path d="M10 20v-5h4v5" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-poster-oswald), sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: ".05em", color: "#4A3524", textTransform: "uppercase", maxWidth: 260 }}>{houseName}</div>
          </div>
        )}
        {houseName && <div style={{ width: 12, height: 12, background: "#C9963F", transform: "rotate(45deg)", flex: "none" }} />}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid #C9963F", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 26 24" fill="none" stroke="#A9782E" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="9" cy="8" r="3.4" />
              <path d="M3 20c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6" />
              <circle cx="18.5" cy="9.5" r="2.6" />
              <path d="M17 15c3 0 5.5 2 5.5 5" />
            </svg>
          </div>
          <div style={{ fontFamily: "var(--font-poster-oswald), sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: ".05em", color: "#4A3524", textTransform: "uppercase", maxWidth: 260 }}>{shakhaName}</div>
        </div>
      </div>

      {/* Photo frame — the ornate gold-and-maroon frame image already includes
          a painted maroon swatch, which is the placeholder look when no photo
          is set. When a photo is set, it's layered ON TOP of the frame image,
          sized to sit just inside the maroon swatch's measured bounds so the
          gold ring and leaf flourishes (which are outside that circle) stay
          visible and aren't covered. */}
      <div style={{ position: "absolute", top: 1240, left: "50%", transform: "translateX(-50%)", width: 576, height: 450 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/poster/photo-frame.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
        {photoSrc && (
          <div style={{ position: "absolute", left: 100, top: 32, width: 385, height: 385, borderRadius: "50%", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc} alt={winnerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* Competition + category */}
      <div style={{ position: "absolute", top: 1670, left: 150, right: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LeafSprig width={46} height={24} viewBox="-6 -15 54 28" />
          <LeafSprig mirrored width={46} height={24} viewBox="-6 -15 54 28" />
        </div>
        <div style={{ fontFamily: "var(--font-poster-malayalam), sans-serif", fontWeight: 800, fontSize: competitionFontSize(competitionName), lineHeight: 1.18, color: "#6E0F1F" }}>{competitionName}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
          <div style={{ width: 70, height: 0, borderTop: "2px dotted #C9963F" }} />
          <div style={{ fontFamily: "var(--font-poster-oswald), sans-serif", fontWeight: 700, fontSize: 40, letterSpacing: "2px", color: "#6E0F1F" }}>( {categoryLabel.toUpperCase()} )</div>
          <div style={{ width: 70, height: 0, borderTop: "2px dotted #C9963F" }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 15, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 120, height: 1, background: "linear-gradient(90deg,rgba(201,150,63,0),#C9963F)" }} />
          <div style={{ width: 120, height: 1, background: "linear-gradient(90deg,#C9963F,rgba(201,150,63,0))" }} />
        </div>
        <div style={{ fontFamily: "var(--font-poster-malayalam), sans-serif", fontWeight: 700, fontSize: 22, marginTop: 28, color: "#4A3524" }}>ഓരോ ചുവടിലും ദൈവ സ്നേഹം</div>
      </div>
    </div>
  );
}
