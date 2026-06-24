"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Bell,
  CalendarDays,
  Users,
  Trophy,
  UserCheck,
  ClipboardCheck,
  ClipboardList,
  BookOpen,
  Layers,
  Medal,
  LogOut,
  Loader2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  color?: string;
};
type NavSection = { label?: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, color: "#6B46FF" },
    ],
  },
  {
    label: "M Hub",
    items: [
      { href: "/admin/content",    label: "Content",    icon: FileText,    color: "#6B46FF" },
      { href: "/admin/notices",    label: "Notices",    icon: Bell,        color: "#B45309" },
      { href: "/admin/activities", label: "Activities", icon: CalendarDays, color: "#15803D" },
      { href: "/admin/plan",       label: "Annual Plan", icon: BookOpen,    color: "#B0892F" },
    ],
  },
  {
    label: "Feast",
    items: [
      { href: "/admin/participants", label: "Participants", icon: UserCheck,    color: "#0891B2" },
      { href: "/admin/entries",      label: "Entries",      icon: ClipboardList, color: "#0F766E" },
      { href: "/admin/participation", label: "Participation", icon: ClipboardCheck, color: "#BE185D" },
      { href: "/admin/results",      label: "Results",      icon: Medal,         color: "#D97706" },
      { href: "/admin/standings",    label: "Standings",    icon: Trophy,        color: "#7C3AED" },
    ],
  },
  {
    label: "Fest Util",
    items: [
      { href: "/admin/users",        label: "Users",        icon: Users,   color: "#0369A1" },
      { href: "/admin/feasts",       label: "Feasts",       icon: Trophy,  color: "#9333EA" },
      { href: "/admin/competitions", label: "Competitions", icon: Layers,  color: "#475569" },
    ],
  },
];

// Bottom bar: 3 pinned items + Menu button
const BOTTOM_NAV: NavItem[] = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/participants", label: "Participants", icon: UserCheck },
  { href: "/admin/results",      label: "Results",      icon: Medal },
];

function isActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

// ─── Sidebar nav link (desktop) ───────────────────────────────────────────────

function SideNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-sm font-medium transition-colors pl-5 ${
        active ? "bg-[#6B46FF]/10 text-[#6B46FF]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon size={16} />
      {item.label}
    </Link>
  );
}

// ─── Mobile slide-up drawer ───────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  pathname,
  profile,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  profile: { full_name?: string | null; email?: string | null; role: string; shakha?: { name: string } | null } | null;
  onSignOut: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdrop}
        className="md:hidden fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: open ? "rgba(15,10,40,0.45)" : "transparent",
          backdropFilter: open ? "blur(2px)" : "none",
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 -8px 40px rgba(107,70,255,0.12)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(.2,.8,.2,1)",
          maxHeight: "82dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drag handle + header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-bold text-gray-900 text-base leading-tight">
              {profile?.full_name || profile?.email || "Admin"}
            </p>
            {profile?.role && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {profile.role.replace("_", " ")}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 border-none cursor-pointer text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable nav list */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-4" : ""}>
              {section.label && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 px-1">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                      style={{
                        background: active ? `${item.color ?? "#6B46FF"}12` : "transparent",
                        color: active ? (item.color ?? "#6B46FF") : "#374151",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${item.color ?? "#6B46FF"}15` }}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="flex-1 text-[15px] font-semibold">{item.label}</span>
                      {active && <ChevronRight size={15} style={{ color: item.color ?? "#6B46FF" }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <div className="mt-5 mb-2">
            <button
              onClick={onSignOut}
              className="flex items-center gap-3 px-3 py-3 rounded-xl w-full border-none bg-transparent cursor-pointer text-red-500 hover:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 shrink-0">
                <LogOut size={16} />
              </div>
              <span className="text-[15px] font-semibold">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !session && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [loading, session, isLoginPage, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-[#6B46FF]" />
      </div>
    );
  }

  if (!session) return null;

  // Current page label for the top bar
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const currentItem = allItems.find((i) => isActive(i.href, pathname));
  const pageTitle = currentItem?.label ?? "Admin";

  const handleSignOut = () => {
    signOut().then(() => router.replace("/admin/login"));
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-100 py-6 px-3">
        <div className="px-3 mb-5">
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

        <nav className="flex-1 flex flex-col gap-3">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <SideNavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer w-full mt-4"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-gray-400 leading-none mb-0.5">CML Admin</p>
          <h2 className="text-[17px] font-bold text-gray-900 leading-tight truncate">{pageTitle}</h2>
        </div>
        {profile?.role && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">
            {profile.role.replace("_", " ")}
          </span>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 safe-area-bottom">
        <div className="flex items-stretch h-[58px]">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors"
                style={{ color: active ? "#6B46FF" : "#9CA3AF" }}
              >
                <div
                  className="flex items-center justify-center rounded-xl px-4 py-1 transition-all"
                  style={{ background: active ? "rgba(107,70,255,0.1)" : "transparent" }}
                >
                  <Icon size={21} />
                </div>
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] border-none bg-transparent cursor-pointer transition-colors"
            style={{ color: drawerOpen ? "#6B46FF" : "#9CA3AF" }}
          >
            <div
              className="flex items-center justify-center rounded-xl px-4 py-1 transition-all"
              style={{ background: drawerOpen ? "rgba(107,70,255,0.1)" : "transparent" }}
            >
              <Menu size={21} />
            </div>
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
        profile={profile}
        onSignOut={handleSignOut}
      />

      {/* ── Main content ── */}
      <main className="flex-1 md:py-0 pt-[60px] pb-[70px] md:pb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
