// Pure calculation functions — no DB, no side effects.
// Safe to import in both client and server components.

export type Grade = "A" | "B" | "C" | null;

export interface GradeResult {
  grade: Grade;
  gradePoints: number;
}

export interface PositionResult {
  position: number | null; // null = beyond 3rd
  positionPoints: number;
}

export interface CalcEntry {
  id: string; // participant_registration_id
  score: number;
}

export interface FullResult extends CalcEntry {
  grade: Grade;
  gradePoints: number;
  position: number | null;
  positionPoints: number;
  totalPoints: number;
}

// ── Grade ──────────────────────────────────────────────────────────────────

export function calcGrade(score: number, maxScore: number): GradeResult {
  if (maxScore <= 0) return { grade: null, gradePoints: 0 };
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return { grade: "A", gradePoints: 5 };
  if (pct >= 60) return { grade: "B", gradePoints: 3 };
  if (pct >= 40) return { grade: "C", gradePoints: 1 };
  return { grade: null, gradePoints: 0 };
}

// ── Position ───────────────────────────────────────────────────────────────
// Standard competition ranking: ties share the same rank.
// Only 1st (5pts), 2nd (3pts), 3rd (1pt) earn position points.
// Beyond 3rd: position = null, positionPoints = 0.

export function calcPositions(
  entries: CalcEntry[]
): Map<string, PositionResult> {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const result = new Map<string, PositionResult>();

  let currentPos = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      currentPos = i + 1; // advance rank; gaps appear after ties
    }
    const pos: number | null = currentPos <= 3 ? currentPos : null;
    const positionPoints = pos === 1 ? 5 : pos === 2 ? 3 : pos === 3 ? 1 : 0;
    result.set(sorted[i].id, { position: pos, positionPoints });
  }

  return result;
}

// ── Combined ───────────────────────────────────────────────────────────────

export function calcAllResults(
  entries: CalcEntry[],
  maxScore: number
): FullResult[] {
  const posMap = calcPositions(entries);
  return entries.map((e) => {
    const { grade, gradePoints } = calcGrade(e.score, maxScore);
    const { position, positionPoints } = posMap.get(e.id) ?? {
      position: null,
      positionPoints: 0,
    };
    return {
      ...e,
      grade,
      gradePoints,
      position,
      positionPoints,
      totalPoints: gradePoints + positionPoints,
    };
  });
}

// ── Grade label helper ─────────────────────────────────────────────────────

export function gradeColor(grade: Grade): string {
  if (grade === "A") return "#16A34A";
  if (grade === "B") return "#D97706";
  if (grade === "C") return "#6B46FF";
  return "#9CA3AF";
}

export function positionLabel(pos: number | null): string {
  if (pos === 1) return "1st";
  if (pos === 2) return "2nd";
  if (pos === 3) return "3rd";
  return "—";
}
