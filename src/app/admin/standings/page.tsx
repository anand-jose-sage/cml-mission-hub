"use client";

import { useState, useEffect } from "react";
import { Loader2, Trophy, Medal, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFeastStandings, getOverallStandings, type AdminStandingRow } from "@/actions/results";
import { SHAKHA_COLOR_MAP } from "@/lib/feast-data";

interface FeastOption { id: string; name: string; year: string; }

interface StandingRow extends AdminStandingRow {
  color: string;
}

const RANK_COLORS: Record<number, string> = {
  1: "#F5C542",
  2: "#C9CDD6",
  3: "#E0936A",
};

const CAT_COLS = [
  { key: "subJunior", label: "Sub Jr" },
  { key: "junior", label: "Junior" },
  { key: "senior", label: "Senior" },
  { key: "superSenior", label: "Super Sr" },
  { key: "elder", label: "Elder" },
  { key: "team", label: "Team" },
] as const;

function withColor(rows: AdminStandingRow[]): StandingRow[] {
  return rows.map((r) => ({ ...r, color: SHAKHA_COLOR_MAP[r.shakhaName] ?? "#A78BFA" }));
}

// ─── Shared podium + table renderer ────────────────────────────────────────

function StandingsBlock({ rows, loading, emptyText }: { rows: StandingRow[]; loading: boolean; emptyText: string }) {
  return (
    <>
      {/* Top 3 podium cards */}
      {!loading && rows.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {rows.slice(0, 3).map((s) => {
            const c = RANK_COLORS[s.rank] ?? "#9CA3AF";
            return (
              <div key={s.shakhaId} className="flex-1 min-w-[140px] rounded-2xl p-4 border" style={{ background: `${c}12`, borderColor: `${c}44` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: c, color: "#2a1d00" }}>
                    {s.rank}
                  </div>
                  <Medal size={14} style={{ color: c }} />
                </div>
                <div className="font-bold text-[15px] text-gray-900 mb-0.5">{s.shakhaName}</div>
                <div className="text-2xl font-bold" style={{ color: c }}>{s.grandTotal}</div>
                <div className="text-xs text-gray-400 mt-0.5">total points</div>
                <div className="flex gap-2 mt-2 text-xs text-gray-500">
                  <span>🥇 {s.firstCount}</span>
                  <span>🥈 {s.secondCount}</span>
                  <span>🥉 {s.thirdCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">
          {emptyText}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-10">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Shakha</th>
                {CAT_COLS.map((c) => (
                  <th key={c.key} className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{c.label}</th>
                ))}
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">1st</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">A</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">B</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">C</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const rankColor = RANK_COLORS[s.rank];
                return (
                  <tr key={s.shakhaId} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-3">
                      {rankColor ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: rankColor, color: "#2a1d00" }}>
                          {s.rank}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">{s.rank}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="font-semibold text-gray-900">{s.shakhaName}</span>
                      </div>
                    </td>
                    {CAT_COLS.map((c) => (
                      <td key={c.key} className="px-3 py-3 text-center text-[13px] text-gray-600">
                        {(s[c.key] as number) > 0 ? <span className="font-semibold">{s[c.key]}</span> : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-[14px]" style={{ color: s.grandTotal > 0 ? "#6B46FF" : "#9CA3AF" }}>
                        {s.grandTotal}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500">{s.firstCount || "—"}</td>
                    <td className="px-3 py-3 text-center">
                      {s.aGrade > 0 ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#16A34A18", color: "#16A34A" }}>{s.aGrade}</span> : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {s.bGrade > 0 ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#D9770618", color: "#D97706" }}>{s.bGrade}</span> : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {s.cGrade > 0 ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#6B46FF18", color: "#6B46FF" }}>{s.cGrade}</span> : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function StandingsPage() {
  const [feasts, setFeasts] = useState<FeastOption[]>([]);
  const [feastId, setFeastId] = useState("");
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [overall, setOverall] = useState<StandingRow[]>([]);
  const [overallLoading, setOverallLoading] = useState(true);

  useEffect(() => {
    supabase.from("feasts").select("id,name,year").order("start_date")
      .then(({ data }) => {
        if (data?.length) { setFeasts(data); setFeastId(data[0].id); }
      });
  }, []);

  // Per-feast standings (feast-wise total) — via service-role server action;
  // shakha_feast_standings has no RLS policy, so a direct client-side query
  // (anon/authenticated key) silently returns zero rows instead of an error.
  useEffect(() => {
    if (!feastId) return;
    setLoading(true);
    getFeastStandings(feastId).then(({ data, error }) => {
      if (error) console.error("[standings]", error);
      setStandings(withColor(data ?? []));
      setLoading(false);
    });
  }, [feastId]);

  // Overall standings — gross sum across every feast, also via server action.
  useEffect(() => {
    setOverallLoading(true);
    getOverallStandings().then(({ data, error }) => {
      if (error) console.error("[overall-standings]", error);
      setOverall(withColor(data ?? []));
      setOverallLoading(false);
    });
  }, []);

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 bg-white";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5C542] to-[#F59E0B] flex items-center justify-center shrink-0">
          <Trophy size={17} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Standings</h1>
          <p className="text-xs text-gray-500">Shakha rankings aggregated from published results</p>
        </div>
      </div>

      {/* Overall standings — gross sum across every feast */}
      <div className="flex items-center gap-2 mb-3">
        <Globe size={15} className="text-gray-400" />
        <h2 className="text-sm font-bold text-gray-800">Overall Standings — All Feasts</h2>
      </div>
      <div className="mb-8">
        <StandingsBlock rows={overall} loading={overallLoading} emptyText="No standings yet across any feast." />
      </div>

      <div className="h-px bg-gray-100 mb-8" />

      {/* Per-feast standings */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={15} className="text-gray-400" />
        <h2 className="text-sm font-bold text-gray-800">Feast Standings</h2>
      </div>
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 mb-1">Feast</label>
        <select value={feastId} onChange={(e) => setFeastId(e.target.value)} className={selectCls}>
          {feasts.map((f) => <option key={f.id} value={f.id}>{f.name} {f.year}</option>)}
        </select>
      </div>

      <StandingsBlock rows={standings} loading={loading} emptyText="No standings yet. Publish some results first." />
    </div>
  );
}
