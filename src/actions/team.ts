"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recalcCompetitionProgress } from "@/actions/feast";

export interface RegisterTeamInput {
  feastCompetitionId: string;
  shakhaId: string;
  teamName: string;
  participantIds: string[]; // 1..7
}

// A team's roster is capped at 7 members by default, but a competition can override
// this via competitions.max_team_size (see supabase/migration-team-max-size.sql) —
// mirrors the max_per_shakha pattern in src/actions/feast.ts.
const DEFAULT_MAX_TEAM_MEMBERS = 7;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMaxTeamSize(admin: any, feastCompetitionId: string): Promise<number> {
  const { data } = await admin
    .from("feast_competitions")
    .select("competition:competitions(max_team_size)")
    .eq("id", feastCompetitionId)
    .maybeSingle();
  const comp = Array.isArray(data?.competition) ? data.competition[0] : data?.competition;
  return (comp?.max_team_size as number) ?? DEFAULT_MAX_TEAM_MEMBERS;
}

export async function registerTeam(input: RegisterTeamInput): Promise<{ error?: string; teamId?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const teamName = input.teamName.trim();
    const participantIds = Array.from(new Set(input.participantIds));

    if (!teamName) return { error: "Team name is required." };
    if (participantIds.length === 0) return { error: "Select at least one member." };

    // Competition must be a team (group-type) competition
    const { data: fc, error: fcErr } = await admin
      .from("feast_competitions")
      .select("id, feast_id, competition:competitions(type, max_team_size)")
      .eq("id", input.feastCompetitionId)
      .single();

    if (fcErr || !fc) return { error: "Competition not found." };
    const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as { type: string; max_team_size: number | null } | null;
    if (comp?.type !== "group") return { error: "This competition does not accept team registrations." };

    const maxTeamMembers = comp?.max_team_size ?? DEFAULT_MAX_TEAM_MEMBERS;
    if (participantIds.length > maxTeamMembers) return { error: `Maximum ${maxTeamMembers} members allowed.` };

    // One team per Shakha per competition
    const { data: existingTeam } = await admin
      .from("team_registrations")
      .select("id")
      .eq("feast_competition_id", input.feastCompetitionId)
      .eq("shakha_id", input.shakhaId)
      .maybeSingle();
    if (existingTeam) return { error: "Your Shakha has already registered a team for this competition." };

    // All members must be registered participants belonging to this shakha and feast
    const { data: participants, error: pErr } = await admin
      .from("participants")
      .select("id, shakha_id, feast_id")
      .in("id", participantIds);

    if (pErr) return { error: pErr.message };
    if (!participants || participants.length !== participantIds.length) {
      return { error: "One or more selected members could not be found." };
    }
    const invalid = participants.some(
      (p) => p.shakha_id !== input.shakhaId || p.feast_id !== fc.feast_id
    );
    if (invalid) return { error: "All members must belong to your Shakha." };

    // No member may already be on another team for this competition
    const { data: clashes } = await admin
      .from("team_registration_members")
      .select("participant_id")
      .eq("feast_competition_id", input.feastCompetitionId)
      .in("participant_id", participantIds);
    if (clashes && clashes.length > 0) {
      return { error: "One or more selected members are already on a team for this competition." };
    }

    // Insert team, then members
    const { data: team, error: teamErr } = await admin
      .from("team_registrations")
      .insert({
        feast_id: fc.feast_id,
        feast_competition_id: input.feastCompetitionId,
        shakha_id: input.shakhaId,
        team_name: teamName,
      })
      .select("id")
      .single();

    if (teamErr || !team) {
      if (teamErr?.code === "23505") {
        return { error: "Your Shakha has already registered a team for this competition." };
      }
      console.error("[registerTeam] team insert:", teamErr?.message);
      return { error: `Team registration failed: ${teamErr?.message ?? "unknown error"}` };
    }

    const memberRows = participantIds.map((participantId) => ({
      team_registration_id: team.id,
      participant_id: participantId,
      feast_competition_id: input.feastCompetitionId,
    }));

    const { error: membersErr } = await admin.from("team_registration_members").insert(memberRows);

    if (membersErr) {
      console.error("[registerTeam] members insert:", membersErr.message);
      // Compensating delete — never leave a team with no/partial roster behind.
      await admin.from("team_registrations").delete().eq("id", team.id);
      if (membersErr.code === "23505") {
        return { error: "One or more selected members are already on a team for this competition." };
      }
      return { error: `Team registration failed: ${membersErr.message}` };
    }

    return { teamId: team.id as string };
  } catch (e) {
    console.error("[registerTeam] unexpected:", e);
    return { error: "Something went wrong. Please try again." };
  }
}

export interface UpdateTeamInput {
  teamId: string;
  teamName: string;
  participantIds: string[]; // 1..7 — replaces the full roster
}

export async function updateTeam(input: UpdateTeamInput): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const teamName = input.teamName.trim();
    const participantIds = Array.from(new Set(input.participantIds));

    if (!teamName) return { error: "Team name is required." };
    if (participantIds.length === 0) return { error: "Select at least one member." };

    const { data: team, error: teamErr } = await admin
      .from("team_registrations")
      .select("id, shakha_id, feast_id, feast_competition_id")
      .eq("id", input.teamId)
      .single();
    if (teamErr || !team) return { error: "Team registration not found." };

    const maxTeamMembers = await getMaxTeamSize(admin, team.feast_competition_id);
    if (participantIds.length > maxTeamMembers) return { error: `Maximum ${maxTeamMembers} members allowed.` };

    // All members must be registered participants belonging to this shakha and feast
    const { data: participants, error: pErr } = await admin
      .from("participants")
      .select("id, shakha_id, feast_id")
      .in("id", participantIds);

    if (pErr) return { error: pErr.message };
    if (!participants || participants.length !== participantIds.length) {
      return { error: "One or more selected members could not be found." };
    }
    const invalid = participants.some(
      (p) => p.shakha_id !== team.shakha_id || p.feast_id !== team.feast_id
    );
    if (invalid) return { error: "All members must belong to your Shakha." };

    // No member may already be on a DIFFERENT team for this competition
    const { data: clashes } = await admin
      .from("team_registration_members")
      .select("participant_id, team_registration_id")
      .eq("feast_competition_id", team.feast_competition_id)
      .in("participant_id", participantIds);
    const conflicting = (clashes ?? []).some((c) => c.team_registration_id !== team.id);
    if (conflicting) {
      return { error: "One or more selected members are already on a different team for this competition." };
    }

    const { error: updateErr } = await admin
      .from("team_registrations")
      .update({ team_name: teamName, updated_at: new Date().toISOString() })
      .eq("id", team.id);
    if (updateErr) return { error: updateErr.message };

    // Replace the roster wholesale — simplest to reason about, matches
    // the individual-registration edit flow's "saving replaces all selections".
    const { error: delErr } = await admin
      .from("team_registration_members")
      .delete()
      .eq("team_registration_id", team.id);
    if (delErr) return { error: delErr.message };

    const memberRows = participantIds.map((participantId) => ({
      team_registration_id: team.id,
      participant_id: participantId,
      feast_competition_id: team.feast_competition_id,
    }));
    const { error: insErr } = await admin.from("team_registration_members").insert(memberRows);
    if (insErr) {
      console.error("[updateTeam] members insert:", insErr.message);
      return { error: `Could not save the roster: ${insErr.message}` };
    }

    return {};
  } catch (e) {
    console.error("[updateTeam] unexpected:", e);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteTeam(teamId: string): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin.from("team_registrations").delete().eq("id", teamId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[deleteTeam] unexpected:", e);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── PARTICIPATION MARKING (team competitions) ──────────────────────────────
// Mirrors setParticipation / setChanceNo in src/actions/feast.ts, keyed on
// team_registrations instead of participant_registrations — a team takes
// part (or not) and draws one chance number as a unit, not per member.

export async function setTeamParticipation(
  teamRegistrationId: string,
  participated: boolean
): Promise<{ error?: string; progressPct?: number | null; compStatus?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { data: updated, error } = await admin
      .from("team_registrations")
      .update({ participated })
      .eq("id", teamRegistrationId)
      .select("feast_competition_id")
      .single();
    if (error) return { error: error.message };

    const fcId = updated?.feast_competition_id as string | undefined;
    return fcId ? await recalcCompetitionProgress(fcId) : {};
  } catch (e) {
    console.error("[setTeamParticipation] unexpected:", e);
    return { error: "Something went wrong." };
  }
}

// Set the draw/lot `chance_no` (1-10000, or null to clear) for a single team.
export async function setTeamChanceNo(
  teamRegistrationId: string,
  chanceNo: number | null
): Promise<{ error?: string }> {
  if (chanceNo !== null && (!Number.isInteger(chanceNo) || chanceNo < 1 || chanceNo > 10000)) {
    return { error: "Chance number must be between 1 and 10000." };
  }
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin
      .from("team_registrations")
      .update({ chance_no: chanceNo })
      .eq("id", teamRegistrationId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[setTeamChanceNo] unexpected:", e);
    return { error: "Something went wrong." };
  }
}
