"use client";

// Nebula Glass result primitives, ported from fest_hub's feast-ui.tsx with its
// --fp-* tokens resolved to the Nebula values (mission hub has no theme vars).

export type MedalPos = 1 | 2 | 3;

export function isMedalPos(n: number | null | undefined): n is MedalPos {
  return n === 1 || n === 2 || n === 3;
}

export const NB = {
  text: "#F4F1FF",
  sub: "#E4E0FA",
  faint: "#B8B2E2",
  link: "#E08BFF",
  surface3: "rgba(255,255,255,0.05)",
  line: "rgba(214,170,255,0.12)",
  track: "rgba(255,255,255,0.08)",
  rowOpen: "rgba(255,255,255,0.1)",
  num: "var(--font-poppins), sans-serif",
  ml: "var(--font-anek), var(--font-poppins), sans-serif",
};

const TONES: Record<MedalPos, { background: string; border: string }> = {
  1: { background: "linear-gradient(100deg, rgba(245,197,66,0.26) 0%, rgba(245,197,66,0.08) 48%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(255,214,107,0.42)" },
  2: { background: "linear-gradient(100deg, rgba(214,220,230,0.16) 0%, rgba(214,220,230,0.05) 48%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(220,226,236,0.26)" },
  3: { background: "linear-gradient(100deg, rgba(199,138,90,0.2) 0%, rgba(199,138,90,0.06) 48%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(227,170,124,0.3)" },
};

export function toneStyle(pos: MedalPos): { background: string; border: string } {
  return TONES[pos];
}

// Gradient number text (gold / silver / bronze), like fest_hub's .fp-t-*.
const NUM_GRAD: Record<MedalPos, string> = {
  1: "linear-gradient(180deg, #FFF3CC 0%, #FFD66B 38%, #F5C542 72%, #C28A12 100%)",
  2: "linear-gradient(180deg, #FFFFFF 0%, #DDE1E8 45%, #9BA3B0 100%)",
  3: "linear-gradient(180deg, #FFE3C8 0%, #E0A577 45%, #A77A4D 100%)",
};
export function toneText(pos: MedalPos): React.CSSProperties {
  return { background: NUM_GRAD[pos], WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
}

export const TONE_BAR: Record<MedalPos, string> = {
  1: "linear-gradient(90deg, #E0A21B, #FFD66B)",
  2: "linear-gradient(90deg, #7D8593, #D9DDE5)",
  3: "linear-gradient(90deg, #8A5530, #E3AA7C)",
};

const MEDAL: Record<MedalPos, React.CSSProperties> = {
  1: { background: "radial-gradient(circle at 32% 26%, #FFF7DA 0%, #FFD66B 24%, #F5C542 58%, #9A6A08 100%)", boxShadow: "inset 0 0 0 1.5px rgba(255,246,214,0.5), inset 0 -3px 6px rgba(70,45,0,0.35), 0 0 16px rgba(245,197,66,0.4)", color: "#3A2A06" },
  2: { background: "radial-gradient(circle at 32% 26%, #FFFFFF 0%, #E8EBF0 24%, #B7BDC8 58%, #6E7684 100%)", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.55), inset 0 -3px 6px rgba(30,35,45,0.3), 0 2px 10px rgba(90,98,112,0.25)", color: "#262B33" },
  3: { background: "radial-gradient(circle at 32% 26%, #FFE6CF 0%, #E3AA7C 24%, #A77A4D 58%, #5E3B1F 100%)", boxShadow: "inset 0 0 0 1.5px rgba(255,230,205,0.45), inset 0 -3px 6px rgba(60,30,10,0.35), 0 2px 10px rgba(130,75,35,0.25)", color: "#3A2210" },
};

export function Medal({ pos, size = 30, tiny }: { pos: MedalPos; size?: number; tiny?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center flex-none rounded-full"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46), fontFamily: NB.num, fontWeight: 900, lineHeight: 1, ...MEDAL[pos] }}
      role={tiny ? undefined : "img"}
      aria-label={tiny ? undefined : `${pos === 1 ? "1st" : pos === 2 ? "2nd" : "3rd"} place`}
    >
      {tiny ? null : pos}
    </span>
  );
}

export function MedalCounts({ g, s, b, size = 11, className }: { g: number; s: number; b: number; size?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-3 font-bold tabular-nums ${className ?? ""}`} style={{ color: NB.sub }}>
      {([[1, g], [2, s], [3, b]] as const).map(([p, n]) => (
        <span key={p} className="inline-flex items-center gap-[5px]">
          <Medal pos={p} size={size} tiny />
          {n}
        </span>
      ))}
    </span>
  );
}

export function GradeBadge({ grade, size = 34, variant = "surface" }: { grade: "A" | "B" | "C" | null; size?: number; variant?: "surface" | "award" }) {
  const style: React.CSSProperties = variant === "award"
    ? grade === "A" ? { background: "#4B31B3", color: "#FFE08A" }
      : grade === "B" ? { background: "#E6E0FF", color: "#4B31B3" }
        : grade === "C" ? { border: "1.5px solid #4B31B3", color: "#4B31B3" }
          : { background: "rgba(30,27,75,0.06)", color: "#55517E" }
    : grade === "A" ? { background: NB.text, color: "#5A1FB8" }
      : grade === "B" ? { background: "rgba(244,241,255,0.55)", color: "#150B36" }
        : grade === "C" ? { border: "1.5px solid rgba(244,241,255,0.55)", color: NB.text }
          : { background: NB.surface3, color: NB.faint };
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), fontSize: Math.round(size * 0.5), fontWeight: 900, fontFamily: NB.num, ...style }}
      aria-label={grade ? `Grade ${grade}` : "No grade"}
    >
      {grade ?? "–"}
    </span>
  );
}
