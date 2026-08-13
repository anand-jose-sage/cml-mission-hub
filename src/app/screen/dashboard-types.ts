// LED Dashboard section model — the top-level nav unit for /screen.
//
// Deliberately a discriminated union (not a boolean/binary toggle) so a future
// "stage" section can be added as a new variant without touching every switch
// that branches on `.kind` — TypeScript's exhaustiveness check will flag every
// call site that needs a new case. No Stage data model exists yet; do not add
// a "stage" variant until that model is built.
export type DashboardSection =
  | { kind: "overall" }
  | { kind: "feast"; feastSlug: string; feastName: string };
  // Extension point for later — do NOT implement yet:
  // | { kind: "stage"; stageId: string; stageName: string };

export function sectionKey(s: DashboardSection): string {
  switch (s.kind) {
    case "overall": return "overall";
    case "feast": return `feast:${s.feastSlug}`;
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
    default: {
      const exhaustive: never = s;
      return exhaustive;
    }
  }
}
