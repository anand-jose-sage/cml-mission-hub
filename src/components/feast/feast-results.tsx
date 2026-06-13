"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, Trophy, Search, BookOpen, Palette } from "lucide-react";
import { useFeast, useFeasts } from "@/hooks/use-feast";
import { getPublishedResults, type PublicResultRow } from "@/actions/results";
import { SHAKHA_COLOR_MAP } from "@/lib/feast-data";
import { FeastTopBar, FeastTabs, type FeastTheme } from "./feast-shared";

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_CONFIG = [
  { slug: "sub_junior",   label: "Sub Jr",  color: "#34D3EE" },
  { slug: "junior",       label: "Junior",  color: "#22C55E" },
  { slug: "senior",       label: "Senior",  color: "#6B46FF" },
  { slug: "super_senior", label: "Super Sr",color: "#F5A742" },
  { slug: "elder",        label: "Elder",   color: "#9D99BC" },
] as const;
type CatSlug = typeof CAT_CONFIG[number]["slug"];

// ─── Shakha pill ──────────────────────────────────────────────────────────────

function ShakhaPill({ name }: { name: string }) {
  const c = SHAKHA_COLOR_MAP[name] ?? "#A78BFA";
  return (
    <span
      className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-lg"
      style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c, boxShadow: `0 0 5px ${c}` }} />
      {name}
    </span>
  );
}

// ─── Position badge ───────────────────────────────────────────────────────────

const POS_STYLE: Record<number, { bg: string; border: string; text: string; emoji: string }> = {
  1: { bg: "#FFFBEB", border: "#F5C542", text: "#92400E", emoji: "🥇" },
  2: { bg: "#F9FAFB", border: "#9CA3AF", text: "#374151", emoji: "🥈" },
  3: { bg: "#FFF7ED", border: "#E0936A", text: "#7C2D12", emoji: "🥉" },
};

function PosBadge({ pos }: { pos: number }) {
  const s = POS_STYLE[pos];
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full border shrink-0"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      {s.emoji} {pos === 1 ? "1st" : pos === 2 ? "2nd" : "3rd"}
    </span>
  );
}

// ─── Grade badge ──────────────────────────────────────────────────────────────

const GRADE_STYLE: Record<string, { bg: string }> = {
  A: { bg: "#16A34A" }, B: { bg: "#D97706" }, C: { bg: "#6B46FF" },
};

function GradeBadge({ grade }: { grade: "A" | "B" | "C" }) {
  return (
    <span
      className="inline-block text-[12px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: GRADE_STYLE[grade]?.bg ?? "#ccc", color: "#fff" }}
    >
      Grade {grade}
    </span>
  );
}

// ─── Sort rows ────────────────────────────────────────────────────────────────

function sortResults(rows: PublicResultRow[]): PublicResultRow[] {
  const go: Record<string, number> = { A: 0, B: 1, C: 2 };
  return [...rows].sort((a, b) => {
    if (a.position !== null && b.position !== null) return a.position - b.position;
    if (a.position !== null) return -1;
    if (b.position !== null) return 1;
    const ga = go[a.grade ?? ""] ?? 9;
    const gb = go[b.grade ?? ""] ?? 9;
    if (ga !== gb) return ga - gb;
    return a.name.localeCompare(b.name);
  });
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({ row, catColor }: { row: PublicResultRow; catColor: string }) {
  const anek: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 700 };
  const isTop = row.position !== null && row.position <= 3;
  return (
    <div
      className="grid items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1.5"
      style={{
        gridTemplateColumns: "2.5rem minmax(0,1fr) auto 4.75rem",
        background: isTop ? POS_STYLE[row.position!]?.bg ?? "#fff" : "rgba(255,255,255,0.65)",
        border: isTop ? `1px solid ${POS_STYLE[row.position!]?.border ?? catColor}55` : "1px solid rgba(255,255,255,0.75)",
      }}
    >
      {/* Col 1 — position */}
      <div className="flex justify-center">
        {row.position !== null && row.position <= 3
          ? <PosBadge pos={row.position} />
          : <span className="text-[12px] text-gray-300 font-mono">—</span>}
      </div>

      {/* Col 2 — name + house */}
      <div className="min-w-0">
        <p className="text-[15px] leading-tight truncate" style={{ color: "#1E1B4B", ...anek }}>{row.name}</p>
        {row.houseName && (
          <p className="text-[12px] font-semibold leading-tight truncate mt-0.5" style={{ color: "#7C3AED" }}>
            {row.houseName}
          </p>
        )}
      </div>

      {/* Col 3 — shakha pill */}
      <div className="flex justify-end">
        <ShakhaPill name={row.shakha} />
      </div>

      {/* Col 4 — grade chip */}
      <div className="flex justify-center">
        {row.grade ? <GradeBadge grade={row.grade} /> : <span className="text-[12px] text-gray-300">—</span>}
      </div>
    </div>
  );
}

// ─── Competition card ─────────────────────────────────────────────────────────

function CompCard({
  comp, catColor,
}: {
  comp: { id: string; name: string; gender?: string | null; competitionCategorySlug?: string | null; compStatus?: string | null };
  catColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PublicResultRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const anek: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 600 };
  const isPublished = comp.compStatus === "published";

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && results === null) {
      setLoading(true);
      const res = await getPublishedResults(comp.id);
      setResults(res.data ?? []);
      setLoading(false);
    }
  };

  const sorted = results ? sortResults(results) : [];

  return (
    <div
      className="relative overflow-hidden mb-2.5"
      style={{
        background: "rgba(255,255,255,0.52)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)", borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 12px rgba(107,70,255,0.06)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[16px]" style={{ background: catColor }} />
      <button onClick={toggle} className="w-full text-left border-none bg-transparent pl-4 pr-3 pt-2.5 pb-2.5 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[18px] leading-tight flex-1" style={{ color: "#1E1B4B", ...anek }}>{comp.name}</p>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {isPublished
              ? <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(107,70,255,0.14)", color: "#6B46FF" }}><Trophy size={9} className="inline -mt-0.5 mr-0.5" />Results</span>
              : <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(156,163,175,0.15)", color: "#9CA3AF" }}>Pending</span>}
            <span className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(107,70,255,0.1)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
              <ChevronDown size={14} color="#6B46FF" />
            </span>
          </div>
        </div>
        {comp.gender && (
          <p className="text-[14px] mt-0.5" style={{ color: comp.gender.toLowerCase().includes("girl") ? "#EC4899" : "#3B82F6", ...anek }}>
            {comp.gender.charAt(0).toUpperCase() + comp.gender.slice(1)}
          </p>
        )}
      </button>
      <div className="overflow-hidden" style={{ maxHeight: open ? 1400 : 0, transition: "max-height 0.32s cubic-bezier(.2,.8,.2,1)" }}>
        <div className="px-3 pb-3">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: catColor }} /></div>
          ) : !isPublished ? (
            <div className="text-center py-5 rounded-xl text-[13px]" style={{ background: `${catColor}10`, color: "#9CA3AF" }}>Results not yet published</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-5 rounded-xl text-[13px]" style={{ background: `${catColor}10`, color: "#9CA3AF" }}>No results recorded</div>
          ) : (
            <>
              {sorted.some(r => r.position !== null) && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: catColor }}>Positions</p>
                  {sorted.filter(r => r.position !== null).map(r => <ResultRow key={r.registrationId} row={r} catColor={catColor} />)}
                </div>
              )}
              {sorted.some(r => r.position === null && r.grade !== null) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: catColor }}>Grades</p>
                  {sorted.filter(r => r.position === null && r.grade !== null).map(r => <ResultRow key={r.registrationId} row={r} catColor={catColor} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category tabs + competition list ─────────────────────────────────────────

function ResultsTabs({ competitions }: {
  competitions: { id: string; name: string; gender?: string | null; competitionCategorySlug?: string | null; compStatus?: string | null }[];
}) {
  const [activeTab, setActiveTab] = useState<CatSlug | "">("");

  const available = CAT_CONFIG.filter(cat => competitions.some(c => c.competitionCategorySlug === cat.slug));
  const resolved: CatSlug | "" =
    activeTab && available.some(c => c.slug === activeTab) ? (activeTab as CatSlug) : (available[0]?.slug ?? "");

  const filtered = competitions.filter(c => c.competitionCategorySlug === resolved);
  const activeCat = CAT_CONFIG.find(c => c.slug === resolved);

  if (available.length === 0) {
    return <p className="text-[15px] text-center py-8" style={{ color: "#6B7280" }}>No competitions yet.</p>;
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {available.map(cat => {
          const on = cat.slug === resolved;
          return (
            <button key={cat.slug} onClick={() => setActiveTab(cat.slug)}
              className="flex items-center gap-1.5 shrink-0 border-none cursor-pointer active:scale-[0.96] transition-transform"
              style={{
                padding: "9px 16px", borderRadius: 13, fontWeight: 800, fontSize: 16,
                background: on ? "linear-gradient(135deg,#6B46FF,#A78BFA)" : "rgba(255,255,255,0.45)",
                color: on ? "#fff" : "#4B5563",
                border: on ? "1.5px solid transparent" : "1.5px solid rgba(107,70,255,0.15)",
                boxShadow: on ? "0 4px 14px rgba(107,70,255,0.35)" : "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: on ? "rgba(255,255,255,0.7)" : cat.color }} />
              {cat.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        {filtered.length === 0
          ? <p className="text-[15px] text-center py-6" style={{ color: "#9CA3AF" }}>No competitions in this category.</p>
          : filtered.map(comp => <CompCard key={comp.id} comp={comp} catColor={activeCat?.color ?? "#6B46FF"} />)}
      </div>
    </div>
  );
}

// ─── Feast content (competitions for one feast) ───────────────────────────────

function FeastContent({ slug, theme }: { slug: string; theme: FeastTheme }) {
  const { feast, loading } = useFeast(slug);

  if (loading && !feast) {
    return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: theme.lavender }} /></div>;
  }
  if (!feast?.competitions.length) {
    return <p className="text-center py-10 text-[14px]" style={{ color: theme.sub }}>No competitions found for this feast.</p>;
  }

  return (
    <div className="rounded-[20px] p-3 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg,#ede9fe,#f5f3ff,#faf5ff,#ede9fe)", border: "1px solid rgba(107,70,255,0.12)" }}>
      <div className="absolute pointer-events-none"
        style={{ top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.25) 0%,transparent 70%)", filter: "blur(20px)" }} />
      <div className="absolute pointer-events-none"
        style={{ bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(52,211,238,0.18) 0%,transparent 70%)", filter: "blur(18px)" }} />
      <div className="relative">
        <ResultsTabs competitions={feast.competitions} />
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function FeastResults({ slug, theme, onBack, onExit, onSearchNav, setFeastSlug }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  onSearchNav: () => void;
  setFeastSlug?: (s: string) => void;
}) {
  const { feasts, loading: feastsLoading } = useFeasts();
  const [activeSlug, setActiveSlug] = useState(slug);

  // Auto-select first feast once DB feasts load
  useEffect(() => {
    if (feasts.length > 0 && !feasts.find(f => f.slug === activeSlug)) {
      setActiveSlug(feasts[0].slug);
    }
  }, [feasts]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePick = (s: string) => {
    setActiveSlug(s);
    setFeastSlug?.(s);
  };

  return (
    <div className="px-4">
      <FeastTopBar title="Results" onBack={onBack} onExit={onExit} theme={theme} />

      {/* Feast selector from DB */}
      <FeastTabs feasts={feasts} active={activeSlug} onPick={handlePick} loading={feastsLoading} />

      {/* Search shortcut button */}
      <button
        onClick={onSearchNav}
        className="w-full flex items-center gap-2.5 px-4 py-3 mb-4 rounded-[14px] border-none cursor-pointer active:scale-[0.98] transition-transform"
        style={{
          background: "rgba(255,255,255,0.72)",
          border: "1.5px solid rgba(107,70,255,0.14)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(107,70,255,0.1)" }}>
          <Search size={15} color="#8B5CF6" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[14px] font-bold" style={{ color: "#1E1B4B", fontFamily: "var(--font-anek),sans-serif" }}>Search Participants</p>
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Find a participant and see their results</p>
        </div>
        <ChevronDown size={14} color="#C4B5FD" style={{ transform: "rotate(-90deg)" }} />
      </button>

      {/* Competition results for selected feast */}
      {!feastsLoading && feasts.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <BookOpen size={28} color={theme.faint} />
          <p className="text-[14px]" style={{ color: theme.sub }}>No feasts found.</p>
        </div>
      ) : activeSlug ? (
        <FeastContent key={activeSlug} slug={activeSlug} theme={theme} />
      ) : (
        <div className="flex flex-col items-center py-14 gap-3">
          <Palette size={26} color={theme.faint} />
          <p className="text-[14px]" style={{ color: theme.sub }}>Select a feast above to view results.</p>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}
