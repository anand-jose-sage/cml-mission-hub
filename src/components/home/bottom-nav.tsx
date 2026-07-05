"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Home,
  LayoutGrid,
  Film,
  Megaphone,
  Info,
} from "lucide-react";
import { type CMLTheme } from "@/lib/theme";
import { NAV_ITEMS } from "@/lib/sample-data";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
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

const BUBBLE_SIZE = 54;
// Notch radius is a few px larger than the bubble so a thin halo ring of
// page background shows around the bubble where it meets the bar.
const NOTCH_RADIUS = BUBBLE_SIZE / 2 + 3;
// Dark navy blue — a deep, saturated color outside the bar's purple/pink
// tint family so inactive icons/labels stay sharp without reading as flat black.
const INACTIVE_COLOR = "#0B2545";
// A darker shade of the brand purple for the active label/icon, instead of
// the brighter accent purple used for the bubble.
const ACTIVE_COLOR = "#4C1D95";

export function BottomNav({ active, setActive, theme }: BottomNavProps) {
  const itemCount = NAV_ITEMS.length;
  const activeIndex = Math.max(0, NAV_ITEMS.findIndex((item) => item.id === active));

  const index = useMotionValue(activeIndex);

  useEffect(() => {
    const controls = animate(index, activeIndex, {
      type: "spring",
      stiffness: 380,
      damping: 32,
    });
    return controls.stop;
  }, [activeIndex, index]);

  const bubbleLeft = useTransform(index, (v) => `${((v + 0.5) / itemCount) * 100}%`);
  // Bar-local top edge doubles as the notch's mask center, so the cut lines
  // up with the bubble sitting half-in/half-out of the bar above it.
  const maskImage = useTransform(index, (v) => {
    const cx = ((v + 0.5) / itemCount) * 100;
    return `radial-gradient(circle ${NOTCH_RADIUS}px at ${cx}% 0px, transparent 0px, transparent ${NOTCH_RADIUS - 1}px, black ${NOTCH_RADIUS + 1}px, black 100%)`;
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] px-3.5 pb-5 pointer-events-none md:absolute">
      <div className="relative pointer-events-auto" style={{ paddingTop: BUBBLE_SIZE / 2 }}>
        <motion.div
          className="flex justify-around items-center rounded-[26px] py-2.5 px-1.5"
          style={{
            background: `linear-gradient(135deg, rgba(167,139,250,0.72), rgba(190,24,147,0.4) 45%, rgba(107,70,255,0.8)), ${theme.navBg}`,
            boxShadow:
              "0 12px 34px rgba(107,70,255,0.28), inset 0 1px 1px rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.45)",
            backdropFilter: "blur(8px) saturate(140%)",
            WebkitBackdropFilter: "blur(8px) saturate(140%)",
            WebkitMaskImage: maskImage,
            maskImage: maskImage,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const on = active === item.id;
            const IconComp = ICON_MAP[item.icon];
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="border-none bg-transparent cursor-pointer flex-1 flex flex-col items-center gap-1 py-1"
                style={{ color: on ? ACTIVE_COLOR : INACTIVE_COLOR }}
              >
                <div
                  className="flex items-center justify-center transition-opacity duration-200"
                  style={{ height: 32, opacity: on ? 0 : 1 }}
                >
                  {IconComp && <IconComp size={21} color={INACTIVE_COLOR} strokeWidth={2.5} />}
                </div>
                <span
                  className="text-[12px] font-[family-name:var(--font-poppins)]"
                  style={{ fontWeight: on ? 800 : 700 }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </motion.div>

        <motion.div
          className="absolute top-0 flex items-center justify-center pointer-events-none"
          style={{
            left: bubbleLeft,
            x: "-50%",
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
            borderRadius: "50%",
            background: "linear-gradient(145deg, #B79BF7, #9173EE)",
            boxShadow:
              "0 8px 20px rgba(140,100,230,0.45), inset 0 1.5px 2px rgba(255,255,255,0.55)",
          }}
        >
          {(() => {
            const ActiveIcon = ICON_MAP[NAV_ITEMS[activeIndex]?.icon];
            return ActiveIcon ? <ActiveIcon size={23} color="#fff" strokeWidth={2} /> : null;
          })()}
        </motion.div>
      </div>
    </div>
  );
}
