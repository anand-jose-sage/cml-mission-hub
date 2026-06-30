"use client";

import { type ReactNode } from "react";
import type { FeastTheme } from "@/components/feast/feast-shared";

export function TutorialPage({
  title,
  subtitle,
  theme,
  children,
}: {
  title?: string;
  subtitle?: string;
  theme: FeastTheme;
  children: ReactNode;
}) {
  return (
    <div className="px-5">
      {title && (
        <h1
          className="font-semibold text-[22px] leading-tight tracking-tight mb-1"
          style={{ fontFamily: "var(--font-anek), sans-serif", color: theme.text }}
        >
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: theme.sub }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
