"use client";

import { motion } from "framer-motion";
import { Sparkles, Clock, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";
import { useCountdown } from "@/hooks/use-countdown";
import { useFeaturedEvent } from "@/hooks/use-featured-event";

interface HeroEventProps {
  theme: CMLTheme;
  onOpen?: () => void;
}

function CountUnit({ v, label }: { v: number; label: string }) {
  return (
    <div className="text-center flex-1">
      <div className="font-[family-name:var(--font-poppins)] font-bold text-[22px] text-white leading-none tabular-nums">
        {String(v).padStart(2, "0")}
      </div>
      <div className="text-[9.5px] text-white/70 mt-1 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function Sep() {
  return (
    <div className="text-white/45 font-bold text-lg self-center -mt-2">:</div>
  );
}

export function HeroEvent({ theme, onOpen }: HeroEventProps) {
  const { event, loading } = useFeaturedEvent();
  const { d, h, m, s } = useCountdown(event?.targetMs ?? Date.now());

  if (loading) {
    return (
      <div className="px-5 pt-3.5 pb-1 flex items-center justify-center py-10">
        <Loader2 size={24} color={COLORS.purple} className="animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="px-5 pt-3.5 pb-1"
    >
      <div
        className="relative overflow-hidden p-5"
        style={{
          borderRadius: theme.radius + 6,
          background: theme.heroGrad,
          boxShadow: "0 18px 44px rgba(107,70,255,0.34)",
        }}
      >
        {/* Glow blobs */}
        <div
          className="absolute rounded-full blur-md"
          style={{
            top: -50,
            right: -30,
            width: 160,
            height: 160,
            background: "rgba(255,255,255,0.18)",
          }}
        />
        <div
          className="absolute rounded-full blur-lg"
          style={{
            bottom: -60,
            left: -40,
            width: 150,
            height: 150,
            background: "rgba(245,197,66,0.22)",
          }}
        />

        {/* Badge row */}
        <div className="relative flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-poppins)] font-bold text-[11px] px-[11px] py-1.5 rounded-full"
            style={{
              background: COLORS.gold,
              color: "#5a3d00",
              boxShadow: "0 4px 12px rgba(245,197,66,0.4)",
            }}
          >
            <Sparkles size={13} fill="#5a3d00" color="#5a3d00" />
            FEATURED EVENT
          </span>
          <span
            className="font-[family-name:var(--font-poppins)] font-bold text-[14px] px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.22)",
              color: "#fff",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {event.date}
          </span>
        </div>

        {/* Title */}
        <h2 className="relative font-[family-name:var(--font-anek)] font-bold text-[27px] text-white mt-3.5 mb-0 leading-tight tracking-tight">
          {event.title}
        </h2>

        {/* Meta */}
        <div className="relative flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {[
            { icon: Clock, text: event.time },
            ...(event.location
              ? [{ icon: MapPin, text: event.location }]
              : []),
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 text-white/[0.92] text-[13px]"
            >
              <Icon size={15} color="rgba(255,255,255,0.92)" />
              {text}
            </span>
          ))}
        </div>

        {/* Countdown */}
        <div
          className="relative mt-4 flex gap-1.5 rounded-2xl py-3 px-2"
          style={{
            background: "rgba(255,255,255,0.14)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <CountUnit v={d} label="Days" />
          <Sep />
          <CountUnit v={h} label="Hrs" />
          <Sep />
          <CountUnit v={m} label="Min" />
          <Sep />
          <CountUnit v={s} label="Sec" />
        </div>

    
      </div>
    </motion.div>
  );
}
