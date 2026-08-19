"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { LentGlowBtn } from "../lent-shared";
import { LentDayPoster } from "./lent-day-poster";
import { useLentPosterGenerator } from "./use-lent-poster-generator";
import type { LentDay } from "@/types";

const POSTER_W = 1080;
const POSTER_H = 1920;

// Same scale-for-display/unscaled-for-export technique as the feast poster's
// ScaledPosterPreview, duplicated locally rather than imported — matching
// this codebase's per-module-duplication convention.
function ScaledPosterPreview({
  children, posterRef,
}: { children: React.ReactNode; posterRef: React.RefObject<HTMLDivElement | null> }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / POSTER_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="w-full mx-auto" style={{ maxWidth: 340, aspectRatio: `${POSTER_W} / ${POSTER_H}`, position: "relative" }}>
      <div
        style={{
          position: "absolute", top: 0, left: 0,
          width: POSTER_W, height: POSTER_H,
          transform: `scale(${scale})`, transformOrigin: "top left",
          visibility: scale > 0 ? "visible" : "hidden",
          borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div ref={posterRef} style={{ width: POSTER_W, height: POSTER_H }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LentPosterOverlay({ day, entry, onClose }: { day: number; entry: LentDay; onClose: () => void }) {
  const gen = useLentPosterGenerator(day, entry.en.themeTitle);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(8,6,16,0.8)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto"
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
          <div>
            <h3 className="font-bold text-[17px]" style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#fff" }}>Share Day {day}</h3>
            <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{entry.ml.themeTitle} &middot; {entry.en.themeTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0"
            style={{ background: "rgba(255,255,255,0.12)" }}
            aria-label="Close"
          >
            <X size={18} color="#fff" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
          <div className="pt-2">
            <ScaledPosterPreview posterRef={gen.posterRef}>
              <LentDayPoster day={day} entry={entry} />
            </ScaledPosterPreview>

            {gen.error && <p className="text-[12.5px] mt-3 text-center" style={{ color: "#FCA5A5" }}>{gen.error}</p>}

            <div className="mt-5">
              <LentGlowBtn variant="primary" full icon={gen.isExporting ? undefined : "Download"} disabled={gen.isExporting} onClick={gen.download}>
                {gen.isExporting ? <Loader2 size={16} className="animate-spin" /> : "Download"}
              </LentGlowBtn>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
