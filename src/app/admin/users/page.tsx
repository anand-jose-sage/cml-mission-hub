"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Search,
  Pencil,
  Plus,
  X,
  Loader2,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Profile, UserRole, Shakha } from "@/types";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "admin", label: "Admin", desc: "Branch administrator — full control on assigned branch" },
  { value: "me_admin", label: "ME Admin", desc: "Can view all branches" },
  { value: "sa_admin", label: "SA Admin", desc: "Full system access, no restrictions" },
];

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-blue-100 text-blue-700",
  me_admin: "bg-purple-100 text-purple-700",
  sa_admin: "bg-red-100 text-red-700",
};

export default function AdminUsersPage() {
  const { profile: currentUser, session } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [shakhas, setShakhas] = useState<Shakha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("admin");
  const [editShakha, setEditShakha] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Create user state
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("admin");
  const [newShakha, setNewShakha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const canManage = !!currentUser;

  const fetchData = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("*, shakha:shakhas(*)").order("created_at", { ascending: true }),
      supabase.from("shakhas").select("*").order("name"),
    ]);
    if (p) setProfiles(p);
    if (s) setShakhas(s);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = profiles.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(p: Profile) {
    setEditProfile(p);
    setEditRole(p.role);
    setEditShakha(p.shakha_id ?? "");
    setEditName(p.full_name);
  }

  function openCreate() {
    setNewEmail("");
    setNewPassword("");
    setNewName("");
    setNewRole("admin");
    setNewShakha("");
    setCreateError(null);
    setShowPw(false);
    setShowCreate(true);
  }

  async function handleCreateUser() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newName,
          role: newRole,
          shakha_id: newShakha || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
      } else {
        setShowCreate(false);
        fetchData();
      }
    } catch {
      setCreateError("Network error");
    }
    setCreating(false);
  }

  async function handleSave() {
    if (!editProfile) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        full_name: editName,
        role: editRole,
        shakha_id: editShakha || null,
      })
      .eq("id", editProfile.id);
    setSaving(false);
    setEditProfile(null);
    fetchData();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <Link href="/admin" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Users</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage admin users & roles</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white border-none cursor-pointer shrink-0" style={{ background: "#6B46FF" }}>
            <Plus size={15} /> Add User
          </button>
        )}
      </div>

      <div className="relative mb-3 sm:mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 focus:border-[#6B46FF]" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-gray-400">No users found</div>}
          {filtered.map((p) => (
            <div key={p.id} className="flex items-start sm:items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#6B46FF]/20 to-[#A78BFA]/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <span className="text-sm font-bold text-[#6B46FF]">
                  {(p.full_name || p.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13px] sm:text-sm text-gray-900 truncate">
                  {p.full_name || "—"}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{p.email}</div>
                {/* Mobile badges */}
                <div className="flex items-center gap-1 mt-1.5 sm:hidden">
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${ROLE_COLORS[p.role]}`}>
                    {p.role.replace("_", " ")}
                  </span>
                  {p.shakha && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">{p.shakha.name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Desktop badges */}
                {p.shakha && (
                  <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">{p.shakha.name}</span>
                )}
                <span className={`hidden sm:inline text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_COLORS[p.role]}`}>
                  {p.role.replace("_", " ")}
                </span>
                {canManage && (
                  <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 border-none bg-transparent cursor-pointer">
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role info */}
      <div className="mt-6 space-y-2">
        {ROLES.map((r) => (
          <div key={r.value} className="flex items-start gap-2 text-sm">
            <Shield size={14} className="mt-0.5 text-gray-400 shrink-0" />
            <div>
              <strong className="text-gray-700 uppercase text-xs">{r.label}</strong>
              <span className="text-gray-500 ml-1">{r.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editProfile && (
        <div className="fixed inset-0 z-[200] bg-white sm:bg-black/30 sm:flex sm:items-start sm:justify-center sm:pt-24 sm:px-4 overflow-y-auto">
          <div className="w-full sm:max-w-md sm:bg-white sm:rounded-2xl p-4 sm:p-6 sm:shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setEditProfile(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Full Name</span>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Email</span>
                <input value={editProfile.email} disabled className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Role</span>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 bg-white">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Branch (Shakha)</span>
                <select value={editShakha} onChange={(e) => setEditShakha(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 bg-white">
                  <option value="">None</option>
                  {shakhas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            </div>

            <div className="flex gap-2 mt-5 sticky bottom-0 bg-white py-3 -mx-4 px-4 sm:relative sm:justify-end sm:mx-0 sm:px-0 sm:py-0 border-t sm:border-0 border-gray-100">
              <button onClick={() => setEditProfile(null)} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-none cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50" style={{ background: "#6B46FF" }}>
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] bg-white sm:bg-black/30 sm:flex sm:items-start sm:justify-center sm:pt-20 sm:px-4 overflow-y-auto">
          <div className="w-full sm:max-w-md sm:bg-white sm:rounded-2xl p-4 sm:p-6 sm:shadow-xl relative sm:mb-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>

            {createError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {createError}
              </div>
            )}

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Tony K T" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Email *</span>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Password *</span>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Role</span>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 bg-white">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Branch (Shakha)</span>
                <select value={newShakha} onChange={(e) => setNewShakha(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 bg-white">
                  <option value="">None</option>
                  {shakhas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            </div>

            <div className="flex gap-2 mt-5 sticky bottom-0 bg-white py-3 -mx-4 px-4 sm:relative sm:justify-end sm:mx-0 sm:px-0 sm:py-0 border-t sm:border-0 border-gray-100">
              <button onClick={() => setShowCreate(false)} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-none cursor-pointer">Cancel</button>
              <button
                onClick={handleCreateUser}
                disabled={creating || !newEmail || !newPassword || newPassword.length < 6}
                className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50"
                style={{ background: "#6B46FF" }}
              >
                {creating ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
