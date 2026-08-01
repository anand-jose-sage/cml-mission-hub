"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calcGrade, calcPositions, GROUP_GRADE_POINTS, GROUP_POSITION_POINTS } from "@/lib/result-calculator";
import { rebuildStandings, type PublicResultRow } from "./results";

const TEAM_CATEGORY_SLUG = "team";

// ── Get saved scores (admin read — bypasses RLS on team_results) ──────────

export async function getTeamCompetitionScores(
  feastCompetitionId: string
): Promise<{ data?: { teamRegistrationId: string; score: number }[]; error?: string }> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("team_results")
    .select("team_registration_id, score")
    .eq("feast_competition_id", feastCompetitionId);
  if (error) return { error: error.message };
  return {
    data: (data ?? []).map((r) => ({
      teamRegistrationId: r.team_registration_id as string,
      score: Number(r.score),
    })),
  };
}

// ── Save draft team scores ─────────────────────────────────────────────────

export async function saveDraftTeamScores(input: {
  feastCompetitionId: string;
  scores: { teamRegistrationId: string; score: number }[];
}): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();

  const rows = input.scores.map((s) => ({
    feast_competition_id: input.feastCompetitionId,
    team_registration_id: s.teamRegistrationId,
    score: s.score,
    grade: null,
    grade_points: 0,
    position: null,
    position_points: 0,
    total_points: 0,
    published_at: null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await admin
    .from("team_results")
    .upsert(rows, { onConflict: "team_registration_id" });

  if (error) return { error: error.message };
  return {};
}

// ── Publish team results ────────────────────────────────────────────────────

export async function publishTeamResults(
  feastCompetitionId: string
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();

  const { data: fc, error: fcErr } = await admin
    .from("feast_competitions")
    .select("id, feast_id, max_score, competition:competitions(type)")
    .eq("id", feastCompetitionId)
    .single();

  if (fcErr || !fc) return { error: "Competition not found" };
  if (!fc.max_score) return { error: "Set max score before publishing" };
  const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as { type: string } | null;
  if (comp?.type !== "group") return { error: "This is not a team competition" };

  const { data: draft, error: draftErr } = await admin
    .from("team_results")
    .select(`
      id, team_registration_id, score,
      team:team_registrations(shakha_id)
    `)
    .eq("feast_competition_id", feastCompetitionId);

  if (draftErr) return { error: draftErr.message };
  if (!draft?.length) return { error: "No scores entered yet" };

  const entries = draft.map((r) => ({
    id: r.team_registration_id as string,
    score: Number(r.score),
  }));

  const posMap = calcPositions(entries, GROUP_POSITION_POINTS);
  const now = new Date().toISOString();

  const calculated = draft.map((r) => {
    const teamId = r.team_registration_id as string;
    const score = Number(r.score);
    const { grade, gradePoints } = calcGrade(score, fc.max_score as number, GROUP_GRADE_POINTS);
    const { position, positionPoints } = posMap.get(teamId) ?? { position: null, positionPoints: 0 };
    const totalPoints = gradePoints + positionPoints;

    const team = (Array.isArray(r.team) ? r.team[0] : r.team) as { shakha_id: string } | null;

    return {
      resultId: r.id as string,
      teamRegistrationId: teamId,
      shakhaId: team?.shakha_id as string | null,
      score,
      grade,
      gradePoints,
      position,
      positionPoints,
      totalPoints,
      publishedAt: now,
    };
  });

  const resultRows = calculated.map((r) => ({
    id: r.resultId,
    feast_competition_id: feastCompetitionId,
    team_registration_id: r.teamRegistrationId,
    score: r.score,
    grade: r.grade,
    grade_points: r.gradePoints,
    position: r.position,
    position_points: r.positionPoints,
    total_points: r.totalPoints,
    published_at: r.publishedAt,
    updated_at: now,
  }));

  const { error: saveErr } = await admin
    .from("team_results")
    .upsert(resultRows, { onConflict: "team_registration_id" });
  if (saveErr) return { error: saveErr.message };

  const { error: delErr } = await admin
    .from("shakha_point_ledger")
    .delete()
    .eq("feast_competition_id", feastCompetitionId);
  if (delErr) return { error: delErr.message };

  const ledgerRows = calculated
    .filter((r) => r.shakhaId)
    .map((r) => ({
      feast_id: fc.feast_id as string,
      feast_competition_id: feastCompetitionId,
      team_registration_id: r.teamRegistrationId,
      shakha_id: r.shakhaId!,
      category_slug: TEAM_CATEGORY_SLUG,
      score: r.score,
      grade: r.grade,
      position: r.position,
      grade_points: r.gradePoints,
      position_points: r.positionPoints,
      total_points: r.totalPoints,
    }));

  if (ledgerRows.length > 0) {
    const { error: ledgerErr } = await admin.from("shakha_point_ledger").insert(ledgerRows);
    if (ledgerErr) return { error: ledgerErr.message };
  }

  const rebuildErr = await rebuildStandings(fc.feast_id as string, admin);
  if (rebuildErr) return { error: rebuildErr };

  const { error: statusErr } = await admin
    .from("feast_competitions")
    .update({ result_status: "published", comp_status: "published" })
    .eq("id", feastCompetitionId);
  if (statusErr) return { error: statusErr.message };

  return {};
}

// ── Unpublish team results (revert to draft) ───────────────────────────────

export async function unpublishTeamResults(
  feastCompetitionId: string,
  feastId: string
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();

  await admin
    .from("team_results")
    .update({
      grade: null, grade_points: 0,
      position: null, position_points: 0,
      total_points: 0, published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("feast_competition_id", feastCompetitionId);

  await admin.from("shakha_point_ledger").delete().eq("feast_competition_id", feastCompetitionId);

  await rebuildStandings(feastId, admin);

  await admin
    .from("feast_competitions")
    .update({ result_status: "draft", comp_status: "completed" })
    .eq("id", feastCompetitionId);

  return {};
}

// ── Get published team results for public screens ──────────────────────────

export async function getPublishedTeamResults(
  feastCompetitionId: string
): Promise<{ data?: PublicResultRow[]; error?: string }> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("team_results")
    .select(`
      team_registration_id, grade, grade_points,
      position, position_points, total_points,
      team:team_registrations(
        team_name,
        shakha:shakhas(name),
        members:team_registration_members(
          participant:participants(name)
        )
      )
    `)
    .eq("feast_competition_id", feastCompetitionId)
    .not("published_at", "is", null);

  if (error) return { error: error.message };

  const rows: PublicResultRow[] = (data ?? []).map((r) => {
    const team = (Array.isArray(r.team) ? r.team[0] : r.team) as Record<string, unknown> | null;
    const shakha = team ? (Array.isArray(team.shakha) ? (team.shakha as unknown[])[0] : team.shakha) as Record<string, unknown> | null : null;
    const members = (team && Array.isArray(team.members) ? team.members : []) as Record<string, unknown>[];
    const memberNames = members
      .map((m) => {
        const p = (Array.isArray(m.participant) ? (m.participant as unknown[])[0] : m.participant) as Record<string, unknown> | null;
        return (p?.name as string) ?? null;
      })
      .filter(Boolean)
      .join(", ");

    return {
      registrationId: r.team_registration_id as string,
      name: (team?.team_name as string) ?? "—",
      houseName: memberNames || null,
      shakha: (shakha?.name as string) ?? "—",
      grade: (r.grade as "A" | "B" | "C" | null) ?? null,
      gradePoints: (r.grade_points as number) ?? 0,
      position: (r.position as number | null) ?? null,
      positionPoints: (r.position_points as number) ?? 0,
      totalPoints: (r.total_points as number) ?? 0,
    };
  });

  return { data: rows };
}
