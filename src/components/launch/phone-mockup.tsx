"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

interface PhoneMockupProps {
  src?: string;             // /launch/<screen>.png — falls back to a gradient placeholder
  label?: string;           // shown on the placeholder
  tint?: "purple" | "pink" | "gold" | "blue";
  style?: CSSProperties;
  width?: number;
  glow?: boolean;
}

const TINTS: Record<string, [string, string]> = {
  purple: ["#6B46FF", "#A78BFA"],
  pink:   ["#EC4899", "#F472B6"],
  gold:   ["#F5C542", "#FCD06A"],
  blue:   ["#3B82F6", "#60A5FA"],
};

export function PhoneMockup({
  src,
  label,
  tint = "purple",
  style,
  width = 260,
  glow = true,
}: PhoneMockupProps) {
  const [a, b] = TINTS[tint];
  const h = Math.round(width * 2.05);

  return (
    <div
      style={{
        position: "relative",
        width,
        height: h,
        borderRadius: width * 0.16,
        background: "linear-gradient(140deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.16)",
        padding: 8,
        boxShadow: glow
          ? `0 30px 80px ${a}55, 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)`
          : "0 18px 40px rgba(0,0,0,0.5)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: width * 0.13,
          overflow: "hidden",
          background: `linear-gradient(165deg, ${a}, ${b})`,
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={label ?? "App screenshot"}
            fill
            sizes={`${width}px`}
            style={{ objectFit: "cover" }}
            // App screenshots are placeholders until the user drops PNGs in
            // public/launch/. Falls back to the gradient face on failure, but
            // logs it — a failure once the file exists (e.g. a stale deploy
            // or optimizer error) should be visible, not silently identical
            // to "the file was never added."
            onError={(e) => {
              console.error("[PhoneMockup] Failed to load image:", src);
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {/* Placeholder label visible when src is missing */}
        {label && (
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: 14,
              textAlign: "center", padding: 16, mixBlendMode: "overlay",
              pointerEvents: "none",
            }}
          >
            {label}
          </div>
        )}
        {/* Top notch */}
        <div
          style={{
            position: "absolute", top: 8, left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.32, height: width * 0.045,
            borderRadius: 999, background: "rgba(0,0,0,0.55)",
          }}
        />
      </div>
    </div>
  );
}
