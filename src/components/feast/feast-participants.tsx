"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ChevronDown, Loader2 } from "lucide-react";
import { useFeasts, type FeastUI } from "@/hooks/use-feast";
import { SHAKHA_COLOR_MAP } from "@/lib/feast-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  searchParticipantResults,
  type ParticipantSearchRow,
} from "@/actions/results";
import { FeastTopBar, type FeastTheme } from "./feast-shared";

// ─── Feast kind helpers ───────────────────────────────────────────────────────

type FeastKind = "literature" | "arts";

function feastKind(f: FeastUI): FeastKind | null {
  const t = (f.slug + " " + f.name).toLowerCase();
  if (t.includes("literature")) return "literature";
  if (t.includes("arts")) return "arts";
  return null;
}

const KIND_GRAD: Record<FeastKind, string> = {
  literature: "linear-gradient(135deg,#6B46FF,#A78BFA)",
  arts: "linear-gradient(135deg,#A855F7,#EC4899)",
};
const KIND_COLOR: Record<FeastKind, string> = {
  literature: "#7C3AED",
  arts: "#C026D3",
};

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

// ─── Grade / position helpers ─────────────────────────────────────────────────

const POS_STYLE: Record<number, { bg: string; border: string; text: string; emoji: string }> = {
  1: { bg: "#FFFBEB", border: "#F5C542", text: "#92400E", emoji: "🥇" },
  2: { bg: "#F9FAFB", border: "#9CA3AF", text: "#374151", emoji: "🥈" },
  3: { bg: "#FFF7ED", border: "#E0936A", text: "#7C2D12", emoji: "🥉" },
};
const GRADE_BG: Record<string, string> = { A: "#16A34A", B: "#D97706", C: "#6B46FF" };
const CAT_LABEL: Record<string, string> = {
  sub_junior: "Sub Junior", junior: "Junior", senior: "Senior",
  super_senior: "Super Senior", elder: "Elder",
};

function PosBadge({ pos }: { pos: number }) {
  const s = POS_STYLE[pos];
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-full border shrink-0"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}>
      {s.emoji} {pos === 1 ? "1st" : pos === 2 ? "2nd" : "3rd"}
    </span>
  );
}

function GradeBadge({ grade }: { grade: "A" | "B" | "C" }) {
  return (
    <span className="inline-block text-[12px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: GRADE_BG[grade], color: "#fff" }}>
      Grade {grade}
    </span>
  );
}

// ─── Participant card with drill-down ─────────────────────────────────────────

function ParticipantCard({ row }: { row: ParticipantSearchRow }) {
  const [open, setOpen] = useState(false);
  const anek: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 700 };
  const sc = SHAKHA_COLOR_MAP[row.shakha] ?? "#A78BFA";
  const published = row.results.filter((r) => r.isPublished);
  const totalPts = published.reduce((a, r) => a + r.totalPoints, 0);

  return (
    <div
      className="relative mb-2.5 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        border: open ? `1.5px solid ${sc}44` : "1px solid rgba(255,255,255,0.8)",
        boxShadow: open ? `0 6px 22px ${sc}18` : "0 2px 10px rgba(107,70,255,0.05)",
        transition: "border-color 0.25s,box-shadow 0.25s",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-[16px]" style={{ background: sc }} />

      <button onClick={() => setOpen((o) => !o)} className="w-full text-left border-none bg-transparent pl-4 pr-3 pt-3 pb-2.5 cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-[15px]"
            style={{ background: `${sc}20`, color: sc, border: `1.5px solid ${sc}44` }}>
            {row.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[16px] leading-tight" style={{ color: "#1E1B4B", ...anek }}>{row.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <ShakhaPill name={row.shakha} />
              {row.category && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: "rgba(107,70,255,0.1)", color: "#7C3AED" }}>
                  {CAT_LABEL[row.category] ?? row.category}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            {row.regNo && (
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(107,70,255,0.08)", color: "#8B5CF6" }}>
                {row.regNo}
              </span>
            )}
            {totalPts > 0 && (
              <span className="text-[11px] font-black" style={{ color: "#7C3AED" }}>{totalPts} pts</span>
            )}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center gap-3 mt-2 pl-[52px]">
          <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>
            {row.results.length} competition{row.results.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-1">
            {published.filter((r) => r.grade).slice(0, 4).map((r, i) => (
              <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: GRADE_BG[r.grade!] ?? "#ccc", color: "#fff" }}>
                {r.grade}
              </span>
            ))}
            {published.filter((r) => r.position !== null && r.position! <= 3).slice(0, 3).map((r, i) => (
              <span key={`p${i}`} className="text-[11px]">{POS_STYLE[r.position!]?.emoji}</span>
            ))}
          </div>
          <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(107,70,255,0.1)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
            <ChevronDown size={13} color="#8B5CF6" />
          </div>
        </div>
      </button>

      {/* Drill-down */}
      <div className="overflow-hidden" style={{ maxHeight: open ? 800 : 0, transition: "max-height 0.32s cubic-bezier(.2,.8,.2,1)" }}>
        <div className="mx-3 mb-3 rounded-xl overflow-hidden"
          style={{ background: "rgba(107,70,255,0.04)", border: "1px solid rgba(107,70,255,0.08)" }}>
          {row.results.length === 0 ? (
            <p className="text-center py-5 text-[13px]" style={{ color: "#9CA3AF" }}>No competitions registered</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(107,70,255,0.07)" }}>
              {row.results.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-tight" style={{ color: "#1E1B4B", ...anek }}>{item.competitionName}</p>
                    {!item.isPublished && (
                      <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>Results pending</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.isPublished ? (
                      <>
                        {item.position !== null && item.position <= 3 && <PosBadge pos={item.position} />}
                        {item.grade && <GradeBadge grade={item.grade} />}
                        {!item.grade && !item.position && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(107,70,255,0.1)", color: "#8B5CF6" }}>
                            {item.totalPoints > 0 ? `${item.totalPoints} pts` : "—"}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(156,163,175,0.15)", color: "#9CA3AF" }}>Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeastParticipants({ slug, theme, onBack, onExit }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  setFeastSlug?: (s: string) => void;
}) {
  const { feasts } = useFeasts();
  const [activeFeastSlug, setActiveFeastSlug] = useState(slug);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(false);
  const [results, setResults] = useState<ParticipantSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync active slug when feasts load and current slug isn't in the list
  useEffect(() => {
    if (feasts.length > 0 && !feasts.find((f) => f.slug === activeFeastSlug)) {
      setActiveFeastSlug(feasts[0].slug);
    }
  }, [feasts]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = (q: string, feastSlug: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      const { data } = await searchParticipantResults(feastSlug, q.trim());
      setResults(data ?? []);
      setLoading(false);
    }, 350);
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    doSearch(v, activeFeastSlug);
  };

  const handleFeastChange = (s: string) => {
    setActiveFeastSlug(s);
    setResults([]);
    setSearched(false);
    if (query.trim()) doSearch(query, s);
  };

  const clearQuery = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="px-4">
      <FeastTopBar title="Participant Search" onBack={onBack} onExit={onExit} theme={theme} />

      {/* Feast chips */}
      {feasts.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {feasts.map((f) => {
            const on = f.slug === activeFeastSlug;
            const k = feastKind(f);
            return (
              <button
                key={f.slug}
                onClick={() => handleFeastChange(f.slug)}
                className="shrink-0 border-none cursor-pointer active:scale-95 transition-transform"
                style={{
                  padding: "7px 14px", borderRadius: 11, fontWeight: 700, fontSize: 13,
                  background: on ? (k ? KIND_GRAD[k] : "linear-gradient(135deg,#6B46FF,#A78BFA)") : "rgba(255,255,255,0.7)",
                  color: on ? "#fff" : "#4B5563",
                  border: on ? "none" : "1px solid rgba(107,70,255,0.12)",
                  boxShadow: on ? `0 4px 14px ${k ? KIND_COLOR[k] : "#6B46FF"}44` : "none",
                }}
              >
                {f.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Search box */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 mb-4 rounded-[14px] transition-all"
        style={{
          background: "rgba(255,255,255,0.82)",
          border: `1.5px solid ${focus ? "rgba(107,70,255,0.45)" : "rgba(107,70,255,0.18)"}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: focus ? "0 0 0 4px rgba(107,70,255,0.1)" : "none",
        }}
      >
        <Search size={16} color="#A78BFA" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Search participant name…"
          className="flex-1 border-none outline-none bg-transparent text-[15px] py-1"
          style={{ fontFamily: "var(--font-anek), sans-serif", fontWeight: 600, color: "#1E1B4B" }}
        />
        {query && (
          <button onClick={clearQuery} className="p-0.5 rounded-full cursor-pointer border-none bg-transparent">
            <X size={14} color="#9CA3AF" />
          </button>
        )}
      </div>

      {/* Content */}
      {!isSupabaseConfigured ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Search size={28} color={theme.faint} />
          <p className="text-[14px] text-center" style={{ color: theme.sub }}>
            Search requires a database connection.
          </p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: theme.lavender }} />
        </div>
      ) : searched && results.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <Search size={26} color={theme.faint} />
          <p className="text-[14px]" style={{ color: theme.sub }}>No participants found for "{query}"</p>
        </div>
      ) : !searched ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(107,70,255,0.08)" }}
          >
            <Search size={28} color="#A78BFA" />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: "#1E1B4B", fontFamily: "var(--font-anek),sans-serif" }}>
            Search Participants
          </p>
          <p className="text-[13px] text-center max-w-[220px]" style={{ color: theme.sub }}>
            Type a participant name to see their competitions and results
          </p>
        </div>
      ) : (
        <>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#A78BFA" }}>
            {results.length} participant{results.length !== 1 ? "s" : ""} found
          </p>
          {results.map((row) => (
            <ParticipantCard key={row.participantId} row={row} />
          ))}
        </>
      )}

      <div className="h-6" />
    </div>
  );
}
