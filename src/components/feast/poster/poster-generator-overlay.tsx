"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, Upload, X } from "lucide-react";
import { GlowBtn } from "../feast-shared";
import { ResultPoster } from "./result-poster";
import { PhotoCropper } from "./photo-cropper";
import { usePosterGenerator } from "./use-poster-generator";

export interface PosterWinner {
  rank: 1 | 2 | 3;
  winnerName: string;
  houseName: string | null;
  shakhaName: string;
  competitionName: string;
  categoryLabel: string;
  feastName: string;
}

const POSTER_W = 1080;
const POSTER_H = 1920;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

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
      {/* This wrapper carries the CSS scale for on-screen display only. The
          export ref must sit on an UNSCALED node — html-to-image serializes
          the captured node's own inline styles (including `transform`), so
          if posterRef were on this scaled node, the exported canvas would
          contain only the tiny scaled-down poster in one corner. */}
      <div
        style={{
          position: "absolute", top: 0, left: 0,
          width: POSTER_W, height: POSTER_H,
          transform: `scale(${scale})`, transformOrigin: "top left",
          visibility: scale > 0 ? "visible" : "hidden",
          borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div ref={posterRef} style={{ width: POSTER_W, height: POSTER_H }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PosterGeneratorOverlay({ winner, onClose }: { winner: PosterWinner; onClose: () => void }) {
  const gen = usePosterGenerator(winner.competitionName, winner.winnerName);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file || !ACCEPTED_TYPES.includes(file.type)) return;
    gen.selectFile(file);
  }, [gen]);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(20,15,10,0.72)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
          <div>
            <h3 className="font-bold text-[17px]" style={{ fontFamily: "var(--font-anek), sans-serif", color: "#fff" }}>Social Poster</h3>
            <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{winner.winnerName} · {winner.competitionName}</p>
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

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
          {gen.step === "crop" && gen.rawImageSrc ? (
            <div className="pt-2">
              <PhotoCropper
                image={gen.rawImageSrc}
                crop={gen.crop}
                zoom={gen.zoom}
                rotation={gen.rotation}
                onCropChange={gen.setCrop}
                onZoomChange={gen.setZoom}
                onRotationChange={gen.setRotation}
                onCropComplete={gen.onCropComplete}
              />
              {gen.error && <p className="text-[12.5px] mt-3 text-center" style={{ color: "#FCA5A5" }}>{gen.error}</p>}
              <div className="flex gap-2.5 mt-5">
                <GlowBtn variant="ghost" full onClick={gen.backToPreview} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>
                  Cancel
                </GlowBtn>
                <GlowBtn variant="gold" full disabled={gen.isCropping} onClick={gen.confirmCrop}>
                  {gen.isCropping ? <Loader2 size={16} className="animate-spin" /> : "Use Photo"}
                </GlowBtn>
              </div>
            </div>
          ) : gen.step === "upload" ? (
            <div className="pt-2">
              <label
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-colors"
                style={{
                  aspectRatio: "1 / 1", border: `2px dashed ${dragActive ? "#F0A500" : "rgba(255,255,255,0.28)"}`,
                  background: dragActive ? "rgba(240,165,0,0.08)" : "rgba(255,255,255,0.04)",
                }}
              >
                <Upload size={26} color="rgba(255,255,255,0.7)" />
                <div className="text-center px-6">
                  <p className="text-[13.5px] font-semibold" style={{ color: "#fff" }}>Drop a photo here</p>
                  <p className="text-[11.5px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>or tap to browse — PNG, JPG or WEBP</p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
              <div className="mt-5">
                <GlowBtn variant="ghost" full onClick={gen.backToPreview} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>
                  Cancel
                </GlowBtn>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <ScaledPosterPreview posterRef={gen.posterRef}>
                <ResultPoster
                  rank={winner.rank}
                  winnerName={winner.winnerName}
                  houseName={winner.houseName}
                  shakhaName={winner.shakhaName}
                  competitionName={winner.competitionName}
                  categoryLabel={winner.categoryLabel}
                  feastName={winner.feastName}
                  photoSrc={gen.photoSrc}
                />
              </ScaledPosterPreview>

              {gen.error && <p className="text-[12.5px] mt-3 text-center" style={{ color: "#FCA5A5" }}>{gen.error}</p>}

              <div className="flex gap-2.5 mt-5">
                <GlowBtn variant="ghost" full onClick={gen.openPicker} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>
                  {gen.photoSrc ? "Change Photo" : "Add Photo"}
                </GlowBtn>
                <GlowBtn variant="gold" full icon={gen.isExporting ? undefined : "Download"} disabled={gen.isExporting} onClick={gen.download}>
                  {gen.isExporting ? <Loader2 size={16} className="animate-spin" /> : "Download"}
                </GlowBtn>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
