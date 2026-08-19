"use client";

import { LENT_POSTER_FONT_CLASS } from "./lent-poster-fonts";
import { LENT_TOTAL_DAYS } from "@/lib/lent-dates";
import type { LentDay } from "@/types";

function ShieldMotif({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path
        d="M50 6 L88 20 V48 C88 72 71 88 50 96 C29 88 12 72 12 48 V20 Z"
        fill="none"
        stroke="#E8B84B"
        strokeWidth="3"
      />
      <path d="M50 24 V70 M32 42 H68" stroke="#E8B84B" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// backgroundImageSrc is a placeholder slot for a future user-supplied St.
// Michael illustration/background — unset today, so the poster renders with
// the existing CSS gradient only. Once an image is available, passing this
// prop (and dropping the file in public/lent/) layers it behind the
// gradient (which becomes a semi-transparent overlay for text legibility)
// with no other changes needed.
export function LentDayPoster({ day, entry, backgroundImageSrc }: { day: number; entry: LentDay; backgroundImageSrc?: string }) {
  const { posterQuote: quoteMl } = entry.ml;
  const { posterQuote: quoteEn } = entry.en;

  return (
    <div
      className={LENT_POSTER_FONT_CLASS}
      style={{
        width: 1080,
        height: 1920,
        position: "relative",
        overflow: "hidden",
        background: backgroundImageSrc ? "#0B0A17" : "linear-gradient(160deg, #0B0A17 0%, #1A1030 55%, #2A1610 100%)",
        color: "#F5EFE0",
        fontFamily: "var(--font-lent-poster-malayalam), sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {backgroundImageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImageSrc}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
        />
      )}
      {backgroundImageSrc && (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, rgba(11,10,23,0.72) 0%, rgba(26,16,48,0.72) 55%, rgba(42,22,16,0.75) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute", top: 200, left: "50%", transform: "translateX(-50%)",
          width: 1100, height: 700,
          background: "radial-gradient(ellipse at center, rgba(232,184,75,0.18) 0%, rgba(232,184,75,0) 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Double hairline border */}
      <div style={{ position: "absolute", top: 24, left: 24, right: 24, bottom: 24, border: "2px solid rgba(232,184,75,0.55)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 34, left: 34, right: 34, bottom: 34, border: "1px solid rgba(232,184,75,0.28)", pointerEvents: "none" }} />

      {/* Org header */}
      <div style={{ marginTop: 70, textAlign: "center", fontWeight: 700, fontSize: 26, lineHeight: 1.3, color: "#E8B84B" }}>
        <div>ചെറുപുഷ്പ മിഷൻ ലീഗ്</div>
        <div>കൽപ്പറ്റ മേഖല</div>
      </div>

      {/* Day badge */}
      <div
        style={{
          marginTop: 32,
          fontFamily: "var(--font-lent-poster-oswald), sans-serif",
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: "3px",
          color: "#F5EFE0",
          padding: "10px 26px",
          border: "1px solid rgba(232,184,75,0.45)",
          borderRadius: 999,
        }}
      >
        ST. MICHAEL&apos;S LENT &middot; DAY {day}/{LENT_TOTAL_DAYS}
      </div>

      <div style={{ marginTop: 44 }}>
        <ShieldMotif size={110} />
      </div>

      {/* Poster-quote label (e.g. STRENGTH / ശക്തി) — a curated one-word
          theme for the shareable image, independent of the in-app day's
          own theme title. */}
      <div
        style={{
          marginTop: 40,
          fontFamily: "var(--font-lent-poster-display), var(--font-lent-poster-malayalam), sans-serif",
          fontWeight: 700, fontSize: 56, lineHeight: 1.1, color: "#F7D26B",
          textShadow: "0 2px 12px rgba(232,184,75,0.35)",
          textAlign: "center",
        }}
      >
        {quoteMl.label}
      </div>
      <div style={{ marginTop: 6, fontFamily: "var(--font-lent-poster-oswald), sans-serif", fontWeight: 600, fontSize: 24, letterSpacing: "3px", color: "rgba(245,239,224,0.6)" }}>
        {quoteEn.label.toUpperCase()}
      </div>

      {/* Quote — the visual centerpiece. Malayalam primary, English secondary. */}
      <div style={{ marginTop: 56, padding: "0 100px", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-lent-poster-display), var(--font-lent-poster-malayalam), sans-serif",
            fontStyle: "italic", fontWeight: 600, fontSize: 50, lineHeight: 1.35, color: "#F5EFE0",
          }}
        >
          &ldquo;{quoteMl.text}&rdquo;
        </div>
        <div style={{ marginTop: 18, fontFamily: "var(--font-lent-poster-oswald), sans-serif", fontWeight: 600, fontSize: 24, letterSpacing: "2px", color: "#E8B84B" }}>
          &mdash; {quoteMl.reference}
        </div>

        <div
          style={{
            marginTop: 40,
            fontFamily: "var(--font-lent-poster-display), var(--font-lent-poster-malayalam), sans-serif",
            fontStyle: "italic", fontWeight: 500, fontSize: 32, lineHeight: 1.4, color: "rgba(245,239,224,0.75)",
          }}
        >
          &ldquo;{quoteEn.text}&rdquo;
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--font-lent-poster-oswald), sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: "2px", color: "rgba(232,184,75,0.75)" }}>
          &mdash; {quoteEn.reference}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", marginBottom: 56, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-lent-poster-oswald), sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "4px", color: "#E8B84B" }}>ST. MICHAEL&apos;S LENT</div>
        <div style={{ marginTop: 6, fontSize: 18, color: "rgba(245,239,224,0.55)" }}>2026 &middot; CML Kalpetta</div>
      </div>
    </div>
  );
}
