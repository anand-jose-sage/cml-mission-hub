"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// TODO: paste the background music URL here. Until this is set, the
// component renders nothing and does nothing (safe no-op).
const MUSIC_SRC = "https://lkeplxbdecciuwyawmwt.supabase.co/storage/v1/object/public/cml-audio/bg_launch.mp3";

const VOLUME = 0.35;

export function BackgroundMusic({ playing }: { playing: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!MUSIC_SRC) return;
    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = VOLUME;
    audio.src = MUSIC_SRC;
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      console.error("[BackgroundMusic] Failed to load:", MUSIC_SRC);
    });
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  // Start once, on the first real scroll gesture (the `playing` prop flips
  // true exactly once — see LaunchExperience).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playing || started || muted) return;
    audio.play().then(() => setStarted(true)).catch(() => {});
  }, [playing, started, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !started) return;
    if (muted) audio.pause();
    else audio.play().catch(() => {});
  }, [muted, started]);

  if (!MUSIC_SRC) return null;

  return (
    <button
      onClick={() => setMuted((m) => !m)}
      aria-label={muted ? "Unmute background music" : "Mute background music"}
      title={muted ? "Unmute background music" : "Mute background music"}
      style={{
        position: "fixed", top: 18, right: 168, zIndex: 100,
        width: 38, height: 38, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {muted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
    </button>
  );
}
