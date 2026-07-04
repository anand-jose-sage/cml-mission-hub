"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

// Continuously spawns bursts at random positions for as long as this
// component stays mounted (i.e. the whole time the Arrival screen is up).
// Randomness only ever happens inside useEffect/setInterval — never during
// render — so the server-rendered/hydration pass always sees zero bursts
// and there's no client/server markup mismatch.
//
// Pure CSS — each spark's direction comes from `rotate(Ndeg) translateY(...)`,
// letting the browser's own transform math handle the geometry instead of
// baking Math.cos/sin results into markup.

const SPARK_COUNT = 16;
const SPARK_COLORS = ["#FFD400", "#FF3B30"]; // yellow, red
const BURST_LIFETIME_MS = 1300;
const SPAWN_INTERVAL_MS = 850;

interface BurstInstance {
  id: number;
  top: string;
  left: string;
}

function randomPercent(min: number, max: number) {
  return `${Math.round(min + Math.random() * (max - min))}%`;
}

function Burst({ top, left }: { top: string; left: string }) {
  return (
    <div style={{ position: "absolute", top, left, width: 0, height: 0 }}>
      <span className="firework-flash" />
      {Array.from({ length: SPARK_COUNT }).map((_, i) => {
        const angle = Math.round((360 / SPARK_COUNT) * i);
        const color = SPARK_COLORS[i % 2];
        return (
          <span
            key={i}
            className="firework-spark"
            style={{
              "--angle": `${angle}deg`,
              background: color,
              boxShadow: `0 0 6px 1px ${color}`,
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

export function Fireworks() {
  const [bursts, setBursts] = useState<BurstInstance[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const spawn = () => {
      const id = nextId.current++;
      setBursts((b) => [...b, { id, top: randomPercent(6, 55), left: randomPercent(8, 92) }]);
      timers.push(setTimeout(() => {
        setBursts((b) => b.filter((x) => x.id !== id));
      }, BURST_LIFETIME_MS));
    };
    spawn();
    const interval = setInterval(spawn, SPAWN_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <style>{`
        .firework-flash {
          position: absolute; top: 0; left: 0;
          width: 10px; height: 10px; margin: -5px 0 0 -5px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,214,0,0.55) 40%, transparent 70%);
          opacity: 0;
          animation: fireworkFlash 0.5s ease-out forwards;
        }
        .firework-spark {
          position: absolute; top: 0; left: 0;
          width: 5px; height: 5px; margin: -2.5px 0 0 -2.5px;
          border-radius: 50%;
          opacity: 0;
          transform: rotate(var(--angle)) translateY(0);
          animation: fireworkBurst 1.1s ease-out 0.08s forwards;
        }
        @keyframes fireworkFlash {
          0%   { opacity: 0; transform: scale(0.2); }
          30%  { opacity: 1; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(2.2); }
        }
        @keyframes fireworkBurst {
          0%   { opacity: 0; transform: rotate(var(--angle)) translateY(0); }
          12%  { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--angle)) translateY(-90px); }
        }
      `}</style>
      {bursts.map((b) => (
        <Burst key={b.id} top={b.top} left={b.left} />
      ))}
    </div>
  );
}
