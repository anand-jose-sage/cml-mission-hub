"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Trophy, Loader2, CalendarDays, ChevronRight,
  Pencil, Trash2, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FeastDB } from "@/types";

const STATUSES: FeastDB["status"][] = ["draft", "registration_open", "ongoing", "completed"];
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", registration_open: "Registration Open",
  ongoing: "Ongoing", completed: "Completed",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  registration_open: "bg-green-100 text-green-700",
  ongoing: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
};

interface FeastRow extends FeastDB {
  participant_count?: number;
}

const emptyForm = {
  name: "", slug: "", type: "literature", year: "2026",
  status: "draft" as FeastDB["status"],
  description: "", venue: "", start_date: "", end_date: "",
};

export default function FeastsAdminPage() {
  const [feasts, setFeasts] = useState<FeastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feasts")
      .select("*, participant_count:participants(count)")
      .order("start_date");
    if (data) {
      setFeasts(data.map((f) => ({
        ...f,
        participant_count: (f.participant_count as unknown as { count: number }[])?.[0]?.count ?? 0,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (f: FeastRow) => {
    setEditId(f.id);
    setForm({
      name: f.name, slug: f.slug, type: f.type, year: f.year,
      status: f.status, description: f.description ?? "",
      venue: f.venue ?? "",
      start_date: f.start_date?.slice(0, 10) ?? "",
      end_date: f.end_date?.slice(0, 10) ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) { setError("Name and slug are required."); return; }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(), slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      type: form.type, year: form.year, status: form.status,
      description: form.description || null, venue: form.venue || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
    };
    const { error: err } = editId
      ? await supabase.from("feasts").update(payload).eq("id", editId)
      : await supabase.from("feasts").insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this feast and all its data? This cannot be undone.")) return;
    await supabase.from("feasts").delete().eq("id", id);
    load();
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
            <Trophy size={17} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Feasts</h1>
            <p className="text-xs text-gray-500">Manage feast events</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors border-none cursor-pointer"
        >
          <Plus size={15} /> New Feast
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      )}

      {!loading && feasts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Trophy size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No feasts yet. Create one to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {feasts.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={18} color="#7C3AED" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{f.name}</span>
                <span className="text-xs text-gray-400">{f.year}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLOR[f.status]}`}>
                  {STATUS_LABEL[f.status]}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {f.venue && <span>{f.venue} · </span>}
                <span>{f.participant_count ?? 0} participants</span>
                {f.slug && <span className="ml-2 text-gray-400 font-mono">/{f.slug}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link
                href={`/admin/feasts/${f.id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
              >
                Competitions <ChevronRight size={13} />
              </Link>
              <button
                onClick={() => openEdit(f)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer"
              ><Pencil size={14} color="#6b7280" /></button>
              <button
                onClick={() => remove(f.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
              ><Trash2 size={14} color="#ef4444" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">{editId ? "Edit Feast" : "New Feast"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              <Field label="Name" value={form.name} onChange={(v) => set("name", v)} placeholder="Literature Feast 2026" />
              <Field label="Slug (URL key)" value={form.slug} onChange={(v) => set("slug", v)} placeholder="literature-feast-2026" hint="Used in URLs — lowercase, hyphens only" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-300">
                    {["literature", "arts", "sports", "general"].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <Field label="Year" value={form.year} onChange={(v) => set("year", v)} placeholder="2026" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-300">
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <Field label="Venue" value={form.venue} onChange={(v) => set("venue", v)} placeholder="St. Theresa's Campus" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date" value={form.start_date} onChange={(v) => set("start_date", v)} placeholder="" type="date" />
                <Field label="End date" value={form.end_date} onChange={(v) => set("end_date", v)} placeholder="" type="date" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Short description of this feast…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-2.5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors bg-transparent cursor-pointer">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; hint?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-300"
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
