"use client";

import {
  Home,
  LayoutGrid,
  Film,
  Megaphone,
  Info,
} from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import { NAV_ITEMS } from "@/lib/sample-data";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; fill?: string; color?: string; strokeWidth?: number }>> = {
  Home,
  LayoutGrid,
  Film,
  Megaphone,
  Info,
};

interface BottomNavProps {
  active: string;
  setActive: (id: string) => void;
  theme: CMLTheme;
}

export function BottomNav({ active, setActive, theme }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] px-3.5 pb-5 pointer-events-none md:absolute">
      <div
        className="pointer-events-auto flex justify-around items-center rounded-[26px] py-2.5 px-1.5"
        style={{
          background: theme.navBg,
          boxShadow: "0 12px 34px rgba(30,27,75,0.18)",
          border: "1px solid rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        {NAV_ITEMS.map((n) => {
          const on = active === n.id;
          const IconComp = ICON_MAP[n.icon];
          return (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className="border-none bg-transparent cursor-pointer flex-1 flex flex-col items-center gap-1 py-1"
              style={{ color: on ? COLORS.purple : COLORS.faint }}
            >
              <div
                className="flex items-center justify-center transition-all"
                style={{
                  width: on ? 42 : 36,
                  height: 32,
                  borderRadius: 12,
                  background: on
                    ? "linear-gradient(160deg, rgba(107,70,255,0.16), rgba(167,139,250,0.16))"
                    : "transparent",
                }}
              >
                {IconComp && (
                  <IconComp
                    size={21}
                    color={on ? COLORS.purple : COLORS.faint}
                    strokeWidth={on ? 2 : 1.9}
                    fill={on ? COLORS.purple : "none"}
                  />
                )}
              </div>
              <span
                className="text-[9.5px] font-[family-name:var(--font-poppins)]"
                style={{ fontWeight: on ? 700 : 500 }}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
