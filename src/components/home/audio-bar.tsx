"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { COLORS } from "@/lib/theme";

const BARS = [10, 16, 22, 14, 26, 18, 30, 20, 12, 24, 16, 28, 14, 22, 10, 18, 26, 12];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface AudioBarProps {
  src?: string | null;
}

export function AudioBar({ src }: AudioBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;
    // Clean URL — strip surrounding quotes if stored that way in DB
    const cleanSrc = src.replace(/^["']|["']$/g, "").trim();
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audio.src = cleanSrc;
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setLoaded(true);
    });
    audio.addEventListener("canplaythrough", () => {
      setLoaded(true);
    });
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentTime(0);
    });
    let disposed = false;
    audio.addEventListener("error", () => {
      if (disposed) return;
      const mediaError = audio.error;
      console.error(
        "[AudioBar] Failed to load audio:",
        cleanSrc,
        "code:", mediaError?.code,
        "message:", mediaError?.message
      );
    });

    return () => {
      disposed = true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [src]);

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

  const progress = duration > 0 ? currentTime / duration : 0;
  const filledBars = Math.round(progress * BARS.length);

  const handleBarClick = useCallback(
    (idx: number) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      audio.currentTime = (idx / BARS.length) * duration;
    },
    [duration]
  );

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-2"
      style={{ background: "rgba(107,70,255,0.06)" }}
    >
      <button
        onClick={togglePlay}
        disabled={!src}
        className="w-[34px] h-[34px] rounded-full border-none cursor-pointer shrink-0 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: COLORS.purple,
          boxShadow: "0 4px 12px rgba(107,70,255,0.35)",
        }}
      >
        {playing ? (
          <Pause size={14} fill="#fff" color="#fff" />
        ) : (
          <Play size={15} fill="#fff" color="#fff" className="ml-px" />
        )}
      </button>
      <div className="flex-1 flex items-center gap-[2.5px] h-8">
        {BARS.map((b, i) => (
          <div
            key={i}
            onClick={() => handleBarClick(i)}
            className={`flex-1 rounded-sm cursor-pointer ${playing ? "animate-wave" : ""}`}
            style={{
              height: b,
              background:
                i < filledBars ? COLORS.purple : "rgba(107,70,255,0.28)",
              animationDelay: playing ? `${i * 70}ms` : undefined,
            }}
          />
        ))}
      </div>
      <span
        className="text-[11px] tabular-nums shrink-0"
        style={{ color: COLORS.faint }}
      >
        {loaded
          ? playing || currentTime > 0
            ? formatDuration(currentTime)
            : formatDuration(duration)
          : src
            ? "..."
            : "--:--"}
      </span>
    </div>
  );
}
