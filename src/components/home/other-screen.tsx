"use client";

import {
  LayoutGrid,
  Film,
  Megaphone,
  Info,
} from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import { PlaceholderImage } from "@/components/shared/placeholder-image";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  LayoutGrid,
  Film,
  Megaphone,
  Info,
};

const SCREEN_MAP: Record<string, [string, string, string]> = {
  activities: [
    "LayoutGrid",
    "Activities",
    "Feast days, gatherings, training & mission visits will live here.",
  ],
  media: [
    "Film",
    "Media Center",
    "Reels, videos, audio reflections, gallery & downloads.",
  ],
  notices: [
    "Megaphone",
    "Notice Board",
    "Parish news, meeting updates & priority announcements.",
  ],
  about: [
    "Info",
    "About",
    "A mission initiative for new Age.",
  ],
};

interface OtherScreenProps {
  tab: string;
  theme: CMLTheme;
}

export function OtherScreen({ tab }: OtherScreenProps) {
  const [iconKey, title, sub] = SCREEN_MAP[tab] ?? SCREEN_MAP.activities;
  const IconComp = ICON_MAP[iconKey];

  return (
    <div className="px-5 pb-[120px] flex flex-col items-center text-center mt-10">
      <div
        className="w-20 h-20 rounded-[26px] flex items-center justify-center"
        style={{
          background: "linear-gradient(150deg, #6B46FF, #A78BFA)",
          boxShadow: "0 16px 36px rgba(107,70,255,0.32)",
        }}
      >
        {IconComp && <IconComp size={34} color="#fff" />}
      </div>
      <h2
        className="font-[family-name:var(--font-poppins)] font-semibold text-[23px] mt-5 mb-2"
        style={{ color: COLORS.text }}
      >
        {title}
      </h2>
      <p
        className="text-sm leading-relaxed max-w-[260px]"
        style={{ color: COLORS.sub }}
      >
        {sub}
      </p>
      <PlaceholderImage
        label={`${title.toLowerCase()} screen`}
        h={200}
        tint="purple"
        className="w-full mt-6"
      />
    </div>
  );
}
