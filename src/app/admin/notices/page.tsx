"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Bell,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { localInputToISO, isoToLocalInput, nowLocalInput } from "@/lib/datetime";
import type { Notice, Priority } from "@/types";

const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  normal: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-600",
};

const NOTICE_CATEGORIES = ["General", "Meeting", "Event", "Admin", "Resource", "Spiritual"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

interface FormState {
  title: string;
  category: string;
  summary: string;
  body: string;
  priority: Priority;
  published_at: string;
}

const emptyForm: FormState = {
  title: "",
  category: "General",
  summary: "",
  body: "",
  priority: "normal",
  published_at: nowLocalInput(),
};

export default function AdminNoticesPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("published_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(n: Notice) {
    setEditId(n.id);
    setForm({
      title: n.title,
      category: n.category,
      summary: n.summary ?? "",
      body: n.body ?? "",
      priority: n.priority,
      published_at: n.published_at ? isoToLocalInput(n.published_at) : "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      summary: form.summary || null,
      body: form.body || null,
      priority: form.priority,
      published_at: localInputToISO(form.published_at),
      created_by: profile?.id ?? null,
    };

    if (editId) {
      await supabase.from("notices").update(payload).eq("id", editId);
    } else {
      await supabase.from("notices").insert(payload);
    }
    setShowForm(false);
    setSaving(false);
    fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;
    await supabase.from("notices").delete().eq("id", id);
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
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Notices</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage notice board</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white border-none cursor-pointer shrink-0" style={{ background: "#6B46FF" }}>
          <Plus size={15} /> New
        </button>
      </div>

      <div className="relative mb-3 sm:mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 focus:border-[#6B46FF]" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-gray-400">No notices found</div>}
          {filtered.map((n) => (
            <div key={n.id} className="flex items-start sm:items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Bell size={16} color="#B45309" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13px] sm:text-sm text-gray-900 truncate">{n.title}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{n.category} &middot; {formatDate(n.published_at)}</div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[n.priority]}`}>
                  {n.priority}
                </span>
                <button onClick={() => openEdit(n)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 border-none bg-transparent cursor-pointer"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(n.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 border-none bg-transparent cursor-pointer"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] bg-white sm:bg-black/30 sm:flex sm:items-start sm:justify-center sm:pt-16 sm:px-4 overflow-y-auto">
          <div className="w-full sm:max-w-lg sm:bg-white sm:rounded-2xl p-4 sm:p-6 sm:shadow-xl relative sm:mb-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editId ? "Edit Notice" : "New Notice"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Title *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputCls} />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Category</span>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputCls} bg-white`}>
                    {NOTICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Priority</span>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={`${inputCls} bg-white`}>
                    {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Summary</span>
                <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputCls} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Body</span>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className={`${inputCls} resize-none`} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Publish date</span>
                <input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} className={inputCls} />
              </label>
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
