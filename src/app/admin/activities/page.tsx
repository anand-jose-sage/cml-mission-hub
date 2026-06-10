"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CalendarDays,
  Search,
  MapPin,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Activity, ActivityCategory } from "@/types";

const CATEGORIES: ActivityCategory[] = [
  "feast", "solemnity", "memorial", "meeting", "gathering",
  "outreach", "formation", "camp", "music", "fundraiser",
  "season", "celebration", "activity",
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

interface FormState {
  title: string;
  summary: string;
  description: string;
  category: ActivityCategory;
  location: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  featured: boolean;
  cover_image: string;
  thumbnail_url: string;
  media_url: string;
  saint_name: string;
}

const emptyForm: FormState = {
  title: "",
  summary: "",
  description: "",
  category: "activity",
  location: "",
  start_date: "",
  end_date: "",
  all_day: false,
  featured: false,
  cover_image: "",
  thumbnail_url: "",
  media_url: "",
  saint_name: "",
};

export default function AdminActivitiesPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("start_date", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(a: Activity) {
    setEditId(a.id);
    setForm({
      title: a.title,
      summary: a.summary ?? "",
      description: a.description ?? "",
      category: a.category ?? "activity",
      location: a.location ?? "",
      start_date: a.start_date ? a.start_date.slice(0, 16) : "",
      end_date: a.end_date ? a.end_date.slice(0, 16) : "",
      all_day: a.all_day,
      featured: a.featured,
      cover_image: a.cover_image ?? "",
      thumbnail_url: a.thumbnail_url ?? "",
      media_url: a.media_url ?? "",
      saint_name: a.saint_name ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      title: form.title,
      summary: form.summary || null,
      description: form.description || null,
      category: form.category,
      location: form.location || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      all_day: form.all_day,
      featured: form.featured,
      cover_image: form.cover_image || null,
      thumbnail_url: form.thumbnail_url || null,
      media_url: form.media_url || null,
      saint_name: form.saint_name || null,
      created_by: profile?.id ?? null,
    };

    if (editId) {
      await supabase.from("activities").update(payload).eq("id", editId);
    } else {
      await supabase.from("activities").insert(payload);
    }
    setShowForm(false);
    setSaving(false);
    fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this activity?")) return;
    await supabase.from("activities").delete().eq("id", id);
    fetchItems();
  }

  function F({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <label className="block">
        <span className="text-sm font-medium text-gray-700 mb-1 block">{label}</span>
        {children}
      </label>
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <Link
          href="/admin"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Activities</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage events & activities</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white border-none cursor-pointer shrink-0"
          style={{ background: "#6B46FF" }}
        >
          <Plus size={15} />
          New
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3 sm:mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 focus:border-[#6B46FF]"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No activities found</div>
          )}
          {filtered.map((a) => (
            <div key={a.id} className="flex items-start sm:items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <CalendarDays size={16} color="#15803D" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13px] sm:text-sm text-gray-900 truncate">{a.title}</div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap mt-0.5">
                  <span>{formatDate(a.start_date)} &middot; {formatTime(a.start_date)}</span>
                  {a.location && (
                    <span className="inline-flex items-center gap-1 hidden sm:inline-flex">
                      <MapPin size={11} /> {a.location}
                    </span>
                  )}
                </div>
                {/* Mobile: badges below text */}
                <div className="flex items-center gap-1.5 mt-1.5 sm:hidden">
                  {a.category && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 capitalize">{a.category}</span>
                  )}
                  {a.featured && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">Featured</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Desktop badges */}
                {a.category && (
                  <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 capitalize">{a.category}</span>
                )}
                {a.featured && (
                  <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Featured</span>
                )}
                <button onClick={() => openEdit(a)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 border-none bg-transparent cursor-pointer">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(a.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 border-none bg-transparent cursor-pointer">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] bg-white sm:bg-black/30 sm:flex sm:items-start sm:justify-center sm:pt-10 sm:px-4 overflow-y-auto">
          <div className="w-full sm:max-w-lg sm:bg-white sm:rounded-2xl p-4 sm:p-6 sm:shadow-xl relative sm:mb-20">
            {/* Mobile header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editId ? "Edit Activity" : "New Activity"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <F label="Title *">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputCls} />
              </F>

              <F label="Summary">
                <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Short summary..." className={inputCls} />
              </F>

              <F label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
              </F>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Category">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ActivityCategory })} className={`${inputCls} bg-white`}>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </F>
                <F label="Location">
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
                </F>
              </div>

              <F label="Saint Name">
                <input value={form.saint_name} onChange={(e) => setForm({ ...form, saint_name: e.target.value })} placeholder="e.g. St. Therese of Lisieux" className={inputCls} />
              </F>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Start Date *">
                  <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required className={inputCls} />
                </F>
                <F label="End Date">
                  <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
                </F>
              </div>

              <F label="Cover Image URL">
                <input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="https://..." className={inputCls} />
              </F>

              <F label="Thumbnail URL">
                <input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." className={inputCls} />
              </F>

              <F label="Media URL">
                <input value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} placeholder="https://... (video/audio link)" className={inputCls} />
              </F>

              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.all_day} onChange={(e) => setForm({ ...form, all_day: e.target.checked })} className="accent-[#6B46FF]" />
                  <span className="text-sm text-gray-700">All day</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-[#6B46FF]" />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-5 sticky bottom-0 bg-white py-3 -mx-4 px-4 sm:relative sm:justify-end sm:mx-0 sm:px-0 sm:py-0 border-t sm:border-0 border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.start_date}
                className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50"
                style={{ background: "#6B46FF" }}
              >
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
