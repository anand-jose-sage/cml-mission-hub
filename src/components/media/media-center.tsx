"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Mic,
  Volume2,
  Film,
  Loader2,
  Bell,
  X,
} from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import {
  useMediaItems,
  type MediaFilter,
  type MediaGalleryItem,
} from "@/hooks/use-media-items";
import { AudioBar } from "@/components/home/audio-bar";

/* ─── filter config ─────────────────────────────────── */
const FILTERS: { id: MediaFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reel", label: "Reels" },
  { id: "video", label: "Videos" },
  { id: "voice-note", label: "Voice" },
  { id: "audio", label: "Audio" },
];

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; color?: string; fill?: string; strokeWidth?: number }>;
    label: string;
    bg: string;
    ink: string;
    gradA: string;
    gradB: string;
    iconFill: boolean;
  }
> = {
  reel: {
    icon: Play,
    label: "Reel",
    bg: "#FCE7F3",
    ink: "#BE185D",
    gradA: "#FCE7F3",
    gradB: "#FBCFE8",
    iconFill: true,
  },
  video: {
    icon: Film,
    label: "Video",
    bg: "#EDE9FE",
    ink: "#6B46FF",
    gradA: "#EDE9FE",
    gradB: "#DDD6FE",
    iconFill: false,
  },
  "voice-note": {
    icon: Mic,
    label: "Voice",
    bg: "#E0F2FE",
    ink: "#0369A1",
    gradA: "#E0F2FE",
    gradB: "#BAE6FD",
    iconFill: false,
  },
  audio: {
    icon: Volume2,
    label: "Audio",
    bg: "#DCFCE7",
    ink: "#15803D",
    gradA: "#DCFCE7",
    gradB: "#BBF7D0",
    iconFill: false,
  },
};

/* ─── Gallery tile ──────────────────────────────────── */
function GalleryTile({
  item,
  theme,
  idx,
  tall,
  onPlay,
}: {
  item: MediaGalleryItem;
  theme: CMLTheme;
  idx: number;
  tall: boolean;
  onPlay: (item: MediaGalleryItem) => void;
}) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.reel;
  const Icon = config.icon;
  const isVisual = item.type === "reel" || item.type === "video";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.04, ease: "easeOut" }}
      onClick={() => isVisual && item.mediaUrl && onPlay(item)}
      className="relative overflow-hidden cursor-pointer group"
      style={{
        borderRadius: theme.radius - 6,
        height: tall ? 210 : 156,
        background: `linear-gradient(150deg, ${config.gradA}, ${config.gradB})`,
        boxShadow: theme.softShadow,
      }}
    >
      {/* striped pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 9px, ${config.gradB} 9px 10px)`,
        }}
      />

      {/* play button for visual types */}
      {isVisual && (
        <div className="absolute inset-0 flex items-center justify-center z-[2]">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
            style={{
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            }}
          >
            <Play size={20} fill={config.ink} color={config.ink} className="ml-0.5" />
          </div>
        </div>
      )}

      {/* audio wave icon for non-visual */}
      {!isVisual && (
        <div className="absolute inset-0 flex items-center justify-center z-[2]">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.6)" }}
          >
            <Icon size={26} color={config.ink} strokeWidth={1.8} />
          </div>
        </div>
      )}

      {/* top-left type badge */}
      <div className="absolute top-2.5 left-2.5 z-[3]">
        <span
          className="inline-flex items-center gap-1 font-[family-name:var(--font-poppins)] font-semibold text-[9px] uppercase tracking-wider px-2 py-[3px] rounded-full"
          style={{ background: "rgba(255,255,255,0.8)", color: config.ink }}
        >
          <Icon
            size={10}
            color={config.ink}
            fill={config.iconFill ? config.ink : "none"}
          />
          {config.label}
        </span>
      </div>

      {/* duration badge */}
      {item.duration && (
        <div className="absolute top-2.5 right-2.5 z-[3]">
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold text-[10px] px-2 py-[3px] rounded-full"
            style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
          >
            {item.duration}
          </span>
        </div>
      )}

      {/* bottom info */}
      <div className="absolute bottom-0 left-0 right-0 z-[3] p-3 pt-8 bg-gradient-to-t from-black/30 to-transparent">
        <div
          className="font-[family-name:var(--font-poppins)] font-semibold text-[13px] leading-tight line-clamp-2"
          style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
        >
          {item.title}
        </div>
        <div
          className="text-[10.5px] mt-1 font-medium"
          style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
        >
          {item.date} {item.month}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Media list card (for voice/audio) ─────────────── */
function MediaListCard({
  item,
  theme,
  idx,
}: {
  item: MediaGalleryItem;
  theme: CMLTheme;
  idx: number;
}) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.reel;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeOut" }}
      className="p-3 group"
      style={{
        background: theme.card.background,
        border: theme.card.border,
        borderRadius: theme.radius - 8,
        boxShadow: theme.softShadow,
        backdropFilter: theme.card.backdropFilter,
        WebkitBackdropFilter: theme.card.backdropFilter,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: config.bg }}
        >
          <Icon size={22} color={config.ink} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-[family-name:var(--font-poppins)] font-semibold text-[14px] leading-tight truncate"
            style={{ color: COLORS.text }}
          >
            {item.title}
          </div>
          <div
            className="text-[11.5px] leading-snug mt-1 line-clamp-1"
            style={{ color: COLORS.sub }}
          >
            {item.summary}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1">
          {item.duration && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ background: config.bg, color: config.ink }}
            >
              {item.duration}
            </span>
          )}
          <span className="text-[10px]" style={{ color: COLORS.faint }}>
            {item.date} {item.month}
          </span>
        </div>
      </div>
      {item.mediaUrl && (
        <div className="mt-2.5">
          <AudioBar src={item.mediaUrl} />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Video lightbox ────────────────────────────────── */
function VideoLightbox({
  item,
  onClose,
}: {
  item: MediaGalleryItem | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center max-w-md mx-auto px-5"
          style={{ background: "rgba(15, 10, 40, 0.92)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-5 w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer z-[1]"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
          >
            <X size={18} color="rgba(255,255,255,0.9)" />
          </button>
          {/* No hardcoded aspect-ratio box here — the video sizes to its own
              natural width/height so portrait reels and landscape videos both
              play undistorted instead of being squished into a fixed tile. */}
          <video
            key={item.id}
            src={item.mediaUrl ?? undefined}
            poster={item.thumbnailUrl ?? undefined}
            controls
            autoPlay
            playsInline
            className="w-full rounded-xl"
            style={{ display: "block", maxHeight: "80vh", height: "auto" }}
          />
          <p
            className="font-[family-name:var(--font-poppins)] font-semibold text-[14px] text-center mt-4 px-4"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {item.title}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   MEDIA CENTER
   ═══════════════════════════════════════════════════════ */
interface MediaCenterProps {
  theme: CMLTheme;
}

export function MediaCenter({ theme }: MediaCenterProps) {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const { items, loading } = useMediaItems(filter);
  const [videoItem, setVideoItem] = useState<MediaGalleryItem | null>(null);

  const visualItems = items.filter(
    (i) => i.type === "reel" || i.type === "video"
  );
  const audioItems = items.filter(
    (i) => i.type === "voice-note" || i.type === "audio"
  );

  const showGrid = filter === "all" || filter === "reel" || filter === "video";
  const showList =
    filter === "all" || filter === "voice-note" || filter === "audio";

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pt-[54px] pb-[112px] scrollbar-hide">
      {/* header */}
      <div className="px-5">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-[family-name:var(--font-poppins)] font-semibold text-[30px] tracking-[-0.5px] m-0"
              style={{ color: COLORS.text }}
            >
              Media Center
            </h1>
            <p className="mt-1 mb-0 text-[13.5px]" style={{ color: COLORS.sub }}>
              Reels, videos &amp; audio reflections
            </p>
          </div>
          <button
            className="w-[42px] h-[42px] rounded-full border-none cursor-pointer relative shrink-0 flex items-center justify-center"
            style={{
              background: theme.chip,
              color: COLORS.text,
              boxShadow: theme.softShadow,
            }}
          >
            <Bell size={19} strokeWidth={2} />
            <span
              className="absolute rounded-full"
              style={{
                top: 9,
                right: 10,
                width: 8,
                height: 8,
                background: COLORS.alert,
                boxShadow: "0 0 0 2px #fff",
              }}
            />
          </button>
        </div>

        {/* filter pills */}
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-0.5 mt-[18px] scrollbar-hide">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="shrink-0 cursor-pointer font-[family-name:var(--font-poppins)] font-semibold text-[13px] rounded-full active:scale-[0.95]"
                style={{
                  border: on ? "none" : "1px solid rgba(36,31,77,0.1)",
                  background: on
                    ? "linear-gradient(150deg, #6B46FF, #A78BFA)"
                    : theme.card.background,
                  color: on ? "#fff" : COLORS.sub,
                  padding: "9px 16px",
                  boxShadow: on
                    ? "0 8px 18px rgba(107,70,255,0.3)"
                    : "none",
                  backdropFilter: theme.card.backdropFilter,
                  WebkitBackdropFilter: theme.card.backdropFilter,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* count */}
        <div className="flex items-baseline justify-between mt-6 mb-3.5">
          <h3
            className="font-[family-name:var(--font-poppins)] font-semibold text-[18px] tracking-[-0.3px] m-0"
            style={{ color: COLORS.text }}
          >
            {filter === "all" ? "Gallery" : FILTERS.find((f) => f.id === filter)?.label}
          </h3>
          <span className="text-[13px]" style={{ color: COLORS.faint }}>
            <b
              className="font-[family-name:var(--font-poppins)] text-[19px] font-bold"
              style={{ color: COLORS.text }}
            >
              {items.length}
            </b>{" "}
            items
          </span>
        </div>
      </div>

      {/* content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="px-5"
        >
          {loading ? (
            <div
              className="flex items-center justify-center py-16 rounded-2xl"
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
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{
                background: theme.card.background,
                border: theme.card.border,
                backdropFilter: theme.card.backdropFilter,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: "rgba(107,70,255,0.08)" }}
              >
                <Film size={26} color={COLORS.faint} />
              </div>
              <span
                className="text-[13px] font-medium"
                style={{ color: COLORS.faint }}
              >
                No media found
              </span>
            </div>
          ) : (
            <>
              {/* Visual gallery grid (reels + videos) */}
              {showGrid && visualItems.length > 0 && (
                <>
                  {filter === "all" && (
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Play size={13} color="#BE185D" fill="#BE185D" />
                      <span
                        className="font-[family-name:var(--font-poppins)] font-semibold text-[11px] uppercase tracking-wider"
                        style={{ color: "#BE185D" }}
                      >
                        Reels &amp; Videos
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-px rounded-full"
                        style={{ background: "#FCE7F3", color: "#BE185D" }}
                      >
                        {visualItems.length}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {visualItems.map((item, idx) => (
                      <GalleryTile
                        key={item.id}
                        item={item}
                        theme={theme}
                        idx={idx}
                        tall={idx === 0 || idx === 3}
                        onPlay={setVideoItem}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Audio list (voice notes + audio) */}
              {showList && audioItems.length > 0 && (
                <>
                  {filter === "all" && (
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Mic size={13} color="#0369A1" />
                      <span
                        className="font-[family-name:var(--font-poppins)] font-semibold text-[11px] uppercase tracking-wider"
                        style={{ color: "#0369A1" }}
                      >
                        Voice &amp; Audio
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-px rounded-full"
                        style={{ background: "#E0F2FE", color: "#0369A1" }}
                      >
                        {audioItems.length}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {audioItems.map((item, idx) => (
                      <MediaListCard
                        key={item.id}
                        item={item}
                        theme={theme}
                        idx={idx}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <VideoLightbox item={videoItem} onClose={() => setVideoItem(null)} />
    </div>
  );
}
