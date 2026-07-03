"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, SkipBack, SkipForward, Music } from "lucide-react";
import { COLORS } from "@/lib/theme";

const BARS = [10, 16, 22, 14, 26, 18, 30, 20, 12, 24, 16, 28, 14, 22, 10, 18, 26, 12, 20, 24, 14, 18, 28, 16, 22];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface FullscreenAudioPlayerProps {
  open: boolean;
  onClose: () => void;
  src?: string | null;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string | null;
}

export function FullscreenAudioPlayer({
  open,
  onClose,
  src,
  title,
  subtitle,
  thumbnailUrl,
}: FullscreenAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Create / destroy audio element when opened/closed
  useEffect(() => {
    if (!open || !src) return;
    const cleanSrc = src.replace(/^["']|["']$/g, "").trim();
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = cleanSrc;
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setLoaded(true);
    });
    audio.addEventListener("canplaythrough", () => setLoaded(true));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentTime(0);
    });
    audio.addEventListener("error", () => {
      console.error("[FullscreenAudioPlayer] Failed to load:", cleanSrc);
    });

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setLoaded(false);
    };
  }, [open, src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(console.error);
    }
  }, [playing]);

  const seekBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  }, []);

  const seekForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
    },
    [duration]
  );

  const handleBarClick = useCallback(
    (idx: number) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      audio.currentTime = (idx / BARS.length) * duration;
    },
    [duration]
  );

  const progress = duration > 0 ? currentTime / duration : 0;
  const filledBars = Math.round(progress * BARS.length);

  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setPlaying(false);
    }
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col max-w-md mx-auto"
          style={{ background: "rgba(15, 10, 40, 0.85)" }}
        >
          {/* Blurred glass overlay */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Close button */}
            <div className="flex justify-end px-5 pt-4">
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <X size={18} color="rgba(255,255,255,0.9)" />
              </button>
            </div>

            {/* Cover art area */}
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              {/* Album art */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="w-[220px] h-[220px] rounded-3xl overflow-hidden mb-10"
                style={{
                  boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 8px 20px rgba(107,70,255,0.3)",
                }}
              >
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailUrl}
                    alt="Audio cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(145deg, rgba(107,70,255,0.4), rgba(167,139,250,0.2))",
                    }}
                  >
                    <Music size={64} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
                  </div>
                )}
              </motion.div>

              {/* Title & subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-center mb-8 w-full"
              >
                <h2
                  className="font-[family-name:var(--font-poppins)] font-bold text-[20px] leading-tight mb-1 px-4"
                  style={{ color: "rgba(255,255,255,0.95)" }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {subtitle}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Player controls area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="px-8 pb-12"
            >
              {/* Waveform visualizer */}
              <div className="flex items-center gap-[2px] h-10 mb-4 px-2">
                {BARS.map((b, i) => (
                  <div
                    key={i}
                    onClick={() => handleBarClick(i)}
                    className={`flex-1 rounded-sm cursor-pointer transition-colors duration-150 ${playing ? "animate-wave" : ""}`}
                    style={{
                      height: b,
                      background:
                        i < filledBars
                          ? "rgba(167,139,250,0.9)"
                          : "rgba(255,255,255,0.18)",
                      animationDelay: playing ? `${i * 70}ms` : undefined,
                    }}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="h-[3px] rounded-full mb-2 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-100"
                  style={{
                    width: `${progress * 100}%`,
                    background: "linear-gradient(90deg, #A78BFA, #6B46FF)",
                  }}
                />
              </div>

              {/* Time labels */}
              <div className="flex justify-between mb-6">
                <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {loaded ? formatDuration(currentTime) : "0:00"}
                </span>
                <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {loaded ? formatDuration(duration) : "--:--"}
                </span>
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-8">
                {/* Skip back */}
                <button
                  onClick={seekBack}
                  className="w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <SkipBack size={18} color="rgba(255,255,255,0.8)" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  disabled={!src}
                  className="w-16 h-16 rounded-full flex items-center justify-center border-none cursor-pointer disabled:opacity-50"
                  style={{
                    background: "linear-gradient(145deg, #7C5CFC, #6B46FF)",
                    boxShadow: "0 8px 28px rgba(107,70,255,0.5), 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {playing ? (
                    <Pause size={24} fill="#fff" color="#fff" />
                  ) : (
                    <Play size={26} fill="#fff" color="#fff" className="ml-1" />
                  )}
                </button>

                {/* Skip forward */}
                <button
                  onClick={seekForward}
                  className="w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <SkipForward size={18} color="rgba(255,255,255,0.8)" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
