"use client";

import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { RotateCcw, RotateCw } from "lucide-react";

export interface PhotoCropperProps {
  image: string;
  crop: Point;
  zoom: number;
  rotation: number;
  onCropChange: (crop: Point) => void;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onCropComplete: (croppedAreaPixels: Area) => void;
}

export function PhotoCropper({
  image, crop, zoom, rotation, onCropChange, onZoomChange, onRotationChange, onCropComplete,
}: PhotoCropperProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "1 / 1", background: "#1a1425" }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onRotationChange={onRotationChange}
          onCropComplete={(_croppedArea, croppedAreaPixels) => onCropComplete(croppedAreaPixels)}
        />
      </div>

      <div className="flex items-center gap-3 px-1">
        <span className="text-[12px] font-semibold shrink-0" style={{ color: "#9CA3AF" }}>Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="flex-1 accent-[#6B46FF]"
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onRotationChange(rotation - 90)}
          className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer active:scale-95 transition-transform"
          style={{ background: "rgba(107,70,255,0.1)" }}
          aria-label="Rotate left"
        >
          <RotateCcw size={18} color="#6B46FF" />
        </button>
        <button
          type="button"
          onClick={() => onRotationChange(rotation + 90)}
          className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer active:scale-95 transition-transform"
          style={{ background: "rgba(107,70,255,0.1)" }}
          aria-label="Rotate right"
        >
          <RotateCw size={18} color="#6B46FF" />
        </button>
      </div>
    </div>
  );
}
