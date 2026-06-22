"use client";

import { motion } from "framer-motion";
import { Trophy, Bell, Film, CalendarDays } from "lucide-react";
import { ACCENTS, softTile, type AccentKey } from "@/lib/theme";

interface QuickAccessProps {
  onFeast: () => void;
  onNotices: () => void;
  onMedia: () => void;
  onEvents: () => void;
}

type Item = {
  key: string;
  label: string;
  accent: AccentKey;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onClick: () => void;
};

export function QuickAccess({ onFeast, onNotices, onMedia, onEvents }: QuickAccessProps) {
  const items: Item[] = [
    { key: "feast",   label: "Feast",   accent: "lavender", icon: Trophy,       onClick: onFeast },
    { key: "notices", label: "Notices", accent: "coral",    icon: Bell,         onClick: onNotices },
    { key: "media",   label: "Media",   accent: "mint",     icon: Film,         onClick: onMedia },
    { key: "events",  label: "Events",  accent: "sky",      icon: CalendarDays, onClick: onEvents },
  ];

  return (
    <div className="flex justify-between px-7 pt-3 pb-1">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <motion.button
            key={it.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
            onClick={it.onClick}
            className="flex flex-col items-center gap-[7px] border-none bg-transparent cursor-pointer active:scale-95 transition-transform"
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 58, height: 58, ...softTile(it.accent, 20) }}
            >
              <Icon size={25} color={ACCENTS[it.accent].ink} />
            </div>
            <span
              className="text-[11.5px] font-medium"
              style={{ color: "#5C5380" }}
            >
              {it.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
