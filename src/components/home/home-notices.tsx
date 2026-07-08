"use client";

import { motion } from "framer-motion";
import { Megaphone, ChevronRight, Pin, Loader2, Bell } from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import { NOTICE_TINTS, type NoticeItem } from "@/lib/notice-data";
import { useNotices } from "@/hooks/use-notices";

/* ─── accent colors per tint (thin top border + icon bg) ── */
const ACCENT: Record<string, { border: string; iconBg: string; iconColor: string; tagBg: string; tagColor: string }> = {
  purple: { border: "#A78BFA", iconBg: "rgba(107,70,255,0.12)", iconColor: "#6B46FF", tagBg: "rgba(107,70,255,0.08)", tagColor: "#5B3FCC" },
  gold:   { border: "#E2A312", iconBg: "rgba(226,163,18,0.12)", iconColor: "#B45309", tagBg: "rgba(226,163,18,0.10)", tagColor: "#9A6A00" },
  coral:  { border: "#F4663F", iconBg: "rgba(244,102,63,0.12)", iconColor: "#B5402B", tagBg: "rgba(244,102,63,0.08)", tagColor: "#B5402B" },
  mint:   { border: "#2FB269", iconBg: "rgba(47,178,105,0.12)", iconColor: "#15803D", tagBg: "rgba(47,178,105,0.08)", tagColor: "#15803D" },
  sky:    { border: "#3DA0F0", iconBg: "rgba(61,160,240,0.12)", iconColor: "#0B6BB8", tagBg: "rgba(61,160,240,0.08)", tagColor: "#0B6BB8" },
};

function NoticeCard({
  n,
  idx,
  onTap,
}: {
  n: NoticeItem;
  idx: number;
  onTap: () => void;
}) {
  const accent = ACCENT[n.tint] ?? ACCENT.purple;

  return (
    <motion.button
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.07, ease: "easeOut" }}
      onClick={onTap}
      className="shrink-0 text-left cursor-pointer flex flex-col relative overflow-hidden active:scale-[0.97] transition-transform"
      style={{
        width: 230,
        borderRadius: 22,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 8px 30px rgba(36,31,77,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
        padding: 0,
      }}
    >
      {/* Colored top accent strip */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${accent.border}, ${accent.border}88)`,
          borderRadius: "22px 22px 0 0",
        }}
      />

      <div className="px-4 pt-3 pb-3.5 flex flex-col flex-1">
        {/* Top row: icon + category + date */}
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0"
            style={{ background: accent.iconBg }}
          >
            {n.pinned ? (
              <Pin size={13} color={accent.iconColor} strokeWidth={2.2} />
            ) : (
              <Megaphone size={13} color={accent.iconColor} strokeWidth={2} />
            )}
          </div>
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold text-[10px] uppercase tracking-wider px-2 py-[3px] rounded-full"
            style={{ background: accent.tagBg, color: accent.tagColor }}
          >
            {n.cat}
          </span>
          <span
            className="ml-auto text-[10px] font-medium tabular-nums"
            style={{ color: COLORS.faint }}
          >
            {n.month} {n.day}
          </span>
        </div>

        {/* Title */}
        <div
          className="font-[family-name:var(--font-poppins)] font-semibold text-[14px] leading-[1.3] tracking-[-0.2px] line-clamp-2"
          style={{ color: COLORS.text }}
        >
          {n.title}
        </div>

        {/* Summary */}
        <div
          className="text-[11.5px] leading-[1.45] mt-1.5 line-clamp-2"
          style={{ color: COLORS.sub, opacity: 0.85 }}
        >
          {n.summary}
        </div>

        {/* Priority badge */}
        {n.priority && (
          <div className="mt-2">
            <span
              className="inline-flex items-center gap-1 font-[family-name:var(--font-poppins)] font-bold text-[9px] uppercase tracking-wider px-2 py-[3px] rounded-full"
              style={{
                background: n.priority === "Urgent"
                  ? "rgba(220,38,38,0.1)"
                  : "rgba(234,179,8,0.12)",
                color: n.priority === "Urgent" ? "#DC2626" : "#B45309",
              }}
            >
              <Bell size={8} strokeWidth={2.5} />
              {n.priority}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

interface HomeNoticesProps {
  theme: CMLTheme;
  onViewAll: () => void;
}

export function HomeNotices({ theme, onViewAll }: HomeNoticesProps) {
  const { items, loading } = useNotices(5);

  if (loading) {
    return (
      <div className="px-5 flex items-center justify-center py-8">
        <Loader2 size={20} color={COLORS.purple} className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const recent = items;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-baseline justify-between px-5 mt-5 mb-3">
        <div className="flex items-center gap-2">
          <Megaphone size={16} color={COLORS.purple} strokeWidth={2} />
          <h3
            className="font-[family-name:var(--font-poppins)] font-semibold text-[17px] tracking-tight m-0"
            style={{ color: COLORS.text }}
          >
            Notices
          </h3>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(107,70,255,0.1)", color: COLORS.purple }}
          >
            {items.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 bg-transparent border-none cursor-pointer font-[family-name:var(--font-poppins)] font-semibold text-[12px]"
          style={{ color: COLORS.purple }}
        >
          See all
          <ChevronRight size={14} color={COLORS.purple} />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
        {recent.map((n, i) => (
          <NoticeCard key={n.id} n={n} idx={i} onTap={onViewAll} />
        ))}
      </div>
    </div>
  );
}
