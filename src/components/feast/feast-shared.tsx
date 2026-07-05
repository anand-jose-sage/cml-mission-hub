"use client";

import { useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Trophy, Sparkles, ArrowLeft, ArrowRight, LogOut, ChevronRight,
  ChevronDown, Clock, MapPin, Check, Ticket, Medal, Search, X,
  PenTool, Palette, FileText, BookOpen, Mic, Users, Film, Image,
  ClipboardList, UserPlus, Lock, LogIn,
} from "lucide-react";
import type { CMLTheme } from "@/lib/theme";
import type { Feast } from "@/lib/feast-data";
import { FEASTS } from "@/lib/feast-data";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
  Trophy, Sparkles, ArrowLeft, ArrowRight, LogOut, ChevronRight,
  ChevronDown, Clock, MapPin, Check, Ticket, Medal, Search, X,
  PenTool, Palette, FileText, BookOpen, Mic, Users, Film, Image,
  ClipboardList, UserPlus, Lock, LogIn,
};

export function FeastIcon({ name, size = 20, color, className }: { name: string; size?: number; color?: string; className?: string }) {
  const Comp = ICON_MAP[name];
  if (Comp) return <Comp size={size} color={color} className={className} />;
  if (!name) return null;
  // Not a known lucide name — treat it as a literal emoji (e.g. set per-competition in Supabase).
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {name}
    </span>
  );
}

export interface FeastTheme {
  radius: number;
  text: string;
  sub: string;
  faint: string;
  gold: string;
  purple: string;
  lavender: string;
  pink: string;
  cyan: string;
  fill: string;
  fillStrong: string;
  hairline: string;
  track: string;
  softShadow: string;
  glass: { background: string; border: string; backdropFilter: string };
  glassStrong: { background: string; border: string; backdropFilter: string };
  pageBg: string;
  blobs: false | "soft" | "vivid";
  navBg: string;
}

export function buildFeastTheme(parent: CMLTheme): FeastTheme {
  return {
    radius: parent.radius || 26,
    text: "#1E1B4B",
    sub: "#6B6792",
    faint: "#9D99BC",
    gold: "#F5C542",
    purple: "#6B46FF",
    lavender: "#A78BFA",
    pink: "#EC4899",
    cyan: "#0EA5C4",
    fill: "#F1EEFB",
    fillStrong: "rgba(107,70,255,0.10)",
    hairline: "rgba(30,27,75,0.07)",
    track: "rgba(30,27,75,0.08)",
    softShadow: parent.softShadow || "0 8px 26px rgba(107,70,255,0.07)",
    glass: parent.card,
    glassStrong: { ...parent.card, background: "#ffffff" },
    pageBg: parent.pageBg || "#FAFAFC",
    blobs: parent.blobs,
    navBg: parent.navBg || "rgba(255,255,255,0.86)",
  };
}

export function GlassPanel({
  children, theme, strong, glow, style, className = "", onClick, pressable,
}: {
  children: ReactNode;
  theme: FeastTheme;
  strong?: boolean;
  glow?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  pressable?: boolean;
}) {
  const g = strong ? theme.glassStrong : theme.glass;
  return (
    <div
      onClick={onClick}
      className={`${pressable ? "transition-transform hover:-translate-y-[3px] active:scale-[0.985] " : ""}${className}`}
      style={{
        borderRadius: theme.radius,
        ...g,
        boxShadow: glow
          ? `0 12px 32px rgba(120,70,160,0.16), 0 0 0 1px ${glow}26, 0 10px 28px ${glow}33`
          : theme.softShadow,
        cursor: onClick || pressable ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function GlowBtn({
  children, onClick, variant = "primary", icon, iconRight, full, disabled, size = "md", style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "gold" | "ghost" | "pink";
  icon?: string;
  iconRight?: string;
  full?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}) {
  const pads = { sm: "10px 14px", md: "14px 18px", lg: "16px 20px" };
  const fonts = { sm: 13, md: 15, lg: 16 };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "linear-gradient(135deg, #6B46FF, #A78BFA)", color: "#fff", boxShadow: "0 10px 28px rgba(107,70,255,0.4)" },
    gold: { background: "linear-gradient(135deg, #F7D26B, #F0A500)", color: "#3a2a00", boxShadow: "0 10px 28px rgba(245,197,66,0.38)" },
    ghost: { background: "rgba(107,70,255,0.09)", color: "#1E1B4B", border: "1px solid rgba(107,70,255,0.2)", boxShadow: "none" },
    pink: { background: "linear-gradient(135deg, #C026D3, #EC4899)", color: "#fff", boxShadow: "0 10px 28px rgba(236,72,153,0.4)" },
  };
  const v = variants[variant];
  const iconColor = (v.color as string) || "#fff";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="active:scale-95 transition-transform"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-poppins), sans-serif", fontWeight: 600,
        fontSize: fonts[size], padding: pads[size], borderRadius: 14,
        width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1,
        ...v, ...style,
      }}
    >
      {icon && <FeastIcon name={icon} size={fonts[size] + 3} color={iconColor} />}
      {children}
      {iconRight && <FeastIcon name={iconRight} size={fonts[size] + 2} color={iconColor} />}
    </button>
  );
}

export function StatusPill({ label, color = "#34D3EE" }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold text-[11px] rounded-full"
      style={{
        fontFamily: "var(--font-poppins), sans-serif",
        color, background: color + "22", border: `1px solid ${color}44`,
        padding: "5px 11px",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </span>
  );
}

export function StatBlock({ value, label, color, theme }: { value: string | number; label: string; color?: string; theme: FeastTheme }) {
  return (
    <div className="flex-1 text-center">
      <div className="font-bold text-[22px] leading-none tabular-nums" style={{ fontFamily: "var(--font-poppins), sans-serif", color: color || theme.text }}>{value}</div>
      <div className="text-[10.5px] mt-1 uppercase tracking-wider" style={{ color: theme.sub }}>{label}</div>
    </div>
  );
}

export function SectionTitle({ children, theme, right }: { children: ReactNode; theme: FeastTheme; right?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between my-[22px_12px]" style={{ margin: "22px 0 12px" }}>
      <h3 className="font-semibold text-[17px] m-0 tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{children}</h3>
      {right}
    </div>
  );
}

export function FeastTopBar({ title, onBack, onExit, theme }: { title: string; onBack?: () => void; onExit: () => void; theme: FeastTheme }) {
  return (
    <div className="flex items-center gap-3 pb-3.5 pt-1">
      {onBack ? (
        <button onClick={onBack} className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform" style={{ ...theme.glass, color: theme.text, border: "none" }}>
          <ArrowLeft size={19} color={theme.text} />
        </button>
      ) : (
        <div className="w-10 h-10 rounded-[13px] flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 8px 22px rgba(139,92,246,0.5)" }}>
          <Trophy size={20} color="#fff" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[16px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{title}</div>
        <div className="text-[11px] font-medium" style={{ color: theme.faint }}>CML Kalpetta &middot; Feast Portal</div>
      </div>
      <button onClick={onExit} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full cursor-pointer text-[12px] font-semibold active:scale-95 transition-transform" style={{ ...theme.glass, color: theme.sub, fontFamily: "var(--font-poppins), sans-serif", border: "none" }}>
        <LogOut size={14} color={theme.sub} /> Hub
      </button>
    </div>
  );
}

export function FeastSwitch({ slug, theme, onPick }: { slug: string; theme: FeastTheme; onPick: (s: string) => void }) {
  return (
    <div className="flex gap-2 mb-4">
      {Object.values(FEASTS).map((f) => {
        const on = f.slug === slug;
        return (
          <button
            key={f.slug}
            onClick={() => onPick(f.slug)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 cursor-pointer py-[11px] px-2.5 rounded-[14px] font-semibold text-[12.5px] active:scale-95 transition-transform"
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              border: on ? "none" : `1px solid ${theme.hairline}`,
              background: on ? `linear-gradient(135deg, ${f.tint[0]}, ${f.tint[1]})` : theme.fill,
              color: on ? "#fff" : theme.sub,
              boxShadow: on ? `0 8px 22px ${f.accent}55` : "none",
            }}
          >
            <FeastIcon name={f.icon} size={15} color={on ? "#fff" : theme.sub} /> {f.name.replace(" Feast", "")}
          </button>
        );
      })}
    </div>
  );
}

// Dynamic feast tabs — driven by real feast list (not static FEASTS)
export interface DynamicFeast {
  slug: string;
  name: string;
  icon: string;
  tint: [string, string];
  accent: string;
}

export function FeastTabs({
  feasts, active, onPick, loading = false,
}: {
  feasts: DynamicFeast[];
  active: string;
  onPick: (slug: string) => void;
  loading?: boolean;
}) {
  if (loading && feasts.length === 0) {
    return (
      <div className="flex gap-2 mb-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex-1 h-11 rounded-[14px] animate-pulse" style={{ background: "rgba(107,70,255,0.08)" }} />
        ))}
      </div>
    );
  }
  if (feasts.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {feasts.map((f) => {
        const on = f.slug === active;
        return (
          <button
            key={f.slug}
            onClick={() => onPick(f.slug)}
            className="shrink-0 inline-flex items-center gap-1.5 cursor-pointer py-[10px] px-4 rounded-[14px] font-bold text-[13px] active:scale-95 transition-transform"
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              border: on ? "none" : "1px solid rgba(107,70,255,0.14)",
              background: on ? `linear-gradient(135deg, ${f.tint[0]}, ${f.tint[1]})` : "rgba(255,255,255,0.7)",
              color: on ? "#fff" : "#4B5563",
              boxShadow: on ? `0 8px 22px ${f.accent}55` : "none",
              whiteSpace: "nowrap",
            }}
          >
            <FeastIcon name={f.icon} size={14} color={on ? "#fff" : "#8B5CF6"} />
            {f.name}
          </button>
        );
      })}
    </div>
  );
}

const FEAST_NAV_BUBBLE_SIZE = 54;
// Notch radius is a few px larger than the bubble so a thin halo ring of
// page background shows around the bubble where it meets the bar.
const FEAST_NAV_NOTCH_RADIUS = FEAST_NAV_BUBBLE_SIZE / 2 + 3;
// Dark navy blue — a deep, saturated color outside the bar's purple/pink
// tint family so inactive icons/labels stay sharp without reading as flat black.
const FEAST_NAV_INACTIVE_COLOR = "#0B2545";
// A darker shade of the brand purple for the active label/icon, instead of
// the brighter accent purple used for the bubble.
const FEAST_NAV_ACTIVE_COLOR = "#4C1D95";
// Dark burgundy for the "Hub" exit item, to set it apart from the other nav items.
const FEAST_NAV_EXIT_COLOR = "#6E1423";

export function FeastNav({ active, onNav, theme }: { active: string; onNav: (id: string) => void; theme: FeastTheme }) {
  const items = [
    { id: "landing", icon: "Sparkles", label: "Feasts" },
    { id: "results", icon: "Medal", label: "Results" },
    { id: "leaderboard", icon: "Trophy", label: "Ranks" },
    { id: "participants", icon: "Search", label: "Search" },
    { id: "exit", icon: "LogOut", label: "Hub" },
  ];
  const itemCount = items.length;
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === active));

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
  const maskImage = useTransform(index, (v) => {
    const cx = ((v + 0.5) / itemCount) * 100;
    return `radial-gradient(circle ${FEAST_NAV_NOTCH_RADIUS}px at ${cx}% 0px, transparent 0px, transparent ${FEAST_NAV_NOTCH_RADIUS - 1}px, black ${FEAST_NAV_NOTCH_RADIUS + 1}px, black 100%)`;
  });

  const activeItem = items[activeIndex];

  return (
    <div className="absolute left-0 right-0 bottom-0 z-40 px-3.5 pb-[22px] pointer-events-none">
      <div className="relative pointer-events-auto" style={{ paddingTop: FEAST_NAV_BUBBLE_SIZE / 2 }}>
        <motion.div
          className="flex justify-around items-center rounded-[26px] py-2.5 px-1.5"
          style={{
            background: `linear-gradient(135deg, rgba(167,139,250,0.72), rgba(190,24,147,0.4) 45%, rgba(107,70,255,0.8)), ${theme.navBg}`,
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: "0 12px 34px rgba(107,70,255,0.28), inset 0 1px 1px rgba(255,255,255,0.5)",
            backdropFilter: "blur(8px) saturate(140%)",
            WebkitBackdropFilter: "blur(8px) saturate(140%)",
            WebkitMaskImage: maskImage,
            maskImage: maskImage,
          }}
        >
          {items.map((n) => {
            const on = active === n.id;
            const isExit = n.id === "exit";
            return (
              <button
                key={n.id}
                onClick={() => onNav(n.id)}
                className="border-none bg-none cursor-pointer flex-1 flex flex-col items-center gap-1 py-1"
                style={{ background: "none", color: on ? FEAST_NAV_ACTIVE_COLOR : isExit ? FEAST_NAV_EXIT_COLOR : FEAST_NAV_INACTIVE_COLOR }}
              >
                <div
                  className="flex items-center justify-center transition-opacity duration-200"
                  style={{ height: 32, opacity: on ? 0 : 1 }}
                >
                  <FeastIcon name={n.icon} size={20} color={isExit ? FEAST_NAV_EXIT_COLOR : FEAST_NAV_INACTIVE_COLOR} />
                </div>
                <span className="text-[12px]" style={{ fontWeight: on ? 800 : 700, fontFamily: "var(--font-poppins), sans-serif" }}>{n.label}</span>
              </button>
            );
          })}
        </motion.div>

        <motion.div
          className="absolute top-0 flex items-center justify-center pointer-events-none"
          style={{
            left: bubbleLeft,
            x: "-50%",
            width: FEAST_NAV_BUBBLE_SIZE,
            height: FEAST_NAV_BUBBLE_SIZE,
            borderRadius: "50%",
            background: `linear-gradient(145deg, ${theme.lavender}, ${theme.purple})`,
            boxShadow: "0 8px 20px rgba(140,100,230,0.45), inset 0 1.5px 2px rgba(255,255,255,0.55)",
          }}
        >
          {activeItem && <FeastIcon name={activeItem.icon} size={23} color="#fff" />}
        </motion.div>
      </div>
    </div>
  );
}
