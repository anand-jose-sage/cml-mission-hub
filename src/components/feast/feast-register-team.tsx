"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Users } from "lucide-react";
import { useFeast, useFeastId } from "@/hooks/use-feast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { registerTeam } from "@/actions/team";
import {
  GlassPanel, GlowBtn, FeastTopBar, StepDots, type FeastTheme,
} from "./feast-shared";

const STEP_LABELS = ["Competition", "Members", "Review"];
// A team's roster is capped at 7 members by default, but a competition can override
// this via FeastCompetition.maxTeamSize. Mirrors DEFAULT_MAX_TEAM_MEMBERS in
// src/actions/team.ts — server-side is the source of truth, this is just the UI hint.
const DEFAULT_MAX_TEAM_MEMBERS = 7;

interface EligibleParticipant {
  id: string;
  name: string;
  houseName: string | null;
}

export function FeastRegisterTeam({ slug, theme, onBack, onExit, onDone }: {
  slug: string;
  theme: FeastTheme;
  onBack: () => void;
  onExit: () => void;
  onDone: () => void;
}) {
  const { feast } = useFeast(slug);
  const feastId = useFeastId(slug);
  const { session } = useAuth();
  const [adminShakha, setAdminShakha] = useState<{ id: string; name: string } | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const [compId, setCompId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [takenCompIds, setTakenCompIds] = useState<Set<string>>(new Set());

  const [eligible, setEligible] = useState<EligibleParticipant[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

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

  // Default the team name to the Shakha's name once it loads (still editable)
  useEffect(() => {
    if (adminShakha && !teamName) setTeamName(adminShakha.name);
  }, [adminShakha]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find which team competitions this shakha has already registered a team for
  useEffect(() => {
    if (!adminShakha || !feast) return;
    const teamCompIds = feast.competitions.filter((c) => c.cat === "Team").map((c) => c.id);
    if (teamCompIds.length === 0) return;
    supabase
      .from("team_registrations")
      .select("feast_competition_id")
      .eq("shakha_id", adminShakha.id)
      .in("feast_competition_id", teamCompIds)
      .then(({ data }) => {
        setTakenCompIds(new Set((data ?? []).map((r) => r.feast_competition_id as string)));
      });
  }, [adminShakha, feast]);

  // Load this shakha's participants for the feast, minus ones already on a team for this competition
  useEffect(() => {
    if (!compId || !feastId || !adminShakha) { setEligible([]); return; }
    setLoadingEligible(true);
    setPicked([]);
    (async () => {
      const [{ data: participants }, { data: memberRows }] = await Promise.all([
        supabase
          .from("participants")
          .select("id, name, house_name")
          .eq("feast_id", feastId)
          .eq("shakha_id", adminShakha.id),
        supabase
          .from("team_registration_members")
          .select("participant_id")
          .eq("feast_competition_id", compId),
      ]);
      const taken = new Set((memberRows ?? []).map((r) => r.participant_id as string));
      setEligible(
        (participants ?? [])
          .filter((p) => !taken.has(p.id))
          .map((p) => ({ id: p.id, name: p.name, houseName: p.house_name ?? null }))
      );
      setLoadingEligible(false);
    })();
  }, [compId, feastId, adminShakha]);

  const maxTeamMembers = feast?.competitions.find((c) => c.id === compId)?.maxTeamSize ?? DEFAULT_MAX_TEAM_MEMBERS;

  const toggle = (id: string) => setPicked((p) =>
    p.includes(id) ? p.filter((x) => x !== id) : p.length >= maxTeamMembers ? p : [...p, id]
  );

  const step0ok = !!(compId && teamName.trim());
  const step1ok = picked.length > 0;

  const submit = async () => {
    if (!adminShakha) return;
    setSubmitting(true);
    setServerError("");
    const result = await registerTeam({
      feastCompetitionId: compId,
      shakhaId: adminShakha.id,
      teamName: teamName.trim(),
      participantIds: picked,
    });
    setSubmitting(false);

    if (result.error) {
      setServerError(result.error);
      return;
    }
    setDone(true);
  };

  if (!feast) {
    return (
      <div className="flex items-center justify-center pt-24">
        <Loader2 size={28} className="animate-spin" style={{ color: theme.lavender }} />
      </div>
    );
  }

  if (done) {
    return (
      <div className="px-5">
        <FeastTopBar title="Team Registered" onBack={onDone} onExit={onExit} theme={theme} />
        <GlassPanel theme={theme} strong style={{ padding: 24, textAlign: "center", marginTop: 20 }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #C026D3, #EC4899)" }}>
            <Check size={26} color="#fff" />
          </div>
          <div className="font-bold text-[17px] mb-1" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>Team Registered!</div>
          <p className="text-[13px] mb-5" style={{ color: theme.sub }}>
            <strong>{teamName}</strong> has been entered for {feast.competitions.find((c) => c.id === compId)?.name}.
          </p>
          <GlowBtn variant="ghost" full onClick={() => { setDone(false); setStep(0); setCompId(""); setTeamName(""); }} style={{ marginBottom: 10 }}>
            Register Another Team
          </GlowBtn>
          <GlowBtn variant="primary" full onClick={onDone}>Done</GlowBtn>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="px-5">
      <FeastTopBar title={`Register Team · ${feast.name}`} onBack={step === 0 ? onBack : () => setStep((s) => s - 1)} onExit={onExit} theme={theme} />
      <StepDots step={step} labels={STEP_LABELS} theme={theme} />

      {step === 0 && (
        <div>
          <GlassPanel theme={theme} style={{ padding: 16, marginBottom: 14 }}>
            <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}>Competition</label>
            <div className="mb-3">
              {feast.competitions.filter((c) => c.cat === "Team").map((c) => {
                const on = compId === c.id;
                const alreadyTaken = takenCompIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    disabled={alreadyTaken}
                    onClick={() => setCompId(c.id)}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-[14px] mb-2 transition-all"
                    style={{
                      background: on ? theme.purple + "1a" : "rgba(255,255,255,0.72)",
                      border: `1px solid ${on ? theme.lavender : theme.hairline}`,
                      opacity: alreadyTaken ? 0.45 : 1,
                      cursor: alreadyTaken ? "not-allowed" : "pointer",
                    }}
                  >
                    <span className="flex-1 text-[13.5px] font-semibold" style={{ color: theme.text }}>{c.name}</span>
                    {alreadyTaken && <span className="text-[10.5px]" style={{ color: theme.faint }}>Team already registered</span>}
                    {on && <Check size={16} color={theme.purple} />}
                  </button>
                );
              })}
              {feast.competitions.filter((c) => c.cat === "Team").length === 0 && (
                <p className="text-[12.5px] py-4 text-center" style={{ color: theme.faint }}>No team competitions in this feast.</p>
              )}
            </div>
            <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}>Team Name</label>
            <div
              className="flex items-center gap-2.5 px-3.5 rounded-[14px]"
              style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${theme.hairline}` }}
            >
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Charity Warriors"
                className="flex-1 border-none outline-none bg-transparent text-[14.5px] py-3"
                style={{ color: theme.text, fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {adminShakha && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[14px] mt-3" style={{ background: theme.fillStrong, border: `1px solid ${theme.purple}22` }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: theme.purple }} />
                <span className="text-[13px] font-semibold" style={{ color: theme.text }}>{adminShakha.name}</span>
                <span className="text-[11.5px] ml-auto" style={{ color: theme.faint }}>Your Shakha</span>
              </div>
            )}
          </GlassPanel>
          <GlowBtn variant="pink" full size="lg" disabled={!step0ok} iconRight="ArrowRight" onClick={() => setStep(1)}>Continue</GlowBtn>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] leading-relaxed" style={{ color: theme.sub }}>
              Pick up to {maxTeamMembers} registered participants from your Shakha.
            </p>
            <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
              style={{ background: picked.length >= maxTeamMembers ? "#fef3c7" : theme.purple + "1a", color: picked.length >= maxTeamMembers ? "#b45309" : theme.purple }}>
              {picked.length} / {maxTeamMembers}
            </span>
          </div>
          {loadingEligible ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin" style={{ color: theme.lavender }} />
            </div>
          ) : eligible.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={{ background: theme.fill }}>
              <p className="text-[14px] font-semibold mb-1" style={{ color: theme.sub }}>No eligible participants</p>
              <p className="text-[12px]" style={{ color: theme.faint }}>Register participants for your Shakha first, then form a team.</p>
            </div>
          ) : eligible.map((p) => {
            const on = picked.includes(p.id);
            return (
              <GlassPanel
                key={p.id}
                theme={theme}
                pressable
                onClick={() => toggle(p.id)}
                style={{
                  padding: "12px 14px", marginBottom: 9, display: "flex", alignItems: "center", gap: 12,
                  border: on ? `1px solid ${theme.lavender}` : theme.glass.border,
                  boxShadow: on ? `0 0 0 3px ${theme.purple}2e, ${theme.softShadow}` : theme.softShadow,
                }}
              >
                <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center" style={{ background: theme.purple + "1a" }}>
                  <Users size={16} color={theme.lavender} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px]" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{p.name}</div>
                  {p.houseName && <div className="text-[11px]" style={{ color: theme.sub }}>{p.houseName}</div>}
                </div>
                <div
                  className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: on ? "linear-gradient(135deg,#C026D3,#EC4899)" : "rgba(255,255,255,0.72)",
                    border: on ? "none" : `1px solid ${theme.hairline}`,
                  }}
                >
                  {on && <Check size={15} color="#fff" />}
                </div>
              </GlassPanel>
            );
          })}
          <GlowBtn variant="pink" full size="lg" disabled={!step1ok} iconRight="ArrowRight" onClick={() => setStep(2)} style={{ marginTop: 14 }}>
            Review Team
          </GlowBtn>
        </div>
      )}

      {step === 2 && (
        <div>
          <GlassPanel theme={theme} strong style={{ padding: 18, marginBottom: 14 }}>
            <div className="font-semibold text-[11px] uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.gold }}>Confirm team details</div>
            {[
              ["Team Name", teamName],
              ["Competition", feast.competitions.find((c) => c.id === compId)?.name ?? "—"],
              ["Shakha", adminShakha?.name ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2.5" style={{ borderBottom: `1px solid ${theme.hairline}` }}>
                <span className="text-[12.5px]" style={{ color: theme.faint }}>{k}</span>
                <span className="text-[13.5px] font-semibold" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}>{v}</span>
              </div>
            ))}
            <div className="mt-3">
              <div className="text-[12.5px] mb-2" style={{ color: theme.faint }}>Members ({picked.length})</div>
              <div className="flex flex-wrap gap-[7px]">
                {picked.map((id) => (
                  <span key={id} className="font-semibold text-[11.5px] px-[11px] py-1.5 rounded-full" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text, background: theme.purple + "2e", border: `1px solid ${theme.purple}55` }}>
                    {eligible.find((p) => p.id === id)?.name}
                  </span>
                ))}
              </div>
            </div>
          </GlassPanel>
          {serverError && (
            <p className="text-center text-[12px] mb-3 px-2 py-2 rounded-xl" style={{ color: "#ef4444", background: "#fee2e2" }}>{serverError}</p>
          )}
          <GlowBtn variant="gold" full size="lg" icon={submitting ? undefined : "Check"} disabled={submitting} onClick={submit}>
            {submitting ? (
              <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Saving…</span>
            ) : "Confirm Team Registration"}
          </GlowBtn>
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}
