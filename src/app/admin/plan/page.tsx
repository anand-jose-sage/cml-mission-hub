"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, AlertTriangle, Plus, Trash2, BookOpen, ChevronDown } from "lucide-react";
import { getPlanContent, savePlanEntry } from "@/actions/plan";
import { PLAN_KEY } from "@/lib/plan-theme";
import type { PlanMeta, PlanMonth, PlanProgram, PlanFeastDay } from "@/types";

interface Entry {
  key: string;
  label: string;
  sort: number;
  type: "meta" | "month";
  value: PlanMeta | PlanMonth;
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

// Editor for a string[] (stones, etc.)
function StringList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      {items.map((s, i) => (
        <div key={i} className="flex gap-1.5">
          <input value={s} placeholder={placeholder} onChange={(e) => onChange(items.map((x, j) => j === i ? e.target.value : x))} className={inputCls} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 w-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center bg-transparent cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} className="text-xs font-semibold inline-flex items-center gap-1 text-[#6B46FF] bg-transparent border-none cursor-pointer">
        <Plus size={13} /> Add
      </button>
    </div>
  );
}

// Editor for {title, desc}[] (programs)
function ProgramEditor({ items, onChange }: { items: PlanProgram[]; onChange: (v: PlanProgram[]) => void }) {
  const upd = (i: number, patch: Partial<PlanProgram>) => onChange(items.map((x, j) => j === i ? { ...x, ...patch } : x));
  return (
    <div className="space-y-2">
      {items.map((p, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-2.5 space-y-1.5">
          <div className="flex gap-1.5">
            <input value={p.title} placeholder="Title" onChange={(e) => upd(i, { title: e.target.value })} className={inputCls} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 w-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center bg-transparent cursor-pointer">
              <Trash2 size={14} />
            </button>
          </div>
          <textarea value={p.desc} placeholder="Description" rows={2} onChange={(e) => upd(i, { desc: e.target.value })} className={`${inputCls} resize-none`} />
        </div>
      ))}
      <button onClick={() => onChange([...items, { title: "", desc: "" }])} className="text-xs font-semibold inline-flex items-center gap-1 text-[#6B46FF] bg-transparent border-none cursor-pointer">
        <Plus size={13} /> Add program
      </button>
    </div>
  );
}

// Editor for feast days
function FeastEditor({ items, onChange }: { items: PlanFeastDay[]; onChange: (v: PlanFeastDay[]) => void }) {
  const upd = (i: number, patch: Partial<PlanFeastDay>) => onChange(items.map((x, j) => j === i ? { ...x, ...patch } : x));
  return (
    <div className="space-y-2">
      {items.map((f, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-2.5 grid grid-cols-2 gap-1.5">
          <input value={f.date} placeholder="Date (3 ജൂലൈ)" onChange={(e) => upd(i, { date: e.target.value })} className={inputCls} />
          <input value={f.day} placeholder="Day (വെള്ളി)" onChange={(e) => upd(i, { day: e.target.value })} className={inputCls} />
          <input value={f.name} placeholder="Name" onChange={(e) => upd(i, { name: e.target.value })} className={`${inputCls} col-span-2`} />
          <input value={f.type} placeholder="Type (തിരുനാൾ)" onChange={(e) => upd(i, { type: e.target.value })} className={inputCls} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center bg-transparent cursor-pointer text-xs gap-1"><Trash2 size={13} /> Remove</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { date: "", day: "", name: "", type: "" }])} className="text-xs font-semibold inline-flex items-center gap-1 text-[#6B46FF] bg-transparent border-none cursor-pointer">
        <Plus size={13} /> Add feast day
      </button>
    </div>
  );
}

export default function AdminPlanPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selKey, setSelKey] = useState<string>("");
  const [draft, setDraft] = useState<PlanMeta | PlanMonth | null>(null);
  const [metaJson, setMetaJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { meta, months } = await getPlanContent();
    const list: Entry[] = [];
    if (meta) list.push({ key: `${PLAN_KEY}:meta`, label: "വർഷം · Year (meta)", sort: 0, type: "meta", value: meta });
    for (const m of months) list.push({ key: `${PLAN_KEY}:${m.monthKey}`, label: `${m.monthMl} · ${m.actionTheme}`, sort: m.index, type: "month", value: m });
    setEntries(list);
    setSelKey((cur) => cur || list[0]?.key || "");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sel = entries.find((e) => e.key === selKey) ?? null;

  // when selection changes, seed the draft
  useEffect(() => {
    if (!sel) { setDraft(null); return; }
    if (sel.type === "meta") setMetaJson(JSON.stringify(sel.value, null, 2));
    else setDraft(structuredClone(sel.value));
  }, [selKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const month = draft as PlanMonth | null;
  const setMonth = (patch: Partial<PlanMonth>) => setMonth2((m) => ({ ...m, ...patch }));
  const setMonth2 = (fn: (m: PlanMonth) => PlanMonth) => setDraft((d) => d ? fn(d as PlanMonth) : d);

  const save = async () => {
    if (!sel) return;
    setSaving(true);
    setMsg(null);
    let value: unknown;
    if (sel.type === "meta") {
      try { value = JSON.parse(metaJson); }
      catch { setSaving(false); setMsg({ type: "err", text: "Invalid JSON" }); return; }
    } else {
      value = draft;
    }
    const res = await savePlanEntry(sel.key, value, sel.sort);
    setSaving(false);
    if (res.error) { setMsg({ type: "err", text: res.error }); return; }
    setMsg({ type: "ok", text: "Saved" });
    setTimeout(() => setMsg(null), 2000);
    await load();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B0892F] to-[#DE8C6F] flex items-center justify-center shrink-0">
          <BookOpen size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Annual Plan</h1>
          <p className="text-xs text-gray-500">പ്രവർത്തന മാർഗ്ഗരേഖ 2026-27 content</p>
        </div>
      </div>

      {/* entry selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
        <div className="relative">
          <select value={selKey} onChange={(e) => setSelKey(e.target.value)} className={`${inputCls} pr-8 appearance-none font-semibold`}>
            {entries.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {msg.type === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}{msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
      ) : sel?.type === "meta" ? (
        <div>
          <Field label="Year-level content (JSON)">
            <textarea value={metaJson} onChange={(e) => setMetaJson(e.target.value)} rows={22} className={`${inputCls} font-mono text-[12px] resize-y`} spellCheck={false} />
          </Field>
          <p className="text-xs text-gray-400 mt-1">Edits objectives, projects, build-the-church, virtues and awards. Keep valid JSON.</p>
        </div>
      ) : month ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Month (ML)"><input value={month.monthMl} onChange={(e) => setMonth({ monthMl: e.target.value })} className={inputCls} /></Field>
            <Field label="Month (EN)"><input value={month.monthEn} onChange={(e) => setMonth({ monthEn: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Action theme"><input value={month.actionTheme} onChange={(e) => setMonth({ actionTheme: e.target.value })} className={inputCls} /></Field>
          <Field label="Church line"><input value={month.churchLine} onChange={(e) => setMonth({ churchLine: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Church part (ML)"><input value={month.churchPart.ml} onChange={(e) => setMonth({ churchPart: { ...month.churchPart, ml: e.target.value } })} className={inputCls} /></Field>
            <Field label="Church part (EN)"><input value={month.churchPart.en} onChange={(e) => setMonth({ churchPart: { ...month.churchPart, en: e.target.value } })} className={inputCls} /></Field>
            <Field label="Part index"><input type="number" value={month.churchPart.index} onChange={(e) => setMonth({ churchPart: { ...month.churchPart, index: parseInt(e.target.value) || 0 } })} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tagline"><input value={month.tagline} onChange={(e) => setMonth({ tagline: e.target.value })} className={inputCls} /></Field>
            <Field label="Accent (hex)"><input value={month.accent} onChange={(e) => setMonth({ accent: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Description"><textarea value={month.description} rows={2} onChange={(e) => setMonth({ description: e.target.value })} className={`${inputCls} resize-none`} /></Field>
          <Field label="Virtue (സദ്ഗുണം)"><input value={month.virtue} onChange={(e) => setMonth({ virtue: e.target.value })} className={inputCls} /></Field>
          <Field label="Stones (small acts)"><StringList items={month.stones} onChange={(stones) => setMonth({ stones })} /></Field>
          <Field label="Feast days"><FeastEditor items={month.feastDays} onChange={(feastDays) => setMonth({ feastDays })} /></Field>
          <Field label="Programs (പ്രവർത്തനങ്ങൾ)"><ProgramEditor items={month.programs} onChange={(programs) => setMonth({ programs })} /></Field>
        </div>
      ) : null}

      {!loading && sel && (
        <div className="flex justify-end mt-5">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50" style={{ background: "#6B46FF" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
          </button>
        </div>
      )}
    </div>
  );
}
