"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Search, X, ChevronDown, ClipboardCheck, UserX, FileDown, FileStack, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setParticipation } from "@/actions/feast";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";
import { getScoreHeadings } from "@/lib/scoresheet-headings";
import { getCompetitionSubject } from "@/lib/competition-subjects";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeastOption  { id: string; name: string; year: string; }
interface ShakhaOption { id: string; name: string; }

interface CompOption {
  fcId: string;
  label: string;
  compName: string;
  catName: string;
  gender: string | null;
  catSlug: string | null;
}

interface EntryRow {
  regId: string;        // participant_registration id
  regNo: string | null;
  name: string;
  houseName: string | null;
  shakhaName: string;
  shakhaId: string;
  catSlug: string | null;
  participated: boolean;
}

// ─── Score-sheet print helpers ─────────────────────────────────────────────────
// Shared by the single-competition export and the "export all" bulk export so
// both produce an identical table layout.

const SL_W = 7, REG_W = 25, TOT_W = 14;

// Anek Malayalam — used for the printed subject line on each sheet.
const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@400;600;700&display=swap" rel="stylesheet">`;

const SHEET_CSS = `
  @page { size: A4 portrait; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  .sheet { border-left: 6px solid #BE185D; border-right: 6px solid #BE185D; padding-left: 12px; padding-right: 12px; }
  .sheet:not(:last-child) { page-break-after: always; }
  .hdr { text-align: center; margin-bottom: 14px; }
  .hdr .feast { font-size: 13px; letter-spacing: .04em; text-transform: uppercase; color: #444; margin: 0 0 4px; }
  .hdr .comp { font-size: 22px; font-weight: 800; margin: 0 0 2px; }
  .hdr .cat { font-size: 14px; font-weight: 600; color: #333; margin: 0; }
  .subject {
    font-family: "Anek Malayalam", Arial, sans-serif;
    text-align: center; font-size: 15px; font-weight: 600; line-height: 1.5;
    color: #111; margin: 10px 4px; min-height: 52px; white-space: pre-line;
  }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #333; height: 28px; text-align: center; font-size: 13px; }
  thead th {
    background: #f0f0f0; font-size: 11px; text-transform: uppercase; letter-spacing: .03em;
    height: auto; padding: 5px 3px; white-space: normal; overflow-wrap: break-word; line-height: 1.25;
  }
  thead th.score-head { text-transform: none; font-size: 10.5px; }
  col.c-sl  { width: ${SL_W}%; }
  col.c-reg { width: ${REG_W}%; }
  col.c-tot { width: ${TOT_W}%; }
  td.sl  { font-weight: 700; }
  td.reg { font-family: "Courier New", monospace; font-weight: 700; letter-spacing: .02em; }
  @media print { .noprint { display: none; } }
  .noprint { text-align: center; margin: 18px 0; }
  .noprint button { font-size: 14px; padding: 8px 18px; cursor: pointer; }
`;

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** One competition's header + judging table — a full print page. */
function renderSheetSection(comp: CompOption, feastTitle: string, regNos: string[]): string {
  const rowCount = Math.max(26, regNos.length);
  const catLine = [comp.catName, comp.gender].filter(Boolean).join(" · ");
  const scoreHeadings = getScoreHeadings(comp.compName, comp.catSlug);
  const subject = getCompetitionSubject(comp.compName, comp.catSlug);
  const scoreCols = scoreHeadings.length;
  const scW = (100 - SL_W - REG_W - TOT_W) / scoreCols;

  const bodyRows = Array.from({ length: rowCount }, (_, i) => {
    const reg = regNos[i] ?? "";
    const scoreCells = Array.from({ length: scoreCols }, () => `<td class="sc"></td>`).join("");
    return `<tr>
        <td class="sl">${i + 1}</td>
        <td class="reg">${escHtml(reg)}</td>
        ${scoreCells}
        <td class="tot"></td>
      </tr>`;
  }).join("");

  return `<section class="sheet">
    <div class="hdr">
      <p class="feast">${escHtml(feastTitle)}</p>
      <p class="comp">${escHtml(comp.compName)}</p>
      <p class="cat">${escHtml(catLine)}</p>
    </div>
    <div class="subject">${escHtml(subject)}</div>
    <table>
      <colgroup>
        <col class="c-sl"><col class="c-reg">
        ${Array.from({ length: scoreCols }, () => `<col style="width:${scW}%">`).join("")}
        <col class="c-tot">
      </colgroup>
      <thead>
        <tr>
          <th>SL</th><th>Registration No</th>
          ${scoreHeadings.map((h) => `<th class="score-head">${escHtml(h)}</th>`).join("")}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </section>`;
}

/** Registration numbers per feast_competition, sorted, optionally restricted to those marked as took part. */
async function fetchRegNosByComp(
  fcIds: string[],
  participatedOnly: boolean
): Promise<{ regNosByComp: Map<string, string[]> | null; error: boolean }> {
  let query = supabase
    .from("participant_registrations")
    .select("feast_competition_id, participant:participants(registration_number)")
    .in("feast_competition_id", fcIds);
  if (participatedOnly) query = query.eq("participated", true);
  const { data, error } = await query;
  if (error) return { regNosByComp: null, error: true };

  const regNosByComp = new Map<string, string[]>();
  for (const r of data ?? []) {
    const p = (Array.isArray(r.participant) ? r.participant[0] : r.participant) as Record<string, unknown> | null;
    const regNo = (p?.registration_number as string | null) ?? "—";
    const fcId = r.feast_competition_id as string;
    const list = regNosByComp.get(fcId);
    if (list) list.push(regNo); else regNosByComp.set(fcId, [regNo]);
  }
  for (const list of regNosByComp.values()) {
    list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }
  return { regNosByComp, error: false };
}

/** Opens a blank tab, writes the given HTML document, and triggers print. Returns false if the pop-up was blocked. */
function openPrintWindow(html: string): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Give the new document a tick to lay out, then open the print dialog.
  // (onload can fire before this handler attaches after document.write, so
  // use a short timeout; the in-page "Print" button is a manual fallback.)
  setTimeout(() => { w.focus(); w.print(); }, 350);
  return true;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ParticipationPage() {
  const [feasts,   setFeasts]   = useState<FeastOption[]>([]);
  const [feastId,  setFeastId]  = useState("");
  const [comps,    setComps]    = useState<CompOption[]>([]);
  const [compId,   setCompId]   = useState("");
  const [shakhas,  setShakhas]  = useState<ShakhaOption[]>([]);
  const [shakhaId, setShakhaId] = useState("");
  const [query,    setQuery]    = useState("");
  const [entries,  setEntries]  = useState<EntryRow[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [msg,      setMsg]      = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportingJudge, setExportingJudge] = useState(false);

  const selectedFeast = feasts.find((f) => f.id === feastId) ?? null;

  // ── Load feasts + shakhas ──
  useEffect(() => {
    supabase.from("feasts").select("id,name,year").order("start_date")
      .then(({ data }) => {
        if (data?.length) { setFeasts(data); setFeastId(data[0].id); }
      });
    supabase.from("shakhas").select("id,name").order("name")
      .then(({ data }) => setShakhas(data ?? []));
  }, []);

  // ── Load competitions for feast ──
  useEffect(() => {
    if (!feastId) return;
    setCompId("");
    supabase
      .from("feast_competitions")
      .select("id, display_order, competition:competitions(name, gender, competition_category:competition_categories(name,slug))")
      .eq("feast_id", feastId)
      .order("display_order")
      .then(({ data }) => {
        const opts: CompOption[] = (data ?? []).map((fc) => {
          const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
          const cat  = comp ? (Array.isArray(comp.competition_category) ? (comp.competition_category as unknown[])[0] : comp.competition_category) as Record<string, unknown> | null : null;
          const name    = (comp?.name   as string) ?? "Unknown";
          const gender  = (comp?.gender as string) ?? "";
          const catName = (cat?.name    as string) ?? "";
          const catSlug = (cat?.slug    as string) ?? null;
          return {
            fcId: fc.id as string,
            label: [name, catName, gender].filter(Boolean).join(" · "),
            compName: name,
            catName,
            gender: gender || null,
            catSlug,
          };
        });
        setComps(opts);
        setCompId(opts[0]?.fcId ?? "");
      });
  }, [feastId]);

  // ── Load registrations for competition ──
  const loadEntries = useCallback(async () => {
    if (!compId) { setEntries([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("participant_registrations")
      .select("id, participated, participant:participants(name, registration_number, house_name, shakha:shakhas(id,name), competition_category:competition_categories(slug))")
      .eq("feast_competition_id", compId);

    const rows: EntryRow[] = (data ?? []).map((r) => {
      const p   = (Array.isArray(r.participant) ? r.participant[0] : r.participant) as Record<string, unknown> | null;
      const sh  = p ? (Array.isArray(p.shakha) ? (p.shakha as unknown[])[0] : p.shakha) as Record<string, unknown> | null : null;
      const cat = p ? (Array.isArray(p.competition_category) ? (p.competition_category as unknown[])[0] : p.competition_category) as Record<string, unknown> | null : null;
      return {
        regId:        r.id as string,
        regNo:        (p?.registration_number as string | null) ?? null,
        name:         (p?.name        as string) ?? "—",
        houseName:    (p?.house_name  as string | null) ?? null,
        shakhaName:   (sh?.name       as string) ?? "—",
        shakhaId:     (sh?.id         as string) ?? "",
        catSlug:      (cat?.slug      as string | null) ?? null,
        participated: Boolean(r.participated),
      };
    });

    // Sort by reg number for a stable, scannable order
    rows.sort((a, b) => (a.regNo ?? "").localeCompare(b.regNo ?? "", undefined, { numeric: true }));

    setEntries(rows);
    setLoading(false);
  }, [compId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── Filtered view (search + shakha) ──
  const visible = entries.filter((r) => {
    if (shakhaId && r.shakhaId !== shakhaId) return false;
    if (query) {
      const q = query.toLowerCase();
      return r.name.toLowerCase().includes(q) || (r.regNo ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const markedCount = entries.filter((e) => e.participated).length;

  // ── Instant save on toggle ──
  const toggle = async (row: EntryRow) => {
    const next = !row.participated;
    // optimistic update
    setEntries((rows) => rows.map((r) => r.regId === row.regId ? { ...r, participated: next } : r));
    setSaving((s) => ({ ...s, [row.regId]: true }));
    const res = await setParticipation(row.regId, next);
    setSaving((s) => { const c = { ...s }; delete c[row.regId]; return c; });
    if (res.error) {
      // revert
      setEntries((rows) => rows.map((r) => r.regId === row.regId ? { ...r, participated: row.participated } : r));
      setMsg({ type: "err", text: res.error });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // ── PDF (print) export — one judge sheet per competition (took-part only), 3 copies each ──
  const exportJudgeSheets = async () => {
    if (!comps.length) return;
    setExportingJudge(true);
    const { regNosByComp, error } = await fetchRegNosByComp(comps.map((c) => c.fcId), true);
    setExportingJudge(false);

    if (error || !regNosByComp) {
      setMsg({ type: "err", text: "Failed to load registrations for export." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    const feastTitle = selectedFeast ? `${selectedFeast.name} ${selectedFeast.year}` : "";
    const sections = comps
      .flatMap((c) => {
        const regNos = regNosByComp.get(c.fcId) ?? [];
        return Array.from({ length: 3 }, () => renderSheetSection(c, feastTitle, regNos));
      })
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Judge Sheets — ${escHtml(feastTitle)}</title>
${FONT_LINK}
<style>${SHEET_CSS}</style></head><body>
  ${sections}
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;

    if (!openPrintWindow(html)) {
      setMsg({ type: "err", text: "Allow pop-ups to export the judge sheets." });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // ── PDF (print) export — every competition in the feast, all registrations ──
  const exportAllPDF = async () => {
    if (!comps.length) return;
    setExportingAll(true);
    const { regNosByComp, error } = await fetchRegNosByComp(comps.map((c) => c.fcId), false);
    setExportingAll(false);

    if (error || !regNosByComp) {
      setMsg({ type: "err", text: "Failed to load registrations for export." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    const feastTitle = selectedFeast ? `${selectedFeast.name} ${selectedFeast.year}` : "";
    const sections = comps.map((c) => renderSheetSection(c, feastTitle, regNosByComp.get(c.fcId) ?? [])).join("");

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Score Sheets — ${escHtml(feastTitle)}</title>
${FONT_LINK}
<style>${SHEET_CSS}</style></head><body>
  ${sections}
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;

    if (!openPrintWindow(html)) {
      setMsg({ type: "err", text: "Allow pop-ups to export the score sheets." });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-200 bg-white w-full";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#BE185D] to-[#EC4899] flex items-center justify-center shrink-0">
          <ClipboardCheck size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
          <p className="text-xs text-gray-500">Mark who took part, then export the judging sheet</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Feast</label>
          <select value={feastId} onChange={(e) => setFeastId(e.target.value)} className={selectCls}>
            {feasts.map((f) => <option key={f.id} value={f.id}>{f.name} {f.year}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Competition</label>
          <div className="relative">
            <select value={compId} onChange={(e) => setCompId(e.target.value)} className={`${selectCls} pr-8 appearance-none`}>
              {comps.map((c) => <option key={c.fcId} value={c.fcId}>{c.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search + shakha filter + export */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or reg no…"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-200 bg-white text-gray-800"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer p-0">
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={shakhaId}
            onChange={(e) => setShakhaId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-200 bg-white pr-8 appearance-none"
          >
            <option value="">All Shakhas</option>
            {shakhas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={exportJudgeSheets}
          disabled={!comps.length || exportingJudge}
          title="Export a judge sheet (3 copies each) for every competition in this feast, with only participants marked as took part"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-40 transition-colors"
          style={{ background: "linear-gradient(135deg,#BE185D,#EC4899)" }}
        >
          {exportingJudge ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          Export Judge Sheet
        </button>
        <button
          onClick={exportAllPDF}
          disabled={!comps.length || exportingAll}
          title="Export a score sheet for every competition in this feast, with all registered participants"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-40 transition-colors"
          style={{ background: "linear-gradient(135deg,#831843,#BE185D)" }}
        >
          {exportingAll ? <Loader2 size={14} className="animate-spin" /> : <FileStack size={14} />}
          Export All
        </button>
      </div>

      {/* Message banner */}
      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {msg.text}
        </div>
      )}

      {/* Count badge */}
      {!loading && entries.length > 0 && (
        <p className="text-xs font-semibold mb-3" style={{ color: "#BE185D" }}>
          {markedCount} of {entries.length} marked participated
        </p>
      )}

      {/* Table / states */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : !compId ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">
          Select a competition above
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-14 flex flex-col items-center gap-2 text-gray-400">
          <UserX size={24} />
          <p className="text-sm font-medium">No registrations found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl overflow-hidden border border-[#1e1b4b] shadow-md mb-4">
            <table className="w-full text-sm min-w-[620px]">
              <thead style={{ background: "linear-gradient(90deg,#fce7f3,#fdf2f8)" }}>
                <tr className="border-b-2" style={{ borderColor: "#f9a8d4" }}>
                  {["Took part", "Reg No", "Participant", "House", "Shakha"].map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider ${h === "Took part" ? "" : "whitespace-nowrap"}`}
                      style={{ color: "#831843", ...(h === "Took part" ? { width: 70 } : {}) }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((e, i) => {
                  const isEven = i % 2 === 0;
                  const catColor = e.catSlug ? (CATEGORY_COLORS[e.catSlug] ?? "#BE185D") : "#BE185D";
                  return (
                    <tr
                      key={e.regId}
                      className="border-b transition-colors cursor-pointer"
                      style={{ borderColor: "#e5e7eb", background: e.participated ? "#fdf2f8" : (isEven ? "#fff" : "#fafafa") }}
                      onClick={() => toggle(e)}
                    >
                      <td className="px-3 py-3" style={{ width: 70 }}>
                        <Checkbox checked={e.participated} busy={!!saving[e.regId]} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block font-mono text-[13px] font-black px-2.5 py-1 rounded-lg tracking-wide text-white" style={{ background: "#831843" }}>
                          {e.regNo ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-[14px] leading-tight" style={{ color: "#1e1b4b" }}>{e.name}</p>
                        {e.catSlug && (
                          <span className="inline-block text-[11px] font-bold mt-0.5 px-1.5 py-0.5 rounded text-white" style={{ background: catColor }}>
                            {CATEGORY_LABELS[e.catSlug] ?? e.catSlug}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[13px] font-semibold" style={{ color: "#5B21B6" }}>{e.houseName ?? "—"}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[13px] font-semibold" style={{ color: "#374151" }}>{e.shakhaName}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2.5 mb-4">
            {visible.map((e) => {
              const catColor = e.catSlug ? (CATEGORY_COLORS[e.catSlug] ?? "#BE185D") : "#BE185D";
              return (
                <div
                  key={e.regId}
                  onClick={() => toggle(e)}
                  className="bg-white rounded-xl overflow-hidden cursor-pointer"
                  style={{ border: e.participated ? "1.5px solid #f472b6" : "1.5px solid #e5e7eb", boxShadow: "0 2px 8px rgba(190,24,93,0.06)" }}
                >
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <Checkbox checked={e.participated} busy={!!saving[e.regId]} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-black leading-tight truncate" style={{ color: "#1e1b4b" }}>{e.name}</p>
                      {e.houseName && (
                        <p className="text-[12px] font-black mt-0.5" style={{ color: "#5B21B6" }}>{e.houseName}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="font-mono text-[12px] font-black px-2 py-0.5 rounded-md tracking-wide text-white" style={{ background: "#831843" }}>
                          {e.regNo ?? "—"}
                        </span>
                        <span className="text-[12px] font-bold" style={{ color: "#374151" }}>{e.shakhaName}</span>
                      </div>
                    </div>
                    {e.catSlug && (
                      <span className="shrink-0 text-[11px] font-black px-2 py-1 rounded-lg text-white" style={{ background: catColor }}>
                        {CATEGORY_LABELS[e.catSlug] ?? e.catSlug}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, busy }: { checked: boolean; busy: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors shrink-0"
      style={{
        borderColor: checked ? "#BE185D" : "#cbd5e1",
        background: checked ? "#BE185D" : "#fff",
      }}
    >
      {busy
        ? <Loader2 size={13} className="animate-spin" color={checked ? "#fff" : "#BE185D"} />
        : checked ? <Check size={15} color="#fff" strokeWidth={3} /> : null}
    </span>
  );
}
