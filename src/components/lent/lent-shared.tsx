"use client";

import type { ReactNode } from "react";
import {
  ShieldCheck, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  X, Share2, Download, CalendarDays, BookOpenText, HeartHandshake, Flame,
  LogOut, Loader2, Check, Sparkles, Map, Send, Lock, Swords,
} from "lucide-react";
import type { CMLTheme } from "@/lib/theme";
import { LENT } from "@/lib/lent-theme";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
  ShieldCheck, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  X, Share2, Download, CalendarDays, BookOpenText, HeartHandshake, Flame,
  LogOut, Loader2, Check, Sparkles, Map, Send, Lock, Swords,
};

export function LentIcon({ name, size = 20, color, className }: { name: string; size?: number; color?: string; className?: string }) {
  const Comp = ICON_MAP[name];
  if (Comp) return <Comp size={size} color={color} className={className} />;
  if (!name) return null;
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {name}
    </span>
  );
}

// "Ember Vigil" theme — tokens straight from the design handoff.
export interface LentTheme {
  radius: number;
  page: string; bg: string; bg2: string;
  surf: string; surf2: string; line: string;
  accent: string; accent2: string;
  text: string; muted: string; glow: string;
  pageBg: string;
}

export function buildLentTheme(parent: CMLTheme): LentTheme {
  return {
    radius: parent.radius || 20,
    page: LENT.page, bg: LENT.bg, bg2: LENT.bg2,
    surf: LENT.surf, surf2: LENT.surf2, line: LENT.line,
    accent: LENT.accent, accent2: LENT.accent2,
    text: LENT.text, muted: LENT.muted, glow: LENT.glow,
    pageBg: LENT.bg,
  };
}

export function LentGlassPanel({
  children, theme, strong, style, className = "", onClick, pressable,
}: {
  children: ReactNode;
  theme: LentTheme;
  strong?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  pressable?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`${pressable ? "transition-transform hover:-translate-y-[3px] active:scale-[0.985] " : ""}${className}`}
      style={{
        borderRadius: theme.radius,
        background: strong ? theme.bg2 : theme.surf,
        border: `1px solid ${theme.line}`,
        cursor: onClick || pressable ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function LentGlowBtn({
  children, onClick, variant = "primary", icon, iconRight, full, disabled, size = "md", style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  icon?: string;
  iconRight?: string;
  full?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}) {
  const pads = { sm: "10px 14px", md: "15px 18px", lg: "16px 20px" };
  const fonts = { sm: 13, md: 14.5, lg: 16 };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: `linear-gradient(135deg, ${LENT.accent}, ${LENT.accent2})`, color: "#fff", boxShadow: `0 14px 34px -14px ${LENT.glow}` },
    ghost: { background: LENT.surf2, color: LENT.text, border: `1px solid ${LENT.line}`, boxShadow: "none" },
  };
  const v = variants[variant];
  const iconColor = (v.color as string) || "#fff";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="active:scale-[0.99] transition-transform"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-lent-malayalam), sans-serif", fontWeight: 600,
        fontSize: fonts[size], padding: pads[size], borderRadius: 15,
        width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1,
        ...v, ...style,
      }}
    >
      {icon && <LentIcon name={icon} size={fonts[size] + 3} color={iconColor} />}
      {children}
      {iconRight && <LentIcon name={iconRight} size={fonts[size] + 2} color={iconColor} />}
    </button>
  );
}

// Chip used for AI-action suggestions and companion-sheet starter prompts.
// Not fully-round — Malayalam labels wrap to two lines and must grow the box.
export function LentChip({ label, onClick, muted }: { label: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", textAlign: "left", lineHeight: 1.4,
        padding: "10px 14px", borderRadius: 18, cursor: "pointer",
        fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 12.5,
        color: muted ? LENT.muted : LENT.text, background: muted ? "transparent" : LENT.surf2,
        border: `1px solid ${LENT.line}`,
      }}
    >
      {label}
    </button>
  );
}

// Optional admin-only day override — jump to any of the 40 days to preview
// its content, regardless of the real calendar date. Only ever passed by
// LentToday when the signed-in profile has an admin role; absent for every
// regular visitor, who sees the header exactly as before.
export interface LentAdminDayNav {
  overridden: boolean; // false while still showing the real "today"
  onPrev: () => void;
  onNext: () => void;
  onJump: (day: number) => void;
  onResetToday: () => void;
}

// Sticky header shared by the Today and Journey screens: shield crest tile,
// bilingual title, day pill, compact exit-to-Hub icon.
export function LentTopBar({
  day, onExit, theme, adminNav,
}: { day: number; onExit: () => void; theme: LentTheme; adminNav?: LentAdminDayNav }) {
  return (
    <div
      className="sticky top-0 z-[6] flex items-center justify-between px-5 pt-[18px] pb-3.5"
      style={{ backdropFilter: "blur(14px)", background: "linear-gradient(180deg, rgba(0,0,0,.28), transparent)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(150deg, ${theme.accent}, ${theme.accent2})`, boxShadow: `0 6px 18px -6px ${theme.glow}` }}
        >
          <ShieldCheck size={15} color="#fff" strokeWidth={1.9} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[11.5px] leading-[1.7] whitespace-nowrap" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", color: theme.text }}>
            വിശുദ്ധ മിഖായേലിന്റെ നോമ്പ്
          </div>
          <div className="text-[9.5px] uppercase" style={{ fontFamily: "var(--font-lent-outfit), sans-serif", letterSpacing: ".1em", color: theme.muted }}>
            St. Michael&apos;s Lent
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {adminNav && (
          <button
            onClick={adminNav.onPrev}
            className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            style={{ background: theme.surf, border: `1px solid ${theme.line}` }}
            aria-label="Previous day (admin)"
          >
            <ChevronLeft size={12} color={theme.muted} />
          </button>
        )}
        <div
          className="flex items-baseline gap-0.5 px-[11px] py-1.5 rounded-full"
          style={{ fontFamily: "var(--font-lent-outfit), sans-serif", border: `1px solid ${adminNav?.overridden ? theme.accent : theme.line}`, background: theme.surf }}
        >
          {adminNav ? (
            <input
              type="number"
              min={1}
              max={40}
              value={day}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) adminNav.onJump(n);
              }}
              className="text-[14px] font-semibold text-center"
              style={{ width: 22, background: "transparent", border: "none", outline: "none", color: theme.accent2, appearance: "textfield" }}
              aria-label="Jump to day (admin)"
            />
          ) : (
            <span className="text-[14px] font-semibold" style={{ color: theme.accent2 }}>{day}</span>
          )}
          <span className="text-[10px]" style={{ color: theme.muted }}>/40</span>
        </div>
        {adminNav && (
          <button
            onClick={adminNav.onNext}
            className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            style={{ background: theme.surf, border: `1px solid ${theme.line}` }}
            aria-label="Next day (admin)"
          >
            <ChevronRight size={12} color={theme.muted} />
          </button>
        )}
        {adminNav?.overridden && (
          <button
            onClick={adminNav.onResetToday}
            className="px-2 h-6 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".04em", background: theme.surf, border: `1px solid ${theme.accent}`, color: theme.accent2 }}
          >
            TODAY
          </button>
        )}
        <button
          onClick={onExit}
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          style={{ background: theme.surf, border: `1px solid ${theme.line}` }}
          aria-label="Exit to Hub"
        >
          <LogOut size={14} color={theme.muted} />
        </button>
      </div>
    </div>
  );
}

// St. Michael presence layer for the Today screen: statue image + gradient
// fade + breathing ember glow. Rendered once by LentModule (not by LentToday
// itself) as a sibling of the scrollable <main>, positioned `absolute`
// (not `fixed`) so it stays bounded to the module's own phone-width frame
// (LentModule's `absolute inset-0` root) instead of the full browser
// viewport — `fixed` would anchor it to the true browser edges on a wide
// desktop window while the max-w-md content column stays centered,
// splitting the two apart. Also defines the `ev-rise` keyframe LentToday's
// hero text uses — CSS keyframes are global once injected, so one <style>
// here covers both.
export function LentPresenceLayer() {
  return (
    <>
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: 420, backgroundImage: "url(/lent/michael.jpg)", backgroundSize: "cover", backgroundPosition: "50% 12%", opacity: 0.62, mixBlendMode: "screen" }}
      />
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: 420, background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 34%, #0B0708 88%)" }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: 64, left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,122,47,.32) 0%, transparent 66%)",
          filter: "blur(6px)", animation: "ev-breathe 7s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes ev-breathe{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.8;transform:scale(1.04)}}
@keyframes ev-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </>
  );
}
