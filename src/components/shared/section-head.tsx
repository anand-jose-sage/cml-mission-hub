"use client";

import { ChevronRight } from "lucide-react";
import { COLORS } from "@/lib/theme";

interface SectionHeadProps {
  title: string;
  action?: string | null;
  onAction?: () => void;
}

export function SectionHead({
  title,
  action = "See all",
  onAction,
}: SectionHeadProps) {
  return (
    <div className="flex items-baseline justify-between px-5 mt-[26px] mb-3.5">
      <h3
        className="font-[family-name:var(--font-poppins)] font-semibold text-[19px] tracking-tight m-0"
        style={{ color: COLORS.text }}
      >
        {title}
      </h3>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-0.5 bg-transparent border-none cursor-pointer font-[family-name:var(--font-poppins)] font-semibold text-[13px]"
          style={{ color: COLORS.purple }}
        >
          {action}
          <ChevronRight size={15} color={COLORS.purple} />
        </button>
      )}
    </div>
  );
}
