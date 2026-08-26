"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, Layers, ChevronDown, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updateCompetitionStatus } from "@/actions/feast";
import type { CompStatusInput } from "@/actions/feast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeastOption { id: string; name: string; year: string; }

interface CompRow {
  fcId: string;
  name: string;
  gender: string | null;
  catLabel: string | null;
  compStatus: string;
  stage: string;
  scheduledTime: string;
  progressPct: number | null;
  info: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "upcoming",    label: "Upcoming",  color: "#6B7280" },
  { value: "progressing", label: "Live",      color: "#D97706" },
  { value: "completed",   label: "Completed", color: "#16A34A" },
  { value: "published",   label: "Published", color: "#6B46FF" },
] as const;

function statusColor(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.color ?? "#6B7280";
}

function genderTag(g: string | null) {
  if (!g) return null;
  const l = g.toLowerCase();
  if (l === "boy" || l === "boys" || l === "male")   return { text: "Boys",   bg: "#EFF6FF", color: "#3B82F6" };
  if (l === "girl" || l === "girls" || l === "female") return { text: "Girls", bg: "#FDF2F8", color: "#EC4899" };
  return { text: "Common", bg: "#F5F3FF", color: "#7C3AED" };
}

// ─── Row component ────────────────────────────────────────────────────────────

function CompCard({
  row,
  onSaved,
}: {
  row: CompRow;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    compStatus: row.compStatus,
    stage: row.stage,
    scheduledTime: row.scheduledTime,
    progressPct: row.progressPct != null ? String(row.progressPct) : "",
    info: row.info,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [err, setErr]       = useState("");

  const dirty =
    form.compStatus   !== row.compStatus ||
    form.stage        !== row.stage ||
    form.scheduledTime !== row.scheduledTime ||
    form.info         !== row.info ||
    (form.progressPct !== (row.progressPct != null ? String(row.progressPct) : ""));

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setErr("");
    const payload: CompStatusInput = {
      feastCompetitionId: row.fcId,
      compStatus: form.compStatus as CompStatusInput["compStatus"],
      stage: form.stage,
      scheduledTime: form.scheduledTime,
      progressPct: form.compStatus === "progressing" && form.progressPct !== ""
        ? Number(form.progressPct)
        : null,
      info: form.info,
    };
    const res = await updateCompetitionStatus(payload);
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  const gen = genderTag(row.gender);

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 bg-white";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-[15px] text-gray-900 truncate">{row.name}</span>
          {gen && (
            <span
              className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: gen.bg, color: gen.color }}
            >
              {gen.text}
            </span>
          )}
          {row.catLabel && (
            <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {row.catLabel}
            </span>
          )}
        </div>
        {/* current status badge */}
        <span
          className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
          style={{
            background: `${statusColor(row.compStatus)}18`,
            color: statusColor(row.compStatus),
          }}
        >
          {STATUS_OPTIONS.find((o) => o.value === row.compStatus)?.label ?? row.compStatus}
        </span>
      </div>

      {/* Fields */}
      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <div className="relative">
            <select
              value={form.compStatus}
              onChange={(e) => set("compStatus", e.target.value)}
              className={`${inputCls} pr-8 appearance-none`}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stage */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
          <input
            type="text"
            placeholder="e.g. STAGE 3 — SPEECH B"
            value={form.stage}
            onChange={(e) => set("stage", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Scheduled time */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Scheduled Time</label>
          <input
            type="text"
            placeholder="e.g. 9:30 AM"
            value={form.scheduledTime}
            onChange={(e) => set("scheduledTime", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Progress % — only when Live */}
        {form.compStatus === "progressing" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Progress %</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0 – 100"
              value={form.progressPct}
              onChange={(e) => set("progressPct", e.target.value)}
              className={inputCls}
            />
          </div>
        )}

        {/* Info — full width */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Info</label>
          <textarea
            rows={3}
            placeholder="Venue details, rules, announcements…"
            value={form.info}
            onChange={(e) => set("info", e.target.value)}
            className={`${inputCls} resize-y`}
          />
        </div>
      </div>

      {/* Footer */}
      {(dirty || err) && (
        <div className="px-4 pb-3 flex items-center justify-between gap-3">
          {err
            ? <p className="text-xs text-red-500">{err}</p>
            : <p className="text-xs text-gray-400">Unsaved changes</p>
          }
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50 transition-all"
            style={{ background: saved ? "#dcfce7" : "#6B46FF", color: saved ? "#16a34a" : "#fff" }}
          >
            {saving
              ? <Loader2 size={14} className="animate-spin" />
              : saved
                ? <><Check size={14} /> Saved</>
                : <><Save size={14} /> Save</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompetitionsAdminPage() {
  const [feasts,      setFeasts]      = useState<FeastOption[]>([]);
  const [feastId,     setFeastId]     = useState("");
  const [comps,       setComps]       = useState<CompRow[]>([]);
  const [catFilter,   setCatFilter]   = useState("");
  const [loading,     setLoading]     = useState(false);
  const [version,     setVersion]     = useState(0);

  // Load feasts once
  useEffect(() => {
    supabase.from("feasts").select("id,name,year").order("start_date")
      .then(({ data }) => {
        if (data?.length) { setFeasts(data); setFeastId(data[0].id); }
      });
  }, []);

  // Load competitions for selected feast
  const load = useCallback(async () => {
    if (!feastId) return;
    setLoading(true);
    const { data } = await supabase
      .from("feast_competitions")
      .select(`
        id, comp_status, stage, scheduled_time, progress_pct, info, display_order,
        competition:competitions(
          name, gender,
          competition_category:competition_categories(name)
        )
      `)
      .eq("feast_id", feastId)
      .order("display_order");

    const rows: CompRow[] = (data ?? []).map((fc) => {
      const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
      const cat  = comp
        ? (Array.isArray(comp.competition_category)
          ? (comp.competition_category as unknown[])[0]
          : comp.competition_category) as Record<string, unknown> | null
        : null;
      return {
        fcId:          fc.id as string,
        name:          (comp?.name  as string) ?? "—",
        gender:        (comp?.gender as string) ?? null,
        catLabel:      (cat?.name   as string) ?? null,
        compStatus:    (fc.comp_status as string) ?? "upcoming",
        stage:         (fc.stage as string) ?? "",
        scheduledTime: (fc.scheduled_time as string) ?? "",
        progressPct:   fc.progress_pct != null ? (fc.progress_pct as number) : null,
        info:          (fc.info as string) ?? "",
      };
    });

    setComps(rows);
    setCatFilter("");
    setLoading(false);
  }, [feastId, version]);          // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 bg-white";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B46FF] to-[#A855F7] flex items-center justify-center shrink-0">
          <Layers size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Competition Management</h1>
          <p className="text-xs text-gray-500">Update status, stage, time, and info for each competition</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Feast</label>
          <select value={feastId} onChange={(e) => setFeastId(e.target.value)} className={selectCls}>
            {feasts.map((f) => (
              <option key={f.id} value={f.id}>{f.name} {f.year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={selectCls}>
            <option value="">All Categories</option>
            {[...new Set(comps.map((c) => c.catLabel).filter(Boolean))].map((cat) => (
              <option key={cat!} value={cat!}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Competition list */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : comps.length === 0 ? (
        <div className="text-center py-14 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No competitions found for this feast.
        </div>
      ) : (() => {
        const filtered = catFilter ? comps.filter((c) => c.catLabel === catFilter) : comps;
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              {filtered.length} competition{filtered.length !== 1 ? "s" : ""}
              {catFilter && <span className="ml-1 text-purple-500 font-medium">· {catFilter}</span>}
            </p>
            {filtered.map((row) => (
              <CompCard
                key={row.fcId}
                row={row}
                onSaved={() => setVersion((v) => v + 1)}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
