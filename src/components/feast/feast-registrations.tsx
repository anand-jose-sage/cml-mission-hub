"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2, UserX, Lock, Pencil } from "lucide-react";
import { useFeast } from "@/hooks/use-feast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";
import { FeastTopBar, type FeastTheme } from "./feast-shared";

interface ParticipantRow {
  id: string;
  name: string;
  house_name: string | null;
  shakha_id: string | null;
  registration_number: string | null;
  gender: string | null;
  shakha: { name: string } | null;
}

interface RegRow {
  id: string;
  feast_competition_id: string;
  participant: ParticipantRow | null;
}

// ---------- helpers ----------

function normGender(g: string | null | undefined) {
  if (!g) return null;
  const l = g.toLowerCase();
  if (l === "boy" || l === "boys" || l === "male") return "boys";
  if (l === "girl" || l === "girls" || l === "female") return "girls";
  return "common";
}

const GENDER_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  boys:   { label: "Boys",   bg: "#dbeafe", color: "#1d4ed8" },
  girls:  { label: "Girls",  bg: "#fce7f3", color: "#be185d" },
  common: { label: "Common", bg: "#f0fdf4", color: "#15803d" },
};

// Stable avatar colour from name string
function avatarColor(name: string) {
  const palette = ["#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % palette.length;
  return palette[h];
}

// ---------- sub-components ----------

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const bg = avatarColor(name);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, background: bg, color: "#fff", fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

function Badge({ label, bg, color, border }: { label: string; bg: string; color: string; border?: string }) {
  return (
    <span
      className="text-[10px] font-bold px-[8px] py-[2px] rounded-full"
      style={{ background: bg, color, border: border ? `1px solid ${border}` : undefined }}
    >
      {label}
    </span>
  );
}

function AccordionRow({
  compName, gender, catSlug, regs, idx, theme, accent, onEdit,
}: {
  compName: string;
  gender: string | null | undefined;
  catSlug: string | null | undefined;
  regs: RegRow[];
  idx: number;
  theme: FeastTheme;
  accent: string;
  onEdit: (participantId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ng = normGender(gender);
  const gStyle = ng ? GENDER_STYLE[ng] : null;
  const catLabel = catSlug ? CATEGORY_LABELS[catSlug] : null;
  const catColor = catSlug ? CATEGORY_COLORS[catSlug] : null;
  const count = regs.length;

  // Alternate gradient colours for the left icon block
  const ICON_GRADS = [
    ["#7C3AED", "#A855F7"],
    ["#EC4899", "#F472B6"],
    ["#F59E0B", "#FCD34D"],
    ["#10B981", "#34D399"],
    ["#3B82F6", "#60A5FA"],
  ];
  const [a, b] = ICON_GRADS[idx % ICON_GRADS.length];

  return (
    <div
      className="rounded-2xl mb-3 overflow-hidden"
      style={{
        background: theme.glassStrong.background,
        border: `1px solid ${theme.hairline}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full border-none cursor-pointer flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
        style={{ background: "none", padding: "13px 14px" }}
      >
        {/* Gradient index box */}
        <div
          className="w-[42px] h-[42px] rounded-[14px] flex items-center justify-center shrink-0 font-bold text-white text-[16px]"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: `0 6px 16px ${a}40`, fontFamily: "var(--font-poppins),sans-serif" }}
        >
          {idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] leading-snug" style={{ fontFamily: "var(--font-anek),sans-serif", color: theme.text }}>
            {compName}
            {gStyle && (
              <span style={{ color: gStyle.color }}> · {gStyle.label}</span>
            )}
            {catLabel && catColor && (
              <span style={{ color: catColor }}> · {catLabel}</span>
            )}
          </div>
        </div>

        {/* Count pill */}
        <div
          className="rounded-full px-2.5 py-1 text-[12px] font-bold shrink-0 mr-1"
          style={{ background: count > 0 ? a + "18" : theme.fill, color: count > 0 ? a : theme.faint }}
        >
          {count}
        </div>

        {/* Chevron */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300"
          style={{ background: theme.fill, transform: open ? "rotate(180deg)" : "none" }}
        >
          <ChevronDown size={14} color={theme.sub} />
        </div>
      </button>

      {/* Expanded participants */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? (count === 0 ? 64 : count * 68 + 8) : 0 }}
      >
        <div style={{ borderTop: `1px solid ${theme.hairline}` }}>
          {count === 0 ? (
            <div className="flex flex-col items-center py-5 gap-1.5">
              <UserX size={22} color={theme.faint} />
              <p className="text-[12.5px]" style={{ color: theme.faint }}>No registrations from your shakha</p>
            </div>
          ) : (
            regs.map((r, ri) => {
              if (!r.participant) return null;
              const p = r.participant;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: ri < regs.length - 1 ? `1px solid ${theme.hairline}` : undefined }}
                >
                  <Avatar name={p.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13.5px] leading-snug" style={{ color: theme.text }}>
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {p.house_name && (
                        <span className="text-[11.5px]" style={{ color: theme.faint }}>{p.house_name}</span>
                      )}
                      {p.house_name && <span style={{ color: theme.faint, fontSize: 10 }}>·</span>}
                      {p.shakha?.name && (
                        <span className="text-[11.5px]" style={{ color: theme.sub }}>{p.shakha.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.registration_number && (
                      <span className="font-mono text-[10.5px] px-2 py-1 rounded-lg" style={{ background: theme.fill, color: theme.faint }}>
                        {p.registration_number}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(p.id); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer active:scale-95 transition-transform"
                      style={{ background: theme.fillStrong }}
                    >
                      <Pencil size={13} color={theme.purple} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- main ----------

export function FeastRegistrations({ slug, theme, onBack, onExit, onEdit }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  onEdit: (participantId: string) => void;
}) {
  const { feast, loading: feastLoading } = useFeast(slug);
  const { session } = useAuth();
  const [myShakhaId, setMyShakhaId] = useState<string | null | undefined>(undefined); // undefined = not yet loaded
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch admin's shakha_id directly — don't rely on AuthProvider's profile which may not load
  useEffect(() => {
    if (!session?.user?.id) { setMyShakhaId(null); return; }
    supabase
      .from("profiles")
      .select("shakha_id, role")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setMyShakhaId(data?.shakha_id ?? null);
      });
  }, [session]);

  useEffect(() => {
    if (!feast || myShakhaId === undefined) return; // wait until shakha_id is resolved
    const ids = feast.competitions.map((c) => c.id);
    if (ids.length === 0) { setLoading(false); return; }

    supabase
      .from("participant_registrations")
      .select(`
        id,
        feast_competition_id,
        participant:participants(
          id, name, house_name, shakha_id, registration_number, gender,
          shakha:shakhas(name)
        )
      `)
      .in("feast_competition_id", ids)
      .then(({ data }) => {
        // Normalise: Supabase may return nested joins as arrays — flatten to single objects
        const all = ((data ?? []) as unknown[]).map((row) => {
          const r = row as Record<string, unknown>;
          const p = (Array.isArray(r.participant) ? r.participant[0] : r.participant) as Record<string, unknown> | null;
          if (p) {
            p.shakha = Array.isArray(p.shakha) ? (p.shakha[0] ?? null) : p.shakha;
          }
          return { ...r, participant: p } as RegRow;
        });
        // Only show participants from this admin's shakha
        const filtered = myShakhaId
          ? all.filter((r) => r.participant?.shakha_id === myShakhaId)
          : all;
        setRegs(filtered);
        setLoading(false);
      });
  }, [feast, myShakhaId]);

  // Still resolving auth
  if (myShakhaId === undefined) {
    return (
      <div className="flex items-center justify-center pt-24">
        <Loader2 size={28} className="animate-spin" style={{ color: theme.lavender }} />
      </div>
    );
  }

  // No session or no shakha assigned — block access
  if (!session || myShakhaId === null) {
    return (
      <div className="px-5">
        <FeastTopBar title="My Registrations" onBack={onBack} onExit={onExit} theme={theme} />
        <div className="flex flex-col items-center justify-center pt-16 pb-8 gap-5">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.purple}22, ${theme.lavender}33)`, border: `1.5px solid ${theme.purple}33` }}
          >
            <Lock size={30} color={theme.purple} />
          </div>
          <div className="text-center">
            <p className="font-bold text-[17px] mb-1.5" style={{ fontFamily: "var(--font-anek),sans-serif", color: theme.text }}>
              Not Authorised
            </p>
            <p className="text-[13px] leading-relaxed max-w-[240px] mx-auto" style={{ color: theme.sub }}>
              {!session
                ? "Please log in as an SA Admin to view registrations."
                : "Your account is not linked to a shakha. Contact your administrator."}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-full text-[13px] font-semibold border-none cursor-pointer"
            style={{ background: theme.fillStrong, color: theme.purple }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (feastLoading || loading) {
    return (
      <div className="flex items-center justify-center pt-24">
        <Loader2 size={28} className="animate-spin" style={{ color: theme.lavender }} />
      </div>
    );
  }

  if (!feast) return null;

  const regsByComp: Record<string, RegRow[]> = {};
  for (const r of regs) {
    if (!regsByComp[r.feast_competition_id]) regsByComp[r.feast_competition_id] = [];
    regsByComp[r.feast_competition_id].push(r);
  }

  const totalRegs = regs.length;
  const shakhaLabel = "Your Shakha";

  return (
    <div className="px-5">
      <FeastTopBar title="My Registrations" onBack={onBack} onExit={onExit} theme={theme} />

      {/* Summary banner */}
      <div
        className="rounded-2xl p-4 mb-4 flex items-center gap-4"
        style={{ background: `linear-gradient(135deg, ${theme.purple}18, ${theme.lavender}12)`, border: `1px solid ${theme.purple}22` }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${theme.purple}, ${theme.lavender})`, boxShadow: `0 6px 18px ${theme.purple}44` }}
        >
          <span className="text-white font-bold text-[20px]" style={{ fontFamily: "var(--font-poppins),sans-serif" }}>{totalRegs}</span>
        </div>
        <div>
          <div className="font-bold text-[15px]" style={{ fontFamily: "var(--font-anek),sans-serif", color: theme.text }}>
            {shakhaLabel}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: theme.sub }}>
            {totalRegs === 0 ? "No registrations yet" : `${totalRegs} registration${totalRegs > 1 ? "s" : ""} across ${feast.name}`}
          </div>
        </div>
      </div>

      {feast.competitions.map((c, i) => (
        <AccordionRow
          key={c.id}
          compName={c.name}
          gender={c.gender}
          catSlug={c.competitionCategorySlug}
          regs={regsByComp[c.id] ?? []}
          idx={i}
          theme={theme}
          accent={feast.accent}
          onEdit={onEdit}
        />
      ))}
      <div className="h-2" />
    </div>
  );
}
