"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, AlertTriangle, ShieldCheck, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getLentContent, saveLentEntry } from "@/actions/lent";
import { LENT_KEY } from "@/lib/lent-theme";
import { LENT_TOTAL_DAYS, getDateForLentDay } from "@/lib/lent-dates";
import type { LentMeta, LentDay, LentDayContent } from "@/types";

interface Entry {
  key: string;
  label: string;
  sort: number;
  type: "meta" | "day";
  value: LentMeta | LentDay;
}

type Lang = "en" | "ml";

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C2D12]/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function emptyDayContent(): LentDayContent {
  return {
    themeTitle: "",
    reading: { text: "", reference: "" },
    reflection: "",
    prayer: "",
    activity: "",
    reflectionQuestion: "",
    posterQuote: { label: "", text: "", reference: "" },
  };
}

function emptyDay(day: number): LentDay {
  return { day, emoji: "", en: emptyDayContent(), ml: emptyDayContent() };
}

const DEFAULT_META: LentMeta = {
  org: "", titleEn: "", titleMl: "", yearLabel: "",
  heroTaglineEn: "", heroTaglineMl: "", heroBodyEn: "", heroBodyMl: "",
  ctaLabelEn: "", ctaLabelMl: "", progressLabelEn: "", progressLabelMl: "",
  phases: [],
  prayerToMichaelEn: "", prayerToMichaelMl: "",
};

export default function AdminLentPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selKey, setSelKey] = useState<string>("");
  const [draft, setDraft] = useState<LentMeta | LentDay | null>(null);
  const [metaJson, setMetaJson] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [jumpDay, setJumpDay] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { meta, days } = await getLentContent();
    const list: Entry[] = [];
    const metaValue = meta ?? DEFAULT_META;
    list.push({ key: `${LENT_KEY}:meta`, label: "Year · Hero (meta)", sort: 0, type: "meta", value: metaValue });
    const byDay = new Map(days.map((d) => [d.day, d]));
    for (let n = 1; n <= LENT_TOTAL_DAYS; n++) {
      const d = byDay.get(n) ?? emptyDay(n);
      list.push({
        key: `${LENT_KEY}:day-${String(n).padStart(2, "0")}`,
        label: `Day ${n}${d.emoji ? " " + d.emoji : ""}${d.en.themeTitle ? " · " + d.en.themeTitle : ""}`,
        sort: n,
        type: "day",
        value: d,
      });
    }
    setEntries(list);
    setSelKey((cur) => cur || list[0]?.key || "");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sel = entries.find((e) => e.key === selKey) ?? null;
  const meta = (entries.find((e) => e.type === "meta")?.value ?? DEFAULT_META) as LentMeta;

  // when selection changes, seed the draft
  useEffect(() => {
    if (!sel) { setDraft(null); return; }
    if (sel.type === "meta") setMetaJson(JSON.stringify(sel.value, null, 2));
    else setDraft(structuredClone(sel.value));
  }, [selKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const day = sel?.type === "day" ? (draft as LentDay | null) : null;
  const content = day?.[lang] ?? null;

  const setEmoji = (emoji: string) => setDraft((d) => d ? { ...(d as LentDay), emoji } : d);
  const setContent = (patch: Partial<LentDayContent>) =>
    setDraft((d) => {
      if (!d) return d;
      const cur = d as LentDay;
      return { ...cur, [lang]: { ...cur[lang], ...patch } };
    });

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
    const res = await saveLentEntry(sel.key, value, sel.sort);
    setSaving(false);
    if (res.error) { setMsg({ type: "err", text: res.error }); return; }
    setMsg({ type: "ok", text: "Saved" });
    setTimeout(() => setMsg(null), 2000);
    await load();
  };

  const goToDay = (n: number) => {
    const clamped = Math.max(1, Math.min(LENT_TOTAL_DAYS, n));
    setSelKey(`${LENT_KEY}:day-${String(clamped).padStart(2, "0")}`);
    setJumpDay("");
  };

  const currentDayNum = sel?.type === "day" ? (sel.value as LentDay).day : null;

  const dayEntries = entries.filter((e) => e.type === "day");
  const phaseGroups = meta.phases.length > 0
    ? meta.phases.map((p) => ({
        phase: p,
        days: dayEntries.filter((e) => (e.value as LentDay).day >= p.dayStart && (e.value as LentDay).day <= p.dayEnd),
      }))
    : [{ phase: null, days: dayEntries }];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C2D12] to-[#E8B84B] flex items-center justify-center shrink-0">
          <ShieldCheck size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">St. Michael&apos;s Lent</h1>
          <p className="text-xs text-gray-500">40-day devotional · Aug 19 &ndash; Oct 3, 2026</p>
        </div>
      </div>

      {/* entry selector */}
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
        <div className="relative">
          <select value={selKey} onChange={(e) => setSelKey(e.target.value)} className={`${inputCls} pr-8 appearance-none font-semibold`}>
            <option value={`${LENT_KEY}:meta`}>Year · Hero (meta)</option>
            {phaseGroups.map((g, gi) => (
              <optgroup
                key={gi}
                label={g.phase ? `${g.phase.index}. ${g.phase.labelEn} · Days ${g.phase.dayStart}-${g.phase.dayEnd}` : "Days"}
              >
                {g.days.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
              </optgroup>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* quick jump */}
      {currentDayNum != null && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => goToDay(currentDayNum - 1)}
            disabled={currentDayNum <= 1}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center bg-white disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
          <input
            type="number"
            min={1}
            max={LENT_TOTAL_DAYS}
            placeholder="Day #"
            value={jumpDay}
            onChange={(e) => setJumpDay(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { const n = parseInt(jumpDay, 10); if (n) goToDay(n); } }}
            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
          />
          <button
            onClick={() => { const n = parseInt(jumpDay, 10); if (n) goToDay(n); }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white cursor-pointer"
          >
            Go
          </button>
          <button
            onClick={() => goToDay(currentDayNum + 1)}
            disabled={currentDayNum >= LENT_TOTAL_DAYS}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center bg-white disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
          <span className="text-xs text-gray-400 ml-1">
            {getDateForLentDay(currentDayNum).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
          </span>
        </div>
      )}

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
          <p className="text-xs text-gray-400 mt-1">Edits bilingual hero copy and the 5 phases (labelEn/labelMl/dayStart/dayEnd). Keep valid JSON.</p>
        </div>
      ) : day && content ? (
        <div className="space-y-3">
          <Field label="Emoji (shared across languages)">
            <input value={day.emoji} onChange={(e) => setEmoji(e.target.value)} className={`${inputCls} w-20 text-center text-lg`} />
          </Field>

          {/* language toggle */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100 w-fit">
            {(["en", "ml"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none"
                style={{ background: lang === l ? "#7C2D12" : "transparent", color: lang === l ? "#fff" : "#6B7280" }}
              >
                {l === "en" ? "English" : "മലയാളം"}
              </button>
            ))}
          </div>

          <Field label="Theme title"><input value={content.themeTitle} onChange={(e) => setContent({ themeTitle: e.target.value })} className={inputCls} /></Field>

          <div className="grid grid-cols-1 gap-2 rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-bold text-gray-500">📖 Reading</p>
            <Field label="Verse text"><textarea value={content.reading.text} rows={2} onChange={(e) => setContent({ reading: { ...content.reading, text: e.target.value } })} className={`${inputCls} resize-none`} /></Field>
            <Field label="Reference"><input value={content.reading.reference} onChange={(e) => setContent({ reading: { ...content.reading, reference: e.target.value } })} className={inputCls} /></Field>
          </div>

          <Field label="💭 Reflection (short insight on the reading)"><textarea value={content.reflection} rows={2} onChange={(e) => setContent({ reflection: e.target.value })} className={`${inputCls} resize-none`} /></Field>
          <Field label="🙏 Prayer"><textarea value={content.prayer} rows={3} onChange={(e) => setContent({ prayer: e.target.value })} className={`${inputCls} resize-none`} /></Field>
          <Field label="🔥 Activity"><textarea value={content.activity} rows={3} onChange={(e) => setContent({ activity: e.target.value })} className={`${inputCls} resize-none`} /></Field>
          <Field label="📝 Private-journal prompt (shown with the reflection above)"><textarea value={content.reflectionQuestion} rows={2} onChange={(e) => setContent({ reflectionQuestion: e.target.value })} className={`${inputCls} resize-none`} /></Field>

          <div className="grid grid-cols-1 gap-2 rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-bold text-[#B0892F]">🖼️ Poster quote (shareable image — may differ from the Reading above)</p>
            <Field label="Label (one word, e.g. Strength)"><input value={content.posterQuote.label} onChange={(e) => setContent({ posterQuote: { ...content.posterQuote, label: e.target.value } })} className={inputCls} /></Field>
            <Field label="Quote text"><textarea value={content.posterQuote.text} rows={2} onChange={(e) => setContent({ posterQuote: { ...content.posterQuote, text: e.target.value } })} className={`${inputCls} resize-none`} /></Field>
            <Field label="Reference"><input value={content.posterQuote.reference} onChange={(e) => setContent({ posterQuote: { ...content.posterQuote, reference: e.target.value } })} className={inputCls} /></Field>
          </div>
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
