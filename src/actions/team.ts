"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface RegisterTeamInput {
  feastCompetitionId: string;
  shakhaId: string;
  teamName: string;
  participantIds: string[]; // 1..7
}

const MAX_TEAM_MEMBERS = 7;

export async function registerTeam(input: RegisterTeamInput): Promise<{ error?: string; teamId?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const teamName = input.teamName.trim();
    const participantIds = Array.from(new Set(input.participantIds));

    if (!teamName) return { error: "Team name is required." };
    if (participantIds.length === 0) return { error: "Select at least one member." };
    if (participantIds.length > MAX_TEAM_MEMBERS) return { error: `Maximum ${MAX_TEAM_MEMBERS} members allowed.` };

    // Competition must be a team (group-type) competition
    const { data: fc, error: fcErr } = await admin
      .from("feast_competitions")
      .select("id, feast_id, competition:competitions(type)")
      .eq("id", input.feastCompetitionId)
      .single();

    if (fcErr || !fc) return { error: "Competition not found." };
    const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as { type: string } | null;
    if (comp?.type !== "group") return { error: "This competition does not accept team registrations." };

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
