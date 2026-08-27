// LED Dashboard section model — the top-level nav unit for /screen.
//
// Deliberately a discriminated union (not a boolean/binary toggle) so a new
// section can be added as its own variant without touching every switch that
// branches on `.kind` — TypeScript's exhaustiveness check flags every call
// site that needs a new case.
export type DashboardSection =
  | { kind: "overall" }
  | { kind: "feast"; feastSlug: string; feastName: string }
  // The live stage board — a single non-rotating screen (like "overall"),
  // not one screen per feast, since only one feast has a multi-stage
  // schedule running at a time in practice.
  | { kind: "stages"; feastSlug: string; feastName: string };

export function sectionKey(s: DashboardSection): string {
  switch (s.kind) {
    case "overall": return "overall";
    case "feast": return `feast:${s.feastSlug}`;
    case "stages": return `stages:${s.feastSlug}`;
    default: {
      const exhaustive: never = s;
      return exhaustive;
    }
  }
}

export function sectionLabel(s: DashboardSection): string {
  switch (s.kind) {
    case "overall": return "Overall";
    case "feast": return s.feastName;
    case "stages": return "Stage Board";
    default: {
      const exhaustive: never = s;
      return exhaustive;
    }
  }
}
