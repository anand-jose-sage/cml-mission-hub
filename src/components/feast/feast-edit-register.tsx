"use client";

import { useState, useEffect } from "react";
import { User, Phone, Calendar, Check, Loader2, Trash2 } from "lucide-react";
import { useFeast } from "@/hooks/use-feast";
import { supabase } from "@/lib/supabase";
import { updateParticipant, deleteParticipant } from "@/actions/feast";
import { getCategorySlug, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";
import {
  GlassPanel, GlowBtn, FeastTopBar, FeastIcon, type FeastTheme,
} from "./feast-shared";

// ─── shared form sub-components ───────────────────────────────────────────

function TextField({ label, value, onChange, placeholder, theme, type = "text", icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  theme: FeastTheme; type?: string; icon?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="mb-3">
      <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins),sans-serif", color: theme.sub }}>{label}</label>
      <div className="flex items-center gap-2.5 px-3.5 rounded-[14px] transition-all"
        style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${focus ? theme.lavender : theme.hairline}`, boxShadow: focus ? `0 0 0 4px ${theme.purple}26` : "none" }}>
        {icon === "user" && <User size={16} color={focus ? theme.lavender : theme.faint} />}
        {icon === "phone" && <Phone size={16} color={focus ? theme.lavender : theme.faint} />}
        <input value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          placeholder={placeholder} type={type} inputMode={type === "tel" ? "tel" : undefined}
          className="flex-1 border-none outline-none bg-transparent text-[14.5px] py-3" style={{ color: theme.text }} />
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
      <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins),sans-serif", color: theme.sub }}>{label}</label>
      <div className="flex items-center gap-2.5 px-3.5 rounded-[14px] transition-all"
        style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${focus ? theme.lavender : theme.hairline}`, boxShadow: focus ? `0 0 0 4px ${theme.purple}26` : "none" }}>
        <Calendar size={16} color={focus ? theme.lavender : theme.faint} />
        <input value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          type="date" max={new Date().toISOString().split("T")[0]} min="1940-01-01"
          className="flex-1 border-none outline-none bg-transparent text-[14.5px] py-3"
          style={{ color: value ? theme.text : theme.faint }} />
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
      <span className="text-[12.5px] font-semibold" style={{ fontFamily: "var(--font-poppins),sans-serif", color }}>
        Competition Category: <strong>{label}</strong>
      </span>
    </div>
  );
}

function GenderPicker({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: FeastTheme }) {
  return (
    <div className="mb-3">
      <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins),sans-serif", color: theme.sub }}>Gender</label>
      <div className="flex gap-2">
        {[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }].map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} onClick={() => onChange(o.value)}
              className="flex-1 py-2.5 rounded-[12px] font-semibold text-[13px] cursor-pointer active:scale-95 transition-transform"
              style={{ fontFamily: "var(--font-poppins),sans-serif", background: on ? "linear-gradient(135deg,#6B46FF,#A78BFA)" : "rgba(255,255,255,0.72)", color: on ? "#fff" : theme.sub, border: on ? "none" : `1px solid ${theme.hairline}`, boxShadow: on ? "0 6px 16px rgba(107,70,255,0.3)" : "none" }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDots({ step, theme }: { step: number; theme: FeastTheme }) {
  const labels = ["Details", "Events", "Review"];
  return (
    <div className="flex items-center gap-1.5 mb-[18px]">
      {labels.map((l, i) => {
        const done = i < step; const active = i === step;
        return (
          <div key={i} className="contents">
            <div className="flex items-center gap-[7px]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[12px]"
                style={{ fontFamily: "var(--font-poppins),sans-serif", background: done || active ? "linear-gradient(135deg,#6B46FF,#A78BFA)" : theme.fillStrong, color: done || active ? "#fff" : theme.faint, boxShadow: active ? "0 6px 16px rgba(107,70,255,0.4)" : "none" }}>
                {done ? <Check size={14} color="#fff" /> : i + 1}
              </div>
              <span className="text-[11.5px]" style={{ fontWeight: active ? 700 : 500, color: active ? theme.text : theme.faint, fontFamily: "var(--font-poppins),sans-serif" }}>{l}</span>
            </div>
            {i < 2 && <div className="flex-1 h-0.5 rounded" style={{ background: i < step ? theme.lavender : theme.track }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────

export function FeastEditRegister({ slug, participantId, theme, onBack, onDone, onExit }: {
  slug: string;
  participantId: string;
  theme: FeastTheme;
  onBack: () => void;
  onDone: () => void;
  onExit: () => void;
}) {
  const { feast } = useFeast(slug);
  const [step, setStep] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState({ name: "", houseName: "", dob: "", gender: "", phone: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "dob" || k === "gender") setPicked([]);
  };
  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // Load existing participant data
  useEffect(() => {
    if (!participantId) return;
    Promise.all([
      supabase.from("participants").select("name, house_name, date_of_birth, gender, phone").eq("id", participantId).single(),
      supabase.from("participant_registrations").select("feast_competition_id").eq("participant_id", participantId),
    ]).then(([{ data: p }, { data: regs }]) => {
      if (p) {
        setForm({
          name: p.name ?? "",
          houseName: p.house_name ?? "",
          dob: p.date_of_birth ?? "",
          gender: p.gender ?? "",
          phone: p.phone ?? "",
        });
      }
      setPicked((regs ?? []).map((r) => r.feast_competition_id));
      setLoadingData(false);
    });
  }, [participantId]);

  const step1ok = !!(form.name.trim() && form.dob && form.gender);
  const step2ok = picked.length > 0;

  const submit = async () => {
    setSubmitting(true);
    setServerError("");
    const result = await updateParticipant({
      participantId,
      name: form.name,
      houseName: form.houseName,
      dateOfBirth: form.dob,
      gender: form.gender,
      phone: form.phone,
      feastCompetitionIds: picked,
    });
    setSubmitting(false);
    if (result.error) { setServerError(result.error); return; }
    onDone();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteParticipant(participantId);
    setDeleting(false);
    if (result.error) { setServerError(result.error); return; }
    onDone();
  };

  if (loadingData || !feast) {
    return (
      <div className="flex items-center justify-center pt-24">
        <Loader2 size={28} className="animate-spin" style={{ color: theme.lavender }} />
      </div>
    );
  }

  return (
    <div className="px-5">
      <FeastTopBar title={`Edit · ${feast.name}`} onBack={step === 0 ? onBack : () => setStep((s) => s - 1)} onExit={onExit} theme={theme} />
      <StepDots step={step} theme={theme} />

      {/* ── Step 0: details ── */}
      {step === 0 && (
        <div>
          <GlassPanel theme={theme} style={{ padding: 16, marginBottom: 14 }}>
            <TextField label="Full Name" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Ann Maria Joy" theme={theme} icon="user" />
            <TextField label="House Name" value={form.houseName} onChange={(v) => set("houseName", v)} placeholder="e.g. Thekkedath House" theme={theme} />
            <DateField label="Date of Birth" value={form.dob} onChange={(v) => set("dob", v)} theme={theme} />
            <CategoryPill dob={form.dob} theme={theme} />
            <GenderPicker value={form.gender} onChange={(v) => set("gender", v)} theme={theme} />
            <TextField label="Phone (optional)" value={form.phone} onChange={(v) => set("phone", v.replace(/[^\d]/g, "").slice(0, 10))} placeholder="10-digit mobile" theme={theme} type="tel" icon="phone" />
          </GlassPanel>
          <GlowBtn variant="primary" full size="lg" disabled={!step1ok} iconRight="ArrowRight" onClick={() => setStep(1)}>Continue</GlowBtn>
          {!step1ok && <p className="text-center text-[11.5px] mt-2.5" style={{ color: theme.faint }}>Name, date of birth and gender are required</p>}

          {/* Delete */}
          <div className="mt-4">
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-none cursor-pointer text-[13px] font-semibold"
                style={{ background: "#fee2e2", color: "#ef4444" }}>
                <Trash2 size={15} /> Remove Registration
              </button>
            ) : (
              <div className="p-4 rounded-2xl text-center" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
                <p className="text-[13px] font-semibold mb-3" style={{ color: "#b91c1c" }}>Delete this registration permanently?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer border-none"
                    style={{ background: "rgba(255,255,255,0.8)", color: "#374151" }}>Cancel</button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border-none flex items-center justify-center gap-1.5"
                    style={{ background: "#ef4444", color: "#fff" }}>
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {deleting ? "Deleting…" : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: competitions ── */}
      {step === 1 && (() => {
        const normGender = (g: string | null | undefined) => {
          if (!g) return null;
          const l = g.toLowerCase();
          if (l === "boy" || l === "boys" || l === "male") return "boys";
          if (l === "girl" || l === "girls" || l === "female") return "girls";
          return l;
        };
        const participantGender = normGender(form.gender);
        const participantCatSlug = getCategorySlug(form.dob);
        const eligibleComps = feast.competitions.filter((c) => {
          const ng = normGender(c.gender);
          const genderOk = !ng || ng === "open" || ng === "common" || ng === participantGender;
          const catOk = !c.competitionCategorySlug || c.competitionCategorySlug === participantCatSlug;
          return genderOk && catOk;
        });
        return (
          <div>
            <p className="text-[13px] mb-3 leading-relaxed" style={{ color: theme.sub }}>
              Update the competitions. Saving will replace all current selections.
            </p>
            {eligibleComps.length === 0 ? (
              <div className="text-center py-10 rounded-2xl" style={{ background: theme.fill }}>
                <p className="text-[14px] font-semibold mb-1" style={{ color: theme.sub }}>No competitions available</p>
                <p className="text-[12px]" style={{ color: theme.faint }}>No events match this age group or gender.</p>
              </div>
            ) : eligibleComps.map((c) => {
              const on = picked.includes(c.id);
              const genderColor = c.gender === "boys" ? "#3B82F6" : c.gender === "girls" ? "#EC4899" : null;
              return (
                <GlassPanel key={c.id} theme={theme} pressable onClick={() => toggle(c.id)}
                  style={{ padding: "12px 14px", marginBottom: 9, display: "flex", alignItems: "center", gap: 12, border: on ? `1px solid ${theme.lavender}` : theme.glass.border, boxShadow: on ? `0 0 0 3px ${theme.purple}2e,${theme.softShadow}` : theme.softShadow }}>
                  <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center" style={{ background: feast.accent + "26" }}>
                    <FeastIcon name={c.icon} size={17} color={theme.lavender} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13.5px]" style={{ fontFamily: "var(--font-poppins),sans-serif", color: theme.text }}>{c.name}</div>
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
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: on ? "linear-gradient(135deg,#6B46FF,#A78BFA)" : "rgba(255,255,255,0.72)", border: on ? "none" : `1px solid ${theme.hairline}` }}>
                    {on && <Check size={15} color="#fff" />}
                  </div>
                </GlassPanel>
              );
            })}
            <div className="flex items-center justify-between mt-3.5 mb-3 px-0.5">
              <span className="text-[13px]" style={{ color: theme.sub }}>Selected</span>
              <span className="font-bold text-[15px]" style={{ fontFamily: "var(--font-poppins),sans-serif", color: theme.text }}>{picked.length} event{picked.length !== 1 ? "s" : ""}</span>
            </div>
            <GlowBtn variant="primary" full size="lg" disabled={!step2ok} iconRight="ArrowRight" onClick={() => setStep(2)}>Review Changes</GlowBtn>
          </div>
        );
      })()}

      {/* ── Step 2: review ── */}
      {step === 2 && (
        <div>
          <GlassPanel theme={theme} strong style={{ padding: 18, marginBottom: 14 }}>
            <div className="font-semibold text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-poppins),sans-serif", color: theme.gold }}>Review changes</div>
            {[
              ["Name", form.name],
              ["House Name", form.houseName || "—"],
              ["Date of Birth", form.dob],
              ["Gender", form.gender.charAt(0).toUpperCase() + form.gender.slice(1)],
              ["Category", CATEGORY_LABELS[getCategorySlug(form.dob)] || "—"],
              ...(form.phone ? [["Phone", form.phone]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2.5" style={{ borderBottom: `1px solid ${theme.hairline}` }}>
                <span className="text-[12.5px]" style={{ color: theme.faint }}>{k}</span>
                <span className="text-[13.5px] font-semibold" style={{ fontFamily: "var(--font-poppins),sans-serif", color: k === "Category" ? (CATEGORY_COLORS[getCategorySlug(form.dob)] || theme.text) : theme.text }}>{v}</span>
              </div>
            ))}
            <div className="mt-3">
              <div className="text-[12.5px] mb-2" style={{ color: theme.faint }}>Competitions ({picked.length})</div>
              <div className="flex flex-wrap gap-[7px]">
                {picked.map((id) => (
                  <span key={id} className="font-semibold text-[11.5px] px-[11px] py-1.5 rounded-full"
                    style={{ fontFamily: "var(--font-poppins),sans-serif", color: theme.text, background: theme.purple + "2e", border: `1px solid ${theme.purple}55` }}>
                    {feast.competitions.find((c) => c.id === id)?.name}
                  </span>
                ))}
              </div>
            </div>
          </GlassPanel>
          {serverError && (
            <p className="text-center text-[12px] mb-3 px-2 py-2 rounded-xl" style={{ color: "#ef4444", background: "#fee2e2" }}>{serverError}</p>
          )}
          <GlowBtn variant="gold" full size="lg" icon={submitting ? undefined : "Check"} disabled={submitting} onClick={submit}>
            {submitting ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Saving…</span> : "Save Changes"}
          </GlowBtn>
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}
