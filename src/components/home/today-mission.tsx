"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Mic,
  BookOpen,
  Sparkles,
  Megaphone,
  ChevronRight,
  Maximize2,
  Loader2,
} from "lucide-react";
import { COLORS, TINT_COLORS, type CMLTheme } from "@/lib/theme";
import { type MissionItem } from "@/lib/sample-data";
import { PlaceholderImage } from "@/components/shared/placeholder-image";
import { AudioBar } from "@/components/home/audio-bar";
import { FullscreenAudioPlayer } from "@/components/home/fullscreen-audio-player";
import { useMissionItems } from "@/hooks/use-mission-items";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; fill?: string; color?: string; className?: string }>> = {
  Play,
  Mic,
  BookOpen,
  Sparkles,
  Megaphone,
};

interface TimelineItemProps {
  item: MissionItem;
  theme: CMLTheme;
  last: boolean;
  idx: number;
  onNoticeClick?: () => void;
  onOpenAudio?: (item: MissionItem) => void;
}

function TimelineItem({ item, theme, last, idx, onNoticeClick, onOpenAudio }: TimelineItemProps) {
  const { bg, ink } = TINT_COLORS[item.tint];
  const IconComp = ICON_MAP[item.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
      className="flex gap-3.5 relative"
      style={{ paddingBottom: last ? 0 : 18 }}
    >
      {/* Date badge rail */}
      <div className="flex flex-col items-center w-11 shrink-0">
        <div
          className="w-11 h-[52px] flex flex-col items-center justify-center z-[1]"
          style={{
            borderRadius: 14,
            background: bg,
            boxShadow: "0 4px 12px rgba(30,27,75,0.08)",
          }}
        >
          <span
            className="font-[family-name:var(--font-poppins)] font-bold text-[18px] leading-none"
            style={{ color: ink }}
          >
            {item.day}
          </span>
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold text-[9px] uppercase tracking-wider mt-[2px]"
            style={{ color: ink, opacity: 0.75 }}
          >
            {item.month}
          </span>
        </div>
        {!last && (
          <div
            className="flex-1 mt-1 rounded-sm"
            style={{
              width: 2.5,
              background:
                "linear-gradient(180deg, rgba(167,139,250,0.5), rgba(167,139,250,0.12))",
            }}
          />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 p-3.5 mb-0.5"
        style={{
          background: theme.card.background,
          border: theme.card.border,
          borderRadius: theme.radius,
          boxShadow: theme.softShadow,
          backdropFilter: theme.card.backdropFilter,
          WebkitBackdropFilter: theme.card.backdropFilter,
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-poppins)] font-semibold text-[11.5px] tracking-wide"
            style={{ color: ink }}
          >
            {IconComp && (
              <IconComp
                size={13}
                color={ink}
                fill={item.icon === "Play" ? ink : "none"}
              />
            )}
            {item.type}
          </span>
          <span
            className="text-[11px]"
            style={{ color: COLORS.faint }}
          >
            {item.time}
          </span>
        </div>

        <div
          className="font-[family-name:var(--font-poppins)] font-semibold text-[15.5px] leading-tight my-[5px] mb-1.5"
          style={{ color: COLORS.text }}
        >
          {item.title}
        </div>

        {/* Media */}
        {item.media === "reel" && (
          <div className="relative mb-2 rounded-xl overflow-hidden">
            {item.mediaUrl ? (
              <video
                src={item.mediaUrl}
                poster={item.thumbnailUrl ?? undefined}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-xl"
                style={{ display: "block", height: "auto", maxHeight: 520 }}
              />
            ) : (
              <>
                <PlaceholderImage
                  label="reel - 9:16 video"
                  h={132}
                  tint="pink"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-[46px] h-[46px] rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.92)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Play
                      size={19}
                      fill={COLORS.purple}
                      color={COLORS.purple}
                      className="ml-0.5"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {item.media === "audio" && <AudioBar src={item.mediaUrl} />}

        <p
          className="text-[13px] leading-relaxed mb-2.5 mt-0"
          style={{ color: COLORS.sub }}
        >
          {item.excerpt}
        </p>

        {item.media === "audio" ? (
          <button
            onClick={() => onOpenAudio?.(item)}
            className="inline-flex items-center gap-1 border-none cursor-pointer bg-transparent p-0"
            style={{ color: COLORS.purple }}
          >
            <Maximize2 size={11} color={COLORS.purple} />
            <span className="text-[11px] font-medium underline underline-offset-2">Open player</span>
          </button>
        ) : (
          <button
            onClick={item.icon === "Megaphone" && onNoticeClick ? onNoticeClick : undefined}
            className="inline-flex items-center gap-[5px] border-none cursor-pointer font-[family-name:var(--font-poppins)] font-semibold text-[12.5px] py-2 px-3.5 rounded-[10px]"
            style={{
              background: "rgba(107,70,255,0.08)",
              color: COLORS.purple,
            }}
          >
            {item.media === "reel"
              ? "Watch reel"
              : item.icon === "Megaphone"
                ? "View notice"
                : "Read more"}
            <ChevronRight size={14} color={COLORS.purple} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface TodayMissionProps {
  theme: CMLTheme;
  onNoticeClick?: () => void;
}

export function TodayMission({ theme, onNoticeClick }: TodayMissionProps) {
  const { items, loading } = useMissionItems();
  const [audioItem, setAudioItem] = useState<MissionItem | null>(null);

  if (loading) {
    return (
      <div className="px-5 flex items-center justify-center py-10">
        <Loader2 size={24} color={COLORS.purple} className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-5 flex flex-col items-center justify-center py-10">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: "rgba(107,70,255,0.08)" }}
        >
          <Sparkles size={22} color={COLORS.faint} />
        </div>
        <span className="text-[13px] font-medium" style={{ color: COLORS.faint }}>
          No missions for today yet
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="px-5">
        {items.map((item, i) => (
          <TimelineItem
            key={i}
            item={item}
            theme={theme}
            idx={i}
            last={i === items.length - 1}
            onNoticeClick={onNoticeClick}
            onOpenAudio={setAudioItem}
          />
        ))}
      </div>

      <FullscreenAudioPlayer
        open={!!audioItem}
        onClose={() => setAudioItem(null)}
        src={audioItem?.mediaUrl}
        title={audioItem?.title ?? ""}
        subtitle={audioItem?.type}
        thumbnailUrl={audioItem?.thumbnailUrl}
      />
    </>
  );
}
