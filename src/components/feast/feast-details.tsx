"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock, MapPin, Loader2, X, Eye, EyeOff, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import type { FeastCompetition } from "@/lib/feast-data";
import { useFeast } from "@/hooks/use-feast";
import { useAuth } from "@/lib/auth-context";
import { getPublishedResults, type PublicResultRow } from "@/actions/results";
import { SHAKHA_COLOR_MAP } from "@/lib/feast-data";
import {
  GlassPanel, GlowBtn, StatusPill, StatBlock, SectionTitle,
  FeastTopBar, type FeastTheme,
} from "./feast-shared";

export type LoginTutorialPhase = "idle" | "typing-email" | "typing-password" | "ready" | "submitting";

export function LoginSheet({
  theme,
  onClose,
  tutorialMode,
  tutorialPhase,
  onTutorialSubmit,
}: {
  theme: FeastTheme;
  onClose: () => void;
  tutorialMode?: boolean;
  tutorialPhase?: LoginTutorialPhase;
  onTutorialSubmit?: () => void;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Tutorial mode: animate typing into the email / password fields when phase changes.
  useEffect(() => {
    if (!tutorialMode) return;
    if (tutorialPhase === "typing-email") {
      const target = "admin@cmlkalpetta.com";
      setEmail("");
      setPassword("");
      setErr("");
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setEmail(target.slice(0, i));
        if (i >= target.length) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }
    if (tutorialPhase === "typing-password") {
      const target = "demo-pass-1234";
      setPassword("");
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setPassword(target.slice(0, i));
        if (i >= target.length) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }
    if (tutorialPhase === "submitting") {
      setBusy(true);
      const t = setTimeout(() => {
        setBusy(false);
        onTutorialSubmit?.();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [tutorialMode, tutorialPhase, onTutorialSubmit]);

  const submit = async () => {
    if (tutorialMode) {
      // Tutorial flow drives submit via phase; ignore manual clicks here.
      return;
    }
    if (!email.trim() || !password) return;
    setBusy(true);
    setErr("");
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) { setErr(error); return; }
    onClose();
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-[14px] outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-t-[28px] px-5 pt-5 pb-8" style={{ background: theme.glassStrong.background, border: `1px solid ${theme.hairline}` }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-[18px]" style={{ fontFamily: "var(--font-anek), sans-serif", color: theme.text }}>SA Admin Login</h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: theme.sub }}>Sign in to register participants</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: theme.fill }}>
            <X size={16} color={theme.sub} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            data-tour="login-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={tutorialMode}
            className={inputCls}
            style={{ background: theme.fill, border: `1px solid ${theme.hairline}`, color: theme.text }}
          />
          <div className="relative" data-tour="login-password">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              readOnly={tutorialMode}
              className={inputCls}
              style={{ background: theme.fill, border: `1px solid ${theme.hairline}`, color: theme.text, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer p-1"
            >
              {showPw ? <EyeOff size={16} color={theme.faint} /> : <Eye size={16} color={theme.faint} />}
            </button>
          </div>
          {err && <p className="text-[12.5px] px-1" style={{ color: "#EF4444" }}>{err}</p>}
        </div>

        <div data-tour="login-submit">
          <GlowBtn
            variant="primary"
            full
            size="lg"
            icon={busy ? undefined : "LogIn"}
            onClick={submit}
            style={{ marginTop: 18 }}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
          </GlowBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Competition Tabs ────────────────────────────────────────────────────────

const CAT_CONFIG = [
  { slug: "sub_junior",   label: "Sub Junior",   color: "#34D3EE" },
  { slug: "junior",       label: "Junior",        color: "#22C55E" },
  { slug: "senior",       label: "Senior",        color: "#6B46FF" },
  { slug: "super_senior", label: "Super Senior",  color: "#F5A742" },
  { slug: "elder",        label: "Elder",         color: "#9D99BC" },
] as const;

type CatSlug = typeof CAT_CONFIG[number]["slug"];

function statusPill(s: string | null | undefined) {
  if (!s || s === "upcoming")     return { label: "Upcoming",    bg: "rgba(156,163,175,0.18)", color: "#6B7280" };
  if (s === "progressing")        return { label: "Live",        bg: "rgba(251,146,60,0.18)",  color: "#D97706" };
  if (s === "completed")          return { label: "Completed",   bg: "rgba(34,197,94,0.18)",   color: "#16A34A" };
  if (s === "published")          return { label: "Published",   bg: "rgba(107,70,255,0.18)",  color: "#6B46FF" };
  return { label: s, bg: "rgba(156,163,175,0.18)", color: "#6B7280" };
}

function genderLabel(g: string | null | undefined) {
  if (!g) return null;
  const l = g.toLowerCase();
  if (l === "boy" || l === "boys" || l === "male")   return { text: "Boys",  color: "#3B82F6" };
  if (l === "girl" || l === "girls" || l === "female") return { text: "Girls", color: "#EC4899" };
  return null;
}

// ─── Inline result sub-components ───────────────────────────────────────────

const POS_STYLE: Record<number, {
  bg: string; border: string; text: string;
  disc: string; numBg: string; numText: string;
}> = {
  1: { bg: "#FFFBEB", border: "#F5C542", text: "#92400E", disc: "#F5C542", numBg: "#6B5200", numText: "#FFF6C8" },
  2: { bg: "#F9FAFB", border: "#9CA3AF", text: "#374151", disc: "#B9C2CC", numBg: "#475260", numText: "#FFFFFF" },
  3: { bg: "#FFF7ED", border: "#E0936A", text: "#7C2D12", disc: "#D98E5F", numBg: "#5A2C14", numText: "#FDE3C9" },
};

function MedalBadge({ pos }: { pos: number }) {
  const m = POS_STYLE[pos];
  if (!m) return null;
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-black"
      style={{
        width: 30, height: 30, background: m.disc, color: m.numBg,
        fontSize: 14, lineHeight: 1, boxShadow: `0 2px 6px ${m.disc}66`,
        border: `1.5px solid ${m.numBg}33`,
      }}
    >
      {pos}
    </div>
  );
}

const GRADE_STYLE: Record<string, { bg: string }> = {
  A: { bg: "#16A34A" }, B: { bg: "#D97706" }, C: { bg: "#6B46FF" },
};

function GradeChip({ grade }: { grade: "A" | "B" | "C" }) {
  const bg = GRADE_STYLE[grade]?.bg ?? "#9CA3AF";
  return (
    <span
      className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[15px] font-black text-white shrink-0"
      style={{ background: bg, boxShadow: `0 2px 6px ${bg}55` }}
    >
      {grade}
    </span>
  );
}

function ResultRow({ row, index, last, showMedal }: {
  row: PublicResultRow; index: number; last: boolean; showMedal: boolean;
}) {
  const anek: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 700 };
  const pos = row.position !== null && row.position <= 3 ? POS_STYLE[row.position] : null;
  const sc = SHAKHA_COLOR_MAP[row.shakha] ?? "#A78BFA";
  const zebra = index % 2 === 1;
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3"
      style={{
        background: pos ? `${pos.border}1A` : zebra ? "rgba(255,255,255,0.4)" : "transparent",
        borderBottom: last ? "none" : "1px solid rgba(107,70,255,0.07)",
      }}
    >
      {/* Medal badge (podium only) */}
      {showMedal && (
        <div className="shrink-0 w-8 flex justify-center">
          {pos ? <MedalBadge pos={row.position!} /> : null}
        </div>
      )}

      {/* Participant — name | house (line 1) · shakha (line 2) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <p className="text-[15px] leading-tight truncate" style={{ color: "#1E1B4B", ...anek }}>{row.name}</p>
          {row.houseName && (
            <span className="inline-flex items-baseline gap-1.5 text-[13.5px] font-semibold truncate" style={{ color: "#7C3AED" }}>
              <span style={{ color: "#DDD6FE" }}>|</span>
              {row.houseName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 min-w-0">
          <span className="text-[13px] shrink-0 leading-none" aria-hidden="true">⛪</span>
          <span className="text-[13px] font-bold truncate" style={{ color: sc }}>{row.shakha}</span>
        </div>
      </div>

      {/* Grade (right) */}
      <div className="shrink-0">
        {row.grade
          ? <GradeChip grade={row.grade} />
          : <span className="w-8 h-8 flex items-center justify-center text-[14px] text-gray-300">—</span>}
      </div>
    </div>
  );
}

function ResultTable({ title, accent, rows }: { title: string; accent: string; rows: PublicResultRow[] }) {
  if (rows.length === 0) return null;
  const showMedal = rows.some((r) => r.position !== null && r.position <= 3);
  return (
    <div
      className="mb-2.5 rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(107,70,255,0.13)", background: "rgba(255,255,255,0.55)", boxShadow: "0 1px 8px rgba(107,70,255,0.05)" }}
    >
      {/* Section title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: `${accent}14` }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: accent }}>{title}</span>
      </div>

      {/* Rows */}
      {rows.map((r, i) => (
        <ResultRow key={r.registrationId} row={r} index={i} last={i === rows.length - 1} showMedal={showMedal} />
      ))}
    </div>
  );
}

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

// ─── Competition card ────────────────────────────────────────────────────────

function CompetitionCard({ comp, catColor }: {
  comp: FeastCompetition;
  catColor: string;
}) {
  const [infoOpen,    setInfoOpen]    = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [results,     setResults]     = useState<PublicResultRow[] | null>(null);
  const [loadingRes,  setLoadingRes]  = useState(false);

  const pill = statusPill(comp.compStatus);
  const gen  = genderLabel(comp.gender);

  const hasInfo = !!comp.info && (comp.compStatus === "upcoming" || comp.compStatus === "progressing");
  const anek: React.CSSProperties = { fontFamily: "var(--font-anek), sans-serif", fontWeight: 600 };

  const toggleResults = async () => {
    const next = !resultsOpen;
    setResultsOpen(next);
    if (next && results === null) {
      setLoadingRes(true);
      const res = await getPublishedResults(comp.id);
      setResults(sortResults(res.data ?? []));
      setLoadingRes(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.52)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        border: resultsOpen ? `1.5px solid ${catColor}55` : "1px solid rgba(255,255,255,0.7)",
        boxShadow: resultsOpen ? `0 4px 20px ${catColor}22` : "0 2px 12px rgba(107,70,255,0.06)",
        marginBottom: 9,
        transition: "border 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[16px]" style={{ background: catColor }} />

      {/* Header (info toggle only) */}
      <button
        onClick={() => hasInfo && setInfoOpen((o) => !o)}
        className="w-full text-left border-none bg-transparent pl-4 pr-3 pt-2.5 pb-2.5"
        style={{ cursor: hasInfo ? "pointer" : "default" }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[19px] leading-tight flex-1" style={{ color: "#1E1B4B", ...anek }}>{comp.name}</p>
          <div className="flex items-center gap-1.5 shrink-0 mt-1">
            <span className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ background: pill.bg, color: pill.color, ...anek }}>
              {pill.label}
            </span>
            {hasInfo && (
              <span className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300"
                style={{ background: "rgba(107,70,255,0.1)", transform: infoOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <ChevronDown size={14} color="#6B46FF" />
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {gen && <span className="text-[17px]" style={{ color: gen.color, ...anek }}>{gen.text}</span>}
          {comp.stage && <span className="text-[17px]" style={{ color: "#3D3A6B", ...anek }}>{comp.stage}</span>}
          {(comp.scheduledTime || comp.time) && (
            <span className="inline-flex items-center gap-1.5 text-[17px]" style={{ color: "#3D3A6B", ...anek }}>
              <Clock size={15} color="#6B46FF" />{comp.scheduledTime || comp.time}
            </span>
          )}
          {comp.venue && (
            <span className="inline-flex items-center gap-1.5 text-[17px]" style={{ color: "#3D3A6B", ...anek }}>
              <MapPin size={15} color="#6B46FF" />{comp.venue}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {comp.compStatus === "progressing" && comp.progressPct != null && (
          <div className="mt-2">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(107,70,255,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${comp.progressPct}%`, background: "linear-gradient(90deg,#F59E0B,#FBBF24)" }} />
            </div>
            <p className="text-[13px] mt-0.5" style={{ color: "#D97706", ...anek }}>{comp.progressPct}% complete</p>
          </div>
        )}
      </button>

      {/* Info drill-down */}
      {hasInfo && (
        <div className="overflow-hidden transition-all"
          style={{ maxHeight: infoOpen ? 400 : 0, transitionDuration: "0.32s", transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}>
          <div className="mx-3 mb-3 px-3.5 py-3 rounded-xl" style={{ background: `${catColor}12`, borderLeft: `3px solid ${catColor}` }}>
            <p className="text-[13px] mb-1.5 uppercase tracking-wider" style={{ color: catColor, fontFamily: "var(--font-anek), sans-serif", fontWeight: 700 }}>Info</p>
            <p className="text-[16px] leading-relaxed whitespace-pre-line" style={{ color: "#1E1B4B", fontFamily: "var(--font-anek), sans-serif", fontWeight: 500 }}>{comp.info}</p>
          </div>
        </div>
      )}

      {/* View Results toggle button */}
      {comp.compStatus === "published" && (
        <button
          onClick={toggleResults}
          className="w-full border-none bg-transparent pl-4 pr-3 pb-2.5 cursor-pointer"
        >
          <div
            className="w-full py-2 rounded-xl text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{
              background: resultsOpen ? catColor : "rgba(107,70,255,0.14)",
              color: resultsOpen ? "#fff" : "#3730a3",
              ...anek,
            }}
          >
            <Trophy size={15} />
            {resultsOpen ? "Hide Results" : "View Results"}
            {resultsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>
      )}

      {/* Results drill-down panel */}
      {comp.compStatus === "published" && (
        <div className="overflow-hidden transition-all"
          style={{ maxHeight: resultsOpen ? 2000 : 0, transitionDuration: "0.38s", transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}>
          <div className="px-3 pb-3 pt-1">
            {loadingRes ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin" style={{ color: catColor }} />
              </div>
            ) : results !== null && results.length === 0 ? (
              <p className="text-center text-[13px] py-5" style={{ color: "#9CA3AF" }}>No published results yet.</p>
            ) : (
              <>
                <ResultTable title="Positions" accent={catColor} rows={(results ?? []).filter(r => r.position !== null)} />
                <ResultTable title="Grades" accent={catColor} rows={(results ?? []).filter(r => r.position === null && r.grade !== null)} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitionTabs({ competitions }: { competitions: FeastCompetition[] }) {
  const [activeTab, setActiveTab] = useState<CatSlug | "">("");

  const availableCats = useMemo(
    () => CAT_CONFIG.filter((cat) => competitions.some((c) => c.competitionCategorySlug === cat.slug)),
    [competitions]
  );

  const resolvedTab: CatSlug | "" =
    activeTab && availableCats.some((c) => c.slug === activeTab)
      ? (activeTab as CatSlug)
      : (availableCats[0]?.slug ?? "");

  const filtered = useMemo(
    () => competitions.filter((c) => c.competitionCategorySlug === resolvedTab),
    [competitions, resolvedTab]
  );

  const activeCat = CAT_CONFIG.find((c) => c.slug === resolvedTab);

  if (availableCats.length === 0) {
    return (
      <p className="text-[15px] text-center py-8" style={{ color: "#6B7280" }}>
        No competitions yet.
      </p>
    );
  }

  return (
    <div>
      {/* Tab row */}
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {availableCats.map((cat) => {
          const isActive = cat.slug === resolvedTab;
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveTab(cat.slug)}
              className="flex items-center gap-1.5 shrink-0 border-none cursor-pointer transition-all active:scale-[0.96]"
              style={{
                padding: "10px 18px",
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 17,
                background: isActive
                  ? `linear-gradient(135deg, #6B46FF, #A78BFA)`
                  : "rgba(255,255,255,0.45)",
                color: isActive ? "#fff" : "#4B5563",
                border: isActive
                  ? "1.5px solid transparent"
                  : "1.5px solid rgba(107,70,255,0.15)",
                boxShadow: isActive
                  ? "0 4px 14px rgba(107,70,255,0.35)"
                  : "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: isActive ? "rgba(255,255,255,0.7)" : cat.color }}
              />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="mt-3">
        {filtered.length === 0 ? (
          <p className="text-[15px] text-center py-6" style={{ color: "#9CA3AF" }}>
            No competitions in this category.
          </p>
        ) : (
          filtered.map((comp) => (
            <CompetitionCard
              key={comp.id}
              comp={comp}
              catColor={activeCat?.color ?? "#6B46FF"}
            />
          ))
        )}
      </div>
    </div>
  );
}

export interface FeastDetailsTutorial {
  loggedIn: boolean;
  loginOpen: boolean;
  loginPhase?: LoginTutorialPhase;
  onLoginClose?: () => void;
  onTutorialSubmit?: () => void;
}

export function FeastDetails({ slug, theme, onBack, onExit, go, tutorial }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  go: (screen: string, slug?: string) => void;
  tutorial?: FeastDetailsTutorial;
}) {
  const { feast, loading } = useFeast(slug);
  const { session, loading: authLoading } = useAuth();
  const [showLoginInternal, setShowLoginInternal] = useState(false);
  const showLogin = tutorial ? tutorial.loginOpen : showLoginInternal;
  const setShowLogin = (v: boolean) => {
    if (tutorial) {
      if (!v) tutorial.onLoginClose?.();
    } else {
      setShowLoginInternal(v);
    }
  };
  const isAuthorized = tutorial ? tutorial.loggedIn : !!session;
  const showAuthBlock = tutorial ? true : !authLoading;

  if (loading && !feast?.competitions.length) {
    return (
      <div className="flex items-center justify-center pt-24">
        <Loader2 size={28} className="animate-spin" style={{ color: theme.lavender }} />
      </div>
    );
  }

  if (!feast) return null;

  return (
    <div className="px-5">
      <FeastTopBar title={feast.name} onBack={onBack} onExit={onExit} theme={theme} />
      {/* Hero banner */}
      <div data-tour="feast-info">
      <GlassPanel theme={theme} strong glow={feast.accent} style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="relative p-[18px]" style={{ background: `linear-gradient(140deg, ${feast.tint[0]}cc, ${feast.tint[1]}cc)` }}>
          <div className="absolute -top-[30px] -right-5 w-[130px] h-[130px] rounded-full" style={{ background: "rgba(255,255,255,0.2)", filter: "blur(20px)" }} />
          <div className="relative flex items-center justify-between">
            <StatusPill label={feast.status} color="#fff" />
            <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>{feast.date}</span>
          </div>
          <h2 className="relative font-bold text-[28px] text-white mt-3 mb-2 tracking-tight leading-[1.1]" style={{ fontFamily: "var(--font-anek), sans-serif" }}>
            {feast.name} {feast.year}
          </h2>
          {feast.venue && (
            <div className="relative inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: "rgba(255,255,255,0.92)" }}>
              <MapPin size={13} color="rgba(255,255,255,0.92)" /> {feast.venue}
            </div>
          )}
          <div className="relative flex gap-2 mt-4 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255, 255, 255, 0.59)", backdropFilter: "blur(6px)" }}>
            <StatBlock value={feast.registrations} label="Registered" color="#fff" theme={theme} />
            <div className="w-px" style={{ background: "rgba(18, 16, 16, 0.25)" }} />
            <StatBlock value={feast.competitions.length} label="Events" color="#fff" theme={theme} />
            <div className="w-px" style={{ background: "rgba(18, 16, 16, 0.25)" }} />
            <StatBlock value={feast.daysLeft} label="Days Left" color="#8d027de3" theme={theme} />
          </div>
        </div>
      </GlassPanel>
      </div>

      {feast.blurb && <p className="text-[13px] leading-relaxed mb-4" style={{ color: theme.sub }}>{feast.blurb}</p>}

      {showAuthBlock && (
        isAuthorized ? (
          <div data-tour="register-btn">
            <GlowBtn variant="gold" full size="lg" icon="Ticket" onClick={() => go("register", slug)} style={{ marginBottom: 10 }}>
              Register Now
            </GlowBtn>
          </div>
        ) : (
          <div data-tour="login-btn">
            <GlowBtn variant="ghost" full size="lg" icon="Lock" onClick={() => setShowLogin(true)} style={{ marginBottom: 10 }}>
              Login to Register
            </GlowBtn>
          </div>
        )
      )}
      {showLogin && (
        <LoginSheet
          theme={theme}
          onClose={() => setShowLogin(false)}
          tutorialMode={!!tutorial}
          tutorialPhase={tutorial?.loginPhase}
          onTutorialSubmit={tutorial?.onTutorialSubmit}
        />
      )}
      <div className="flex gap-2.5 mb-1">
        <GlowBtn variant="ghost" full icon="Medal" onClick={() => go("results", slug)}>Results</GlowBtn>
        {isAuthorized
          ? <div data-tour="my-registrations-btn" style={{ width: "100%" }}><GlowBtn variant="ghost" full icon="ClipboardList" onClick={() => go("registrations", slug)}>My Registrations</GlowBtn></div>
          : <GlowBtn variant="ghost" full icon="Trophy" onClick={() => go("leaderboard", slug)}>Leaderboard</GlowBtn>
        }
      </div>

      <SectionTitle theme={theme} right={<span className="text-[12px]" style={{ color: theme.faint }}>{feast.competitions.length} events</span>}>
        Competitions
      </SectionTitle>

      {/* Category tabs + competition cards */}
      <div
        className="rounded-[20px] p-3"
        style={{
          background: "linear-gradient(145deg,#ede9fe,#f5f3ff,#faf5ff,#ede9fe)",
          border: "1px solid rgba(107,70,255,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Aurora blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -40, right: -30,
            width: 140, height: 140,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(167,139,250,0.25) 0%,transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -30, left: -20,
            width: 120, height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(52,211,238,0.18) 0%,transparent 70%)",
            filter: "blur(18px)",
          }}
        />
        <div className="relative">
          <CompetitionTabs competitions={feast.competitions} />
        </div>
      </div>
      <div className="h-2" />
    </div>
  );
}
