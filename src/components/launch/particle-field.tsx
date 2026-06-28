"use client";

import { useEffect, useRef } from "react";

interface ParticleFieldProps {
  density?: number;      // particles per 1000px²; default 0.04
  hue?: [string, string]; // [purple, gold] — colors picked at random
  speed?: number;        // base drift, default 0.18
}

// Canvas-based starfield + drifting dust. Cheaper than Three.js, GPU-friendly,
// uses transform-3d-style depth via radius+alpha. Pointer movement creates a
// soft parallax shift across all particles.
export function ParticleField({
  density = 0.04,
  hue = ["#A78BFA", "#F5C542"],
  speed = 0.18,
}: ParticleFieldProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: { x: number; y: number; z: number; vx: number; vy: number; r: number; c: string }[] = [];
    let rafId = 0;

    function resize() {
      const c = canvas!;
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((w * h * density) / 1000);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),               // 0..1 depth
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r: 0.4 + Math.random() * 1.4,
        c: Math.random() > 0.92 ? hue[1] : hue[0],
      }));
    }

    function loop() {
      const p = pointerRef.current;
      p.tx += (p.x - p.tx) * 0.04;
      p.ty += (p.y - p.ty) * 0.04;
      const px = (p.tx - w / 2) / w; // -.5..+.5
      const py = (p.ty - h / 2) / h;

      ctx!.clearRect(0, 0, w, h);

      // soft radial gradient backdrop
      const g = ctx!.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, Math.max(w, h));
      g.addColorStop(0, "rgba(72,38,160,0.25)");
      g.addColorStop(0.5, "rgba(20,8,52,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);

      for (const dot of particles) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < -10) dot.x = w + 10;
        if (dot.x > w + 10) dot.x = -10;
        if (dot.y < -10) dot.y = h + 10;
        if (dot.y > h + 10) dot.y = -10;

        const depth = 0.3 + dot.z * 0.7;
        const shift = (1 - depth) * 20;
        const x = dot.x + px * shift;
        const y = dot.y + py * shift;
        const alpha = depth * (0.4 + dot.z * 0.5);

        ctx!.beginPath();
        ctx!.arc(x, y, dot.r * (0.8 + dot.z * 1.2), 0, Math.PI * 2);
        ctx!.fillStyle = dot.c;
        ctx!.globalAlpha = alpha;
        ctx!.shadowColor = dot.c;
        ctx!.shadowBlur = 8 * dot.z;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;

      rafId = requestAnimationFrame(loop);
    }

    function onPointer(e: PointerEvent) {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [density, speed, hue]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
