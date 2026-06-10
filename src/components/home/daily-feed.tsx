"use client";

import { Play, Volume2, ChevronRight } from "lucide-react";
import { COLORS, TINT_COLORS, type CMLTheme } from "@/lib/theme";
import { type FeedItem } from "@/lib/sample-data";
import { PlaceholderImage } from "@/components/shared/placeholder-image";

const INK_MAP: Record<string, string> = {
  purple: "#6B46FF",
  pink: "#BE185D",
  gold: "#B45309",
  mint: "#15803D",
  sky: "#0369A1",
};

interface FeedCardProps {
  item: FeedItem;
  theme: CMLTheme;
}

function FeedCard({ item, theme }: FeedCardProps) {
  const ink = INK_MAP[item.tint] ?? COLORS.purple;
  const isMedia = ["Reel", "Video", "Audio"].includes(item.cat);

  return (
    <div
      className="break-inside-avoid mb-3 overflow-hidden cursor-pointer"
      style={{
        background: theme.card.background,
        border: theme.card.border,
        borderRadius: theme.radius,
        boxShadow: theme.softShadow,
        backdropFilter: theme.card.backdropFilter,
        WebkitBackdropFilter: theme.card.backdropFilter,
      }}
    >
      <div className="relative">
        <PlaceholderImage
          label={item.cat.toLowerCase()}
          h={item.h}
          rounded="rounded-none"
          tint={item.tint}
        />
        <span
          className="absolute top-[9px] left-[9px] font-[family-name:var(--font-poppins)] font-semibold text-[10.5px] px-[9px] py-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.92)",
            color: ink,
            backdropFilter: "blur(4px)",
          }}
        >
          {item.cat}
        </span>
        {isMedia && (
          <div
            className="absolute bottom-[9px] right-[9px] w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
            }}
          >
            {item.cat === "Audio" ? (
              <Volume2 size={15} color={ink} />
            ) : (
              <Play size={15} fill={ink} color={ink} className="ml-px" />
            )}
          </div>
        )}
      </div>
      <div className="p-[11px] pb-[13px] pt-[11px]">
        <div
          className="font-[family-name:var(--font-poppins)] font-semibold text-[14.5px] leading-tight"
          style={{ color: COLORS.text }}
        >
          {item.title}
        </div>
        <p
          className="text-xs leading-snug mt-[5px] mb-[9px]"
          style={{ color: COLORS.sub }}
        >
          {item.sum}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px]" style={{ color: COLORS.faint }}>
            {item.time}
          </span>
          <span
            className="inline-flex items-center gap-[3px] font-semibold text-xs font-[family-name:var(--font-poppins)]"
            style={{ color: ink }}
          >
            View
            <ChevronRight size={13} color={ink} />
          </span>
        </div>
      </div>
    </div>
  );
}

interface DailyFeedProps {
  theme: CMLTheme;
  items?: FeedItem[];
}

export function DailyFeed({ theme, items = [] }: DailyFeedProps) {
  return (
    <div className="px-5 columns-2 gap-3">
      {items.map((item, i) => (
        <FeedCard key={i} item={item} theme={theme} />
      ))}
    </div>
  );
}
