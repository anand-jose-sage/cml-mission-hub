"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2, Check, Medal, ChevronDown, AlertTriangle,
  Save, Send, RotateCcw, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setMaxScore, saveDraftScores, publishResults, unpublishResults, getCompetitionScores } from "@/actions/results";
import {
  calcGrade, calcPositions, gradeColor, positionLabel,
  type Grade,
} from "@/lib/result-calculator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeastOption { id: string; name: string; year: string; }

interface CompOption {
  fcId: string;
  label: string;
  maxScore: number | null;
  resultStatus: "draft" | "published";
}

interface EntryRow {
  registrationId: string;
  regNo: string;
  name: string;
  shakhaName: string;
  savedScore: number | null;
}

// ─── Grade cell ───────────────────────────────────────────────────────────────

const GRADE_SOLID: Record<string, { bg: string; text: string }> = {
  A: { bg: "#16A34A", text: "#fff" },
  B: { bg: "#D97706", text: "#fff" },
  C: { bg: "#6B46FF", text: "#fff" },
};

function GradeCell({ grade, pts }: { grade: Grade; pts: number }) {
  if (!grade) return <span className="text-gray-300 text-sm font-medium">—</span>;
  const { bg, text } = GRADE_SOLID[grade];
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="inline-block text-[13px] font-bold px-3 py-1 rounded-lg leading-none"
        style={{ background: bg, color: text }}
      >
        Grade {grade}
      </span>
      <span className="text-[10px] text-gray-400 pl-0.5">+{pts} pts</span>
    </div>
  );
}

// ─── Position cell ────────────────────────────────────────────────────────────

const POS_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "#FEF9C3", border: "#F5C542", text: "#92400E" },
  2: { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" },
  3: { bg: "#FEF3E2", border: "#E0936A", text: "#7C2D12" },
};
const POS_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function PosCell({ pos, pts }: { pos: number | null; pts: number }) {
  if (!pos) return <span className="text-gray-300 text-sm font-medium">—</span>;
  const style = POS_COLORS[pos] ?? { bg: "#F3F4F6", border: "#E5E7EB", text: "#6B7280" };
  const emoji = POS_EMOJI[pos] ?? "";
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1 rounded-lg leading-none border"
        style={{ background: style.bg, borderColor: style.border, color: style.text }}
      >
        {emoji} {positionLabel(pos)}
      </span>
      {pts > 0 && <span className="text-[10px] text-gray-400 pl-0.5">+{pts} pts</span>}
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
      .select("id, max_score, result_status, display_order, competition:competitions(name, gender, competition_category:competition_categories(name))")
      .eq("feast_id", feastId)
      .order("display_order")
      .then(({ data }) => {
        const opts: CompOption[] = (data ?? []).map((fc) => {
          const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
          const cat = comp ? (Array.isArray(comp.competition_category) ? (comp.competition_category as unknown[])[0] : comp.competition_category) as Record<string, unknown> | null : null;
          const name = (comp?.name as string) ?? "Unknown";
          const catName = (cat?.name as string) ?? "";
          const gender = (comp?.gender as string) ?? "";
          const parts = [name, catName, gender].filter(Boolean);
          return {
            fcId: fc.id as string,
            label: parts.join(" · "),
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
        .select("id, participant:participants(name, registration_number, shakha:shakhas(name))")
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

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 bg-white";
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
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B46FF] to-[#A855F7] flex items-center justify-center shrink-0">
          <Medal size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Results</h1>
          <p className="text-xs text-gray-500">Enter scores, preview grades, and publish</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex gap-3 mb-4 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Feast</label>
          <select value={feastId} onChange={(e) => setFeastId(e.target.value)} className={selectCls}>
            {feasts.map((f) => <option key={f.id} value={f.id}>{f.name} {f.year}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Competition</label>
          <div className="relative">
            <select
              value={compId}
              onChange={(e) => setCompId(e.target.value)}
              className={`${selectCls} w-full pr-8 appearance-none`}
            >
              {compOptions.map((c) => <option key={c.fcId} value={c.fcId}>{c.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {resultStatus === "published" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
            <Check size={12} /> Published
          </span>
        )}
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto mb-4">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["#", "Reg No", "Participant", "Shakha", `Score / ${maxScore}`, "Grade", "Position", "Total"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const p = previewMap[e.registrationId];
                  return (
                    <tr key={e.registrationId} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-3 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3">
                        <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "#6B46FF12", color: "#6B46FF" }}>
                          {e.regNo}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{e.name}</td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{e.shakhaName}</td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          max={maxScore}
                          step="0.5"
                          value={scores[e.registrationId] ?? ""}
                          onChange={(ev) => setScores((s) => ({ ...s, [e.registrationId]: ev.target.value }))}
                          placeholder="—"
                          disabled={resultStatus === "published"}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-purple-200 disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                      <td className="px-3 py-3"><GradeCell grade={p?.grade ?? null} pts={p?.gradePoints ?? 0} /></td>
                      <td className="px-3 py-3"><PosCell pos={p?.position ?? null} pts={p?.positionPoints ?? 0} /></td>
                      <td className="px-3 py-3">
                        {p ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-[18px] leading-none" style={{ color: p.totalPoints > 0 ? "#6B46FF" : "#D1D5DB" }}>
                              {p.totalPoints}
                            </span>
                            <span className="text-[10px] text-gray-400">pts</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Grade summary chips */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {(["A", "B", "C"] as const).map((g) => {
              const count = preview.filter((p) => p.grade === g).length;
              const { bg, text } = GRADE_SOLID[g];
              return (
                <div key={g} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-md" style={{ background: bg, color: text }}>
                    Grade {g}
                  </span>
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

          {/* Action buttons */}
          {resultStatus === "draft" ? (
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Draft
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={publishing}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6B46FF,#A855F7)" }}
              >
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publish Results
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-white cursor-pointer disabled:opacity-50"
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
