"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Users, Loader2, X, Download, Plus, Pencil, Trash2, Save,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCategorySlug, CATEGORY_LABELS } from "@/lib/competition-categories";
import { createParticipantAdmin, updateParticipant, deleteParticipant } from "@/actions/feast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeastOption { id: string; name: string; year: string; }
interface ShakhaOption { id: string; name: string; }

interface FeastComp {
  id: string;
  competition: {
    id: string;
    name: string;
    gender: string | null;
    competition_category: { id: string; slug: string; name: string } | null;
  } | null;
}

interface ParticipantRow {
  id: string;
  registration_number: string | null;
  name: string;
  house_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  shakha: { id: string; name: string } | null;
  competition_category: { slug: string; name: string } | null;
  comp_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "", label: "All Genders" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
];

const CAT_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "sub_junior", label: "Sub Junior" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
  { value: "super_senior", label: "Super Senior" },
  { value: "elder", label: "Elder" },
];

function normGender(g: string | null): "Boy" | "Girl" | "—" {
  if (!g) return "—";
  const l = g.toLowerCase();
  if (l === "boy" || l === "boys" || l === "male") return "Boy";
  if (l === "girl" || l === "girls" || l === "female") return "Girl";
  return "—";
}

// ─── Slide-over Panel ────────────────────────────────────────────────────────

interface PanelProps {
  mode: "new" | "edit";
  feastId: string;
  shakhas: ShakhaOption[];
  feastComps: FeastComp[];
  participant?: ParticipantRow | null;
  existingRegIds?: string[];
  onClose: () => void;
  onSaved: () => void;
}

function ParticipantPanel({
  mode, feastId, shakhas, feastComps, participant, existingRegIds, onClose, onSaved,
}: PanelProps) {
  const [form, setForm] = useState({
    shakhaId: participant?.shakha?.id ?? "",
    name: participant?.name ?? "",
    houseName: participant?.house_name ?? "",
    dob: participant?.date_of_birth ?? "",
    gender: participant?.gender?.toLowerCase().startsWith("boy") ? "boy"
      : participant?.gender?.toLowerCase().startsWith("girl") ? "girl" : "",
    phone: participant?.phone ?? "",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(existingRegIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const catSlug = getCategorySlug(form.dob);
  const catLabel = catSlug ? CATEGORY_LABELS[catSlug] : null;

  const availableComps = feastComps.filter((fc) => {
    if (!fc.competition) return false;
    const compCatSlug = fc.competition.competition_category?.slug;
    const compGender = fc.competition.gender?.toLowerCase();
    if (catSlug && compCatSlug && compCatSlug !== catSlug) return false;
    if (compGender && compGender !== "common" && form.gender && compGender !== form.gender) return false;
    return true;
  });

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "dob" || k === "gender") setSelectedIds([]);
  };

  const toggleComp = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.dob || !form.gender || !form.shakhaId) {
      setError("Name, DOB, gender and shakha are required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = mode === "new"
      ? await createParticipantAdmin({
          feastId,
          shakhaId: form.shakhaId,
          name: form.name,
          houseName: form.houseName,
          dateOfBirth: form.dob,
          gender: form.gender,
          phone: form.phone,
          feastCompetitionIds: selectedIds,
        })
      : await updateParticipant({
          participantId: participant!.id,
          name: form.name,
          houseName: form.houseName,
          dateOfBirth: form.dob,
          gender: form.gender,
          phone: form.phone,
          feastCompetitionIds: selectedIds,
        });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSaved();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteParticipant(participant!.id);
    setDeleting(false);
    if (result.error) { setError(result.error); return; }
    onSaved();
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-300";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-900 text-base">
            {mode === "new" ? "Register Participant" : "Edit Participant"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 border-none bg-transparent cursor-pointer">
            <X size={18} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Shakha */}
          <div>
            <label className={labelCls}>Shakha</label>
            <select value={form.shakhaId} onChange={(e) => set("shakhaId", e.target.value)} className={inputCls}>
              <option value="">Select shakha…</option>
              {shakhas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" className={inputCls} />
          </div>

          {/* House Name */}
          <div>
            <label className={labelCls}>House Name</label>
            <input value={form.houseName} onChange={(e) => set("houseName", e.target.value)} placeholder="House / family name" className={inputCls} />
          </div>

          {/* DOB + auto category */}
          <div>
            <label className={labelCls}>Date of Birth</label>
            <input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} className={inputCls} />
            {catLabel && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">Category:</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{catLabel}</span>
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className={labelCls}>Gender</label>
            <div className="flex gap-2">
              {(["boy", "girl"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => set("gender", g)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-colors"
                  style={{
                    background: form.gender === g ? (g === "boy" ? "#dbeafe" : "#fce7f3") : "#f9fafb",
                    color: form.gender === g ? (g === "boy" ? "#1d4ed8" : "#be185d") : "#6b7280",
                    borderColor: form.gender === g ? (g === "boy" ? "#93c5fd" : "#f9a8d4") : "#e5e7eb",
                  }}
                >
                  {g === "boy" ? "Boy" : "Girl"}
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>
              Phone <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit mobile" className={inputCls} />
          </div>

          {/* Competitions */}
          <div>
            <label className={labelCls}>Competitions</label>
            {!form.dob || !form.gender ? (
              <p className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
                Enter DOB and gender to see available competitions
              </p>
            ) : availableComps.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
                No competitions for this category / gender
              </p>
            ) : (
              <div className="space-y-1.5">
                {availableComps.map((fc) => {
                  const checked = selectedIds.includes(fc.id);
                  return (
                    <label
                      key={fc.id}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{
                        background: checked ? "#f5f3ff" : "#f9fafb",
                        border: `1px solid ${checked ? "#c4b5fd" : "#e5e7eb"}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleComp(fc.id)}
                        className="accent-purple-600 w-4 h-4 shrink-0"
                      />
                      <span className="text-sm text-gray-900 font-medium">{fc.competition?.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2.5 shrink-0">
          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-transparent cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-[#6D28D9] transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving…" : mode === "new" ? "Register" : "Save Changes"}
            </button>
          </div>

          {mode === "edit" && (
            !confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
              >
                Delete Registration
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-xs text-red-700 font-semibold mb-2.5">Permanently delete this registration?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg text-xs font-medium border border-gray-200 bg-white cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-500 text-white border-none cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {deleting ? "Deleting…" : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ParticipantsAdminPage() {
  const [feasts, setFeasts] = useState<FeastOption[]>([]);
  const [feastId, setFeastId] = useState("");
  const [shakhas, setShakhas] = useState<ShakhaOption[]>([]);
  const [feastComps, setFeastComps] = useState<FeastComp[]>([]);
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [shakhaFilter, setShakhaFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [q, setQ] = useState("");

  // Slide-over
  const [panelMode, setPanelMode] = useState<"new" | "edit" | null>(null);
  const [editRow, setEditRow] = useState<ParticipantRow | null>(null);
  const [editRegIds, setEditRegIds] = useState<string[]>([]);

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

  // Load feast competitions when feast changes (for registration form)
  useEffect(() => {
    if (!feastId) return;
    supabase
      .from("feast_competitions")
      .select("id, competition:competitions(id,name,gender,competition_category:competition_categories(id,slug,name))")
      .eq("feast_id", feastId)
      .order("display_order")
      .then(({ data }) => setFeastComps((data ?? []) as unknown as FeastComp[]));
  }, [feastId]);

  // Load participants
  const load = useCallback(async () => {
    if (!feastId) return;
    setLoading(true);
    const { data } = await supabase
      .from("participants")
      .select(`
        id, registration_number, name, house_name, phone, date_of_birth, gender, created_at,
        shakha:shakhas(id,name),
        competition_category:competition_categories(slug,name),
        comp_count:participant_registrations(count)
      `)
      .eq("feast_id", feastId)
      .order("created_at", { ascending: false });

    setRows(
      (data ?? []).map((p) => ({
        ...p,
        shakha: (Array.isArray(p.shakha) ? p.shakha[0] : p.shakha) as { id: string; name: string } | null,
        competition_category: (Array.isArray(p.competition_category) ? p.competition_category[0] : p.competition_category) as { slug: string; name: string } | null,
        comp_count: (p.comp_count as unknown as { count: number }[])?.[0]?.count ?? 0,
      }))
    );
    setLoading(false);
  }, [feastId]);

  useEffect(() => { load(); }, [load]);

  // Client-side filtering
  const filtered = rows.filter((r) => {
    if (shakhaFilter && r.shakha?.id !== shakhaFilter) return false;
    if (genderFilter) {
      const g = r.gender?.toLowerCase() ?? "";
      if (genderFilter === "boy" && !["boy", "boys", "male"].includes(g)) return false;
      if (genderFilter === "girl" && !["girl", "girls", "female"].includes(g)) return false;
    }
    if (catFilter && r.competition_category?.slug !== catFilter) return false;
    if (q.trim()) {
      const ql = q.trim().toLowerCase();
      if (
        !r.name.toLowerCase().includes(ql) &&
        !(r.registration_number ?? "").toLowerCase().includes(ql) &&
        !(r.shakha?.name ?? "").toLowerCase().includes(ql)
      ) return false;
    }
    return true;
  });

  const openEdit = async (row: ParticipantRow) => {
    setEditRow(row);
    setEditRegIds([]);
    setPanelMode("edit");
    const { data } = await supabase
      .from("participant_registrations")
      .select("feast_competition_id")
      .eq("participant_id", row.id);
    setEditRegIds((data ?? []).map((d) => d.feast_competition_id));
  };

  const exportCsv = () => {
    const header = ["Reg No", "Name", "House Name", "Shakha", "Gender", "Category", "Events", "Phone", "Registered"].join(",");
    const lines = filtered.map((r) =>
      [
        r.registration_number ?? "",
        `"${r.name}"`,
        `"${r.house_name ?? ""}"`,
        `"${r.shakha?.name ?? ""}"`,
        normGender(r.gender),
        r.competition_category?.name ?? "",
        r.comp_count,
        r.phone ?? "",
        new Date(r.created_at).toLocaleDateString("en-IN"),
      ].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "participants.csv";
    a.click();
  };

  const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-200 bg-white";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shrink-0">
            <Users size={17} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Participants</h1>
            <p className="text-xs text-gray-500">{filtered.length} of {rows.length} shown</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 bg-transparent cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => { setEditRow(null); setEditRegIds([]); setPanelMode("new"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] border-none cursor-pointer"
          >
            <Plus size={14} /> Register
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <select value={feastId} onChange={(e) => setFeastId(e.target.value)} className={`${selectCls} col-span-2 sm:col-span-1`}>
          {feasts.map((f) => <option key={f.id} value={f.id}>{f.name} {f.year}</option>)}
        </select>
        <select value={shakhaFilter} onChange={(e) => setShakhaFilter(e.target.value)} className={selectCls}>
          <option value="">All Shakhas</option>
          {shakhas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className={selectCls}>
          {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={selectCls}>
          {CAT_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, reg number or shakha…"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-200"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 border-none bg-transparent cursor-pointer">
            <X size={14} color="#9ca3af" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={22} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Reg No", "Name", "House", "Shakha", "Gender", "Category", "Events", "Phone", "Date", ""].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400 text-sm">No participants found.</td>
                </tr>
              )}
              {filtered.map((r) => {
                const gLabel = normGender(r.gender);
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-3 font-mono text-xs text-purple-700 whitespace-nowrap">{r.registration_number ?? "—"}</td>
                    <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{r.name}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{r.house_name ?? "—"}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{r.shakha?.name ?? "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        gLabel === "Boy" ? "bg-blue-50 text-blue-600" :
                        gLabel === "Girl" ? "bg-pink-50 text-pink-600" :
                        "bg-gray-100 text-gray-400"
                      }`}>
                        {gLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {r.competition_category
                        ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{r.competition_category.name}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        {r.comp_count}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{r.phone ?? "—"}</td>
                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => openEdit(r)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-purple-50 border-none bg-transparent cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={13} color="#7C3AED" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over */}
      {panelMode && (
        <ParticipantPanel
          mode={panelMode}
          feastId={feastId}
          shakhas={shakhas}
          feastComps={feastComps}
          participant={editRow}
          existingRegIds={editRegIds}
          onClose={() => setPanelMode(null)}
          onSaved={() => { setPanelMode(null); load(); }}
        />
      )}
    </div>
  );
}
