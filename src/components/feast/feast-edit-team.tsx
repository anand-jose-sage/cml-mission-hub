"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Users, Trash2 } from "lucide-react";
import { useFeast } from "@/hooks/use-feast";
import { supabase } from "@/lib/supabase";
import { updateTeam, deleteTeam } from "@/actions/team";
import {
  GlassPanel, GlowBtn, FeastTopBar, type FeastTheme,
} from "./feast-shared";

// A team's roster is capped at 7 members by default, but a competition can override
// this via FeastCompetition.maxTeamSize. Mirrors DEFAULT_MAX_TEAM_MEMBERS in
// src/actions/team.ts — server-side is the source of truth, this is just the UI hint.
const DEFAULT_MAX_TEAM_MEMBERS = 7;

interface EligibleParticipant {
  id: string;
  name: string;
  houseName: string | null;
}

export function FeastEditTeam({ slug, teamId, theme, onBack, onDone, onExit }: {
  slug: string;
  teamId: string;
  theme: FeastTheme;
  onBack: () => void;
  onDone: () => void;
  onExit: () => void;
}) {
  const { feast } = useFeast(slug);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [serverError, setServerError] = useState("");

  const [compId, setCompId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [eligible, setEligible] = useState<EligibleParticipant[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  // Load the team, its current roster, and every eligible participant
  // (this Shakha's participants for the feast, minus anyone already on a
  // DIFFERENT team for this competition — the current team's own members
  // stay eligible so they show up pre-picked).
  useEffect(() => {
    if (!teamId) return;
    (async () => {
      const { data: team } = await supabase
        .from("team_registrations")
        .select("team_name, shakha_id, feast_id, feast_competition_id")
        .eq("id", teamId)
        .single();

      if (!team) { setLoadingData(false); return; }
      setTeamName(team.team_name);
      setCompId(team.feast_competition_id);

      const [{ data: members }, { data: participants }, { data: otherMemberRows }] = await Promise.all([
        supabase
          .from("team_registration_members")
          .select("participant_id")
          .eq("team_registration_id", teamId),
        supabase
          .from("participants")
          .select("id, name, house_name")
          .eq("feast_id", team.feast_id)
          .eq("shakha_id", team.shakha_id),
        supabase
          .from("team_registration_members")
          .select("participant_id, team_registration_id")
          .eq("feast_competition_id", team.feast_competition_id),
      ]);

      const takenByOthers = new Set(
        (otherMemberRows ?? [])
          .filter((r) => r.team_registration_id !== teamId)
          .map((r) => r.participant_id as string)
      );

      setEligible(
        (participants ?? [])
          .filter((p) => !takenByOthers.has(p.id))
          .map((p) => ({ id: p.id, name: p.name, houseName: p.house_name ?? null }))
      );
      setPicked((members ?? []).map((m) => m.participant_id as string));
      setLoadingData(false);
    })();
  }, [teamId]);

  const maxTeamMembers = feast?.competitions.find((c) => c.id === compId)?.maxTeamSize ?? DEFAULT_MAX_TEAM_MEMBERS;

  const toggle = (id: string) => setPicked((p) =>
    p.includes(id) ? p.filter((x) => x !== id) : p.length >= maxTeamMembers ? p : [...p, id]
  );

  const canSave = !!teamName.trim() && picked.length > 0;

  const submit = async () => {
    setSubmitting(true);
    setServerError("");
    const result = await updateTeam({ teamId, teamName: teamName.trim(), participantIds: picked });
    setSubmitting(false);
    if (result.error) { setServerError(result.error); return; }
    onDone();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteTeam(teamId);
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

  const compName = feast.competitions.find((c) => c.id === compId)?.name ?? "Team Event";

  return (
    <div className="px-5">
      <FeastTopBar title={`Edit Team · ${feast.name}`} onBack={onBack} onExit={onExit} theme={theme} />

      <GlassPanel theme={theme} style={{ padding: 16, marginBottom: 14 }}>
        <label className="block text-[11.5px] font-semibold mb-1.5 tracking-wider" style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}>Competition</label>
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[14px] mb-3" style={{ background: theme.fillStrong, border: `1px solid ${theme.hairline}` }}>
          <span className="text-[13.5px] font-semibold" style={{ color: theme.text }}>{compName}</span>
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
      </GlassPanel>

      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] leading-relaxed" style={{ color: theme.sub }}>
          Update the team roster. Saving replaces all members.
        </p>
        <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
          style={{ background: picked.length >= maxTeamMembers ? "#fef3c7" : theme.purple + "1a", color: picked.length >= maxTeamMembers ? "#b45309" : theme.purple }}>
          {picked.length} / {maxTeamMembers}
        </span>
      </div>

      {eligible.length === 0 ? (
        <div className="text-center py-10 rounded-2xl" style={{ background: theme.fill }}>
          <p className="text-[14px] font-semibold mb-1" style={{ color: theme.sub }}>No eligible participants</p>
          <p className="text-[12px]" style={{ color: theme.faint }}>Register more participants for your Shakha first.</p>
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

      {serverError && (
        <p className="text-center text-[12px] mt-3 px-2 py-2 rounded-xl" style={{ color: "#ef4444", background: "#fee2e2" }}>{serverError}</p>
      )}

      <GlowBtn variant="gold" full size="lg" icon={submitting ? undefined : "Check"} disabled={submitting || !canSave} onClick={submit} style={{ marginTop: 14 }}>
        {submitting ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Saving…</span> : "Save Changes"}
      </GlowBtn>

      {/* Delete */}
      <div className="mt-4">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-none cursor-pointer text-[13px] font-semibold"
            style={{ background: "#fee2e2", color: "#ef4444" }}>
            <Trash2 size={15} /> Remove Team Registration
          </button>
        ) : (
          <div className="p-4 rounded-2xl text-center" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
            <p className="text-[13px] font-semibold mb-3" style={{ color: "#b91c1c" }}>Delete this team permanently?</p>
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
      <div className="h-2" />
    </div>
  );
}
