"use client";

import { useState, useEffect } from "react";
import { User, Phone, Calendar, Check, Loader2 } from "lucide-react";
import { useFeast } from "@/hooks/use-feast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { registerParticipant } from "@/actions/feast";
import { getCategorySlug, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";
import {
  GlassPanel, GlowBtn, FeastTopBar, FeastIcon, StepDots, type FeastTheme,
} from "./feast-shared";

// A Shakha may only field a limited number of participants in any single individual
// competition — the limit is per-competition (FeastCompetition.maxPerShakha, default
// 2). Mirrors DEFAULT_MAX_PER_SHAKHA in src/actions/feast.ts — server-side is the
// source of truth, this is just for the live UI hint.
const DEFAULT_MAX_PER_SHAKHA = 2;

function TextField({ label, value, onChange, placeholder, theme, type = "text", icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  theme: FeastTheme; type?: string; icon?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="mb-3">
      <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-[14px] transition-all"
        style={{
          background: "rgba(255,255,255,0.72)",
          border: `1px solid ${focus ? theme.lavender : theme.hairline}`,
          boxShadow: focus ? `0 0 0 4px ${theme.purple}26` : "none",
        }}
      >
        {icon === "user" && <User size={16} color={focus ? theme.lavender : theme.faint} />}
        {icon === "phone" && <Phone size={16} color={focus ? theme.lavender : theme.faint} />}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          type={type}
          inputMode={type === "tel" ? "tel" : undefined}
          className="flex-1 border-none outline-none bg-transparent text-[14.5px] py-3"
          style={{ color: theme.text, fontFamily: "Inter, sans-serif" }}
        />
      </div>
    </div>
  );
}

function DateField({ label, value, onChange, theme }: {
  label: string; value: string; onChange: (v: string) => void; theme: FeastTheme;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="mb-2">
      <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}>{label}</label>
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-[14px] transition-all"
        style={{
          background: "rgba(255,255,255,0.72)",
          border: `1px solid ${focus ? theme.lavender : theme.hairline}`,
          boxShadow: focus ? `0 0 0 4px ${theme.purple}26` : "none",
        }}
      >
        <Calendar size={16} color={focus ? theme.lavender : theme.faint} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          type="date"
          max={new Date().toISOString().split("T")[0]}
          min="1940-01-01"
          className="flex-1 border-none outline-none bg-transparent text-[14.5px] py-3"
          style={{ color: value ? theme.text : theme.faint, fontFamily: "Inter, sans-serif" }}
        />
      </div>
    </div>
  );
}

function CategoryPill({ dob, theme }: { dob: string; theme: FeastTheme }) {
  const slug = getCategorySlug(dob);
  if (!slug) return <div className="mb-3" />;
  const label = CATEGORY_LABELS[slug];
  const color = CATEGORY_COLORS[slug] || theme.lavender;
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-[12px] mb-3" style={{ background: color + "18", border: `1px solid ${color}44` }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="text-[12.5px] font-semibold" style={{ fontFamily: "var(--font-poppins), sans-serif", color }}>
        Competition Category: <strong>{label}</strong>
      </span>
    </div>
  );
}

function GenderPicker({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: FeastTheme }) {
  const options = [{ value: "boy", label: "Boy" }, { value: "girl", label: "Girl" }, { value: "other", label: "Other" }];
  return (
    <div className="mb-3">
      <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}>Gender</label>
      <div className="flex gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className="flex-1 py-2.5 rounded-[12px] font-semibold text-[13px] cursor-pointer active:scale-95 transition-transform"
              style={{
                fontFamily: "var(--font-poppins), sans-serif",
                background: on ? "linear-gradient(135deg, #6B46FF, #A78BFA)" : "rgba(255,255,255,0.72)",
                color: on ? "#fff" : theme.sub,
                border: on ? "none" : `1px solid ${theme.hairline}`,
                boxShadow: on ? "0 6px 16px rgba(107,70,255,0.3)" : "none",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface RegResult {
  regNo: string;
  name: string;
  houseName: string;
  shakha: string;
  dob: string;
  gender: string;
  category: string;
  phone: string;
  comps: string[];
}

export function FeastRegister({ slug, theme, onBack, onExit, onDone }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  onDone: (r: RegResult) => void;
}) {
  const { feast } = useFeast(slug);
  const { session } = useAuth();
  const [adminShakha, setAdminShakha] = useState<{ id: string; name: string } | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({ name: "", houseName: "", dob: "", gender: "", phone: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [shakhaCounts, setShakhaCounts] = useState<Record<string, number>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (id: string) => setPicked((p) => {
    if (p.includes(id)) return p.filter((x) => x !== id);
    const cap = feast?.competitions.find((c) => c.id === id)?.maxPerShakha ?? DEFAULT_MAX_PER_SHAKHA;
    return p.length >= 2 || (shakhaCounts[id] ?? 0) >= cap ? p : [...p, id];
  });

  // Load admin's shakha from their profile
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("profiles")
      .select("shakha_id, shakha:shakhas(id, name)")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.shakha_id) return;
        const sh = Array.isArray(data.shakha) ? data.shakha[0] : data.shakha;
        setAdminShakha({ id: data.shakha_id, name: (sh as { name: string })?.name ?? "" });
      });
  }, [session]);

  // Clear competition selections whenever DOB or gender changes — eligibility may differ
  useEffect(() => { setPicked([]); }, [form.dob, form.gender]);

  // How many participants from this Shakha are already registered per individual
  // competition — used to grey out ones already at the 2-per-Shakha cap.
  useEffect(() => {
    if (!adminShakha || !feast) return;
    const compIds = feast.competitions.filter((c) => c.cat === "Individual").map((c) => c.id);
    if (compIds.length === 0) return;
    (async () => {
      const { data: regs } = await supabase
        .from("participant_registrations")
        .select("feast_competition_id, participant_id")
        .in("feast_competition_id", compIds);
      if (!regs?.length) { setShakhaCounts({}); return; }

      const participantIds = [...new Set(regs.map((r) => r.participant_id as string))];
      const { data: parts } = await supabase
        .from("participants")
        .select("id")
        .in("id", participantIds)
        .eq("shakha_id", adminShakha.id);
      const shakhaSet = new Set((parts ?? []).map((p) => p.id as string));

      const counts: Record<string, number> = {};
      for (const r of regs) {
        if (!shakhaSet.has(r.participant_id as string)) continue;
        const fc = r.feast_competition_id as string;
        counts[fc] = (counts[fc] ?? 0) + 1;
      }
      setShakhaCounts(counts);
    })();
  }, [adminShakha, feast]);

  const step1ok = !!(form.name.trim() && form.dob && form.gender);

  const submit = async () => {
    if (!feast) return;
    setSubmitting(true);
    setServerError("");
    const result = await registerParticipant({
      feastSlug: slug,
      shakhaId: adminShakha?.id ?? null,
      shakhaName: adminShakha?.name ?? "",
      name: form.name,
      houseName: form.houseName,
      dateOfBirth: form.dob,
      gender: form.gender,
      phone: form.phone,
      feastCompetitionIds: picked,
    });
    setSubmitting(false);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    onDone({
      regNo: result.regNo!,
      name: form.name,
      houseName: form.houseName,
      shakha: adminShakha?.name ?? "",
      dob: form.dob,
      gender: form.gender,
      category: getCategorySlug(form.dob),
      phone: form.phone,
      comps: picked.map((id) => feast.competitions.find((c) => c.id === id)?.name ?? id),
    });
  };

  if (!feast) {
    return (
      <div className="flex items-center justify-center pt-24">
        <Loader2 size={28} className="animate-spin" style={{ color: theme.lavender }} />
      </div>
    );
  }

  return (
    <div className="px-5">
      <FeastTopBar title={`Register · ${feast.name}`} onBack={step === 0 ? onBack : () => setStep((s) => s - 1)} onExit={onExit} theme={theme} />
      <StepDots step={step} labels={["Details", "Events", "Review"]} theme={theme} />

      {step === 0 && (
        <div>
          <GlassPanel theme={theme} style={{ padding: 16, marginBottom: 14 }}>
            <TextField label="Full Name" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Ann Maria Joy" theme={theme} icon="user" />
            <TextField label="House Name" value={form.houseName} onChange={(v) => set("houseName", v)} placeholder="e.g. Thekkedath House" theme={theme} />
            <DateField label="Date of Birth" value={form.dob} onChange={(v) => set("dob", v)} theme={theme} />
            <CategoryPill dob={form.dob} theme={theme} />
            <GenderPicker value={form.gender} onChange={(v) => set("gender", v)} theme={theme} />
            <TextField label="Phone (optional)" value={form.phone} onChange={(v) => set("phone", v.replace(/[^\d]/g, "").slice(0, 10))} placeholder="10-digit mobile" theme={theme} type="tel" icon="phone" />
            {adminShakha && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[14px]" style={{ background: theme.fillStrong, border: `1px solid ${theme.purple}22` }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: theme.purple }} />
                <span className="text-[13px] font-semibold" style={{ color: theme.text }}>{adminShakha.name}</span>
                <span className="text-[11.5px] ml-auto" style={{ color: theme.faint }}>Your Shakha</span>
              </div>
            )}
          </GlassPanel>
          <GlowBtn variant="primary" full size="lg" disabled={!step1ok} iconRight="ArrowRight" onClick={() => setStep(1)}>Continue</GlowBtn>
          {!step1ok && <p className="text-center text-[11.5px] mt-2.5" style={{ color: theme.faint }}>Name, date of birth and gender are required</p>}
        </div>
      )}

      {step === 1 && (() => {
        const normGender = (g: string | null | undefined) => {
          if (!g) return null;
          const l = g.toLowerCase();
          if (l === "boy" || l === "boys" || l === "male") return "boys";
          if (l === "girl" || l === "girls" || l === "female") return "girls";
          return l; // "common", "open", etc.
        };
        const participantGender = normGender(form.gender);
        const participantCatSlug = getCategorySlug(form.dob);
        const eligibleComps = feast.competitions.filter((c) => {
          const ng = normGender(c.gender);
          const genderOk = !ng || ng === "open" || ng === "common" || ng === participantGender;
          const catOk = !c.competitionCategorySlug || c.competitionCategorySlug === participantCatSlug;
          return genderOk && catOk && c.cat === "Individual";
        });
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] leading-relaxed" style={{ color: theme.sub }}>
                Showing competitions for your category. Select the ones you&apos;d like to enter.
              </p>
              <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                style={{ background: picked.length >= 2 ? "#fef3c7" : theme.purple + "1a", color: picked.length >= 2 ? "#b45309" : theme.purple }}>
                {picked.length} / 2
              </span>
            </div>
            {picked.length >= 2 && (
              <div className="mb-3 px-3.5 py-2.5 rounded-[14px] text-[12.5px]" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                Maximum 2 competitions allowed. Deselect one to change.
              </div>
            )}
            {eligibleComps.length === 0 ? (
              <div className="text-center py-10 rounded-2xl" style={{ background: theme.fill }}>
                <p className="text-[14px] font-semibold mb-1" style={{ color: theme.sub }}>No individual competitions available</p>
                <p className="text-[12px]" style={{ color: theme.faint }}>No individual events match your age group or gender. You can still continue — join a team competition afterwards from &quot;Register Team&quot;.</p>
              </div>
            ) : eligibleComps.map((c) => {
              const on = picked.includes(c.id);
              const cap = c.maxPerShakha ?? DEFAULT_MAX_PER_SHAKHA;
              const full = !on && (shakhaCounts[c.id] ?? 0) >= cap;
              const genderColor = c.gender === "boys" ? "#3B82F6" : c.gender === "girls" ? "#EC4899" : null;
              return (
                <GlassPanel
                  key={c.id}
                  theme={theme}
                  pressable={!full}
                  onClick={() => !full && toggle(c.id)}
                  style={{
                    padding: "12px 14px", marginBottom: 9, display: "flex", alignItems: "center", gap: 12,
                    border: on ? `1px solid ${theme.lavender}` : theme.glass.border,
                    boxShadow: on ? `0 0 0 3px ${theme.purple}2e, ${theme.softShadow}` : theme.softShadow,
                    opacity: full ? 0.45 : 1,
                    cursor: full ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center" style={{ background: feast.accent + "26" }}>
                    <FeastIcon name={c.icon} size={17} color={theme.lavender} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13.5px]" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{c.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[11px]" style={{ color: theme.sub }}>{c.cat}{c.time ? ` · ${c.time}` : ""}</span>
                      {genderColor && (
                        <span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ background: genderColor + "1a", color: genderColor, border: `1px solid ${genderColor}33` }}>
                          {c.gender === "boys" ? "Boys" : "Girls"}
                        </span>
                      )}
                      {c.competitionCategorySlug && (
                        <span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ background: theme.purple + "1a", color: theme.purple, border: `1px solid ${theme.purple}33` }}>
                          {CATEGORY_LABELS[c.competitionCategorySlug] || c.competitionCategorySlug}
                        </span>
                      )}
                      {full && (
                        <span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                          Full for your Shakha (max {cap})
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: on ? "linear-gradient(135deg,#6B46FF,#A78BFA)" : "rgba(255,255,255,0.72)",
                      border: on ? "none" : `1px solid ${theme.hairline}`,
                    }}
                  >
                    {on && <Check size={15} color="#fff" />}
                  </div>
                </GlassPanel>
              );
            })}
            <div className="flex items-center justify-between mt-3.5 mb-3 px-0.5">
              <span className="text-[13px]" style={{ color: theme.sub }}>Selected</span>
              <span className="font-bold text-[15px]" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{picked.length} event{picked.length !== 1 ? "s" : ""}</span>
            </div>
            <GlowBtn variant="primary" full size="lg" iconRight="ArrowRight" onClick={() => setStep(2)}>Review Registration</GlowBtn>
            {picked.length === 0 && (
              <p className="text-center text-[11.5px] mt-2.5" style={{ color: theme.faint }}>No individual events selected — you can still register and add them to a team later.</p>
            )}
          </div>
        );
      })()}

      {step === 2 && (
        <div>
          <GlassPanel theme={theme} strong style={{ padding: 18, marginBottom: 14 }}>
            <div className="font-semibold text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.gold }}>Confirm your details</div>
            {[
              ["Name", form.name],
              ["House Name", form.houseName || "—"],
              ["Date of Birth", form.dob],
              ["Gender", form.gender.charAt(0).toUpperCase() + form.gender.slice(1)],
              ["Category", CATEGORY_LABELS[getCategorySlug(form.dob)] || "—"],
              ["Shakha", adminShakha?.name ?? "—"],
              ...(form.phone ? [["Phone", form.phone]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2.5" style={{ borderBottom: `1px solid ${theme.hairline}` }}>
                <span className="text-[12.5px]" style={{ color: theme.faint }}>{k}</span>
                <span className="text-[13.5px] font-semibold" style={{ fontFamily: "var(--font-poppins), sans-serif", color: k === "Category" ? (CATEGORY_COLORS[getCategorySlug(form.dob)] || theme.text) : theme.text }}>{v}</span>
              </div>
            ))}
            <div className="mt-3">
              <div className="text-[12.5px] mb-2" style={{ color: theme.faint }}>Competitions ({picked.length})</div>
              {picked.length === 0 ? (
                <p className="text-[12px]" style={{ color: theme.faint }}>None — you can add them to a team afterwards.</p>
              ) : (
                <div className="flex flex-wrap gap-[7px]">
                  {picked.map((id) => (
                    <span key={id} className="font-semibold text-[11.5px] px-[11px] py-1.5 rounded-full" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text, background: theme.purple + "2e", border: `1px solid ${theme.purple}55` }}>
                      {feast.competitions.find((c) => c.id === id)?.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </GlassPanel>
          {serverError && (
            <p className="text-center text-[12px] mb-3 px-2 py-2 rounded-xl" style={{ color: "#ef4444", background: "#fee2e2" }}>{serverError}</p>
          )}
          <GlowBtn variant="gold" full size="lg" icon={submitting ? undefined : "Check"} disabled={submitting} onClick={submit}>
            {submitting ? (
              <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Saving…</span>
            ) : "Confirm Registration"}
          </GlowBtn>
          <p className="text-center text-[11.5px] mt-2.5" style={{ color: theme.faint }}>Registering under <strong>{adminShakha?.name ?? "your shakha"}</strong></p>
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}
