"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FileText,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { localInputToISO, isoToLocalInput, nowLocalInput } from "@/lib/datetime";
import type { ContentItem, ContentType } from "@/types";

const CONTENT_TYPES: ContentType[] = [
  "reflection", "message", "reel", "voice-note",
  "video", "audio", "saint-reflection",
];

const TYPE_LABELS: Record<string, string> = {
  reflection: "Reflection",
  message: "Message",
  reel: "Reel",
  "voice-note": "Voice Note",
  video: "Video",
  audio: "Audio",
  "saint-reflection": "Saint Reflection",
  activity: "Activity",
  notice: "Notice",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

interface FormState {
  title: string;
  content_type: ContentType;
  summary: string;
  content: string;
  thumbnail_url: string;
  media_url: string;
  featured: boolean;
  published_at: string;
}

const emptyForm: FormState = {
  title: "",
  content_type: "message",
  summary: "",
  content: "",
  thumbnail_url: "",
  media_url: "",
  featured: false,
  published_at: nowLocalInput(),
};

export default function AdminContentPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .order("published_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((item) => {
    const matchesType = filter === "All" || TYPE_LABELS[item.content_type] === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: ContentItem) {
    setEditId(item.id);
    setForm({
      title: item.title,
      content_type: item.content_type,
      summary: item.summary ?? "",
      content: item.content ?? "",
      thumbnail_url: item.thumbnail_url ?? "",
      media_url: item.media_url ?? "",
      featured: item.featured,
      published_at: item.published_at ? isoToLocalInput(item.published_at) : "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const slug = editId
      ? undefined
      : slugify(form.title) + "-" + Date.now().toString(36);

    const payload: Record<string, unknown> = {
      title: form.title,
      content_type: form.content_type,
      summary: form.summary || null,
      content: form.content || null,
      thumbnail_url: form.thumbnail_url || null,
      media_url: form.media_url || null,
      featured: form.featured,
      published_at: localInputToISO(form.published_at),
      created_by: profile?.id ?? null,
    };

    if (slug) payload.slug = slug;

    if (editId) {
      await supabase.from("content_items").update(payload).eq("id", editId);
    } else {
      await supabase.from("content_items").insert(payload);
    }
    setShowForm(false);
    setSaving(false);
    fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content item?")) return;
    await supabase.from("content_items").delete().eq("id", id);
    fetchItems();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <Link href="/admin" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Content</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage all content items</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white border-none cursor-pointer shrink-0" style={{ background: "#6B46FF" }}>
          <Plus size={15} /> New
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {["All", ...Object.values(TYPE_LABELS).filter((v, i, a) => a.indexOf(v) === i)].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-none cursor-pointer ${
              filter === type
                ? "bg-[#6B46FF] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="relative mb-3 sm:mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 focus:border-[#6B46FF]" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-gray-400">No content found</div>}
          {filtered.map((item) => (
            <div key={item.id} className="flex items-start sm:items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#6B46FF]/10 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <FileText size={16} color="#6B46FF" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13px] sm:text-sm text-gray-900 truncate">{item.title}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {TYPE_LABELS[item.content_type] ?? item.content_type} &middot; {formatDate(item.published_at)}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {item.featured && (
                  <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Featured</span>
                )}
                <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 border-none bg-transparent cursor-pointer"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 border-none bg-transparent cursor-pointer"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] bg-white sm:bg-black/30 sm:flex sm:items-start sm:justify-center sm:pt-12 sm:px-4 overflow-y-auto">
          <div className="w-full sm:max-w-lg sm:bg-white sm:rounded-2xl p-4 sm:p-6 sm:shadow-xl relative sm:mb-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editId ? "Edit Content" : "New Content"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Title *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputCls} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Type *</span>
                <select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value as ContentType })} className={`${inputCls} bg-white`}>
                  {CONTENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Summary</span>
                <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputCls} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Content</span>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className={`${inputCls} resize-none`} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Media URL</span>
                <input value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} placeholder="https://..." className={inputCls} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Thumbnail URL</span>
                <input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." className={inputCls} />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Publish date</span>
                  <input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} className={inputCls} />
                </label>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-[#6B46FF]" />
                    <span className="text-sm text-gray-700">Featured</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5 sticky bottom-0 bg-white py-3 -mx-4 px-4 sm:relative sm:justify-end sm:mx-0 sm:px-0 sm:py-0 border-t sm:border-0 border-gray-100">
              <button onClick={() => setShowForm(false)} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-none cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title} className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50" style={{ background: "#6B46FF" }}>
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
