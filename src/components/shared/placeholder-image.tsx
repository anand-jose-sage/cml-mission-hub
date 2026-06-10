"use client";

import type { TintColor } from "@/lib/theme";

const TINT_MAP: Record<TintColor, { a: string; b: string; ink: string }> = {
  purple: { a: "#EDE9FE", b: "#DDD6FE", ink: "#6B46FF" },
  gold: { a: "#FEF3C7", b: "#FDE68A", ink: "#B45309" },
  pink: { a: "#FCE7F3", b: "#FBCFE8", ink: "#BE185D" },
  mint: { a: "#DCFCE7", b: "#BBF7D0", ink: "#15803D" },
  sky: { a: "#E0F2FE", b: "#BAE6FD", ink: "#0369A1" },
};

interface PlaceholderImageProps {
  label: string;
  h?: number;
  rounded?: string;
  tint?: TintColor;
  className?: string;
}

export function PlaceholderImage({
  label,
  h = 120,
  rounded = "rounded-2xl",
  tint = "purple",
  className = "",
}: PlaceholderImageProps) {
  const { a, b, ink } = TINT_MAP[tint];

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${rounded} ${className}`}
      style={{
        height: h,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 9px, ${b} 9px 10px)`,
        }}
      />
      <span
        className="relative font-mono text-[10.5px] tracking-wide uppercase font-semibold px-2 py-1 rounded-md"
        style={{
          color: ink,
          opacity: 0.72,
          border: `1px dashed ${ink}55`,
          background: "rgba(255,255,255,0.35)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
