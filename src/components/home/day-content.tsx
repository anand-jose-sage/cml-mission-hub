"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Mic, Megaphone, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import { DAY_LABELS, type DayContentItem } from "@/lib/sample-data";
import { useDayContent } from "@/hooks/use-day-content";

const TYPE_CONFIG = {
  reel: {
    icon: Play,
    label: "Reels",
    bg: "#FCE7F3",
    ink: "#BE185D",
    iconFill: true,
  },
  voice: {
    icon: Mic,
    label: "Voice Notes",
    bg: "#EDE9FE",
    ink: "#6B46FF",
    iconFill: false,
  },
  notice: {
    icon: Megaphone,
    label: "Notices",
    bg: "#DCFCE7",
    ink: "#15803D",
    iconFill: false,
  },
} as const;

function ContentCard({
  item,
  theme,
  idx,
}: {
  item: DayContentItem;
  theme: CMLTheme;
  idx: number;
}) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.06, ease: "easeOut" }}
      className="flex items-start gap-3 p-3 cursor-pointer group"
      style={{
        background: theme.card.background,
        border: theme.card.border,
        borderRadius: theme.radius - 6,
        boxShadow: theme.softShadow,
        backdropFilter: theme.card.backdropFilter,
        WebkitBackdropFilter: theme.card.backdropFilter,
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: config.bg }}
      >
        <Icon
          size={18}
          color={config.ink}
          fill={config.iconFill ? config.ink : "none"}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold text-[14px] leading-tight truncate"
            style={{ color: COLORS.text }}
          >
            {item.title}
          </span>
          {item.duration && (
            <span
              className="text-[10.5px] font-medium shrink-0 px-1.5 py-0.5 rounded-md"
              style={{ background: config.bg, color: config.ink }}
            >
              {item.duration}
            </span>
          )}
        </div>
        <p
          className="text-[12px] leading-snug mt-1 mb-0 line-clamp-2"
          style={{ color: COLORS.sub }}
        >
          {item.summary}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10.5px]" style={{ color: COLORS.faint }}>
            {item.time}
          </span>
          <span
            className="inline-flex items-center gap-0.5 font-semibold text-[11px] font-[family-name:var(--font-poppins)] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: config.ink }}
          >
            {item.type === "reel"
              ? "Watch"
              : item.type === "voice"
                ? "Listen"
                : "View"}
            <ChevronRight size={12} color={config.ink} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface DayContentProps {
  sel: number;
  theme: CMLTheme;
}

export function DayContent({ sel, theme }: DayContentProps) {
  const { items, loading } = useDayContent(sel);

  const reels = items.filter((i) => i.type === "reel");
  const voices = items.filter((i) => i.type === "voice");
  const notices = items.filter((i) => i.type === "notice");

  const sections = [
    { key: "reel", items: reels, config: TYPE_CONFIG.reel },
    { key: "voice", items: voices, config: TYPE_CONFIG.voice },
    { key: "notice", items: notices, config: TYPE_CONFIG.notice },
  ].filter((s) => s.items.length > 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sel}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="px-5 mt-4"
      >
        {/* Day label */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-1.5 h-5 rounded-full"
            style={{ background: "linear-gradient(180deg, #6B46FF, #A78BFA)" }}
          />
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold text-[13px]"
            style={{ color: COLORS.text }}
          >
            {DAY_LABELS[sel]}
          </span>
          <span className="text-[12px]" style={{ color: COLORS.faint }}>
            &middot; {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {loading ? (
          <div
            className="flex items-center justify-center py-10 rounded-2xl"
            style={{
              background: theme.card.background,
              border: theme.card.border,
              backdropFilter: theme.card.backdropFilter,
            }}
          >
            <Loader2
              size={24}
              color={COLORS.purple}
              className="animate-spin"
            />
          </div>
        ) : items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 rounded-2xl"
            style={{
              background: theme.card.background,
              border: theme.card.border,
              backdropFilter: theme.card.backdropFilter,
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "rgba(107,70,255,0.08)" }}
            >
              <Volume2 size={22} color={COLORS.faint} />
            </div>
            <span
              className="text-[13px] font-medium"
              style={{ color: COLORS.faint }}
            >
              No content for this day
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.key}>
                {/* Section label */}
                <div className="flex items-center gap-1.5 mb-2">
                  <section.config.icon
                    size={13}
                    color={section.config.ink}
                    fill={
                      section.config.iconFill ? section.config.ink : "none"
                    }
                  />
                  <span
                    className="font-[family-name:var(--font-poppins)] font-semibold text-[11px] uppercase tracking-wider"
                    style={{ color: section.config.ink }}
                  >
                    {section.config.label}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-px rounded-full"
                    style={{
                      background: section.config.bg,
                      color: section.config.ink,
                    }}
                  >
                    {section.items.length}
                  </span>
                </div>
                {/* Cards */}
                <div className="space-y-2">
                  {section.items.map((item, idx) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      theme={theme}
                      idx={idx}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
