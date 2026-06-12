"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, GripVertical, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Competition {
  id: string;
  name: string;
  type: string;
  category: string | null;
  gender: string | null;
  competition_category: { name: string } | null;
}

interface FeastComp {
  id: string;
  competition_id: string;
  display_order: number;
  time_slot: string | null;
  venue: string | null;
  max_slots: number | null;
  competition: Competition | null;
}

interface Feast {
  id: string;
  name: string;
  slug: string;
  year: string;
}

export default function FeastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [feast, setFeast] = useState<Feast | null>(null);
  const [feastComps, setFeastComps] = useState<FeastComp[]>([]);
  const [allComps, setAllComps] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addState, setAddState] = useState({ competitionId: "", timeSlot: "", venue: "", maxSlots: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: f }, { data: fcs }, { data: comps }] = await Promise.all([
      supabase.from("feasts").select("id,name,slug,year").eq("id", id).single(),
      supabase.from("feast_competitions")
        .select("*, competition:competitions(id,name,type,category,gender,competition_category:competition_categories(name))")
        .eq("feast_id", id)
        .order("display_order"),
      supabase.from("competitions")
        .select("*, competition_category:competition_categories(name)")
        .order("name"),
    ]);
    setFeast(f);
    setFeastComps((fcs ?? []) as FeastComp[]);
    setAllComps(comps ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addComp = async () => {
    if (!addState.competitionId) return;
    setSaving(true);
    const nextOrder = (feastComps.at(-1)?.display_order ?? -1) + 1;
    await supabase.from("feast_competitions").insert({
      feast_id: id,
      competition_id: addState.competitionId,
      display_order: nextOrder,
      time_slot: addState.timeSlot || null,
      venue: addState.venue || null,
      max_slots: addState.maxSlots ? parseInt(addState.maxSlots) : null,
    });
    setSaving(false);
    setShowAdd(false);
    setAddState({ competitionId: "", timeSlot: "", venue: "", maxSlots: "" });
    load();
  };

  const removeComp = async (fcId: string) => {
    if (!confirm("Remove this competition from the feast?")) return;
    await supabase.from("feast_competitions").delete().eq("id", fcId);
    load();
  };

  const alreadyAdded = new Set(feastComps.map((fc) => fc.competition_id));
  const availableComps = allComps.filter((c) => !alreadyAdded.has(c.id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-5 border-none bg-transparent cursor-pointer p-0"
      >
        <ArrowLeft size={16} /> Back to Feasts
      </button>

      {loading && <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>}

      {!loading && feast && (
        <>
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">{feast.name} {feast.year}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage competition lineup — add, reorder and configure events</p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">{feastComps.length} Competitions</h2>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-medium hover:bg-[#6D28D9] transition-colors border-none cursor-pointer"
            >
              <Plus size={14} /> Add Competition
            </button>
          </div>

          {feastComps.length === 0 && (
            <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <p className="text-sm">No competitions added yet.</p>
            </div>
          )}

          <div className="space-y-2">
            {feastComps.map((fc, idx) => (
              <div key={fc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3">
                <GripVertical size={16} color="#d1d5db" className="flex-shrink-0" />
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                    {fc.competition?.name}
                    {fc.competition?.gender && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${fc.competition.gender === "boys" ? "bg-blue-50 text-blue-600" : fc.competition.gender === "girls" ? "bg-pink-50 text-pink-600" : "bg-gray-100 text-gray-500"}`}>
                        {fc.competition.gender.charAt(0).toUpperCase() + fc.competition.gender.slice(1)}
                      </span>
                    )}
                    {fc.competition?.competition_category && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                        {fc.competition.competition_category.name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 flex gap-2 mt-0.5 flex-wrap">
                    <span className="capitalize">{fc.competition?.type}</span>
                    {fc.competition?.category && <span>· {fc.competition.category}</span>}
                    {fc.time_slot && <span>· {fc.time_slot}</span>}
                    {fc.venue && <span>· {fc.venue}</span>}
                    {fc.max_slots && <span>· max {fc.max_slots}</span>}
                  </div>
                </div>
                <button
                  onClick={() => removeComp(fc.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>

          {availableComps.length === 0 && feastComps.length > 0 && (
            <p className="text-xs text-center text-gray-400 mt-4">All competitions have been added.</p>
          )}
        </>
      )}

      {/* Add competition modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900 text-base">Add Competition</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Competition</label>
                <select
                  value={addState.competitionId}
                  onChange={(e) => setAddState((s) => ({ ...s, competitionId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">Select…</option>
                  {availableComps.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Time slot</label>
                  <input
                    value={addState.timeSlot}
                    onChange={(e) => setAddState((s) => ({ ...s, timeSlot: e.target.value }))}
                    placeholder="9:30 AM"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max slots</label>
                  <input
                    type="number"
                    value={addState.maxSlots}
                    onChange={(e) => setAddState((s) => ({ ...s, maxSlots: e.target.value }))}
                    placeholder="40"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
                <input
                  value={addState.venue}
                  onChange={(e) => setAddState((s) => ({ ...s, venue: e.target.value }))}
                  placeholder="Hall A"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-2.5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-transparent cursor-pointer">Cancel</button>
              <button
                onClick={addComp}
                disabled={saving || !addState.competitionId}
                className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
