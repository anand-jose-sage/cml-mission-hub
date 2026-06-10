"use client";

import Image from "next/image";
import { Bell, MapPin } from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";

interface TopHeaderProps {
  theme: CMLTheme;
}

function Logo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        boxShadow: "0 4px 14px rgba(107,70,255,0.16)",
      }}
    >
      <Image
        src="/logo.png"
        alt="CML Logo"
        width={size}
        height={size}
        className="object-cover w-full h-full"
        priority
      />
    </div>
  );
}

export function TopHeader({ theme }: TopHeaderProps) {
  return (
    <div className="px-5 pt-1 pb-1.5">
      {/* Org branding row */}
      <div className="flex items-center gap-2.5">
        <Logo size={48} />
        <div className="flex-1 min-w-0">
          <div
            className="font-[family-name:var(--font-poppins)] font-bold text-[18px] leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ color: COLORS.text }}
          >
            Cherupushpa Mission League
          </div>
          <div className="inline-flex items-center gap-1 mt-[3px]">
            <MapPin size={11} color={COLORS.purple} />
            <span
              className="text-[14.5px] font-medium whitespace-nowrap"
              style={{ color: COLORS.sub }}
            >
              Kalpatta Meghala
            </span>
          </div>
        </div>

        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center shrink-0 rounded-full border-none cursor-pointer"
          style={{
            width: 38,
            height: 38,
            background: theme.chip,
            color: COLORS.text,
            boxShadow: theme.softShadow,
          }}
        >
          <Bell size={17} strokeWidth={2} />
          <span
            className="absolute rounded-full"
            style={{
              top: 7,
              right: 8,
              width: 8,
              height: 8,
              background: COLORS.alert,
              boxShadow: "0 0 0 2px #fff",
            }}
          />
        </button>
      </div>

    </div>
  );
}
