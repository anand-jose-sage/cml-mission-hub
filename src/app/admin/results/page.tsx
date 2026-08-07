"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2, Check, Medal, ChevronDown, AlertTriangle,
  Save, Send, RotateCcw, X, FileDown, FileStack,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  setMaxScore, saveDraftScores, publishResults, unpublishResults,
  getCompetitionScores, getScoresForCompetitions,
} from "@/actions/results";
import {
  calcGrade, calcPositions, calcAllResults, positionLabel,
  type Grade,
} from "@/lib/result-calculator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeastOption { id: string; name: string; year: string; }

interface CompOption {
  fcId: string;
  label: string;
  compName: string;
  catName: string;
  gender: string | null;
  maxScore: number | null;
  resultStatus: "draft" | "published";
}

interface EntryRow {
  registrationId: string;
  regNo: string;
  name: string;
  houseName: string | null;
  shakhaName: string;
  savedScore: number | null;
}

// ─── Grade cell ───────────────────────────────────────────────────────────────

const GRADE_SOLID: Record<string, { bg: string; pts: string }> = {
  A: { bg: "#15803D", pts: "#14532D" },
  B: { bg: "#B45309", pts: "#78350F" },
  C: { bg: "#5B21B6", pts: "#3B0764" },
};

function GradeCell({ grade, pts }: { grade: Grade; pts: number }) {
  if (!grade) return <span className="text-sm font-bold" style={{ color: "#6B7280" }}>—</span>;
  const { bg, pts: ptsColor } = GRADE_SOLID[grade];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="inline-flex items-center justify-center text-[13px] font-black px-3 py-1 rounded-lg leading-none w-full text-white"
        style={{ background: bg }}
      >
        Grade {grade}
      </span>
      <span className="text-[12px] font-black" style={{ color: ptsColor }}>+{pts} pts</span>
    </div>
  );
}

// ─── Position cell ────────────────────────────────────────────────────────────

const POS_COLORS: Record<number, { bg: string; pts: string }> = {
  1: { bg: "#92400E", pts: "#78350F" },
  2: { bg: "#374151", pts: "#1F2937" },
  3: { bg: "#7C2D12", pts: "#6B2510" },
};
const POS_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function PosCell({ pos, pts }: { pos: number | null; pts: number }) {
  if (!pos) return <span className="text-sm font-bold" style={{ color: "#6B7280" }}>—</span>;
  const style = POS_COLORS[pos] ?? { bg: "#374151", pts: "#1F2937" };
  const emoji = POS_EMOJI[pos] ?? "";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="inline-flex items-center justify-center gap-1.5 text-[13px] font-black px-3 py-1 rounded-lg leading-none w-full text-white"
        style={{ background: style.bg }}
      >
        {emoji} {positionLabel(pos)}
      </span>
      {pts > 0 && <span className="text-[12px] font-black" style={{ color: style.pts }}> +{pts} pts</span>}
    </div>
  );
}

// ─── Publish confirm modal ────────────────────────────────────────────────────

function PublishConfirm({
  onConfirm,
  onCancel,
  busy,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-bold text-[17px] text-gray-900">Publish Results?</h3>
          <button onClick={onCancel} className="border-none bg-transparent cursor-pointer p-1">
            <X size={18} color="#9ca3af" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">This will:</p>
        <ul className="space-y-2 mb-6">
          {[
            "Calculate grades for all participants",
            "Calculate positions (ties share same rank)",
            "Calculate grade + position points",
            "Write to the point ledger",
            "Rebuild Shakha standings",
            "Mark competition as Published",
          ].map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
              <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#6B46FF,#A855F7)" }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF export ─────────────────────────────────────────────────────────────
// Print-to-PDF, same pattern as the participation/participants admin pages
// (open a blank tab, write a standalone HTML document, trigger window.print()).

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function genderLabel(g: string | null): string {
  const lower = (g ?? "").toLowerCase();
  if (lower.startsWith("boy") || lower === "male") return "Boys";
  if (lower.startsWith("girl") || lower === "female") return "Girls";
  return "Common";
}

interface PdfRow {
  name: string;
  houseName: string | null;
  shakhaName: string;
  grade: Grade;
  gradePoints: number;
  position: number | null;
  positionPoints: number;
  sortPoints: number; // total points, or -1 when no score was ever entered (sorts last)
}

/** 1st/2nd/3rd first, then the rest by grade/score (highest first), ties by name. */
function sortPdfRows(rows: PdfRow[]): PdfRow[] {
  return [...rows].sort((a, b) => {
    const posA = a.position ?? 999;
    const posB = b.position ?? 999;
    if (posA !== posB) return posA - posB;
    if (b.sortPoints !== a.sortPoints) return b.sortPoints - a.sortPoints;
    return a.name.localeCompare(b.name);
  });
}

function pdfGradeCell(grade: Grade, pts: number): string {
  if (!grade) return `<span class="none">—</span>`;
  const { bg } = GRADE_SOLID[grade];
  return `<span class="pill" style="background:${bg}">Grade ${grade}<b>+${pts} pts</b></span>`;
}

function pdfPosCell(pos: number | null, pts: number): string {
  if (!pos) return `<span class="none">—</span>`;
  const { bg } = POS_COLORS[pos] ?? { bg: "#374151", pts: "#1F2937" };
  const emoji = POS_EMOJI[pos] ?? "";
  return `<span class="pill" style="background:${bg}">${emoji} ${positionLabel(pos)}${pts > 0 ? `<b>+${pts} pts</b>` : ""}</span>`;
}

const PDF_CSS = `
  @page { size: A4 portrait; margin: 16mm 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e1b4b; margin: 0; }
  .sheet { border-left: 6px solid #6B46FF; border-right: 6px solid #6B46FF; padding: 0 16px; }
  .sheet:not(:last-child) { page-break-after: always; }
  .hdr { text-align: center; margin-bottom: 14px; }
  .hdr .org1 { font-size: 19px; font-weight: 800; margin: 0; }
  .hdr .org2 { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #6B46FF; margin: 2px 0 12px; }
  .hdr .comp { font-size: 18px; font-weight: 800; margin: 4px 0 2px; }
  .hdr .cat { font-size: 12.5px; font-weight: 600; color: #4B5563; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead tr { background: linear-gradient(90deg,#ede9fe,#f5f3ff); }
  th { border: 1px solid #c4b5fd; padding: 7px 6px; font-size: 10.5px; text-transform: uppercase; letter-spacing: .03em; color: #1e1b4b; text-align: left; }
  th.c-pos, th.c-grade { text-align: center; }
  td { border: 1px solid #e5e7eb; padding: 7px 6px; font-size: 12.5px; vertical-align: middle; }
  tbody tr:nth-child(even) { background: #f8f7ff; }
  td.pos, td.grade { text-align: center; width: 17%; }
  td.name { font-weight: 700; }
  td.house { color: #7C3AED; font-weight: 600; }
  td.shakha { color: #4B5563; font-weight: 600; }
  .pill { display: inline-flex; flex-direction: column; align-items: center; gap: 1px; color: #fff; font-weight: 800; font-size: 10.5px; padding: 4px 8px; border-radius: 6px; line-height: 1.3; }
  .pill b { font-size: 9px; font-weight: 800; }
  .none { color: #9CA3AF; font-weight: 700; }
  .empty { text-align: center; color: #9CA3AF; padding: 22px; font-size: 13px; }
  @media print { .noprint { display: none; } }
  .noprint { text-align: center; margin: 18px 0; }
  .noprint button { font-size: 14px; padding: 8px 18px; cursor: pointer; background: #6B46FF; color: #fff; border: none; border-radius: 8px; font-weight: 600; }
`;

function renderResultSection(compName: string, catLine: string, rows: PdfRow[]): string {
  const bodyRows = rows.map((r) => `<tr>
      <td class="pos">${pdfPosCell(r.position, r.positionPoints)}</td>
      <td class="name">${escHtml(r.name)}</td>
      <td class="house">${escHtml(r.houseName ?? "—")}</td>
      <td class="shakha">${escHtml(r.shakhaName)}</td>
      <td class="grade">${pdfGradeCell(r.grade, r.gradePoints)}</td>
    </tr>`).join("");

  return `<section class="sheet">
    <div class="hdr">
      <p class="org1">Cherupushpa Mission League</p>
      <p class="org2">Kalpetta Meghala</p>
      <p class="comp">${escHtml(compName)}</p>
      ${catLine ? `<p class="cat">${escHtml(catLine)}</p>` : ""}
    </div>
    <table>
      <thead><tr>
        <th class="c-pos">Position</th><th>Name</th><th>House Name</th><th>Shakha</th><th class="c-grade">Grade</th>
      </tr></thead>
      <tbody>${bodyRows || `<tr><td colspan="5" class="empty">No graded results yet</td></tr>`}</tbody>
    </table>
  </section>`;
}

/** Opens a blank tab, writes the given HTML document, and triggers print. Returns false if the pop-up was blocked. */
function openPrintWindow(html: string): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 350);
  return true;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResultsAdminPage() {
  const [feasts, setFeasts] = useState<FeastOption[]>([]);
  const [feastId, setFeastId] = useState("");
  const [compOptions, setCompOptions] = useState<CompOption[]>([]);
  const [compId, setCompId] = useState("");

  const [maxScoreInput, setMaxScoreInput] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [savingMax, setSavingMax] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const selectedComp = compOptions.find((c) => c.fcId === compId) ?? null;
  const maxScore = selectedComp?.maxScore ?? null;
  const resultStatus = selectedComp?.resultStatus ?? "draft";

  // ── Load feasts ──
  useEffect(() => {
    supabase.from("feasts").select("id,name,year").order("start_date")
      .then(({ data }) => {
        if (data?.length) { setFeasts(data); setFeastId(data[0].id); }
      });
  }, []);

  // ── Load competitions for feast ──
  useEffect(() => {
    if (!feastId) return;
    supabase
      .from("feast_competitions")
      .select("id, max_score, result_status, display_order, competition:competitions(name, type, gender, competition_category:competition_categories(name))")
      .eq("feast_id", feastId)
      .order("display_order")
      .then(({ data }) => {
        const opts: CompOption[] = (data ?? [])
          .filter((fc) => {
            const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
            return comp?.type !== "group";
          })
          .map((fc) => {
          const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
          const cat = comp ? (Array.isArray(comp.competition_category) ? (comp.competition_category as unknown[])[0] : comp.competition_category) as Record<string, unknown> | null : null;
          const name = (comp?.name as string) ?? "Unknown";
          const catName = (cat?.name as string) ?? "";
          const gender = (comp?.gender as string) || null;
          const parts = [name, catName, gender].filter(Boolean);
          return {
            fcId: fc.id as string,
            label: parts.join(" · "),
            compName: name,
            catName,
            gender,
            maxScore: fc.max_score as number | null,
            resultStatus: (fc.result_status as "draft" | "published") ?? "draft",
          };
        });
        setCompOptions(opts);
        setCompId(opts[0]?.fcId ?? "");
      });
  }, [feastId]);

  // ── Load entries + saved scores when competition changes ──
  const loadEntries = useCallback(async () => {
    if (!compId) return;
    setLoading(true);

    const comp = compOptions.find((c) => c.fcId === compId);
    setMaxScoreInput(comp?.maxScore != null ? String(comp.maxScore) : "");

    const [{ data: regData }, scoresResult] = await Promise.all([
      supabase
        .from("participant_registrations")
        .select("id, participant:participants(name, registration_number, house_name, shakha:shakhas(name))")
        .eq("feast_competition_id", compId),
      getCompetitionScores(compId),
    ]);

    const savedMap: Record<string, number> = {};
    for (const r of scoresResult.data ?? []) {
      savedMap[r.registrationId] = r.score;
    }

    const rows: EntryRow[] = (regData ?? []).map((r) => {
      const p = (Array.isArray(r.participant) ? r.participant[0] : r.participant) as Record<string, unknown> | null;
      const sh = p ? (Array.isArray(p.shakha) ? (p.shakha as unknown[])[0] : p.shakha) as Record<string, unknown> | null : null;
      const regId = r.id as string;
      const rawRegNo = (p?.registration_number as string | null) ?? null;
      return {
        registrationId: regId,
        regNo: rawRegNo ?? regId.slice(0, 8).toUpperCase(),
        name: (p?.name as string) ?? "—",
        houseName: (p?.house_name as string | null) ?? null,
        shakhaName: (sh?.name as string) ?? "—",
        savedScore: savedMap[regId] ?? null,
      };
    });

    setEntries(rows);
    const initScores: Record<string, string> = {};
    for (const row of rows) {
      if (row.savedScore != null) initScores[row.registrationId] = String(row.savedScore);
    }
    setScores(initScores);
    setLoading(false);
  }, [compId, compOptions]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── Live preview ──
  const preview = useMemo(() => {
    if (!maxScore) return [];
    const calcEntries = entries
      .map((e) => {
        const inputVal = scores[e.registrationId];
        const hasInput = inputVal != null && inputVal !== "";
        const hasSaved = e.savedScore != null;
        // Skip entirely if no score has been entered or saved yet
        if (!hasInput && !hasSaved) return null;
        const score = hasInput ? parseFloat(inputVal) : e.savedScore!;
        return { id: e.registrationId, score };
      })
      .filter((e): e is { id: string; score: number } => e !== null && !isNaN(e.score));

    const posMap = calcPositions(calcEntries);

    return calcEntries.map((e) => {
      const { grade, gradePoints } = calcGrade(e.score, maxScore);
      const { position, positionPoints } = posMap.get(e.id) ?? { position: null, positionPoints: 0 };
      return { id: e.id, grade, gradePoints, position, positionPoints, totalPoints: gradePoints + positionPoints };
    });
  }, [entries, scores, maxScore]);

  const previewMap = Object.fromEntries(preview.map((p) => [p.id, p]));

  // ── Actions ──
  const handleSaveMax = async () => {
    const val = parseInt(maxScoreInput);
    if (isNaN(val) || val <= 0) { setMsg({ type: "err", text: "Enter a valid max score" }); return; }
    setSavingMax(true);
    const res = await setMaxScore(compId, val);
    setSavingMax(false);
    if (res.error) { setMsg({ type: "err", text: res.error }); return; }
    setCompOptions((opts) => opts.map((o) => o.fcId === compId ? { ...o, maxScore: val } : o));
    setMsg({ type: "ok", text: "Max score saved" });
    setTimeout(() => setMsg(null), 2000);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const scoreRows = entries
      .filter((e) => scores[e.registrationId] != null && scores[e.registrationId] !== "")
      .map((e) => ({ registrationId: e.registrationId, score: parseFloat(scores[e.registrationId]) }));
    const res = await saveDraftScores({ feastCompetitionId: compId, scores: scoreRows });
    setSaving(false);
    if (res.error) { setMsg({ type: "err", text: res.error }); return; }
    setMsg({ type: "ok", text: "Scores saved as draft" });
    setTimeout(() => setMsg(null), 2000);
    await loadEntries();
  };

  const handlePublish = async () => {
    setPublishing(true);
    setShowConfirm(false);
    const res = await publishResults(compId);
    setPublishing(false);
    if (res.error) { setMsg({ type: "err", text: res.error }); return; }
    setMsg({ type: "ok", text: "Results published and standings updated!" });
    setTimeout(() => setMsg(null), 3000);
    setCompOptions((opts) => opts.map((o) => o.fcId === compId ? { ...o, resultStatus: "published" } : o));
    await loadEntries();
  };

  const handleUnpublish = async () => {
    if (!feastId) return;
    setPublishing(true);
    const res = await unpublishResults(compId, feastId);
    setPublishing(false);
    if (res.error) { setMsg({ type: "err", text: res.error }); return; }
    setMsg({ type: "ok", text: "Reverted to draft" });
    setTimeout(() => setMsg(null), 2000);
    setCompOptions((opts) => opts.map((o) => o.fcId === compId ? { ...o, resultStatus: "draft" } : o));
    await loadEntries();
  };

  // ── Export the currently selected competition to PDF ──
  const handleExportPdf = () => {
    if (!selectedComp || !entries.length) return;
    const rows: PdfRow[] = entries.map((e) => {
      const p = previewMap[e.registrationId];
      return {
        name: e.name,
        houseName: e.houseName,
        shakhaName: e.shakhaName,
        grade: p?.grade ?? null,
        gradePoints: p?.gradePoints ?? 0,
        position: p?.position ?? null,
        positionPoints: p?.positionPoints ?? 0,
        sortPoints: p ? p.totalPoints : -1,
      };
    });
    const catLine = [selectedComp.catName, genderLabel(selectedComp.gender)].filter(Boolean).join(" | ");
    const section = renderResultSection(selectedComp.compName, catLine, sortPdfRows(rows.filter((r) => r.grade !== null)));
    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Results — ${escHtml(selectedComp.compName)}</title>
<style>${PDF_CSS}</style></head><body>
  ${section}
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
    if (!openPrintWindow(html)) {
      setMsg({ type: "err", text: "Allow pop-ups to export the results PDF." });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // ── Export every competition in the feast to one PDF ──
  const handleExportAll = async () => {
    if (!compOptions.length) return;
    setExportingAll(true);

    const fcIds = compOptions.map((c) => c.fcId);
    const [{ data: regData }, scoresResult] = await Promise.all([
      supabase
        .from("participant_registrations")
        .select("id, feast_competition_id, participant:participants(name, house_name, shakha:shakhas(name))")
        .in("feast_competition_id", fcIds),
      getScoresForCompetitions(fcIds),
    ]);
    setExportingAll(false);

    if (!regData || scoresResult.error || !scoresResult.data) {
      setMsg({ type: "err", text: "Failed to load results for export." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    const regsByComp = new Map<string, { registrationId: string; name: string; houseName: string | null; shakhaName: string }[]>();
    for (const r of regData) {
      const p = (Array.isArray(r.participant) ? r.participant[0] : r.participant) as Record<string, unknown> | null;
      const sh = p ? (Array.isArray(p.shakha) ? (p.shakha as unknown[])[0] : p.shakha) as Record<string, unknown> | null : null;
      const fcId = r.feast_competition_id as string;
      const row = {
        registrationId: r.id as string,
        name: (p?.name as string) ?? "—",
        houseName: (p?.house_name as string | null) ?? null,
        shakhaName: (sh?.name as string) ?? "—",
      };
      const list = regsByComp.get(fcId);
      if (list) list.push(row); else regsByComp.set(fcId, [row]);
    }

    const scoresByComp = scoresResult.data;
    const sections = compOptions.map((c) => {
      const regs = regsByComp.get(c.fcId) ?? [];
      const scoreMap: Record<string, number> = {};
      for (const s of scoresByComp[c.fcId] ?? []) scoreMap[s.registrationId] = s.score;

      const calcEntries = regs
        .filter((r) => scoreMap[r.registrationId] != null)
        .map((r) => ({ id: r.registrationId, score: scoreMap[r.registrationId] }));
      const results = calcAllResults(calcEntries, c.maxScore ?? 0);
      const resultMap = new Map(results.map((r) => [r.id, r]));

      const rows: PdfRow[] = regs.map((r) => {
        const res = resultMap.get(r.registrationId);
        return {
          name: r.name,
          houseName: r.houseName,
          shakhaName: r.shakhaName,
          grade: res?.grade ?? null,
          gradePoints: res?.gradePoints ?? 0,
          position: res?.position ?? null,
          positionPoints: res?.positionPoints ?? 0,
          sortPoints: res ? res.totalPoints : -1,
        };
      });

      const catLine = [c.catName, genderLabel(c.gender)].filter(Boolean).join(" | ");
      return renderResultSection(c.compName, catLine, sortPdfRows(rows.filter((r) => r.grade !== null)));
    }).join("");

    const feast = feasts.find((f) => f.id === feastId);
    const feastTitle = feast ? `${feast.name} ${feast.year}` : "Results";
    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Results — ${escHtml(feastTitle)}</title>
<style>${PDF_CSS}</style></head><body>
  ${sections}
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;

    if (!openPrintWindow(html)) {
      setMsg({ type: "err", text: "Allow pop-ups to export the results PDF." });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-200 bg-white";
  const maxScoreReady = maxScore != null && maxScore > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {showConfirm && (
        <PublishConfirm
          onConfirm={handlePublish}
          onCancel={() => setShowConfirm(false)}
          busy={publishing}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B46FF] to-[#A855F7] flex items-center justify-center shrink-0">
            <Medal size={17} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Results</h1>
            <p className="text-xs text-gray-500">Enter scores, preview grades, and publish</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={!selectedComp || !entries.length}
            title="Export the selected competition's results as a PDF"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-40 transition-colors"
            style={{ background: "linear-gradient(135deg,#6B46FF,#A855F7)" }}
          >
            <FileDown size={14} />
            Export PDF
          </button>
          <button
            onClick={handleExportAll}
            disabled={!compOptions.length || exportingAll}
            title="Export results for every competition in this feast"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-40 transition-colors"
            style={{ background: "linear-gradient(135deg,#4C1D95,#6B46FF)" }}
          >
            {exportingAll ? <Loader2 size={14} className="animate-spin" /> : <FileStack size={14} />}
            Export All
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Feast</label>
          <select value={feastId} onChange={(e) => setFeastId(e.target.value)} className={`${selectCls} w-full`}>
            {feasts.map((f) => <option key={f.id} value={f.id}>{f.name} {f.year}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Competition</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={compId}
                onChange={(e) => setCompId(e.target.value)}
                className={`${selectCls} w-full pr-8 appearance-none`}
              >
                {compOptions.map((c) => <option key={c.fcId} value={c.fcId}>{c.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {resultStatus === "published" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100 shrink-0">
                <Check size={12} /> Published
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Max Score gate */}
      <div className={`rounded-xl p-4 mb-4 border ${maxScoreReady ? "border-gray-200 bg-gray-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex items-center gap-3 flex-wrap">
          {!maxScoreReady ? (
            <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mr-auto">
              <AlertTriangle size={15} />
              Set max score to unlock score entry
            </div>
          ) : (
            <span className="text-sm text-gray-600 mr-auto">
              Max score: <strong>{maxScore}</strong>
            </span>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Max Score</label>
            <input
              type="number"
              min="1"
              value={maxScoreInput}
              onChange={(e) => setMaxScoreInput(e.target.value)}
              placeholder="e.g. 100"
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-200 bg-white"
            />
            <button
              onClick={handleSaveMax}
              disabled={savingMax}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50"
              style={{ background: "#6B46FF" }}
            >
              {savingMax ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {maxScoreReady ? "Update" : "Set"}
            </button>
          </div>
        </div>
      </div>

      {/* Message banner */}
      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {msg.type === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Score table or blocked state */}
      {!maxScoreReady ? (
        <div className="rounded-xl border-2 border-dashed border-amber-200 py-16 flex flex-col items-center gap-2 text-amber-400">
          <AlertTriangle size={24} />
          <p className="text-sm font-medium">Set max score above to enter scores</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">
          No participants registered for this competition.
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden sm:block bg-white rounded-xl overflow-hidden border border-[#1e1b4b] shadow-md mb-4">
            <table className="w-full text-sm min-w-[700px]">
              <thead style={{ background: "linear-gradient(90deg,#ede9fe,#f5f3ff)" }}>
                <tr className="border-b-2" style={{ borderColor: "#c4b5fd" }}>
                  {["#", "Reg No", `Score / ${maxScore}`, "Participant", "Shakha", "Grade", "Position", "Total"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider whitespace-nowrap" style={{ color: "#1e1b4b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const p = previewMap[e.registrationId];
                  const isEven = i % 2 === 0;
                  return (
                    <tr
                      key={e.registrationId}
                      className="border-b transition-colors"
                      style={{
                        borderColor: "#e5e7eb",
                        background: isEven ? "#fff" : "#f8f7ff",
                      }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = "#ede9fe")}
                      onMouseLeave={(ev) => (ev.currentTarget.style.background = isEven ? "#fff" : "#f8f7ff")}
                    >
                      <td className="px-3 py-3 text-xs font-black" style={{ color: "#4C1D95" }}>{i + 1}</td>
                      <td className="px-3 py-3">
                        <span className="inline-block font-mono text-[13px] font-black px-2.5 py-1 rounded-lg tracking-wide text-white" style={{ background: "#4C1D95" }}>
                          {e.regNo}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number" min="0" max={maxScore} step="0.5"
                          value={scores[e.registrationId] ?? ""}
                          onChange={(ev) => setScores((s) => ({ ...s, [e.registrationId]: ev.target.value }))}
                          placeholder="—"
                          disabled={resultStatus === "published"}
                          className="w-20 border-2 rounded-lg px-2 py-1.5 text-[15px] font-black text-center outline-none transition-colors disabled:opacity-50"
                          style={{ borderColor: "#ddd6fe", color: "#1e1b4b" }}
                          onFocus={(ev) => (ev.currentTarget.style.borderColor = "#6B46FF")}
                          onBlur={(ev) => (ev.currentTarget.style.borderColor = "#ddd6fe")}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-[14px] leading-tight" style={{ color: "#1e1b4b" }}>{e.name}</p>
                        {e.houseName && (
                          <p className="text-[12px] font-semibold mt-0.5" style={{ color: "#7C3AED" }}>{e.houseName}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[13px] font-semibold" style={{ color: "#4B5563" }}>{e.shakhaName}</span>
                      </td>
                      <td className="px-3 py-3 text-center"><GradeCell grade={p?.grade ?? null} pts={p?.gradePoints ?? 0} /></td>
                      <td className="px-3 py-3 text-center"><PosCell pos={p?.position ?? null} pts={p?.positionPoints ?? 0} /></td>
                      <td className="px-3 py-3">
                        {p ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-black text-[20px] leading-none" style={{ color: p.totalPoints > 0 ? "#6B46FF" : "#D1D5DB" }}>{p.totalPoints}</span>
                            <span className="text-[10px] font-semibold" style={{ color: "#A78BFA" }}>pts</span>
                          </div>
                        ) : <span className="text-gray-300 text-sm font-medium">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="sm:hidden space-y-2.5 mb-4">
            {entries.map((e, i) => {
              const p = previewMap[e.registrationId];
              return (
                <div key={e.registrationId} className="rounded-xl overflow-hidden" style={{ border: "1.5px solid #ddd6fe", boxShadow: "0 2px 8px rgba(107,70,255,0.08)" }}>
                  {/* Card header */}
                  <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 bg-white">
                    <span className="text-[13px] font-black font-mono w-5 shrink-0" style={{ color: "#4C1D95" }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-black leading-tight truncate" style={{ color: "#1e1b4b" }}>{e.name}</p>
                      {e.houseName && (
                        <p className="text-[12px] font-black mt-0.5" style={{ color: "#5B21B6" }}>{e.houseName}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[12px] font-black px-2 py-0.5 rounded-md tracking-wide text-white" style={{ background: "#4C1D95" }}>
                          {e.regNo}
                        </span>
                        <span className="text-[12px] font-bold" style={{ color: "#374151" }}>{e.shakhaName}</span>
                      </div>
                    </div>
                    {/* Total points */}
                    <div className="shrink-0 text-right">
                      {p ? (
                        <>
                          <span className="font-black text-[24px] leading-none" style={{ color: p.totalPoints > 0 ? "#4C1D95" : "#9CA3AF" }}>{p.totalPoints}</span>
                          <p className="text-[10px] font-black" style={{ color: "#5B21B6" }}>pts</p>
                        </>
                      ) : (
                        <span className="text-[20px] font-black" style={{ color: "#9CA3AF" }}>—</span>
                      )}
                    </div>
                  </div>

                  {/* Score row — dark background */}
                  <div className="flex items-center gap-3 px-3.5 py-3 border-t" style={{ background: "#ede9fe", borderColor: "#ddd6fe" }}>
                    <span className="text-[11px] font-black uppercase tracking-widest shrink-0" style={{ color: "#4C1D95" }}>Score</span>
                    <input
                      type="number" min="0" max={maxScore} step="0.5"
                      inputMode="decimal"
                      value={scores[e.registrationId] ?? ""}
                      onChange={(ev) => setScores((s) => ({ ...s, [e.registrationId]: ev.target.value }))}
                      placeholder="—"
                      disabled={resultStatus === "published"}
                      className="w-20 border-2 rounded-lg px-3 py-2 text-[16px] font-black text-center outline-none transition-colors bg-white disabled:opacity-40"
                      style={{ borderColor: "#c4b5fd", color: "#1e1b4b" }}
                      onFocus={(ev) => (ev.currentTarget.style.borderColor = "#7C3AED")}
                      onBlur={(ev) => (ev.currentTarget.style.borderColor = "#c4b5fd")}
                    />
                    <span className="text-[13px] font-black shrink-0" style={{ color: "#4C1D95" }}>/ {maxScore}</span>

                    {/* Live grade + position */}
                    {p ? (
                      <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                        <GradeCell grade={p.grade ?? null} pts={p.gradePoints} />
                        <PosCell pos={p.position ?? null} pts={p.positionPoints} />
                      </div>
                    ) : (
                      <span className="ml-auto text-[12px] font-bold" style={{ color: "#6D28D9" }}>enter score</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grade summary chips */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {(["A", "B", "C"] as const).map((g) => {
              const count = preview.filter((p) => p.grade === g).length;
              const { bg } = GRADE_SOLID[g];
              return (
                <div key={g} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-md text-white" style={{ background: bg }}>Grade {g}</span>
                  <span className="font-bold text-[15px] text-gray-800">{count}</span>
                  <span className="text-gray-400 text-xs">participants</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
              <span className="text-[12px] text-gray-500 font-medium">No grade</span>
              <span className="font-bold text-[15px] text-gray-800">{preview.filter((p) => !p.grade).length}</span>
            </div>
          </div>

          {/* Action buttons — full-width stacked on mobile */}
          {resultStatus === "draft" ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Draft
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={publishing}
                className="flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6B46FF,#A855F7)" }}
              >
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publish Results
              </button>
            </div>
          ) : (
            <div className="flex sm:justify-end">
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-white cursor-pointer disabled:opacity-50"
              >
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Unpublish (revert to draft)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
