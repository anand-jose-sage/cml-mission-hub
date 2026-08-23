"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2, UserX, Lock, Pencil, Download } from "lucide-react";
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

// Edit registrations locked after Aug 27 2026 5:00 PM IST (11:30 AM UTC)
const EDIT_DEADLINE = new Date("2026-08-27T11:30:00Z");
const isEditLocked = () => new Date() >= EDIT_DEADLINE;

// ---------- helpers ----------

function normGender(g: string | null | undefined) {
  if (!g) return null;
  const l = g.toLowerCase();
  if (l === "boy" || l === "boys" || l === "male") return "boys";
  if (l === "girl" || l === "girls" || l === "female") return "girls";
  return "common";
}

// Participant's own gender (boy/girl/other) → single letter for the print sheet
function genderLetter(g: string | null | undefined) {
  if (!g) return "";
  const l = g.toLowerCase();
  if (l.startsWith("b") || l === "male") return "B";
  if (l.startsWith("g") || l === "female") return "G";
  return "";
}

const CATEGORY_ORDER = ["sub_junior", "junior", "senior", "super_senior", "elder"] as const;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const GENDER_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  boys:   { label: "Boys",   bg: "#dbeafe", color: "#1d4ed8" },
  girls:  { label: "Girls",  bg: "#fce7f3", color: "#be185d" },
  common: { label: "Common", bg: "#f0fdf4", color: "#15803d" },
};

// ---------- sub-components ----------

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
  compName, gender, catSlug, regs, idx, theme, accent, onEdit, isFirstWithRegistrations,
}: {
  compName: string;
  gender: string | null | undefined;
  catSlug: string | null | undefined;
  regs: RegRow[];
  idx: number;
  theme: FeastTheme;
  accent: string;
  onEdit: (participantId: string) => void;
  isFirstWithRegistrations?: boolean;
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
      data-tour={idx === 0 ? "registration-category-card" : undefined}
      className="rounded-2xl mb-3 overflow-hidden"
      style={{
        background: theme.glassStrong.background,
        border: `1px solid ${theme.hairline}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <button
        data-tour={isFirstWithRegistrations ? "edit-existing-registration-card" : undefined}
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
          className="rounded-full px-2.5 py-1 text-[13px] font-black shrink-0 mr-1"
          style={{ background: count > 0 ? a + "22" : theme.fill, color: count > 0 ? a : theme.faint }}
        >
          {count}
        </div>

        {/* Chevron */}
        <div
          data-tour={idx === 0 ? "registration-category-expand" : undefined}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300"
          style={{ background: a, boxShadow: `0 2px 8px ${a}66`, transform: open ? "rotate(180deg)" : "none" }}
        >
          <ChevronDown size={16} color="#fff" strokeWidth={3} />
        </div>
      </button>

      {/* Expanded participants */}
      <div
        data-tour={idx === 0 ? "registration-participant-list" : undefined}
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? (count === 0 ? 64 : count * 78 + 8) : 0 }}
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
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{
                    borderBottom: ri < regs.length - 1 ? `1px solid ${theme.hairline}` : undefined,
                    background: ri % 2 === 1 ? theme.fill + "80" : "transparent",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] leading-snug truncate" style={{ fontFamily: "var(--font-anek),sans-serif", fontWeight: 800, color: theme.text }}>
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {p.house_name && (
                        <span className="text-[12.5px]" style={{ fontFamily: "var(--font-anek),sans-serif", fontWeight: 700, color: theme.sub }}>{p.house_name}</span>
                      )}
                      {p.house_name && p.shakha?.name && <span style={{ color: theme.faint, fontSize: 10 }}>·</span>}
                      {p.shakha?.name && (
                        <span className="text-[12.5px]" style={{ fontFamily: "var(--font-anek),sans-serif", fontWeight: 700, color: theme.sub }}>{p.shakha.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.registration_number && (
                      <span
                        className="relative inline-flex items-center text-[13px] px-2.5 py-1 tracking-wide"
                        style={{
                          background: "#FCD34D",
                          color: "#451A03",
                          fontFamily: "var(--font-anek), sans-serif",
                          fontWeight: 800,
                          WebkitTextStroke: "0.3px #451A03",
                          borderRadius: "5px",
                          border: "1px dashed rgba(120,53,15,0.4)",
                          boxShadow: "0 1px 3px rgba(120,53,15,0.25)",
                        }}
                      >
                        <span
                          className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 0 0 1px rgba(120,53,15,0.2)" }}
                          aria-hidden="true"
                        />
                        {p.registration_number}
                        <span
                          className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 0 0 1px rgba(120,53,15,0.2)" }}
                          aria-hidden="true"
                        />
                      </span>
                    )}
                    {!isEditLocked() && (
                      <button
                        data-tour={isFirstWithRegistrations && ri === 0 ? "edit-existing-registration-edit-btn" : undefined}
                        onClick={(e) => { e.stopPropagation(); onEdit(p.id); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer active:scale-95 transition-transform"
                        style={{ background: theme.fillStrong }}
                      >
                        <Pencil size={13} color={theme.purple} />
                      </button>
                    )}
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
  const [myShakhaName, setMyShakhaName] = useState<string | null>(null);
  const [regs, setRegs] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const retry = () => { setLoadError(null); setMyShakhaId(undefined); setLoading(true); setRetryTick((t) => t + 1); };

  // Fetch admin's shakha_id directly — don't rely on AuthProvider's profile which may not load
  useEffect(() => {
    if (!session?.user?.id) { setMyShakhaId(null); return; }
    Promise.resolve(
      supabase
        .from("profiles")
        .select("shakha_id, role, shakha:shakhas(name)")
        .eq("id", session.user.id)
        .maybeSingle()
    )
      .then(({ data }) => {
        setMyShakhaId(data?.shakha_id ?? null);
        const shakha = data?.shakha as { name: string } | { name: string }[] | null | undefined;
        setMyShakhaName((Array.isArray(shakha) ? shakha[0] : shakha)?.name ?? null);
      })
      .catch(() => {
        setMyShakhaId(null);
        setLoadError("Couldn't load your profile. Check your connection and try again.");
      });
  }, [session, retryTick]);

  useEffect(() => {
    if (!feast || myShakhaId === undefined) return; // wait until shakha_id is resolved
    const ids = feast.competitions.map((c) => c.id);
    if (ids.length === 0) { setLoading(false); return; }

    Promise.resolve(
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
    )
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
      })
      .catch(() => {
        setLoading(false);
        setLoadError("Couldn't load registrations. Check your connection and try again.");
      });
  }, [feast, myShakhaId, retryTick]);

  const errorState = (
    <div className="px-5">
      <FeastTopBar title="My Registrations" onBack={onBack} onExit={onExit} theme={theme} />
      <div className="flex flex-col items-center justify-center pt-16 pb-8 gap-4 px-6">
        <p className="text-[13px] text-center leading-relaxed" style={{ color: theme.sub }}>{loadError}</p>
        <button
          onClick={retry}
          className="px-6 py-2.5 rounded-full text-[13px] font-semibold border-none cursor-pointer"
          style={{ background: theme.fillStrong, color: theme.purple }}
        >
          Retry
        </button>
      </div>
    </div>
  );

  // Still resolving auth
  if (myShakhaId === undefined) {
    return loadError ? errorState : (
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
    return loadError ? errorState : (
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
  const shakhaLabel = myShakhaName ?? "Your Shakha";
  const firstNonEmptyIdx = feast.competitions.findIndex((c) => (regsByComp[c.id]?.length ?? 0) > 0);

  const downloadRegistrationsPDF = () => {
    if (totalRegs === 0) return;

    const compById: Record<string, { name: string; catSlug: string | null }> = {};
    for (const c of feast.competitions) {
      compById[c.id] = { name: c.name, catSlug: c.competitionCategorySlug ?? null };
    }

    const buckets: Record<string, RegRow[]> = {};
    for (const r of regs) {
      if (!r.participant) continue;
      const catSlug = compById[r.feast_competition_id]?.catSlug ?? "other";
      if (!buckets[catSlug]) buckets[catSlug] = [];
      buckets[catSlug].push(r);
    }

    let sl = 0;
    const sectionsHtml = [...CATEGORY_ORDER, "other"]
      .filter((slug) => buckets[slug]?.length)
      .map((slug) => {
        const label = slug === "other" ? "Other" : (CATEGORY_LABELS[slug] ?? slug);
        const rows = buckets[slug]
          .map((r) => {
            const p = r.participant!;
            sl += 1;
            const compName = compById[r.feast_competition_id]?.name ?? "";
            return `<tr>
              <td class="sl">${sl}</td>
              <td class="reg">${esc(p.registration_number ?? "—")}</td>
              <td class="name">${esc(p.name)}</td>
              <td class="house">${esc(p.house_name ?? "—")}</td>
              <td class="bg">${esc(genderLetter(p.gender))}</td>
              <td class="comp">${esc(compName)}</td>
            </tr>`;
          })
          .join("");
        return `<tr class="cat-head"><td colspan="6">${esc(label)}</td></tr>${rows}`;
      })
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Registrations — ${esc(shakhaLabel)}</title>
<style>
  @page { size: A4 portrait; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; border-left: 3px solid #6B46FF; border-right: 3px solid #6B46FF; padding: 0 12px; }
  .hdr { text-align: center; margin-bottom: 16px; }
  .hdr .org { font-size: 15px; letter-spacing: .08em; text-transform: uppercase; color: #6B46FF; margin: 0 0 8px; font-weight: 800; padding-bottom: 8px; border-bottom: 2px solid #6B46FF; }
  .hdr .feast { font-size: 24px; font-weight: 900; color: #4C1D95; margin: 10px 0 4px; letter-spacing: .01em; }
  .hdr .shakha { font-size: 14px; font-weight: 700; color: #333; margin: 0; display: inline-block; background: #f0edff; padding: 4px 12px; border-radius: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #333; padding: 5px 6px; text-align: left; font-size: 12.5px; }
  thead th { background: #f0f0f0; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; }
  col.c-sl   { width: 7%; }
  col.c-reg  { width: 15%; }
  col.c-name { width: 26%; }
  col.c-house{ width: 18%; }
  col.c-bg   { width: 8%; }
  col.c-comp { width: 26%; }
  td.sl, td.bg { text-align: center; font-weight: 700; }
  td.reg { font-family: "Courier New", monospace; font-weight: 700; }
  tr.cat-head td { background: #e5e0ff; font-weight: 800; text-transform: uppercase; letter-spacing: .03em; font-size: 12px; }
  @media print { .noprint { display: none; } }
  .noprint { text-align: center; margin: 18px 0; }
  .noprint button { font-size: 14px; padding: 8px 18px; cursor: pointer; }
</style></head><body>
  <div class="hdr">
    <p class="org">Cherupushpa Mission League Kalpetta</p>
    <p class="feast">${esc(feast.name)}</p>
    <p class="shakha">Registration of shakha ${esc(shakhaLabel)}</p>
  </div>
  <table>
    <colgroup>
      <col class="c-sl"><col class="c-reg"><col class="c-name">
      <col class="c-house"><col class="c-bg"><col class="c-comp">
    </colgroup>
    <thead>
      <tr>
        <th>SL</th><th>Reg No</th><th>Participant Name</th>
        <th>House Name</th><th>B/G</th><th>Competition</th>
      </tr>
    </thead>
    <tbody>${sectionsHtml}</tbody>
  </table>
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      setPdfError("Allow pop-ups to download the registration sheet.");
      setTimeout(() => setPdfError(null), 3000);
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };

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
        <div data-tour="registrations-summary" className="flex-1 min-w-0">
          <div className="font-bold text-[15px] truncate" style={{ fontFamily: "var(--font-anek),sans-serif", color: theme.text }}>
            {shakhaLabel}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: theme.sub }}>
            {totalRegs === 0 ? "No registrations yet" : `${totalRegs} registration${totalRegs > 1 ? "s" : ""} across ${feast.name}`}
          </div>
        </div>
        <button
          data-tour="download-registrations-btn"
          onClick={downloadRegistrationsPDF}
          disabled={totalRegs === 0}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border-none cursor-pointer active:scale-95 transition-transform shrink-0 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${theme.purple}, ${theme.lavender})`, boxShadow: `0 6px 16px ${theme.purple}44` }}
          aria-label="Download registrations"
        >
          <Download size={15} color="#fff" strokeWidth={2.5} />
          <span className="text-white text-[12.5px] font-bold">Download</span>
        </button>
      </div>
      {pdfError && (
        <div className="text-[12.5px] font-medium mb-3 px-1" style={{ color: "#EF4444" }}>
          {pdfError}
        </div>
      )}

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
          isFirstWithRegistrations={i === firstNonEmptyIdx}
        />
      ))}
      <div className="h-2" />
    </div>
  );
}
