"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Bell,
  CalendarDays,
  Users,
  Trophy,
  UserCheck,
  ClipboardList,
  Layers,
  Medal,
  LogOut,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/activities", label: "Activities", icon: CalendarDays },
  { href: "/admin/users", label: "Users", icon: Users },
  // Feast section
  { href: "/admin/feasts", label: "Feasts", icon: Trophy },
  { href: "/admin/participants", label: "Participants", icon: UserCheck },
  { href: "/admin/entries", label: "Entries", icon: ClipboardList },
  { href: "/admin/competitions", label: "Competitions", icon: Layers },
  { href: "/admin/results", label: "Results", icon: Medal },
  { href: "/admin/standings", label: "Standings", icon: Trophy },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Login page doesn't need protection
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !session && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [loading, session, isLoginPage, router]);

  // Login page renders without shell
  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-[#6B46FF]" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-dvh bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-100 py-6 px-3">
        <div className="px-3 mb-6">
          <h2 className="text-lg font-bold text-gray-900">CML Admin</h2>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {profile?.full_name || profile?.email}
          </p>
          {profile?.role && (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {profile.role.replace("_", " ")}
            </span>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#6B46FF]/10 text-[#6B46FF]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => signOut().then(() => router.replace("/admin/login"))}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer w-full"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">CML Admin</h2>
        <div className="flex items-center gap-2">
          {profile?.role && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {profile.role.replace("_", " ")}
            </span>
          )}
          <button
            onClick={() => signOut().then(() => router.replace("/admin/login"))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 border-none bg-transparent cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 pb-3 text-[10px] font-medium ${
                active ? "text-[#6B46FF]" : "text-gray-400"
              }`}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 md:py-0 pt-14 pb-20 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
