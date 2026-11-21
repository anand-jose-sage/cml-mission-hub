"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, Trophy, Search, BookOpen, Camera, Church, Award } from "lucide-react";
import { motion } from "framer-motion";
import { GradeBadge, Medal, NB, isMedalPos, toneStyle } from "./nebula-ui";
import { useFeast, useFeasts } from "@/hooks/use-feast";
import { getPublishedResults, type PublicResultRow } from "@/actions/results";
import { getPublishedTeamResults } from "@/actions/team-results";
import { CATEGORY_LABELS } from "@/lib/competition-categories";
import { FeastTopBar, FeastTabs, type FeastTheme } from "./feast-shared";
import { PosterGeneratorOverlay, type PosterWinner } from "./poster/poster-generator-overlay";

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_CONFIG = [
  { slug: "poombatta_1",  label: "Poombatta 1", color: "#FF6FB0" },
  { slug: "poombatta_2",  label: "Poombatta 2", color: "#FB7185" },
  { slug: "sub_junior",   label: "Sub Jr",  color: "#34D3EE" },
  { slug: "junior",       label: "Junior",  color: "#22C55E" },
  { slug: "senior",       label: "Senior",  color: "#B44CFF" },
  { slug: "super_senior", label: "Super Sr",color: "#F5A742" },
  { slug: "elder",        label: "Elder",   color: "#9D99BC" },
] as const;
type CatSlug = typeof CAT_CONFIG[number]["slug"];

const TEAM_TAB = { slug: "team", label: "Team", color: "#EC4899" } as const;
type TabSlug = CatSlug | "team";

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

// ─── Result row (fest_hub ResultRow, shakha only) ─────────────────────────────

function ShakhaTag({ shakha, color }: { shakha: string; color: string }) {
  const tint = (pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
  return (
    <span
      className="flex w-fit max-w-full items-center justify-center gap-1.5 rounded-full px-3 py-1 text-center text-[12px] font-semibold leading-tight break-words"
      style={{ color, border: `1px solid ${tint(45)}` }}
    >
      <Church className="h-[13px] w-[13px] shrink-0" aria-hidden="true" />
      {shakha}
    </span>
  );
}

function ResultRow({ row, isTeam, competitionName, categoryLabel, feastName, onGeneratePoster, delay }: {
  row: PublicResultRow; isTeam: boolean; delay: number;
  competitionName: string; categoryLabel: string; feastName: string; onGeneratePoster: (winner: PosterWinner) => void;
}) {
  const pos = isMedalPos(row.position) ? row.position : null;
  const sc = NB.link;
  const openPoster = () => {
    if (!pos) return;
    onGeneratePoster({
      rank: pos,
      winnerName: row.name,
      houseName: row.houseName,
      shakhaName: row.shakha,
      competitionName,
      categoryLabel,
      feastName,
    });
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-3 rounded-[14px] px-3 py-[11px]"
      style={pos === 1 ? toneStyle(1) : { background: NB.surface3, border: `1px solid ${NB.line}` }}
    >
      {pos ? (
        <Medal pos={pos} size={32} />
      ) : (
        <span className="w-8 shrink-0 text-center text-[15px] font-extrabold tabular-nums" style={{ color: NB.faint, fontFamily: NB.num }}>
          {row.position ?? "–"}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[17px] font-black leading-tight" style={{ color: NB.text, fontFamily: NB.ml }}>{row.name}</span>
        <span className="flex min-w-0 flex-col items-start gap-1.5 text-[12.5px] font-semibold" style={{ color: NB.sub }}>
          {row.houseName && !isTeam && <span style={{ fontFamily: NB.ml }}>{row.houseName}</span>}
          <ShakhaTag shakha={row.shakha} color={sc} />
        </span>
        {isTeam && row.houseName && (
          <span className="text-[12px] font-semibold" style={{ color: NB.sub, fontFamily: NB.ml }}>
            <span className="font-extrabold">Members:</span> {row.houseName}
          </span>
        )}
      </span>
      {pos && !isTeam && (
        <button
          type="button"
          onClick={openPoster}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full cursor-pointer"
          style={{ background: "rgba(37,211,102,0.14)", border: "1px solid rgba(37,211,102,0.45)", color: "#25D366" }}
          aria-label="Generate social poster"
        >
          <Camera size={17} />
        </button>
      )}
      <GradeBadge grade={row.grade} size={34} />
    </motion.li>
  );
}

function ResultTable({ title, accent, rows, isTeam, competitionName, categoryLabel, feastName, onGeneratePoster }: {
  title: string; accent: string; rows: PublicResultRow[]; isTeam: boolean;
  competitionName: string; categoryLabel: string; feastName: string; onGeneratePoster: (winner: PosterWinner) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="mb-2 px-1 text-[10.5px] font-extrabold uppercase tracking-[0.16em]" style={{ color: accent }}>{title}</p>
      <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
        {rows.map((r, i) => (
          <ResultRow
            key={r.registrationId} row={r} isTeam={isTeam} delay={Math.min(i, 8) * 0.05}
            competitionName={competitionName} categoryLabel={categoryLabel} feastName={feastName} onGeneratePoster={onGeneratePoster}
          />
        ))}
      </ol>
    </div>
  );
}

// ─── Award card: 1st–3rd (fest_hub AwardCard, Nebula Glass orchid board) ─────

const PLACE_PASTEL: Record<1 | 2 | 3, { bg: string; line: string; glow?: string }> = {
  1: { bg: "linear-gradient(120deg, #FFF5D6 0%, #FCE29B 100%)", line: "#EBC45E", glow: "0 10px 24px rgba(245,197,66,.28)" },
  2: { bg: "linear-gradient(120deg, #F2F7FC 0%, #C2D0E2 100%)", line: "#8DA2BE", glow: "0 8px 20px rgba(110,130,160,.22)" },
  3: { bg: "linear-gradient(120deg, #FDEDE1 0%, #F4D0B4 100%)", line: "#DDAB86" },
};
const AWARD = { ink: "#1E1B4B", sub: "#55517E", link: "#4B31B3", goldInk: "#8A5800" };

function AwardCard({ rows, accent, isTeam, onPoster }: {
  rows: PublicResultRow[]; accent: string; isTeam: boolean; onPoster: (row: PublicResultRow) => void;
}) {
  return (
    <article
      className="overflow-hidden rounded-[24px]"
      style={{
        background: "linear-gradient(165deg, #F1E6FF 0%, #E2CEFF 50%, #F6DAF2 100%)",
        color: AWARD.ink,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 0 #FFFFFF, 0 26px 60px rgba(3,1,14,0.6), 0 0 44px rgba(180,76,255,0.32)",
      }}
    >
      <div aria-hidden="true" className="h-[5px]" style={{ background: `linear-gradient(90deg, ${accent}, #F5C542)` }} />
      <div className="flex items-center gap-1.5 px-4 pb-1 pt-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em]" style={{ color: "#5A1FB8" }}>
        <Award className="h-[13px] w-[13px]" aria-hidden="true" />
        Final results
      </div>
      <ol className="m-0 flex list-none flex-col gap-[7px] px-2.5 pb-2.5 pt-2.5">
        {rows.map((w, i) => {
          const pos = isMedalPos(w.position) ? w.position : null;
          const first = pos === 1;
          return (
            <motion.li
              key={w.registrationId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + Math.min(i, 4) * 0.08 }}
              className="relative flex items-center gap-3 overflow-hidden rounded-[18px]"
              style={{
                padding: first ? "16px 12px" : "12px 12px 12px 14px",
                background: pos ? PLACE_PASTEL[pos].bg : "rgba(255,255,255,0.6)",
                border: `1px solid ${pos ? PLACE_PASTEL[pos].line : "rgba(90,31,184,0.16)"}`,
                boxShadow: pos ? PLACE_PASTEL[pos].glow : undefined,
              }}
            >
              {first && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-[30%]"
                  style={{ background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.7), rgba(255,255,255,0))", skewX: -18 }}
                  initial={{ x: "-160%" }}
                  animate={{ x: "420%" }}
                  transition={{ duration: 1.6, delay: 0.6, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
                />
              )}
              {pos ? <Medal pos={pos} size={first ? 48 : 40} /> : <span className="w-10" />}
              <span className="relative flex min-w-0 flex-1 flex-col gap-[3px]">
                {first && <span className="text-[9.5px] font-extrabold uppercase tracking-[0.2em]" style={{ color: AWARD.goldInk }}>Winner</span>}
                <span className="font-extrabold leading-tight" style={{ fontSize: first ? 19 : 16.5, color: AWARD.ink, fontFamily: NB.ml }}>{w.name}</span>
                {w.houseName && !isTeam && <span className="text-[13px] font-semibold" style={{ color: AWARD.sub, fontFamily: NB.ml }}>{w.houseName}</span>}
                {isTeam && w.houseName && <span className="line-clamp-2 text-[12.5px] font-semibold" style={{ color: AWARD.sub, fontFamily: NB.ml }}>{w.houseName}</span>}
                <span className="mt-1 self-start"><ShakhaTag shakha={w.shakha} color={AWARD.link} /></span>
              </span>
              {pos && !isTeam && (
                <button
                  type="button"
                  onClick={() => onPoster(w)}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full cursor-pointer"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(37,211,102,0.55)", color: "#1FAF55", boxShadow: "0 4px 12px rgba(37,211,102,0.22)" }}
                  aria-label={`Make ${w.name}'s poster`}
                >
                  <Camera size={18} />
                </button>
              )}
              <span className="relative flex flex-col items-center gap-[5px]">
                <GradeBadge grade={w.grade} size={first ? 44 : 36} variant="award" />
                <span className="text-[9.5px] font-extrabold uppercase tracking-[0.14em]" style={{ color: AWARD.sub }}>Grade</span>
              </span>
            </motion.li>
          );
        })}
      </ol>
    </article>
  );
}

// ─── Competition card ─────────────────────────────────────────────────────────

function CompCard({
  comp, catColor, feastName, onGeneratePoster,
}: {
  comp: { id: string; name: string; cat?: "Individual" | "Team"; gender?: string | null; competitionCategorySlug?: string | null; compStatus?: string | null };
  catColor: string;
  feastName: string;
  onGeneratePoster: (winner: PosterWinner) => void;
}) {
  const [open, setOpen] = useState(false);
  const categoryLabel = comp.competitionCategorySlug ? CATEGORY_LABELS[comp.competitionCategorySlug] ?? "" : "";
  const [results, setResults] = useState<PublicResultRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const anek: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 600 };
  const isPublished = comp.compStatus === "published";
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Measure the panel's real content height instead of guessing a fixed cap —
  // a hardcoded maxHeight clipped competitions with more participants than it
  // could fit (overflow-hidden silently cut off the rest of the list).
  useEffect(() => {
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
  }, [open, loading, results, isPublished]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && results === null) {
      setLoading(true);
      const res = comp.cat === "Team"
        ? await getPublishedTeamResults(comp.id)
        : await getPublishedResults(comp.id);
      setResults(res.data ?? []);
      setLoading(false);
    }
  };

  const sorted = results ? sortResults(results) : [];

  return (
    <div
      className="relative overflow-hidden mb-2.5"
      style={{
        background: "rgba(30,18,72,0.52)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)", borderRadius: 16,
        border: "1px solid rgba(30,18,72,0.7)", boxShadow: "0 2px 12px rgba(180,76,255,0.06)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[16px]" style={{ background: catColor }} />
      <button onClick={toggle} className="w-full text-left border-none bg-transparent pl-4 pr-3 pt-2.5 pb-2.5 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[18px] leading-tight flex-1" style={{ color: "#F4F1FF", ...anek }}>{comp.name}</p>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {isPublished
              ? <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(180,76,255,0.14)", color: "#B44CFF" }}><Trophy size={9} className="inline -mt-0.5 mr-0.5" />Results</span>
              : <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(156,163,175,0.15)", color: "#B8B2E2" }}>Pending</span>}
            <span className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(180,76,255,0.1)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
              <ChevronDown size={14} color="#B44CFF" />
            </span>
          </div>
        </div>
        {comp.gender && (
          <p className="text-[14px] mt-0.5" style={{ color: comp.gender.toLowerCase().includes("girl") ? "#EC4899" : "#3B82F6", ...anek }}>
            {comp.gender.charAt(0).toUpperCase() + comp.gender.slice(1)}
          </p>
        )}
      </button>
      <div className="overflow-hidden" style={{ maxHeight: open ? contentHeight : 0, transition: "max-height 0.32s cubic-bezier(.2,.8,.2,1)" }}>
        <div ref={contentRef} className="px-3 pb-3">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: catColor }} /></div>
          ) : !isPublished ? (
            <div className="text-center py-5 rounded-xl text-[13px]" style={{ background: `${catColor}10`, color: "#B8B2E2" }}>Results not yet published</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-5 rounded-xl text-[13px]" style={{ background: `${catColor}10`, color: "#B8B2E2" }}>No results recorded</div>
          ) : (
            <>
              {sorted.some(r => isMedalPos(r.position)) && (
                <AwardCard
                  rows={sorted.filter(r => isMedalPos(r.position))} accent={catColor} isTeam={comp.cat === "Team"}
                  onPoster={(r) => onGeneratePoster({ rank: r.position as 1 | 2 | 3, winnerName: r.name, houseName: r.houseName, shakhaName: r.shakha, competitionName: comp.name, categoryLabel, feastName })}
                />
              )}
              <ResultTable
                title="Graded entries" accent="#E4E0FA" rows={sorted.filter(r => !isMedalPos(r.position) && (r.grade !== null || r.position !== null))} isTeam={comp.cat === "Team"}
                competitionName={comp.name} categoryLabel={categoryLabel} feastName={feastName} onGeneratePoster={onGeneratePoster}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category tabs + competition list ─────────────────────────────────────────

function ResultsTabs({ competitions, feastName, onGeneratePoster }: {
  competitions: { id: string; name: string; cat?: "Individual" | "Team"; gender?: string | null; competitionCategorySlug?: string | null; compStatus?: string | null }[];
  feastName: string;
  onGeneratePoster: (winner: PosterWinner) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabSlug | "">("");

  // Team competitions get their own tab — regardless of whether they carry an
  // age category (e.g. Folk Dance is sub_junior-only) or none at all (e.g.
  // Group Song is open to every age) — so they never mix into an age tab.
  const hasTeam = competitions.some(c => c.cat === "Team");
  const available: { slug: TabSlug; label: string; color: string }[] = [
    ...CAT_CONFIG.filter(cat => competitions.some(c => c.competitionCategorySlug === cat.slug && c.cat !== "Team")),
    ...(hasTeam ? [TEAM_TAB] : []),
  ];
  const resolved: TabSlug | "" =
    activeTab && available.some(c => c.slug === activeTab) ? activeTab : (available[0]?.slug ?? "");

  const filtered = resolved === "team"
    ? competitions.filter(c => c.cat === "Team")
    : competitions.filter(c => c.competitionCategorySlug === resolved && c.cat !== "Team");
  const activeCat = available.find(c => c.slug === resolved);

  if (available.length === 0) {
    return <p className="text-[15px] text-center py-8" style={{ color: "#B8B2E2" }}>No competitions yet.</p>;
  }

  return (
    <div>
      {/* Category tiles (fest_hub): published / total, big label, progress bar */}
      <div role="group" aria-label="Category" className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 pt-1" style={{ scrollbarWidth: "none" }}>
        {available.map(cat => {
          const on = cat.slug === resolved;
          const list = cat.slug === "team"
            ? competitions.filter(c => c.cat === "Team")
            : competitions.filter(c => c.competitionCategorySlug === cat.slug && c.cat !== "Team");
          const done = list.filter(c => c.compStatus === "published").length;
          const pct = list.length ? Math.round((done / list.length) * 100) : 0;
          const deep = `color-mix(in srgb, ${cat.color} 45%, #120933)`;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveTab(cat.slug)}
              aria-pressed={on}
              className="flex h-[88px] shrink-0 flex-col items-start justify-between rounded-[20px] px-3.5 py-3 text-left cursor-pointer transition-[min-width,background,box-shadow] duration-300"
              style={{
                minWidth: on ? 158 : 118,
                background: on ? `linear-gradient(150deg, ${cat.color} 0%, ${deep} 100%)` : "rgba(24,14,60,0.8)",
                color: on ? "#FFFFFF" : NB.text,
                border: `1px solid ${on ? "rgba(255,255,255,.3)" : "rgba(214,170,255,0.24)"}`,
                boxShadow: on ? `0 14px 30px color-mix(in srgb, ${cat.color} 40%, transparent)` : undefined,
              }}
            >
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.04em] tabular-nums">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: on ? "currentColor" : cat.color }} />
                {done} / {list.length}
              </span>
              <span className="whitespace-nowrap font-black uppercase leading-[0.92] transition-[font-size] duration-300" style={{ fontSize: on ? 24 : 18, fontFamily: NB.num, letterSpacing: "0.005em" }}>{cat.label}</span>
              <span className="block h-[3px] w-full rounded-full" style={{ background: on ? "rgba(0,0,0,.16)" : NB.track }}>
                <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: on ? "currentColor" : cat.color }} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        {filtered.length === 0
          ? <p className="text-[15px] text-center py-6" style={{ color: "#B8B2E2" }}>No competitions in this category.</p>
          : filtered.map(comp => (
            <CompCard key={comp.id} comp={comp} catColor={activeCat?.color ?? "#B44CFF"} feastName={feastName} onGeneratePoster={onGeneratePoster} />
          ))}
      </div>
    </div>
  );
}

// ─── Feast content (competitions for one feast) ───────────────────────────────

function FeastContent({ slug, theme, onGeneratePoster }: { slug: string; theme: FeastTheme; onGeneratePoster: (winner: PosterWinner) => void }) {
  const { feast, loading } = useFeast(slug);

  if (loading && !feast?.competitions.length) {
    return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: theme.lavender }} /></div>;
  }
  if (!feast?.competitions.length) {
    return <p className="text-center py-10 text-[14px]" style={{ color: theme.sub }}>No competitions found for this feast.</p>;
  }

  return (
    <div className="rounded-[20px] p-3 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg,#1E1048,#1A0E40,#1A0E40,#1E1048)", border: "1px solid rgba(180,76,255,0.12)" }}>
      <div className="absolute pointer-events-none"
        style={{ top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.25) 0%,transparent 70%)", filter: "blur(20px)" }} />
      <div className="absolute pointer-events-none"
        style={{ bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(52,211,238,0.18) 0%,transparent 70%)", filter: "blur(18px)" }} />
      <div className="relative">
        <ResultsTabs competitions={feast.competitions} feastName={feast.name} onGeneratePoster={onGeneratePoster} />
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
  const [posterWinner, setPosterWinner] = useState<PosterWinner | null>(null);

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
      <FeastTabs theme={theme} feasts={feasts} active={activeSlug} onPick={handlePick} loading={feastsLoading} />

      {/* Search shortcut button */}
      <button
        onClick={onSearchNav}
        className="w-full flex items-center gap-2.5 px-4 py-3 mb-4 rounded-[14px] border-none cursor-pointer active:scale-[0.98] transition-transform"
        style={{
          background: "rgba(30,18,72,0.72)",
          border: "1.5px solid rgba(180,76,255,0.14)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(180,76,255,0.1)" }}>
          <Search size={15} color="#B44CFF" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[14px] font-bold" style={{ color: "#F4F1FF", fontFamily: "var(--font-anek),sans-serif" }}>Search Participants</p>
          <p className="text-[11px]" style={{ color: "#B8B2E2" }}>Find a participant and see their results</p>
        </div>
        <ChevronDown size={14} color="rgba(214,170,255,0.35)" style={{ transform: "rotate(-90deg)" }} />
      </button>

      {/* Competition results for selected feast. FeastContent mounts immediately
          with the already-known activeSlug (in parallel with the feast list load)
          rather than waiting on feastsLoading — only fall back to a loading/empty
          state once feasts have resolved and activeSlug turns out invalid. */}
      {!feastsLoading && feasts.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <BookOpen size={28} color={theme.faint} />
          <p className="text-[14px]" style={{ color: theme.sub }}>No feasts found.</p>
        </div>
      ) : !feastsLoading && feasts.length > 0 && !feasts.some(f => f.slug === activeSlug) ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin" style={{ color: theme.lavender }} />
        </div>
      ) : (
        <FeastContent key={activeSlug} slug={activeSlug} theme={theme} onGeneratePoster={setPosterWinner} />
      )}

      <div className="h-6" />

      {posterWinner && (
        <PosterGeneratorOverlay winner={posterWinner} onClose={() => setPosterWinner(null)} />
      )}
    </div>
  );
}
