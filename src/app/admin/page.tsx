"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Bell,
  CalendarDays,
  Users,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface SectionInfo {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  count: number;
  color: string;
}

export default function AdminPage() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ content: 0, notices: 0, activities: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const [c, n, a, u] = await Promise.all([
        supabase.from("content_items").select("id", { count: "exact", head: true }),
        supabase.from("notices").select("id", { count: "exact", head: true }),
        supabase.from("activities").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        content: c.count ?? 0,
        notices: n.count ?? 0,
        activities: a.count ?? 0,
        users: u.count ?? 0,
      });
      setLoading(false);
    }
    fetchCounts();
  }, []);

  const sections: SectionInfo[] = [
    {
      title: "Content",
      description: "Reflections, messages, reels, voice notes",
      href: "/admin/content",
      icon: FileText,
      count: counts.content,
      color: "#6B46FF",
    },
    {
      title: "Notices",
      description: "Notice board announcements",
      href: "/admin/notices",
      icon: Bell,
      count: counts.notices,
      color: "#B45309",
    },
    {
      title: "Activities",
      description: "Events, gatherings, missions",
      href: "/admin/activities",
      icon: CalendarDays,
      count: counts.activities,
      color: "#15803D",
    },
    {
      title: "Users",
      description: "Manage admin users & roles",
      href: "/admin/users",
      icon: Users,
      count: counts.users,
      color: "#0369A1",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#6B46FF] to-[#A78BFA] flex items-center justify-center shrink-0">
            <FolderOpen size={18} color="#fff" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              Welcome, {profile?.full_name || profile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="block p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: `${section.color}15` }}
                >
                  <Icon size={18} color={section.color} />
                </div>
                {loading ? (
                  <Loader2 size={14} className="animate-spin text-gray-300" />
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    {section.count}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">
                {section.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{section.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Role info */}
      {profile && (
        <div className="mt-5 sm:mt-8 p-3 sm:p-4 bg-purple-50 border border-purple-100 rounded-xl">
          <p className="text-xs sm:text-sm text-purple-800">
            Signed in as <strong className="break-all">{profile.email}</strong> &middot;{" "}
            <strong className="uppercase">{profile.role.replace("_", " ")}</strong>
            {profile.shakha && (
              <> &middot; {profile.shakha.name}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
