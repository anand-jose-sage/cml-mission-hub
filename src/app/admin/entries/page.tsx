"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Search, X, Download, ClipboardList, UserX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABELS } from "@/lib/competition-categories";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeastOption { id: string; name: string; year: string; }
interface ShakhaOption { id: string; name: string; }

interface CompOption {
  fcId: string;
  label: string; // "Name · Boys · Senior"
  compName: string;
  gender: string | null;
  catSlug: string | null;
}

interface ParticipantEntry {
  regId: string;
  fcId: string;
  name: string;
  houseName: string | null;
  shakhaId: string | null;
  shakhaName: string | null;
  gender: string | null;
  regNo: string | null;
  phone: string | null;
  catSlug: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normGender(g: string | null): "Boy" | "Girl" | null {
  if (!g) return null;
  const l = g.toLowerCase();
  if (l === "boy" || l === "boys" || l === "male") return "Boy";
  if (l === "girl" || l === "girls" || l === "female") return "Girl";
  return null;
}

function compLabel(name: string, gender: string | null, catSlug: string | null) {
  const parts = [name];
  const g = normGender(gender);
  if (g) parts.push(g === "Boy" ? "Boys" : "Girls");
  else if (gender?.toLowerCase() === "common") parts.push("Common");
  if (catSlug && CATEGORY_LABELS[catSlug]) parts.push(CATEGORY_LABELS[catSlug]);
  return parts.join(" · ");
}

function avatarBg(name: string) {
  const p = ["#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % p.length;
  return p[h];
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EntriesAdminPage() {
  const [feasts, setFeasts] = useState<FeastOption[]>([]);
  const [feastId, setFeastId] = useState("");
  const [shakhas, setShakhas] = useState<ShakhaOption[]>([]);
  const [compOptions, setCompOptions] = useState<CompOption[]>([]);
  const [allEntries, setAllEntries] = useState<ParticipantEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [compFilter, setCompFilter] = useState(""); // feast_competition id
  const [shakhaFilter, setShakhaFilter] = useState("");
  const [q, setQ] = useState("");

  // Load feasts + shakhas once
  useEffect(() => {
    Promise.all([
      supabase.from("feasts").select("id,name,year").order("start_date"),
      supabase.from("shakhas").select("id,name").order("name"),
    ]).then(([{ data: f }, { data: s }]) => {
      if (f?.length) { setFeasts(f); setFeastId(f[0].id); }
      setShakhas(s ?? []);
    });
  }, []);

  // Load competitions + all entries when feast changes
  const load = useCallback(async () => {
    if (!feastId) return;
    setLoading(true);
    setCompFilter("");

    const { data: fcData } = await supabase
      .from("feast_competitions")
      .select(`
        id, display_order,
        competition:competitions(
          id, name, gender,
          competition_category:competition_categories(slug, name)
        )
      `)
      .eq("feast_id", feastId)
      .order("display_order");

    const opts: CompOption[] = (fcData ?? []).map((fc) => {
      const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
      const cat = comp ? (Array.isArray(comp.competition_category) ? (comp.competition_category as unknown[])[0] : comp.competition_category) as Record<string, unknown> | null : null;
      const name = (comp?.name as string) ?? "Unknown";
      const gender = (comp?.gender as string) ?? null;
      const catSlug = (cat?.slug as string) ?? null;
      return {
        fcId: fc.id as string,
        label: compLabel(name, gender, catSlug),
        compName: name,
        gender,
        catSlug,
      };
    });
    setCompOptions(opts);

    // Auto-select first competition
    const firstId = opts[0]?.fcId ?? "";
    setCompFilter(firstId);

    // Fetch all entries for this feast
    const fcIds = opts.map((o) => o.fcId);
    if (fcIds.length === 0) { setAllEntries([]); setLoading(false); return; }

    const { data: regData } = await supabase
      .from("participant_registrations")
      .select(`
        id, feast_competition_id,
        participant:participants(
          id, name, house_name, gender, registration_number, phone, shakha_id,
          shakha:shakhas(id, name),
          competition_category:competition_categories(slug)
        )
      `)
      .in("feast_competition_id", fcIds);

    const rows: ParticipantEntry[] = (regData ?? []).map((r) => {
      const p = (Array.isArray(r.participant) ? r.participant[0] : r.participant) as Record<string, unknown> | null;
      const sh = p ? (Array.isArray(p.shakha) ? (p.shakha as unknown[])[0] : p.shakha) as Record<string, unknown> | null : null;
      const cc = p ? (Array.isArray(p.competition_category) ? (p.competition_category as unknown[])[0] : p.competition_category) as Record<string, unknown> | null : null;
      return {
        regId: r.id as string,
        fcId: r.feast_competition_id as string,
        name: (p?.name as string) ?? "—",
        houseName: (p?.house_name as string) ?? null,
        shakhaId: (sh?.id as string) ?? null,
        shakhaName: (sh?.name as string) ?? null,
        gender: (p?.gender as string) ?? null,
        regNo: (p?.registration_number as string) ?? null,
        phone: (p?.phone as string) ?? null,
        catSlug: (cc?.slug as string) ?? null,
      };
    });
    setAllEntries(rows);
    setLoading(false);
  }, [feastId]);

  useEffect(() => { load(); }, [load]);

  // Filtered list
  const filtered = allEntries.filter((e) => {
    if (compFilter && e.fcId !== compFilter) return false;
    if (shakhaFilter && e.shakhaId !== shakhaFilter) return false;
    if (q.trim()) {
      const ql = q.trim().toLowerCase();
      if (!e.name.toLowerCase().includes(ql) && !(e.shakhaName ?? "").toLowerCase().includes(ql) && !(e.regNo ?? "").toLowerCase().includes(ql)) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const compName = compOptions.find((c) => c.fcId === compFilter)?.label ?? "all";
    const header = "Name,House,Shakha,Gender,Category,Reg No,Phone";
    const lines = filtered.map((e) =>
      [`"${e.name}"`, `"${e.houseName ?? ""}"`, `"${e.shakhaName ?? ""}"`,
       normGender(e.gender) ?? "", e.catSlug ? (CATEGORY_LABELS[e.catSlug] || e.catSlug) : "",
       e.regNo ?? "", e.phone ?? ""].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `entries-${compName}.csv`;
    a.click();
  };

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 bg-white";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shrink-0">
            <ClipboardList size={17} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Entries</h1>
            <p className="text-xs text-gray-500">{filtered.length} participant{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 bg-transparent cursor-pointer"
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {/* Feast */}
        <select value={feastId} onChange={(e) => setFeastId(e.target.value)} className={selectCls}>
          {feasts.map((f) => <option key={f.id} value={f.id}>{f.name} {f.year}</option>)}
        </select>

        {/* Competition — primary filter */}
        <select
          value={compFilter}
          onChange={(e) => setCompFilter(e.target.value)}
          className={`${selectCls} sm:col-span-1 font-medium`}
        >
          {compOptions.map((c) => (
            <option key={c.fcId} value={c.fcId}>{c.label}</option>
          ))}
        </select>

        {/* Shakha */}
        <select value={shakhaFilter} onChange={(e) => setShakhaFilter(e.target.value)} className={selectCls}>
          <option value="">All Shakhas</option>
          {shakhas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, reg number or shakha…"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-200"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer p-1">
            <X size={14} color="#9ca3af" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={22} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
          <UserX size={28} />
          <p className="text-sm">No entries for this selection.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                {["Name", "House", "Shakha", "Gender", "Category", "Reg No", "Phone"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const gLabel = normGender(e.gender);
                return (
                  <tr key={e.regId} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ background: avatarBg(e.name) }}
                        >
                          {initials(e.name)}
                        </div>
                        <span className="font-medium text-gray-900 text-[13px]">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-[12.5px] whitespace-nowrap">{e.houseName ?? "—"}</td>
                    <td className="px-3 py-3 text-gray-600 text-[12.5px] whitespace-nowrap">{e.shakhaName ?? "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {gLabel ? (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${gLabel === "Boy" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
                          {gLabel}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {e.catSlug ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          {CATEGORY_LABELS[e.catSlug] || e.catSlug}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11.5px] text-purple-600 whitespace-nowrap">{e.regNo ?? "—"}</td>
                    <td className="px-3 py-3 text-gray-500 text-[12.5px] whitespace-nowrap">{e.phone ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
