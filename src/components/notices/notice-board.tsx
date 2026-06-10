"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  Megaphone,
  Sparkles,
  Award,
  User,
  Volume2,
  Pin,
  ChevronDown,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import {
  NOTICE_TINTS,
  NOTICE_FILTERS,
  type NoticeItem,
  type NoticeTintKey,
  type NoticeAuthor,
} from "@/lib/notice-data";
import { useNotices } from "@/hooks/use-notices";

/* ─── icon lookup ───────────────────────────────────── */
const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
> = { Megaphone, Sparkles, Award, User, Volume2, Pin, Bell };

const INK_TITLE = "#241F4D";

/* ─── Author avatar (gradient + initials) ───────────── */
function AuthorAvatar({
  a,
  size = 28,
}: {
  a: NoticeAuthor;
  size?: number;
}) {
  const t = NOTICE_TINTS[a.tint] || NOTICE_TINTS.purple;
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-[family-name:var(--font-poppins)] font-semibold"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, ${t.dot}, ${t.ink})`,
        color: "#fff",
        fontSize: size * 0.4,
        boxShadow: "0 0 0 2px rgba(255,255,255,0.7)",
      }}
    >
      {a.initials}
    </div>
  );
}

/* ─── Notice Card (stacked deck) ────────────────────── */
function NoticeCard({
  n,
  idx,
  first,
  vis,
  onOpen,
}: {
  n: NoticeItem;
  idx: number;
  first: boolean;
  vis: boolean;
  onOpen: (n: NoticeItem, el: HTMLButtonElement) => void;
}) {
  const t = NOTICE_TINTS[n.tint];
  const IconComp = ICON_MAP[n.icon];

  return (
    <button
      onClick={(e) => onOpen(n, e.currentTarget)}
      className="appearance-none text-left cursor-pointer w-full flex border active:scale-[0.98] transition-transform"
      style={{
        background: t.grad,
        borderColor: "rgba(255,255,255,0.7)",
        borderRadius: 26,
        padding: "16px 16px 24px",
        marginTop: first ? 0 : -14,
        position: "relative",
        gap: 14,
        boxShadow:
          "0 -2px 0 rgba(255,255,255,0.5), 0 16px 34px rgba(36,31,77,0.13)",
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(16px)",
        transition:
          "opacity .5s ease, transform .5s cubic-bezier(.2,.7,.2,1)",
        transitionDelay: `${idx * 65}ms`,
      }}
    >
      {/* left rail: icon + date */}
      <div className="flex flex-col items-center shrink-0 gap-2" style={{ width: 52 }}>
        <div
          className="w-9 h-9 rounded-[12px] shrink-0 flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.65)",
            boxShadow: "0 4px 12px rgba(36,31,77,0.10)",
          }}
        >
          {IconComp && <IconComp size={16} color={t.ink} strokeWidth={2.1} />}
        </div>
        <div className="text-center leading-none">
          <div
            className="font-[family-name:var(--font-poppins)] font-bold text-[18px] whitespace-nowrap"
            style={{ color: t.ink }}
          >
            {n.day}
          </div>
          <div
            className="font-[family-name:var(--font-poppins)] font-semibold text-[12.5px] uppercase tracking-wider mt-[2px] whitespace-nowrap"
            style={{ color: t.ink }}
          >
            {n.month}
          </div>
        </div>
      </div>

      {/* main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[7px]">
          {n.pinned && (
            <span
              className="inline-flex items-center gap-[3px] font-[family-name:var(--font-poppins)] font-bold text-[8.5px] tracking-wide uppercase px-[7px] py-[3px] rounded-full"
              style={{ background: t.ink, color: "#fff" }}
            >
              <Pin size={9} color="#fff" />
              Pinned
            </span>
          )}
          <span
            className="font-[family-name:var(--font-poppins)] font-semibold text-[11px] tracking-wide uppercase"
            style={{ color: t.ink }}
          >
            {n.cat}
          </span>
          <span
            className="ml-auto w-[7px] h-[7px] rounded-full"
            style={{
              background: t.dot,
              boxShadow: `0 0 0 3px ${t.soft}`,
            }}
          />
        </div>
        <div
          className="font-[family-name:var(--font-poppins)] font-semibold text-[16px] leading-[1.22] tracking-[-0.2px] mt-[7px]"
          style={{ color: INK_TITLE }}
        >
          {n.title}
        </div>
        <div
          className="text-[11.5px] leading-snug mt-[6px] line-clamp-2"
          style={{ color: t.ink, opacity: 0.78 }}
        >
          {n.summary}
        </div>
      </div>
    </button>
  );
}

/* ─── Meta chip (date / time / venue in detail) ─────── */
function MetaChip({
  icon: Icon,
  label,
  value,
  ink,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  ink: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1.5">
      <Icon size={18} color={ink} strokeWidth={2} />
      <div
        className="text-[9.5px] uppercase tracking-wide font-semibold"
        style={{ color: COLORS.faint }}
      >
        {label}
      </div>
      <div
        className="font-[family-name:var(--font-poppins)] font-semibold text-[12.5px] text-center leading-tight"
        style={{ color: INK_TITLE }}
      >
        {value}
      </div>
    </div>
  );
}

/* ─── Notice Detail (rendered inside expanding panel) ── */
function NoticeDetail({
  n,
  shown,
  onClose,
}: {
  n: NoticeItem;
  shown: boolean;
  onClose: () => void;
}) {
  const t = NOTICE_TINTS[n.tint];
  const isEvent = !!n.event;

  const glassBtn: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(36,31,77,0.12)",
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* top chrome buttons */}
      <div
        className="absolute left-4 right-4 z-[4] flex items-center justify-between"
        style={{
          top: 50,
          opacity: shown ? 1 : 0,
          transition: "opacity .25s ease",
          transitionDelay: shown ? ".14s" : "0s",
        }}
      >
        <button onClick={onClose} className="active:scale-[0.92]" style={glassBtn}>
          <ChevronDown size={20} color={t.ink} strokeWidth={2.2} />
        </button>
        <button className="active:scale-[0.92]" style={glassBtn}>
          <Share2 size={17} color={t.ink} strokeWidth={2} />
        </button>
      </div>

      {/* scroll body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* HERO (colored) */}
        <div
          className="px-[22px]"
          style={{
            paddingTop: 104,
            paddingBottom: 30,
            opacity: shown ? 1 : 0,
            transform: shown ? "none" : "translateY(10px)",
            transition:
              "opacity .3s ease, transform .35s cubic-bezier(.2,.7,.2,1)",
            transitionDelay: shown ? ".1s" : "0s",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-[5px] font-[family-name:var(--font-poppins)] font-bold text-[10.5px] tracking-wide uppercase px-[11px] py-[5px] rounded-full"
              style={{ background: "rgba(255,255,255,0.7)", color: t.ink }}
            >
              {ICON_MAP[n.icon] &&
                (() => {
                  const Ic = ICON_MAP[n.icon];
                  return <Ic size={12} color={t.ink} />;
                })()}
              {n.cat}
            </span>
            {n.priority && (
              <span
                className="inline-flex items-center gap-1 font-[family-name:var(--font-poppins)] font-bold text-[10px] tracking-wide uppercase px-[10px] py-[5px] rounded-full"
                style={{ background: t.ink, color: "#fff" }}
              >
                {n.priority} priority
              </span>
            )}
          </div>
          <h1
            className="font-[family-name:var(--font-poppins)] font-semibold text-[26px] leading-[1.18] tracking-[-0.5px] mt-4"
            style={{ color: INK_TITLE }}
          >
            {n.title}
          </h1>
          <div
            className="text-[12px] mt-3"
            style={{ color: t.ink, opacity: 0.85 }}
          >
            Posted {n.date}, {n.time}
          </div>
        </div>

        {/* WHITE SHEET */}
        <div
          className="min-h-[320px] px-[22px] pb-7"
          style={{
            background: "#fff",
            borderRadius: "28px 28px 0 0",
            padding: "8px 22px 28px",
            marginTop: -8,
            boxShadow: "0 -10px 30px rgba(36,31,77,0.08)",
            transform: shown ? "none" : "translateY(40px)",
            opacity: shown ? 1 : 0,
            transition:
              "opacity .35s ease, transform .45s cubic-bezier(.2,.7,.2,1)",
            transitionDelay: shown ? ".16s" : "0s",
          }}
        >
          {/* grab handle */}
          <div
            className="w-[38px] h-1 rounded-full mx-auto mt-3 mb-[18px]"
            style={{ background: "rgba(36,31,77,0.12)" }}
          />

          {/* event key-details */}
          {isEvent && n.event && (
            <div
              className="flex rounded-[18px] mb-5"
              style={{
                background: t.soft,
                border: `1px solid ${t.soft}`,
              }}
            >
              <MetaChip icon={Calendar} label="Date" value={n.event.date} ink={t.ink} />
              <div
                className="my-3"
                style={{ width: 1, background: "rgba(36,31,77,0.08)" }}
              />
              <MetaChip icon={Clock} label="Time" value={n.event.time} ink={t.ink} />
              <div
                className="my-3"
                style={{ width: 1, background: "rgba(36,31,77,0.08)" }}
              />
              <MetaChip icon={MapPin} label="Venue" value={n.event.venue} ink={t.ink} />
            </div>
          )}

          {/* body */}
          {n.body.map((p, i) => (
            <p
              key={i}
              className="text-[14.5px] leading-[1.62] mb-[13px]"
              style={{ color: "#4A4668" }}
            >
              {p}
            </p>
          ))}

          {/* attachment */}
          {n.attach && (
            <div
              className="flex items-center gap-3 mt-1.5 rounded-[16px] p-[13px_14px]"
              style={{
                background: "#F7F5FD",
                border: "1px solid rgba(36,31,77,0.06)",
              }}
            >
              <div
                className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                style={{ background: t.soft }}
              >
                <FileText size={19} color={t.ink} strokeWidth={1.9} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-[family-name:var(--font-poppins)] font-semibold text-[13px] truncate"
                  style={{ color: INK_TITLE }}
                >
                  {n.attach.name}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: COLORS.faint }}>
                  {n.attach.size}
                </div>
              </div>
              <button
                className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center shrink-0 active:scale-[0.92]"
                style={{ background: t.ink }}
              >
                <Download size={16} color="#fff" strokeWidth={2} />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* bottom spacer for nav clearance */}
      <div className="shrink-0 h-[90px]" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTICE BOARD — index + expand orchestration
   ═══════════════════════════════════════════════════════ */
interface NoticeBoardProps {
  theme: CMLTheme;
  onDetailChange?: (open: boolean) => void;
}

export function NoticeBoard({ theme, onDetailChange }: NoticeBoardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { items: allNotices, loading } = useNotices();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<{
    n: NoticeItem;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const [shown, setShown] = useState(false);
  const [vis, setVis] = useState(false);

  // entrance animation
  useEffect(() => {
    const a = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVis(true))
    );
    const fb = setTimeout(() => setVis(true), 400);
    return () => {
      cancelAnimationFrame(a);
      clearTimeout(fb);
    };
  }, []);

  const list = allNotices.filter((n) => {
    if (filter === "all") return true;
    // time-based filters
    if (filter === "today" || filter === "this-week" || filter === "earlier") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const pubDate = new Date(n.publishedAt);
      const pubDay = new Date(pubDate.getFullYear(), pubDate.getMonth(), pubDate.getDate());
      const dayMs = 86400000;

      if (filter === "today") {
        return pubDay.getTime() === todayStart.getTime();
      }
      if (filter === "this-week") {
        const weekAgo = new Date(todayStart.getTime() - 6 * dayMs);
        return pubDay >= weekAgo && pubDay <= todayStart;
      }
      // earlier = older than 7 days
      const weekAgo = new Date(todayStart.getTime() - 6 * dayMs);
      return pubDay < weekAgo;
    }
    // group-based filters
    return n.group === filter;
  });

  const openNotice = useCallback(
    (n: NoticeItem, el: HTMLButtonElement) => {
      const root = rootRef.current;
      if (!root) return;
      const rr = root.getBoundingClientRect();
      const cr = el.getBoundingClientRect();
      setOpen({
        n,
        rect: {
          top: cr.top - rr.top,
          left: cr.left - rr.left,
          width: cr.width,
          height: cr.height,
        },
      });
      setShown(false);
      onDetailChange?.(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setShown(true))
      );
    },
    [onDetailChange]
  );

  const close = useCallback(() => {
    setShown(false);
    setTimeout(() => {
      setOpen(null);
      onDetailChange?.(false);
    }, 440);
  }, [onDetailChange]);

  const t = open ? NOTICE_TINTS[open.n.tint] : null;
  const geom: React.CSSProperties = open
    ? shown
      ? {
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: 0,
        }
      : {
          top: open.rect.top,
          left: open.rect.left,
          width: open.rect.width,
          height: open.rect.height,
          borderRadius: 26,
        }
    : {};

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
    >
      {/* ── INDEX scroll ── */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pt-[54px] pb-[112px] scrollbar-hide">
        {/* header */}
        <div className="px-5">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="font-[family-name:var(--font-poppins)] font-semibold text-[30px] tracking-[-0.5px] m-0"
                style={{ color: COLORS.text }}
              >
                Notice Board
              </h1>
              <p className="mt-1 mb-0 text-[13.5px]" style={{ color: COLORS.sub }}>
                Announcements &amp; updates for your unit
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
            {NOTICE_FILTERS.map((f) => {
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

          {/* count row */}
          <div className="flex items-baseline justify-between mt-6 mb-3.5">
            <h3
              className="font-[family-name:var(--font-poppins)] font-semibold text-[18px] tracking-[-0.3px] m-0"
              style={{ color: COLORS.text }}
            >
              Latest
            </h3>
            <span className="text-[13px]" style={{ color: COLORS.faint }}>
              <b
                className="font-[family-name:var(--font-poppins)] text-[19px] font-bold"
                style={{ color: COLORS.text }}
              >
                {list.length}
              </b>{" "}
              notices
            </span>
          </div>
        </div>

        {/* stacked deck */}
        <div className="px-5">
          {loading ? (
            <div
              className="flex items-center justify-center py-16 rounded-2xl"
              style={{
                background: theme.card.background,
                border: theme.card.border,
                backdropFilter: theme.card.backdropFilter,
              }}
            >
              <Loader2 size={24} color={COLORS.purple} className="animate-spin" />
            </div>
          ) : list.length === 0 ? (
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
                <Megaphone size={26} color={COLORS.faint} />
              </div>
              <span className="text-[13px] font-medium" style={{ color: COLORS.faint }}>
                No notices yet
              </span>
            </div>
          ) : (
            <>
              {list.map((n, i) => (
                <NoticeCard
                  key={n.id}
                  n={n}
                  idx={i}
                  first={i === 0}
                  vis={vis}
                  onOpen={openNotice}
                />
              ))}
              <div
                className="text-center text-[11.5px] py-[22px] pb-1.5"
                style={{ color: COLORS.faint }}
              >
                You&apos;re all caught up
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── EXPANDING DETAIL PANEL ── */}
      {open && t && (
        <div
          className="absolute overflow-hidden"
          style={{
            background: t.grad,
            boxShadow: "0 30px 80px rgba(36,31,77,0.35)",
            transition:
              "top .44s cubic-bezier(.5,.04,.16,1), left .44s cubic-bezier(.5,.04,.16,1), width .44s cubic-bezier(.5,.04,.16,1), height .44s cubic-bezier(.5,.04,.16,1), border-radius .44s ease",
            ...geom,
          }}
        >
          <NoticeDetail n={open.n} shown={shown} onClose={close} />
        </div>
      )}
    </div>
  );
}
