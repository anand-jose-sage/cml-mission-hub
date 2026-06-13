"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Search, X, Download, ClipboardList, UserX, ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeastOption  { id: string; name: string; year: string; }
interface ShakhaOption { id: string; name: string; }

interface CompOption {
  fcId: string;
  label: string;
  compName: string;
  gender: string | null;
  catSlug: string | null;
}

interface EntryRow {
  regId: string;
  regNo: string | null;
  name: string;
  houseName: string | null;
  shakhaName: string;
  catSlug: string | null;
  gender: string | null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EntriesPage() {
  const [feasts,      setFeasts]      = useState<FeastOption[]>([]);
  const [feastId,     setFeastId]     = useState("");
  const [comps,       setComps]       = useState<CompOption[]>([]);
  const [compId,      setCompId]      = useState("");
  const [shakhas,     setShakhas]     = useState<ShakhaOption[]>([]);
  const [shakhaId,    setShakhaId]    = useState("");
  const [query,       setQuery]       = useState("");
  const [entries,     setEntries]     = useState<EntryRow[]>([]);
  const [loading,     setLoading]     = useState(false);

  const selectedComp = comps.find((c) => c.fcId === compId) ?? null;

  // ── Load feasts ──
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
          const name   = (comp?.name   as string) ?? "Unknown";
          const gender = (comp?.gender as string) ?? "";
          const catName = (cat?.name   as string) ?? "";
          const catSlug = (cat?.slug   as string) ?? null;
          return {
            fcId: fc.id as string,
            label: [name, catName, gender].filter(Boolean).join(" · "),
            compName: name,
            gender: gender || null,
            catSlug,
          };
        });
        setComps(opts);
        setCompId(opts[0]?.fcId ?? "");
      });
  }, [feastId]);

  // ── Load entries ──
  const loadEntries = useCallback(async () => {
    if (!compId) return;
    setLoading(true);
    let q = supabase
      .from("participant_registrations")
      .select("id, participant:participants(name, registration_number, house_name, gender, shakha:shakhas(id,name), competition_category:competition_categories(slug))")
      .eq("feast_competition_id", compId);

    const { data } = await q;

    const rows: EntryRow[] = (data ?? [])
      .map((r) => {
        const p   = (Array.isArray(r.participant) ? r.participant[0] : r.participant) as Record<string, unknown> | null;
        const sh  = p ? (Array.isArray(p.shakha) ? (p.shakha as unknown[])[0] : p.shakha) as Record<string, unknown> | null : null;
        const cat = p ? (Array.isArray(p.competition_category) ? (p.competition_category as unknown[])[0] : p.competition_category) as Record<string, unknown> | null : null;
        return {
          regId:     r.id as string,
          regNo:     (p?.registration_number as string | null) ?? null,
          name:      (p?.name      as string) ?? "—",
          houseName: (p?.house_name as string | null) ?? null,
          shakhaName:(sh?.name     as string) ?? "—",
          shakhaId:  (sh?.id       as string) ?? "",
          catSlug:   (cat?.slug    as string | null) ?? null,
          gender:    (p?.gender    as string | null) ?? null,
        };
      })
      .filter((r) => {
        if (shakhaId && (r as EntryRow & { shakhaId: string }).shakhaId !== shakhaId) return false;
        if (query) {
          const q2 = query.toLowerCase();
          return r.name.toLowerCase().includes(q2) || (r.regNo ?? "").toLowerCase().includes(q2);
        }
        return true;
      });

    setEntries(rows);
    setLoading(false);
  }, [compId, shakhaId, query]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── CSV export ──
  const exportCSV = () => {
    if (!entries.length) return;
    const header = ["#", "Reg No", "Name", "House", "Shakha", "Category"].join(",");
    const rows = entries.map((e, i) =>
      [i + 1, e.regNo ?? "", e.name, e.houseName ?? "", e.shakhaName, e.catSlug ? (CATEGORY_LABELS[e.catSlug] ?? e.catSlug) : ""].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `entries-${selectedComp?.compName ?? "comp"}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-200 bg-white w-full";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B46FF] to-[#A855F7] flex items-center justify-center shrink-0">
          <ClipboardList size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entries</h1>
          <p className="text-xs text-gray-500">Browse registrations by competition</p>
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
          onClick={exportCSV}
          disabled={!entries.length}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 bg-white cursor-pointer disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Count badge */}
      {!loading && entries.length > 0 && (
        <p className="text-xs font-semibold mb-3" style={{ color: "#6B46FF" }}>
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
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
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-14 flex flex-col items-center gap-2 text-gray-400">
          <UserX size={24} />
          <p className="text-sm font-medium">No entries found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl overflow-hidden border border-[#1e1b4b] shadow-md mb-4">
            <table className="w-full text-sm min-w-[560px]">
              <thead style={{ background: "linear-gradient(90deg,#ede9fe,#f5f3ff)" }}>
                <tr className="border-b-2" style={{ borderColor: "#c4b5fd" }}>
                  {["#", "Reg No", "Participant", "Shakha", "Category"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider whitespace-nowrap" style={{ color: "#1e1b4b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const isEven = i % 2 === 0;
                  const catColor = e.catSlug ? (CATEGORY_COLORS[e.catSlug] ?? "#6B46FF") : "#6B46FF";
                  return (
                    <tr
                      key={e.regId}
                      className="border-b transition-colors"
                      style={{ borderColor: "#e5e7eb", background: isEven ? "#fff" : "#f8f7ff" }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = "#ede9fe")}
                      onMouseLeave={(ev) => (ev.currentTarget.style.background = isEven ? "#fff" : "#f8f7ff")}
                    >
                      <td className="px-3 py-3 text-xs font-black" style={{ color: "#4C1D95" }}>{i + 1}</td>
                      <td className="px-3 py-3">
                        <span className="inline-block font-mono text-[13px] font-black px-2.5 py-1 rounded-lg tracking-wide text-white" style={{ background: "#4C1D95" }}>
                          {e.regNo ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-[14px] leading-tight" style={{ color: "#1e1b4b" }}>{e.name}</p>
                        {e.houseName && (
                          <p className="text-[12px] font-semibold mt-0.5" style={{ color: "#5B21B6" }}>{e.houseName}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[13px] font-semibold" style={{ color: "#374151" }}>{e.shakhaName}</span>
                      </td>
                      <td className="px-3 py-3">
                        {e.catSlug ? (
                          <span className="inline-block text-[12px] font-black px-2.5 py-1 rounded-lg text-white" style={{ background: catColor }}>
                            {CATEGORY_LABELS[e.catSlug] ?? e.catSlug}
                          </span>
                        ) : <span className="text-sm font-bold" style={{ color: "#6B7280" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2.5 mb-4">
            {entries.map((e, i) => {
              const catColor = e.catSlug ? (CATEGORY_COLORS[e.catSlug] ?? "#6B46FF") : "#6B46FF";
              return (
                <div key={e.regId} className="bg-white rounded-xl overflow-hidden" style={{ border: "1.5px solid #ddd6fe", boxShadow: "0 2px 8px rgba(107,70,255,0.08)" }}>
                  <div className="flex items-center gap-2.5 px-3.5 py-3">
                    <span className="text-[13px] font-black font-mono w-5 shrink-0" style={{ color: "#4C1D95" }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-black leading-tight truncate" style={{ color: "#1e1b4b" }}>{e.name}</p>
                      {e.houseName && (
                        <p className="text-[12px] font-black mt-0.5" style={{ color: "#5B21B6" }}>{e.houseName}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="font-mono text-[12px] font-black px-2 py-0.5 rounded-md tracking-wide text-white" style={{ background: "#4C1D95" }}>
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
