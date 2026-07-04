"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ParticleField } from "./particle-field";
import { PhoneMockup } from "./phone-mockup";
import { Fireworks } from "./fireworks";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Module-scope handle so any section can request a smooth scroll through the
// shared Lenis instance (e.g. "skip the intro" double-click on the arrival logo).
let lenisInstance: Lenis | null = null;
function lenisScrollTo(target: number | HTMLElement, opts?: { duration?: number; offset?: number }) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { duration: opts?.duration ?? 1.6, offset: opts?.offset });
  } else if (typeof window !== "undefined") {
    const y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY + (opts?.offset ?? 0);
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

// One continuous cinematic dolly from current position to the very bottom of
// the page. Default duration matches the spec (~1m 15s). Uses an ease-in-out
// curve so the camera accelerates softly out of "Arrival" and decelerates
// into the Final CTAs — no jerky stop/start, no pit stops.
const TOUR_DURATION_SEC = 75;
const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

let tourRunning = false;
function startCinematicTour() {
  if (tourRunning || typeof window === "undefined") return;
  tourRunning = true;
  const bottom = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );

  const finish = () => { tourRunning = false; };
  if (lenisInstance) {
    lenisInstance.scrollTo(bottom, {
      duration: TOUR_DURATION_SEC,
      easing: easeInOutSine,
      onComplete: finish,
    });
  } else {
    // Native fallback (no smooth-easing control beyond browser default)
    window.scrollTo({ top: bottom, behavior: "smooth" });
    setTimeout(finish, TOUR_DURATION_SEC * 1000);
  }
}

// ─── Smooth scroll provider ──────────────────────────────────────────────────
// Lenis drives a virtual scroll; GSAP's ticker is bound to it so ScrollTrigger
// fires in sync. Without that wiring, pinned/scrub sections jitter.
function useLenisScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisInstance = lenis;
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
    };
  }, []);
}

// ─── Reusable helpers ────────────────────────────────────────────────────────
const COLORS = {
  ink: "#05030F",
  surface: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.14)",
  textPrimary: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.65)",
  purple: "#A78BFA",
  lavender: "#C4B5FD",
  blue: "#60A5FA",
  gold: "#F5C542",
};

function Eyebrow({ children, color = COLORS.gold }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "6px 12px", borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, boxShadow: `0 0 12px ${color}` }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.textMuted }}>
        {children}
      </span>
    </div>
  );
}

function Headline({ children, size = 64, gradient = false }: { children: ReactNode; size?: number; gradient?: boolean }) {
  return (
    <h2
      style={{
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        fontWeight: 700,
        margin: 0,
        background: gradient
          ? "linear-gradient(180deg, #FFF 0%, #C4B5FD 60%, #A78BFA 100%)"
          : undefined,
        WebkitBackgroundClip: gradient ? "text" : undefined,
        WebkitTextFillColor: gradient ? "transparent" : undefined,
        color: gradient ? undefined : "#fff",
      }}
    >
      {children}
    </h2>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 18, lineHeight: 1.6, color: COLORS.textMuted, maxWidth: 620, margin: 0 }}>
      {children}
    </p>
  );
}

// ─── Top nav (minimal, fades in after first scroll) ──────────────────────────
function TopNav() {
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "18px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(5,3,15,0.6), rgba(5,3,15,0))",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Image src="/launch/cml_logo.png" alt="CML" width={28} height={28} style={{ borderRadius: 6 }} />
        <span style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>CML Kalpetta</span>
      </div>
      <Link
        href="/"
        style={{
          fontSize: 13, fontWeight: 600,
          padding: "8px 16px", borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#fff", textDecoration: "none",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        Enter Platform →
      </Link>
    </div>
  );
}

// ─── 1. ARRIVAL ──────────────────────────────────────────────────────────────
function ArrivalSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const scale  = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1.05, 0.2]);
  const glow   = useTransform(scrollYProgress, [0, 1], [0.5, 1.3]);
  const exploded = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  const line1 = useTransform(scrollYProgress, [0.10, 0.20, 0.30], [0, 1, 1]);
  const line2 = useTransform(scrollYProgress, [0.30, 0.40, 0.55], [0, 1, 1]);
  const line3 = useTransform(scrollYProgress, [0.55, 0.65, 0.80], [0, 1, 1]);

  return (
    <section ref={ref} style={{ position: "relative", height: "300vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Fireworks — fire once on mount, yellow + red, alongside the logo's
            continuous float/particle loops */}
        <Fireworks />

        {/* logo — double-click runs the cinematic guided tour (~70s, with
            small pit stops at every section) */}
        <motion.div
          onDoubleClick={() => { startCinematicTour(); }}
          title="Double-click to play the guided tour"
          style={{ position: "relative", scale, rotate, cursor: "pointer", userSelect: "none", filter: useTransform(glow, (v) => `drop-shadow(0 0 ${30 * v}px rgba(167,139,250,${0.5 * v}))`) }}
        >
          <motion.div
            style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.18)", boxShadow: "0 0 80px rgba(167,139,250,0.45)" }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image src="/launch/cml_logo.png" alt="CML" width={200} height={200} style={{ width: "100%", height: "100%", objectFit: "cover" }} priority />
          </motion.div>
          {/* particles emanating */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              style={{
                position: "absolute", left: "50%", top: "50%",
                width: 4, height: 4, borderRadius: 999, background: i % 3 === 0 ? COLORS.gold : COLORS.purple,
                marginLeft: -2, marginTop: -2, pointerEvents: "none",
                filter: "blur(0.5px)",
              }}
              animate={{
                x: [0, Math.cos((i / 12) * Math.PI * 2) * 160],
                y: [0, Math.sin((i / 12) * Math.PI * 2) * 160],
                opacity: [0.9, 0],
              }}
              transition={{ duration: 2.8, repeat: Infinity, delay: (i / 12) * 2.8, ease: "easeOut" }}
            />
          ))}
        </motion.div>

        {/* Org name + "Presents" — persistent banner below the logo (not overlapping it).
            Each character of the org name gets its own flame-flicker animation. */}
        <style>{`
          .flame-char {
            display: inline-block;
            white-space: pre;
            color: #FFF3C4;
            animation: flameFlicker 0.7s ease-in-out infinite;
          }
          @keyframes flameFlicker {
            0%, 100% { text-shadow: 0 -1px 4px #FFEB3B, 0 -4px 10px #FFA000, 0 -8px 18px #FF5722, 0 -12px 26px #E64A19; }
            50%      { text-shadow: 0 -2px 6px #FFEB3B, 0 -6px 14px #FFA000, 0 -10px 22px #FF5722, 0 -14px 30px #E64A19; }
          }
        `}</style>
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: "calc(50% + 130px)",
            textAlign: "center", pointerEvents: "none", padding: "0 24px", zIndex: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "0.15em" }}>
              {"CHERUPUSHPA MISSION LEAGUE KALPETTA MEGHALA".split(" ").map((word, wi) => (
                <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.3em" }}>
                  {word.split("").map((ch, i) => (
                    <span key={i} className="flame-char" style={{ animationDelay: `${(i % 6) * 0.09}s` }}>
                      {ch}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            <motion.div
              style={{
                marginTop: 10, fontSize: 34, fontWeight: 800, letterSpacing: "0.05em",
                backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, #fff7c2 50%, ${COLORS.gold} 100%)`,
                backgroundSize: "220% 100%",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
              animate={{ backgroundPositionX: ["0%", "120%"] }}
              transition={{ duration: 1.6, delay: 0.3, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
            >
              Presents
            </motion.div>
          </motion.div>
        </div>

        {/* Text reveal */}
        <div style={{ position: "absolute", bottom: "16vh", left: 0, right: 0, textAlign: "center" }}>
          <RevealLine opacity={line1}>One Mission</RevealLine>
          <RevealLine opacity={line2}>One Community</RevealLine>
          <RevealLine opacity={line3}>One Platform</RevealLine>
        </div>

        {/* Explosion overlay — appears at end of section */}
        <motion.div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: useTransform(exploded, (v) => `radial-gradient(circle at center, rgba(255,255,255,${0.65 * v}), rgba(167,139,250,${0.3 * v}) 30%, transparent 70%)`),
          }}
        />
      </div>
    </section>
  );
}

function RevealLine({ children, opacity }: { children: ReactNode; opacity: MotionValue<number> }) {
  const y = useTransform(opacity, [0, 1], [12, 0]);
  return (
    <motion.div
      style={{
        opacity, y,
        fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em",
        lineHeight: 1.15,
        background: "linear-gradient(180deg, #FFF, #C4B5FD)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── 1.5  PATRON SAINTS REVEAL ───────────────────────────────────────────────
// Bridge between the arrival explosion and the product ecosystem. Four beams
// emerge from the logo position, become glass-framed portraits, float, orbit
// briefly, then merge back into a single gold beam that fades into the next
// section. Drop real PNGs at /public/launch/saints/<slug>.png — see README.txt.
interface Saint {
  name: string;
  slug: string;
  hue: string; // halo tint
}
const SAINTS: Saint[] = [
  { name: "St. Thomas",            slug: "st-thomas",          hue: "#7C5CFF" },
  { name: "St. Francis Xavier",    slug: "st-francis-xavier",  hue: "#60A5FA" },
  { name: "St. Alphonsa",          slug: "st-alphonsa",        hue: "#F5A742" },
  { name: "St. Thérèse of Lisieux",slug: "st-therese",         hue: "#F472B6" },
];

// Layout positions, all relative to the centered sticky viewport. The X axis
// uses clamp() so the constellation breathes on narrow screens without
// breaking the symmetry.
const constellation: { x: string; y: number }[] = [
  { x: "clamp(-360px, -28vw, -200px)", y: -10 },
  { x: "clamp(-130px, -10vw, -80px)",  y: -90 },
  { x: "clamp(80px, 10vw, 130px)",     y: -90 },
  { x: "clamp(200px, 28vw, 360px)",    y: -10 },
];
// Orbit positions: cardinal points at 230px radius around the logo.
const orbit = [
  { x: 0,    y: -230 },
  { x: 230,  y: 0    },
  { x: 0,    y: 230  },
  { x: -230, y: 0    },
];

function SaintFrame({
  saint, idx, progress,
}: { saint: Saint; idx: number; progress: MotionValue<number> }) {
  // Phase boundaries (each saint staggers slightly so they don't all pop at once)
  const stagger = idx * 0.04;
  const emerge   = [0.00 + stagger, 0.16 + stagger];
  const settle   = [0.16 + stagger, 0.32 + stagger];
  const nameIn   = [0.30 + stagger, 0.44 + stagger];
  const toOrbit  = [0.58, 0.78];
  const merge    = [0.86, 0.98];

  // Opacity & scale lifecycle
  const opacity = useTransform(progress, [0, emerge[0], emerge[1], 0.85, merge[1]], [0, 0.2, 1, 1, 0]);
  const scale   = useTransform(progress, [emerge[0], settle[1], toOrbit[1], merge[1]], [0.3, 1, 1, 0.4]);
  const nameO   = useTransform(progress, [nameIn[0], nameIn[1], toOrbit[0], toOrbit[1]], [0, 1, 1, 0]);

  // Position lerp:  start (center 0,0) → constellation → orbit → center
  const cx = constellation[idx].x;
  const cy = constellation[idx].y;
  const ox = orbit[idx].x;
  const oy = orbit[idx].y;

  const x = useTransform(progress, [emerge[0], settle[0], toOrbit[0], toOrbit[1], merge[1]],
    ["0px", cx, cx, `${ox}px`, "0px"]);
  const y = useTransform(progress, [emerge[0], settle[0], toOrbit[0], toOrbit[1], merge[1]],
    [0, cy, cy, oy, 0]);

  // Independent gentle float (looped, scroll-agnostic)
  const floatY = useRef(0);
  useEffect(() => { floatY.current = idx; }, [idx]);

  return (
    <motion.div
      style={{
        position: "absolute", left: "50%", top: "50%",
        x, y, opacity, scale,
        translateX: "-50%", translateY: "-50%",
        willChange: "transform, opacity",
        pointerEvents: "none",
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5 + idx * 0.4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
        style={{ position: "relative" }}
      >
        {/* Soft halo */}
        <div
          style={{
            position: "absolute", inset: -36, borderRadius: 28,
            background: `radial-gradient(60% 60% at 50% 50%, ${saint.hue}55, ${saint.hue}00 70%)`,
            filter: "blur(4px)",
            pointerEvents: "none",
          }}
        />
        {/* Glass frame */}
        <div
          style={{
            position: "relative",
            width: 168, height: 220,
            borderRadius: 20,
            padding: 6,
            background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: `0 24px 60px ${saint.hue}40, 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 30px ${saint.hue}33 inset`,
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
          }}
        >
          <div
            style={{
              position: "relative", width: "100%", height: "100%",
              borderRadius: 16, overflow: "hidden",
              background: `linear-gradient(160deg, ${saint.hue}, #1A1130)`,
            }}
          >
            <Image
              src={`/launch/saints/${saint.slug}.png`}
              alt={saint.name}
              fill
              sizes="168px"
              style={{ objectFit: "cover" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            {/* Top-light shimmer particles */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span
                key={i}
                style={{
                  position: "absolute", width: 3, height: 3, borderRadius: 999,
                  background: i % 2 === 0 ? "#F5C542" : "#fff",
                  boxShadow: i % 2 === 0 ? "0 0 8px #F5C542" : "0 0 6px #fff",
                  top: `${20 + (i * 13) % 60}%`,
                  left: `${(i * 19 + 12) % 84}%`,
                }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
                transition={{ duration: 2.2 + i * 0.35, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
            {/* Gold rim glow */}
            <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 30px rgba(245,197,66,0.15)", borderRadius: 16, pointerEvents: "none" }} />
          </div>
        </div>
        {/* Name */}
        <motion.div
          style={{
            opacity: nameO,
            position: "absolute", left: "50%", top: "100%",
            transform: "translateX(-50%)",
            marginTop: 14, whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(5,3,15,0.55)",
              border: `1px solid ${saint.hue}55`,
              backdropFilter: "blur(10px)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "#fff",
              boxShadow: `0 6px 16px ${saint.hue}33`,
            }}
          >
            {saint.name}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function SaintsRevealSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Beam emission window
  const beamLen = useTransform(scrollYProgress, [0, 0.14], [0, 240]);
  const beamOp  = useTransform(scrollYProgress, [0, 0.06, 0.18], [0, 1, 0]);
  // Returning CML logo at center — visible through orbit, fades before merge expand
  const logoOp = useTransform(scrollYProgress, [0.5, 0.62, 0.92, 1], [0, 1, 1, 0]);
  const logoScale = useTransform(scrollYProgress, [0.5, 0.62], [0.7, 1]);
  // Final merge: gold radial expands and fades out
  const mergeScale = useTransform(scrollYProgress, [0.86, 1], [0.3, 4]);
  const mergeOp    = useTransform(scrollYProgress, [0.86, 0.94, 1], [0, 1, 0]);
  // Headline appears once the constellation is in place, leaves before orbit
  const headlineOp = useTransform(scrollYProgress, [0.30, 0.42, 0.55, 0.62], [0, 1, 1, 0]);

  return (
    <section ref={ref} style={{ position: "relative", height: "250vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Background spotlight */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 50% at 50% 50%, rgba(245,197,66,0.10), rgba(0,0,0,0) 70%)" }} />

        {/* 4 beams of light emerging from center */}
        {SAINTS.map((s, i) => {
          const angle = (i / 4) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
          return (
            <motion.div
              key={s.slug}
              style={{
                position: "absolute", left: "50%", top: "50%",
                width: 2, height: beamLen,
                background: `linear-gradient(180deg, ${s.hue}, ${s.hue}00)`,
                boxShadow: `0 0 12px ${s.hue}`,
                transformOrigin: "top center",
                transform: `rotate(${angle}rad)`,
                opacity: beamOp,
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* CML logo at the center (returns mid-section for orbit) */}
        <motion.div
          style={{
            position: "absolute", left: "50%", top: "50%",
            translateX: "-50%", translateY: "-50%",
            width: 120, height: 120, borderRadius: "50%",
            overflow: "hidden", border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 0 60px rgba(167,139,250,0.55)",
            opacity: logoOp, scale: logoScale,
            zIndex: 1,
          }}
        >
          <Image src="/launch/cml_logo.png" alt="CML" width={120} height={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>

        {/* 4 saint frames */}
        {SAINTS.map((s, i) => (
          <SaintFrame key={s.slug} saint={s} idx={i} progress={scrollYProgress} />
        ))}

        {/* Headline (visible while constellation is settled) */}
        <motion.div
          style={{
            position: "absolute", left: 0, right: 0, top: "10vh",
            textAlign: "center", padding: "0 24px", opacity: headlineOp, pointerEvents: "none",
          }}
        >
          <Eyebrow>Our Patron Saints</Eyebrow>
          <div style={{ marginTop: 14 }}>
            <Headline size={48} gradient>Carried By Their Light</Headline>
          </div>
        </motion.div>

        {/* Final merge: gold radial expands as the saints converge */}
        <motion.div
          style={{
            position: "absolute", left: "50%", top: "50%",
            translateX: "-50%", translateY: "-50%",
            width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,235,180,0.95), rgba(245,197,66,0.45) 40%, rgba(124,58,237,0) 80%)",
            opacity: mergeOp, scale: mergeScale,
            filter: "blur(2px)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      </div>
    </section>
  );
}

// ─── 1.6  JESUS & THE LITTLE LAMB ────────────────────────────────────────────
// A pastel meadow scene that picks up from the Saints' gold light merge. Jesus
// settles in center, a small lamb walks in from the left, and four Malayalam
// virtues (സ്‌നേഹം → ത്യാഗം → സേവനം → സഹനം) bloom + dissolve in sequence,
// before the whole scene swirls into a beam that hands off to the Ecosystem.
//
// Optional images (graceful gradient fallback when missing):
//   /launch/jesus.png       — Jesus sitting (portrait crop)
//   /launch/lamb.png        — Lamb alone (transparent bg ideal)
//   /launch/meadow.png      — Background pattern (optional; CSS pattern used otherwise)

// Small SVG butterfly with wing-flap keyframes
function Butterfly({ x, y, scale = 1, delay = 0, color = "#F9B57D" }: { x: string; y: string; scale?: number; delay?: number; color?: string }) {
  return (
    <motion.div
      style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, willChange: "transform" }}
      animate={{ x: [0, 12, -8, 0], y: [0, -10, 6, 0] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden>
        <g>
          <ellipse cx="10" cy="10" rx="9" ry="11" fill={color} opacity="0.85">
            <animateTransform attributeName="transform" type="scale" values="1 1;0.6 1;1 1" dur="0.55s" repeatCount="indefinite" additive="sum" />
          </ellipse>
          <ellipse cx="26" cy="10" rx="9" ry="11" fill={color} opacity="0.85">
            <animateTransform attributeName="transform" type="scale" values="1 1;0.6 1;1 1" dur="0.55s" repeatCount="indefinite" additive="sum" />
          </ellipse>
          <ellipse cx="11" cy="18" rx="7" ry="8" fill={color} opacity="0.7" />
          <ellipse cx="25" cy="18" rx="7" ry="8" fill={color} opacity="0.7" />
          <rect x="17" y="6" width="2" height="18" rx="1" fill="#3a2615" />
        </g>
      </svg>
    </motion.div>
  );
}

// Background flower (used as scattered ornament)
function MeadowFlower({ x, y, size = 22, color = "#F4C8D6", delay = 0 }: { x: string; y: string; size?: number; color?: string; delay?: number }) {
  return (
    <motion.div
      style={{ position: "absolute", left: x, top: y, width: size, height: size, opacity: 0.7 }}
      animate={{ rotate: [0, 8, -4, 0], y: [0, -3, 0] }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <ellipse key={i} cx={12 + Math.cos(a) * 5} cy={12 + Math.sin(a) * 5} rx="4" ry="6" fill={color}
              transform={`rotate(${(a * 180) / Math.PI} ${12 + Math.cos(a) * 5} ${12 + Math.sin(a) * 5})`} />
          );
        })}
        <circle cx="12" cy="12" r="2.2" fill="#F5C542" />
      </svg>
    </motion.div>
  );
}

// Petal burst around a word during bloom/dissolve
function PetalBurst({ active, hue }: { active: boolean; hue: string }) {
  return (
    <>
      {active && Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 80 + (i % 3) * 30;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
            animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r - 10, opacity: [0, 1, 0], scale: [0.4, 1, 0.6], rotate: [0, 180] }}
            transition={{ duration: 1.8, ease: "easeOut", delay: i * 0.04 }}
            style={{
              position: "absolute", left: "50%", top: "50%",
              width: 8, height: 12, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              background: `linear-gradient(135deg, ${hue}, #fff7c2)`,
              boxShadow: `0 0 8px ${hue}`,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
}

// `hue` drives halo/petals/glow (stays pastel for that ethereal feel).
// `ink` is the saturated end of the text gradient so the word reads cleanly
// against the pastel meadow.
const VIRTUES = [
  { ml: "സ്‌നേഹം", glyph: "❤️", hue: "#F472B6", ink: "#9D174D" }, // crimson rose
  { ml: "ത്യാഗം",  glyph: "✨", hue: "#F5C542", ink: "#92400E" }, // burnt amber
  { ml: "സേവനം",  glyph: "🌿", hue: "#86D2B2", ink: "#14532D" }, // deep emerald
  { ml: "സഹനം",   glyph: "🌸", hue: "#E89BBC", ink: "#6B21A8" }, // royal violet
];

function JesusLambSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Background pour-in (picks up from the saints' gold light)
  const meadowOp     = useTransform(scrollYProgress, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);
  const goldOverlay  = useTransform(scrollYProgress, [0, 0.10], [1, 0]);

  // Jesus reveal
  const jesusOp      = useTransform(scrollYProgress, [0.06, 0.18, 0.92, 1], [0, 1, 1, 0]);
  const jesusScale   = useTransform(scrollYProgress, [0.06, 0.20], [0.85, 1]);
  const haloOp       = useTransform(scrollYProgress, [0.08, 0.22, 0.92, 1], [0, 1, 1, 0]);

  // Lamb walk-in — from off-screen-left to a resting spot just in front of
  // Jesus on the viewer's left. Jesus is centered at left:50% translateX(-50%)
  // (his left edge ≈ centre − 140 with a 280-wide container); the lamb container
  // is anchored at left:50% with no translateX, so x = -290 puts its right edge
  // ~6px to the left of Jesus's left edge — a "small distance" gap.
  const lambX        = useTransform(scrollYProgress, [0.18, 0.34], [-400, -290]);
  const lambOp       = useTransform(scrollYProgress, [0.18, 0.26, 0.92, 1], [0, 1, 1, 0]);

  // Words — staggered bloom/dissolve windows
  const wordWindows = [
    [0.36, 0.42, 0.48, 0.54],
    [0.50, 0.56, 0.62, 0.68],
    [0.62, 0.68, 0.74, 0.80],
    [0.74, 0.80, 0.86, 0.92],
  ] as const;

  // Final spiral + beam
  const spiralOp     = useTransform(scrollYProgress, [0.90, 0.96, 1], [0, 1, 0]);
  const spiralRot    = useTransform(scrollYProgress, [0.86, 1], [0, 540]);
  const spiralScale  = useTransform(scrollYProgress, [0.86, 1], [0.6, 2.6]);
  const beamScale    = useTransform(scrollYProgress, [0.94, 1], [0.4, 5]);
  const beamOp       = useTransform(scrollYProgress, [0.94, 0.98, 1], [0, 1, 0]);

  return (
    <section ref={ref} style={{ position: "relative", height: "300vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* Meadow background — pastel sky → grass */}
        <motion.div
          style={{
            position: "absolute", inset: 0, opacity: meadowOp,
            background:
              "radial-gradient(120% 80% at 50% 110%, #BFE2B7 0%, #E9F1C7 40%, #FBE7D7 65%, #F7DCE6 90%)",
          }}
        />
        {/* Soft warm sun rays from top */}
        <motion.div
          style={{
            position: "absolute", inset: "-20% -20% 50% -20%",
            opacity: meadowOp,
            background:
              "conic-gradient(from 200deg at 50% 0%, rgba(255,225,170,0.0), rgba(255,225,170,0.35) 18%, rgba(255,225,170,0.0) 34%, rgba(255,225,170,0.32) 60%, rgba(255,225,170,0) 82%)",
            filter: "blur(8px)",
            mixBlendMode: "screen",
          }}
        />

        {/* Scattered flowers (background ornament) */}
        {[
          { x: "5%", y: "10%", color: "#F4C8D6", size: 26, d: 0 },
          { x: "12%", y: "22%", color: "#FFD8A6", size: 18, d: 1.4 },
          { x: "20%", y: "8%", color: "#C7E6A4", size: 22, d: 0.8 },
          { x: "32%", y: "16%", color: "#B5D2F0", size: 18, d: 2.1 },
          { x: "78%", y: "10%", color: "#F4C8D6", size: 22, d: 0.4 },
          { x: "88%", y: "26%", color: "#FFD8A6", size: 18, d: 1.7 },
          { x: "70%", y: "20%", color: "#C7E6A4", size: 20, d: 1.1 },
          { x: "4%", y: "70%", color: "#F4C8D6", size: 24, d: 0.6 },
          { x: "14%", y: "82%", color: "#FFE0B0", size: 18, d: 1.9 },
          { x: "26%", y: "90%", color: "#C7E6A4", size: 22, d: 0.2 },
          { x: "82%", y: "82%", color: "#F4C8D6", size: 22, d: 1.3 },
          { x: "92%", y: "70%", color: "#B5D2F0", size: 20, d: 0.9 },
          { x: "62%", y: "92%", color: "#FFD8A6", size: 24, d: 1.6 },
        ].map((f, i) => (
          <motion.div key={i} style={{ opacity: meadowOp }}>
            <MeadowFlower {...f} delay={f.d} />
          </motion.div>
        ))}

        {/* Drifting bokeh */}
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={`b-${i}`}
            style={{
              position: "absolute",
              width: 80 + (i % 3) * 50, height: 80 + (i % 3) * 50,
              left: `${(i * 17 + 5) % 90}%`, top: `${(i * 23 + 15) % 70}%`,
              borderRadius: "50%",
              background: i % 2 === 0 ? "rgba(255,225,170,0.5)" : "rgba(244,200,214,0.55)",
              filter: "blur(28px)", opacity: 0.5, mixBlendMode: "screen",
            }}
            animate={{ x: [0, 24, -12, 0], y: [0, -16, 12, 0] }}
            transition={{ duration: 18 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Pollen particles */}
        {Array.from({ length: 38 }).map((_, i) => (
          <motion.span
            key={`p-${i}`}
            style={{
              position: "absolute",
              width: 3 + (i % 3), height: 3 + (i % 3),
              left: `${(i * 13 + 4) % 96}%`, top: `${(i * 29 + 8) % 92}%`,
              borderRadius: 999,
              background: i % 3 === 0 ? "#FFE7A8" : i % 3 === 1 ? "#fff" : "#F4C8D6",
              boxShadow: i % 3 === 0 ? "0 0 6px #FFE7A8" : "0 0 4px #fff",
              opacity: 0.7,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 5 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }}
          />
        ))}

        {/* Butterflies */}
        <Butterfly x="14%" y="14%" delay={0}   color="#F9B57D" />
        <Butterfly x="78%" y="22%" delay={1.3} color="#F4C8D6" />
        <Butterfly x="38%" y="38%" delay={2.4} scale={0.85} color="#FFD8A6" />

        {/* Jesus + halo — bottom-anchored so feet sit on the shared ground line */}
        <motion.div
          style={{
            position: "absolute", left: "50%", bottom: "18vh",
            translateX: "-50%",
            opacity: jesusOp, scale: jesusScale,
            willChange: "transform, opacity",
            transformOrigin: "bottom center",
          }}
        >
          {/* Halo (purely behind the figure, doesn't touch the PNG bounds) */}
          <motion.div
            style={{
              position: "absolute", left: "50%", top: -10,
              translateX: "-50%",
              width: 220, height: 220, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,235,170,0.85), rgba(245,197,66,0.35) 40%, rgba(245,197,66,0) 75%)",
              filter: "blur(2px)",
              opacity: haloOp,
              pointerEvents: "none",
              zIndex: 0,
            }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Soft elliptical ground shadow — separate element so it can't paint a box */}
          <div
            aria-hidden
            style={{
              position: "absolute", left: "50%", bottom: -6,
              transform: "translateX(-50%)",
              width: 220, height: 22,
              borderRadius: "50%",
              background: "radial-gradient(50% 50% at 50% 50%, rgba(60,40,20,0.35), rgba(60,40,20,0) 70%)",
              filter: "blur(3px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          {/* Figure — no filter, no background; pure transparent PNG */}
          <div
            style={{
              position: "relative", zIndex: 1,
              width: 280, height: 360,
            }}
          >
            <Image
              src="/launch/jesus.png" alt="Jesus" fill sizes="280px"
              style={{ objectFit: "contain", objectPosition: "bottom" }}
              priority
              unoptimized
            />
          </div>
        </motion.div>

        {/* Lamb — walks in from the left, settles on the same baseline as Jesus */}
        <motion.div
          style={{
            position: "absolute", left: "50%", bottom: "18vh",
            x: lambX, opacity: lambOp,
            willChange: "transform, opacity",
            transformOrigin: "bottom center",
          }}
        >
          <motion.div
            animate={{ y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "bottom center" }}
          >
            {/* Lamb ground shadow — separate element so it can't paint a box */}
            <div
              aria-hidden
              style={{
                position: "absolute", left: "50%", bottom: -4,
                transform: "translateX(-50%)",
                width: 110, height: 14,
                borderRadius: "50%",
                background: "radial-gradient(50% 50% at 50% 50%, rgba(30,16,6,0.40), rgba(30,16,6,0) 70%)",
                filter: "blur(2px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            {/* Figure — no filter, no background; pure transparent PNG */}
            <div
              style={{
                position: "relative", zIndex: 1,
                width: 150, height: 150,
              }}
            >
              <Image
                src="/launch/lamb.png" alt="Lamb" fill sizes="150px"
                style={{ objectFit: "contain", objectPosition: "bottom" }}
                unoptimized
              />
            </div>
            {/* Heart bubble */}
            <motion.div
              style={{
                position: "absolute", top: -6, right: -2, fontSize: 18,
                filter: "drop-shadow(0 4px 8px rgba(220,80,120,0.4))",
              }}
              animate={{ y: [0, -4, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              💗
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Malayalam virtue words */}
        {VIRTUES.map((v, i) => (
          <VirtueWord key={v.ml} word={v} idx={i} windows={wordWindows[i]} progress={scrollYProgress} />
        ))}

        {/* Final swirl spiral */}
        <motion.div
          style={{
            position: "absolute", left: "50%", top: "50%",
            translateX: "-50%", translateY: "-50%",
            width: 360, height: 360, borderRadius: "50%",
            opacity: spiralOp, scale: spiralScale, rotate: spiralRot,
            background:
              "conic-gradient(from 0deg, rgba(245,197,66,0) 0%, rgba(245,197,66,0.6) 10%, rgba(244,114,182,0.55) 28%, rgba(134,210,178,0.5) 50%, rgba(245,197,66,0.6) 75%, rgba(245,197,66,0) 100%)",
            filter: "blur(6px)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        {/* Beam handoff */}
        <motion.div
          style={{
            position: "absolute", left: "50%", top: "50%",
            translateX: "-50%", translateY: "-50%",
            width: 360, height: 360, borderRadius: "50%",
            opacity: beamOp, scale: beamScale,
            background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(245,197,66,0.5) 35%, rgba(124,58,237,0) 80%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Gold overlay from previous section's merge — fades as meadow pours in */}
        <motion.div
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(50% 50% at 50% 50%, rgba(255,235,180,1), rgba(245,197,66,0.5) 40%, rgba(124,58,237,0) 80%)",
            opacity: goldOverlay, pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}

function VirtueWord({
  word, idx, windows, progress,
}: {
  word: typeof VIRTUES[number];
  idx: number;
  windows: readonly [number, number, number, number];
  progress: MotionValue<number>;
}) {
  const [bloomStart, bloomEnd, holdEnd, vanish] = windows;
  const op    = useTransform(progress, [bloomStart, bloomEnd, holdEnd, vanish], [0, 1, 1, 0]);
  const scale = useTransform(progress, [bloomStart, bloomEnd, holdEnd, vanish], [0.4, 1, 1.05, 1.6]);
  const blur  = useTransform(progress, [bloomStart, bloomEnd, holdEnd, vanish], [14, 0, 0, 10]);
  const y     = useTransform(progress, [bloomStart, bloomEnd, holdEnd, vanish], [30, 0, -8, -60]);

  // Spawn petal burst around the bloom + dissolve boundaries
  const [active, setActive] = useState(false);
  useEffect(() => {
    return progress.on("change", (v) => {
      const inBloom   = v >= bloomStart && v < bloomEnd + 0.02;
      const inVanish  = v >= holdEnd && v < vanish + 0.02;
      setActive(inBloom || inVanish);
    });
  }, [progress, bloomStart, bloomEnd, holdEnd, vanish]);

  // Positions slightly offset per word so they don't all stack at exact center
  const offsets = [{ x: -30, y: -20 }, { x: 30, y: -30 }, { x: -25, y: 20 }, { x: 25, y: 10 }];
  const offset = offsets[idx];

  return (
    <motion.div
      style={{
        position: "absolute",
        left: `calc(50% + ${offset.x}px)`,
        top: `calc(50% + ${offset.y}px)`,
        translateX: "-50%", translateY: "-50%",
        opacity: op, scale, y,
        filter: useTransform(blur, (v) => `blur(${v}px)`),
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      <div style={{ position: "relative", textAlign: "center" }}>
        {/* Soft dark cream backdrop blob — lifts the text off the pastel meadow */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: "-30px -60px",
            background: `radial-gradient(60% 70% at 50% 50%, rgba(40,18,32,0.40), rgba(40,18,32,0.18) 50%, rgba(40,18,32,0) 80%)`,
            filter: "blur(14px)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
        {/* Soft hue glow blob behind the text */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: "-20px -40px",
            background: `radial-gradient(50% 60% at 50% 50%, ${word.hue}55, ${word.hue}00 75%)`,
            filter: "blur(10px)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
        <PetalBurst active={active} hue={word.hue} />
        <div
          style={{
            fontFamily: "var(--font-anek), var(--font-poppins), sans-serif",
            fontSize: "clamp(48px, 8vw, 96px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            background: `linear-gradient(180deg, #FFFFFF 0%, ${word.hue} 55%, ${word.ink} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            // Stronger glow + a faint dark drop for separation from the bg
            filter: `drop-shadow(0 4px 14px ${word.ink}66) drop-shadow(0 0 28px ${word.hue}99) drop-shadow(0 2px 4px rgba(0,0,0,0.35))`,
            paddingBottom: 6,
          }}
        >
          {word.ml}
        </div>
        <div
          style={{
            fontSize: 28, marginTop: 4,
            filter: `drop-shadow(0 4px 10px ${word.ink}55)`,
          }}
        >
          {word.glyph}
        </div>
      </div>
    </motion.div>
  );
}

// ─── 2. DIGITAL ECOSYSTEM ────────────────────────────────────────────────────
function EcosystemSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [180, -260]);
  const y3 = useTransform(scrollYProgress, [0, 1], [-80, 220]);

  return (
    <section ref={ref} style={{ position: "relative", height: "250vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "0 24px" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {/* Three floating mockups at different depths */}
          <motion.div style={{ position: "absolute", left: "8%", y: y2, scale: 0.7, opacity: 0.55 }}>
            <PhoneMockup src="/launch/notices.png" label="Notices" tint="gold" width={210} />
          </motion.div>
          <motion.div style={{ position: "absolute", right: "8%", y: y3, scale: 0.75, opacity: 0.6 }}>
            <PhoneMockup src="/launch/media.png" label="Media" tint="blue" width={220} />
          </motion.div>
          <motion.div style={{ position: "relative", y: y1, scale: 1, zIndex: 2 }}>
            <PhoneMockup src="/launch/home.png" label="Home" tint="purple" width={280} />
          </motion.div>
        </div>

        <div style={{ position: "relative", zIndex: 3, textAlign: "center", maxWidth: 760 }}>
          <Eyebrow>Digital Ecosystem</Eyebrow>
          <Headline size={64} gradient>Everything Your Unit Needs</Headline>
          <div style={{ marginTop: 18, display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", color: COLORS.textMuted, fontSize: 16 }}>
            {["Activities", "Formation", "Media", "Communication", "Feast Management"].map((t) => (
              <span key={t} style={{ padding: "8px 14px", borderRadius: 999, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Generic "phone right, copy left" feature section ────────────────────────
function FeatureSection({
  eyebrow, headline, sub, bullets, screen, label, tint = "purple", reverse = false, height = "200vh",
}: {
  eyebrow: string;
  headline: ReactNode;
  sub: ReactNode;
  bullets: string[];
  screen?: string;
  label?: string;
  tint?: "purple" | "pink" | "gold" | "blue";
  reverse?: boolean;
  height?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const phoneRot = useTransform(scrollYProgress, [0, 1], [reverse ? 6 : -6, reverse ? -6 : 6]);

  return (
    <section ref={ref} style={{ position: "relative", height }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, maxWidth: 1100, width: "100%", alignItems: "center", direction: reverse ? "rtl" : "ltr" }}>
          <div style={{ direction: "ltr" }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <div style={{ marginTop: 18 }}>
              <Headline size={54} gradient>{headline}</Headline>
            </div>
            <div style={{ marginTop: 20 }}>
              <Sub>{sub}</Sub>
            </div>
            <ul style={{ marginTop: 28, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
              {bullets.map((b) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 16, color: COLORS.textPrimary }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(167,139,250,0.16)", color: COLORS.purple, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>✓</span>
                  {b}
                </motion.li>
              ))}
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "center", direction: "ltr" }}>
            <motion.div style={{ y: phoneY, rotate: phoneRot }}>
              <PhoneMockup src={screen} label={label} tint={tint} width={300} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 5. NOTICE BOARD (custom: notification particles) ────────────────────────
function NoticeSection() {
  return (
    <section style={{ position: "relative", height: "150vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px" }}>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 940, width: "100%", textAlign: "center" }}>
        <Eyebrow>Notices</Eyebrow>
        <div style={{ marginTop: 18 }}>
          <Headline size={58} gradient>Instant Communication</Headline>
        </div>
        <div style={{ marginTop: 14 }}>
          <Sub>Every announcement reaches everyone — pinned, prioritized, persistent.</Sub>
        </div>

        <div style={{ position: "relative", marginTop: 60, height: 360, display: "flex", justifyContent: "center" }}>
          {[
            { delay: 0,    bg: "#A78BFA", label: "ശാഖയിൽ നിന്നും", priority: "Urgent" },
            { delay: 0.1,  bg: "#F5C542", label: "Notice from Council", priority: "High" },
            { delay: 0.2,  bg: "#60A5FA", label: "Formation update", priority: "General" },
          ].map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 80, rotate: -8 + i * 6, scale: 0.9 }}
              whileInView={{ opacity: 1, y: i * 14, rotate: -6 + i * 6, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: n.delay, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                position: "absolute", left: `${30 + i * 6}%`, top: 0,
                width: 320, padding: 18, borderRadius: 18,
                background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.14)`,
                backdropFilter: "blur(20px)", textAlign: "left",
                boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px ${n.bg}33 inset`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: n.bg, boxShadow: `0 0 14px ${n.bg}` }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>{n.priority}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{n.label}</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6 }}>Tap to view details</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 6. MEDIA CENTER (sound waves + reels) ───────────────────────────────────
function MediaSection() {
  return (
    <section style={{ position: "relative", height: "200vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px" }}>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1080, width: "100%", textAlign: "center" }}>
        <Eyebrow>Media Center</Eyebrow>
        <div style={{ marginTop: 18 }}>
          <Headline size={58} gradient>Formation Beyond Meetings</Headline>
        </div>
        <div style={{ marginTop: 14 }}>
          <Sub>Listen. Watch. Learn. Grow.</Sub>
        </div>

        {/* Animated waveform */}
        <div style={{ marginTop: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 120 }}>
          {Array.from({ length: 48 }).map((_, i) => (
            <motion.span
              key={i}
              style={{ width: 4, borderRadius: 4, background: i % 5 === 0 ? COLORS.gold : COLORS.purple }}
              animate={{ height: [10, 40 + Math.random() * 60, 20, 80, 14] }}
              transition={{ duration: 1.6 + (i % 5) * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
            />
          ))}
        </div>

        <div style={{ marginTop: 60, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {["Listen", "Watch", "Learn", "Grow"].map((w, i) => (
            <motion.div
              key={w}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{
                padding: "20px 28px", borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 18, fontWeight: 600,
                backdropFilter: "blur(14px)",
                minWidth: 130,
              }}
            >
              {w}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 7. FEAST HERO (big stage + counters) ────────────────────────────────────
function FeastHeroSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 0.9]);
  const counters = useCountersInView(ref, [126, 26, 380]);

  return (
    <section ref={ref} style={{ position: "relative", height: "400vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "0 24px" }}>
        {/* Background environment */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 60% at 50% 40%, rgba(124,58,237,0.35), rgba(0,0,0,0) 70%), radial-gradient(40% 40% at 50% 80%, rgba(245,197,66,0.18), rgba(0,0,0,0) 70%)" }} />
        {/* Floating data dots */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            style={{ position: "absolute", left: `${(i * 37) % 100}%`, top: `${(i * 17 + 10) % 90}%`, width: 6, height: 6, borderRadius: 999, background: i % 3 === 0 ? COLORS.gold : COLORS.purple, boxShadow: `0 0 12px currentColor`, color: i % 3 === 0 ? COLORS.gold : COLORS.purple }}
            animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 1000 }}>
          <Eyebrow>Feast Management</Eyebrow>
          <div style={{ marginTop: 18 }}>
            <Headline size={72} gradient>Built For Feast Management</Headline>
          </div>
          <div style={{ marginTop: 50, display: "flex", justifyContent: "center" }}>
            <motion.div style={{ scale }}>
              <PhoneMockup src="/launch/feast.png" label="Feast Portal" tint="purple" width={340} />
            </motion.div>
          </div>
          <div style={{ marginTop: 50, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 760, marginInline: "auto" }}>
            {[
              { label: "Registrations", v: counters[0] },
              { label: "Competitions",  v: counters[1] },
              { label: "Participants",  v: counters[2] },
            ].map((c) => (
              <div key={c.label} style={{ padding: 22, borderRadius: 18, background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.border}`, backdropFilter: "blur(10px)" }}>
                <div style={{ fontSize: 38, fontWeight: 700, color: COLORS.gold, fontVariantNumeric: "tabular-nums" }}>{Math.floor(c.v).toLocaleString()}</div>
                <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.textMuted, marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Counter hook — tweens to target while section is in view
function useCountersInView(ref: React.RefObject<HTMLElement | null>, targets: number[]) {
  const [vals, setVals] = useState(targets.map(() => 0));
  useEffect(() => {
    if (!ref.current) return;
    let raf = 0;
    let start: number | null = null;
    const dur = 1800;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const step = (t: number) => {
            if (start === null) start = t;
            const k = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - k, 3);
            setVals(targets.map((tgt) => tgt * eased));
            if (k < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(ref.current);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, [ref, targets.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return vals;
}

// ─── 8. SEAMLESS REGISTRATION (step-by-step) ────────────────────────────────
function RegistrationSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const step = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 4]);
  const [active, setActive] = useState(0);
  useEffect(() => step.on("change", (v) => setActive(Math.floor(v))), [step]);

  const steps = ["Details", "Events", "Review", "Confirm"];
  const stepImages = [
    "/launch/registration-details.png",
    "/launch/registration-events.png",
    "/launch/registration-review.png",
    "/launch/registration-confirm.png",
  ];
  const activeIdx = Math.min(active, steps.length - 1);

  return (
    <section ref={ref} style={{ position: "relative", height: "350vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 48, alignItems: "center", maxWidth: 1180, width: "100%" }}>
          {/* Left copy */}
          <div>
            <Eyebrow>Workflow</Eyebrow>
            <div style={{ marginTop: 18 }}>
              <Headline size={54} gradient>Register In Under A Minute</Headline>
            </div>
            <div style={{ marginTop: 18 }}>
              <Sub>Fast. Simple. Error-Free.</Sub>
            </div>
            <div style={{ marginTop: 30, display: "grid", gap: 14 }}>
              {steps.map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 14, opacity: active >= i ? 1 : 0.35, transition: "opacity 0.3s" }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 999,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                    background: active >= i ? "linear-gradient(135deg, #A78BFA, #F5C542)" : "rgba(255,255,255,0.08)",
                    color: active >= i ? "#0B0719" : COLORS.textMuted,
                    boxShadow: active >= i ? "0 0 22px rgba(167,139,250,0.5)" : "none",
                    transition: "all 0.3s",
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phone center */}
          <div style={{ position: "relative", width: 300, height: 300 * 2.05 }}>
            <AnimatePresence>
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0 }}
              >
                <PhoneMockup src={stepImages[activeIdx]} label={steps[activeIdx]} tint="purple" width={300} />
              </motion.div>
            </AnimatePresence>
            {active >= 3 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                style={{
                  position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
                  width: 120, height: 120, borderRadius: 999,
                  background: "radial-gradient(circle, rgba(74,222,128,0.55), rgba(74,222,128,0) 70%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 44, color: "#4ADE80",
                }}
              >
                ✓
              </motion.div>
            )}
          </div>

          {/* Right details */}
          <div>
            <div style={{ padding: 22, borderRadius: 18, background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.border}`, backdropFilter: "blur(14px)" }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>Now showing</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{steps[Math.min(active, steps.length - 1)]}</div>
              <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 8, lineHeight: 1.6 }}>
                {[
                  "Name, DOB, gender — competition category auto-detected.",
                  "Tap to add events. Selections glow as you confirm.",
                  "Review every detail before you commit.",
                  "Submitted. Registration ID generated.",
                ][Math.min(active, 3)]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 9. ORGANIZER CONTROL ────────────────────────────────────────────────────
function OrganizerSection() {
  return (
    <section style={{ position: "relative", height: "250vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px" }}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <Eyebrow>For Organizers</Eyebrow>
          <div style={{ marginTop: 18 }}>
            <Headline size={56} gradient>Live Control Of Every Detail</Headline>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {[
            { title: "Participant Management", num: "126", sub: "registrations active" },
            { title: "Live Tracking",          num: "26",  sub: "competitions running" },
            { title: "House Wise Reports",     num: "8",   sub: "houses ranked" },
            { title: "Category Wise Reports",  num: "5",   sub: "categories" },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              style={{
                padding: 28, borderRadius: 20,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${COLORS.border}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <div style={{ fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.textMuted }}>{c.title}</div>
              <div style={{ marginTop: 12, fontSize: 50, fontWeight: 700, color: COLORS.gold, lineHeight: 1 }}>{c.num}</div>
              <div style={{ marginTop: 6, fontSize: 14, color: COLORS.textMuted }}>{c.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FINAL ───────────────────────────────────────────────────────────────────
function FinalSection() {
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px", textAlign: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: 880 }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "0 0 60px rgba(167,139,250,0.45)" }}>
            <Image src="/launch/cml_logo.png" alt="CML" width={90} height={90} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <Headline size={56} gradient>Cherupushpa Mission League</Headline>
        <div style={{ marginTop: 10, fontSize: 18, color: COLORS.textMuted, fontWeight: 500 }}>Kalpetta Mekhala</div>
        <div style={{ marginTop: 36, fontSize: 22, color: COLORS.lavender, fontWeight: 600, letterSpacing: "0.02em" }}>
          Mission. Formation. Community. <span style={{ color: COLORS.gold }}>Now Digital.</span>
        </div>
        <div style={{ marginTop: 50, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "16px 28px", borderRadius: 999,
            background: "linear-gradient(135deg, #6B46FF, #A78BFA)",
            color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 14px 36px rgba(107,70,255,0.45), 0 0 0 1px rgba(255,255,255,0.15) inset",
          }}>
            Enter Platform →
          </Link>
          <a href="#features" style={{
            display: "inline-flex", alignItems: "center",
            padding: "16px 28px", borderRadius: 999,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)",
            color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none",
          }}>
            Explore Features
          </a>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Root experience ─────────────────────────────────────────────────────────
export function LaunchExperience() {
  useLenisScroll();

  // Section 4 (Activities) — special-cased so timeline grows as user scrolls
  const actRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: actP } = useScroll({ target: actRef, offset: ["start end", "end start"] });
  const lineGrow = useTransform(actP, [0, 0.9], ["0%", "100%"]);
  const lineSpring = useSpring(lineGrow, { stiffness: 80, damping: 20, mass: 0.5 });

  return (
    <div style={{ position: "relative", background: COLORS.ink, color: "#fff", minHeight: "100vh" }}>
      <ParticleField />
      <TopNav />

      <ArrivalSection />
      <SaintsRevealSection />
      <JesusLambSection />
      <EcosystemSection />

      {/* 3. HOME DASHBOARD */}
      <FeatureSection
        eyebrow="Home Dashboard"
        headline="Your unit, at a glance."
        sub="Featured events, live countdowns, notice alerts, and one-tap access — every member sees what matters today."
        bullets={["Upcoming Events", "Countdown Tracking", "Quick Access", "Smart Dashboard"]}
        screen="/launch/home.png"
        label="Home"
        tint="purple"
      />

      {/* 4. ACTIVITIES TIMELINE — with growing line */}
      <section ref={actRef} style={{ position: "relative", height: "200vh" }} id="features">
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, maxWidth: 1100, width: "100%", margin: "0 auto", alignItems: "center" }}>
            <div>
              <Eyebrow>Activities</Eyebrow>
              <div style={{ marginTop: 18 }}>
                <Headline size={54} gradient>Never Miss A Mission Opportunity</Headline>
              </div>
              <div style={{ marginTop: 20 }}>
                <Sub>Formation paths, monthly activities, feast preparation and live event tracking — woven into one calendar.</Sub>
              </div>
              <ul style={{ marginTop: 28, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                {["Formation Journey", "Monthly Activities", "Feast Preparation", "Event Tracking"].map((b) => (
                  <li key={b} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 16 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(245,197,66,0.18)", color: COLORS.gold, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>★</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Growing timeline */}
            <div style={{ position: "relative", height: 460, paddingLeft: 32 }}>
              <div style={{ position: "absolute", left: 22, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
              <motion.div style={{
                position: "absolute", left: 22, top: 0, width: 2, height: lineSpring, borderRadius: 4,
                background: "linear-gradient(180deg, #A78BFA, #F5C542)",
                boxShadow: "0 0 18px rgba(167,139,250,0.7)",
              }} />
              {[
                { d: "Jul", t: "ജൂലൈ · St Thomas Foundation", tint: COLORS.purple },
                { d: "Aug", t: "ആഗസ്റ്റ് · History Pillars",     tint: COLORS.gold },
                { d: "Sep", t: "Culture Windows",                  tint: COLORS.blue },
                { d: "Oct", t: "Mission Tower",                    tint: COLORS.purple },
              ].map((it, i) => (
                <motion.div
                  key={it.t}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  style={{ position: "relative", marginBottom: 24, paddingLeft: 32 }}
                >
                  <span style={{
                    position: "absolute", left: 14, top: 8, width: 18, height: 18, borderRadius: 999,
                    background: it.tint, boxShadow: `0 0 18px ${it.tint}`,
                    border: "2px solid #0B0719",
                  }} />
                  <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{it.d}</div>
                    <div style={{ marginTop: 4, fontSize: 16, fontWeight: 600 }}>{it.t}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <NoticeSection />
      <MediaSection />
      <FeastHeroSection />
      <RegistrationSection />
      <OrganizerSection />
      <FinalSection />
    </div>
  );
}
