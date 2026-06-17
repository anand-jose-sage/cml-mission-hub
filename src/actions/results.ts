"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calcGrade, calcPositions } from "@/lib/result-calculator";

// ── Leaderboard — all shakhas + standings (bypasses RLS) ──────────────────

export interface LeaderboardRow {
  shakhaId: string;
  name: string;
  rank: number;
  points: number;
  subJunior: number;
  junior: number;
  senior: number;
  superSenior: number;
  elder: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  aGrade: number;
  bGrade: number;
  cGrade: number;
}

export async function getLeaderboard(
  feastSlug: string
): Promise<{ data?: LeaderboardRow[]; error?: string }> {
  const admin = getSupabaseAdmin();

  const { data: feastRow } = await admin
    .from("feasts").select("id").eq("slug", feastSlug).single();
  if (!feastRow) return { data: [] };

  const feastId = feastRow.id as string;

  const [{ data: shakhas }, { data: standings }] = await Promise.all([
    admin.from("shakhas").select("id, name").order("name"),
    admin
      .from("shakha_feast_standings")
      .select(`
        shakha_id, grand_total, rank,
        sub_junior_points, junior_points, senior_points,
        super_senior_points, elder_points,
        first_place_count, second_place_count, third_place_count,
        a_grade_count, b_grade_count, c_grade_count
      `)
      .eq("feast_id", feastId),
  ]);

  if (!shakhas?.length) return { data: [] };

  // Build standings map keyed by shakha_id
  const sMap = new Map<string, Record<string, number>>();
  for (const s of standings ?? []) {
    sMap.set(s.shakha_id as string, s as Record<string, number>);
  }

  const rows: LeaderboardRow[] = shakhas.map((sh) => {
    const s = sMap.get(sh.id as string);
    return {
      shakhaId: sh.id as string,
      name: sh.name as string,
      rank: (s?.rank as number) ?? 0,
      points: (s?.grand_total as number) ?? 0,
      subJunior: (s?.sub_junior_points as number) ?? 0,
      junior: (s?.junior_points as number) ?? 0,
      senior: (s?.senior_points as number) ?? 0,
      superSenior: (s?.super_senior_points as number) ?? 0,
      elder: (s?.elder_points as number) ?? 0,
      firstCount: (s?.first_place_count as number) ?? 0,
      secondCount: (s?.second_place_count as number) ?? 0,
      thirdCount: (s?.third_place_count as number) ?? 0,
      aGrade: (s?.a_grade_count as number) ?? 0,
      bGrade: (s?.b_grade_count as number) ?? 0,
      cGrade: (s?.c_grade_count as number) ?? 0,
    };
  });

  // Sort: ranked shakhas first (by rank asc), then unranked alphabetically
  rows.sort((a, b) => {
    if (a.rank > 0 && b.rank > 0) return a.rank - b.rank;
    if (a.rank > 0) return -1;
    if (b.rank > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  // Assign display rank for unranked shakhas
  let nextRank = (rows.filter(r => r.rank > 0).length) + 1;
  for (const r of rows) {
    if (r.rank === 0) { r.rank = nextRank++; }
  }

  return { data: rows };
}

// ── Search participants with their published results ──────────────────────

export interface ParticipantResultItem {
  competitionId: string;
  competitionName: string;
  grade: "A" | "B" | "C" | null;
  position: number | null;
  totalPoints: number;
  isPublished: boolean;
}

export interface ParticipantSearchRow {
  participantId: string;
  name: string;
  houseName: string | null;
  shakha: string;
  regNo: string;
  category: string | null;
  results: ParticipantResultItem[];
}

export async function searchParticipantResults(
  feastSlug: string,
  query: string
): Promise<{ data?: ParticipantSearchRow[]; error?: string }> {
  if (!query.trim()) return { data: [] };

  const admin = getSupabaseAdmin();

  const { data: feast } = await admin.from("feasts").select("id").eq("slug", feastSlug).single();
  if (!feast) return { data: [] };

  // Single nested query: participant → registrations → (feast_competition + result).
  // Replaces the previous 3-round-trip waterfall (participants → regs → results).
  const { data: participants, error: pErr } = await admin
    .from("participants")
    .select(`
      id, name, house_name, registration_number,
      shakha:shakhas(name),
      competition_category:competition_categories(slug),
      registrations:participant_registrations(
        id,
        feast_competition:feast_competitions(id, result_status, competition:competitions(name)),
        results:competition_results(grade, position, total_points, published_at)
      )
    `)
    .eq("feast_id", feast.id)
    .ilike("name", `%${query.trim()}%`)
    .limit(25);

  if (pErr) return { error: pErr.message };
  if (!participants?.length) return { data: [] };

  const rows: ParticipantSearchRow[] = participants.map((p) => {
    const shakhaObj = (Array.isArray(p.shakha) ? p.shakha[0] : p.shakha) as { name: string } | null;
    const catObj = (Array.isArray(p.competition_category) ? p.competition_category[0] : p.competition_category) as { slug: string } | null;
    const regs = (Array.isArray(p.registrations) ? p.registrations : []) as Record<string, unknown>[];

    const items: ParticipantResultItem[] = regs.map((reg) => {
      const fc = (Array.isArray(reg.feast_competition) ? reg.feast_competition[0] : reg.feast_competition) as Record<string, unknown> | null;
      const comp = fc ? (Array.isArray(fc.competition) ? (fc.competition as unknown[])[0] : fc.competition) as Record<string, unknown> | null : null;
      // competition_results has at most one row per registration; only treat it
      // as a real result if it has actually been published.
      const resRow = (Array.isArray(reg.results) ? reg.results[0] : reg.results) as Record<string, unknown> | null;
      const res = resRow?.published_at ? resRow : null;
      return {
        competitionId: (fc?.id as string) ?? "",
        competitionName: (comp?.name as string) ?? "—",
        grade: (res?.grade as "A" | "B" | "C" | null) ?? null,
        position: (res?.position as number | null) ?? null,
        totalPoints: (res?.total_points as number) ?? 0,
        isPublished: fc?.result_status === "published",
      };
    });

    return {
      participantId: p.id,
      name: p.name as string,
      houseName: (p.house_name as string | null) ?? null,
      shakha: shakhaObj?.name ?? "—",
      regNo: (p.registration_number as string) ?? "",
      category: catObj?.slug ?? null,
      results: items,
    };
  });

  return { data: rows };
}

// ── Screen data: per-competition results for Screen 2 ─────────────────────

export interface CompetitionResult {
  competitionId: string;
  competitionName: string;
  categoryName: string;
  categorySlug: string;
  positions: { place: 1 | 2 | 3; name: string; houseName: string | null; shakha: string; photoUrl: string | null }[];
  grades: {
    A: { name: string; houseName: string | null; shakha: string }[];
    B: { name: string; houseName: string | null; shakha: string }[];
    C: { name: string; houseName: string | null; shakha: string }[];
  };
}

export interface ScreenData {
  competitions: CompetitionResult[];
}

export async function getScreenData(
  feastSlug: string
): Promise<{ data?: ScreenData; error?: string }> {
  const admin = getSupabaseAdmin();

  const { data: feastRow } = await admin.from("feasts").select("id").eq("slug", feastSlug).single();
  if (!feastRow) return { data: { competitions: [] } };

  const feastId = feastRow.id as string;

  // Step 1: get all published feast_competitions with competition name + category
  const { data: fcs, error: fcsErr } = await admin
    .from("feast_competitions")
    .select(`
      id,
      competition:competitions(
        name,
        competition_category:competition_categories(name, slug)
      )
    `)
    .eq("feast_id", feastId)
    .eq("result_status", "published");

  if (fcsErr || !fcs?.length) {
    return { data: { competitions: [] } };
  }

  interface CompInfo { name: string; categoryName: string; categorySlug: string }
  const compInfoMap = new Map<string, CompInfo>();

  for (const fc of fcs) {
    const id = fc.id as string;
    const compObj = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
    const catObj = compObj
      ? (Array.isArray(compObj.competition_category) ? (compObj.competition_category as unknown[])[0] : compObj.competition_category) as Record<string, unknown> | null
      : null;
    compInfoMap.set(id, {
      name: (compObj?.name as string) ?? "Competition",
      categoryName: (catObj?.name as string) ?? "",
      categorySlug: (catObj?.slug as string) ?? "",
    });
  }

  const fcIds = fcs.map((fc) => fc.id as string);

  // Step 2: get all published results
  const { data: results, error: rErr } = await admin
    .from("competition_results")
    .select(`
      position, grade, feast_competition_id,
      registration:participant_registrations(
        participant:participants(name, house_name, shakha:shakhas(name))
      )
    `)
    .in("feast_competition_id", fcIds)
    .not("published_at", "is", null);

  if (rErr) return { data: { competitions: [] } };

  // Group rows by feast_competition_id
  const rowsByFc = new Map<string, Array<{ position: number | null; grade: string | null; name: string; houseName: string | null; shakha: string }>>();
  for (const fcId of fcIds) rowsByFc.set(fcId, []);

  for (const r of (results ?? [])) {
    const rec = r as Record<string, unknown>;
    const fcId = rec.feast_competition_id as string;
    if (!rowsByFc.has(fcId)) continue;
    const reg = (Array.isArray(rec.registration) ? rec.registration[0] : rec.registration) as Record<string, unknown> | null;
    const p = reg ? (Array.isArray(reg.participant) ? (reg.participant as unknown[])[0] : reg.participant) as Record<string, unknown> | null : null;
    const sh = p ? (Array.isArray(p.shakha) ? (p.shakha as unknown[])[0] : p.shakha) as Record<string, unknown> | null : null;
    rowsByFc.get(fcId)!.push({
      position: (rec.position as number | null) ?? null,
      grade: (rec.grade as string | null) ?? null,
      name: (p?.name as string) ?? "—",
      houseName: (p?.house_name as string | null) ?? null,
      shakha: (sh?.name as string) ?? "—",
    });
  }

  // Build one CompetitionResult per feast_competition
  const competitions: CompetitionResult[] = [];

  for (const [fcId, rows] of rowsByFc) {
    const info = compInfoMap.get(fcId)!;

    const posMap = new Map<number, { place: 1 | 2 | 3; name: string; houseName: string | null; shakha: string; photoUrl: string | null }>();
    const grades: CompetitionResult["grades"] = { A: [], B: [], C: [] };

    for (const row of rows) {
      if (row.position && row.position >= 1 && row.position <= 3 && !posMap.has(row.position)) {
        posMap.set(row.position, { place: row.position as 1 | 2 | 3, name: row.name, houseName: row.houseName, shakha: row.shakha, photoUrl: null });
      }
      if (row.grade === "A") grades.A.push({ name: row.name, houseName: row.houseName, shakha: row.shakha });
      else if (row.grade === "B") grades.B.push({ name: row.name, houseName: row.houseName, shakha: row.shakha });
      else if (row.grade === "C") grades.C.push({ name: row.name, houseName: row.houseName, shakha: row.shakha });
    }

    const hasAny = posMap.size > 0 || grades.A.length > 0 || grades.B.length > 0 || grades.C.length > 0;
    if (!hasAny) continue;

    competitions.push({
      competitionId: fcId,
      competitionName: info.name,
      categoryName: info.categoryName,
      categorySlug: info.categorySlug,
      positions: ([1, 2, 3] as const)
        .map((p) => posMap.get(p))
        .filter(Boolean) as { place: 1 | 2 | 3; name: string; houseName: string | null; shakha: string; photoUrl: string | null }[],
      grades,
    });
  }

  return { data: { competitions } };
}

// ── Set max score ──────────────────────────────────────────────────────────

export async function setMaxScore(
  feastCompetitionId: string,
  maxScore: number
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("feast_competitions")
    .update({ max_score: maxScore })
    .eq("id", feastCompetitionId);
  if (error) return { error: error.message };
  return {};
}

// ── Get saved scores (admin read — bypasses RLS on competition_results) ───

export async function getCompetitionScores(
  feastCompetitionId: string
): Promise<{ data?: { registrationId: string; score: number }[]; error?: string }> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("competition_results")
    .select("participant_registration_id, score")
    .eq("feast_competition_id", feastCompetitionId);
  if (error) return { error: error.message };
  return {
    data: (data ?? []).map((r) => ({
      registrationId: r.participant_registration_id as string,
      score: Number(r.score),
    })),
  };
}

// ── Get published results for public screen ────────────────────────────────

export interface PublicResultRow {
  registrationId: string;
  name: string;
  houseName: string | null;
  shakha: string;
  grade: "A" | "B" | "C" | null;
  gradePoints: number;
  position: number | null;
  positionPoints: number;
  totalPoints: number;
}

export async function getPublishedResults(
  feastCompetitionId: string
): Promise<{ data?: PublicResultRow[]; error?: string }> {
  const admin = getSupabaseAdmin();

  // The `published_at IS NOT NULL` filter already guarantees only published
  // rows come back (unpublish clears published_at), so no separate status
  // pre-check is needed — one round trip instead of two.
  const { data, error } = await admin
    .from("competition_results")
    .select(`
      participant_registration_id, grade, grade_points,
      position, position_points, total_points,
      registration:participant_registrations(
        participant:participants(name, house_name, shakha:shakhas(name))
      )
    `)
    .eq("feast_competition_id", feastCompetitionId)
    .not("published_at", "is", null);

  if (error) return { error: error.message };

  const rows: PublicResultRow[] = (data ?? []).map((r) => {
    const reg = (Array.isArray(r.registration) ? r.registration[0] : r.registration) as Record<string, unknown> | null;
    const participant = reg ? (Array.isArray(reg.participant) ? (reg.participant as unknown[])[0] : reg.participant) as Record<string, unknown> | null : null;
    const shakha = participant ? (Array.isArray(participant.shakha) ? (participant.shakha as unknown[])[0] : participant.shakha) as Record<string, unknown> | null : null;
    return {
      registrationId: r.participant_registration_id as string,
      name: (participant?.name as string) ?? "—",
      houseName: (participant?.house_name as string | null) ?? null,
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

// ── Save draft scores ──────────────────────────────────────────────────────

export async function saveDraftScores(input: {
  feastCompetitionId: string;
  scores: { registrationId: string; score: number }[];
}): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();

  const rows = input.scores.map((s) => ({
    feast_competition_id: input.feastCompetitionId,
    participant_registration_id: s.registrationId,
    score: s.score,
    // clear any previously published calculations
    grade: null,
    grade_points: 0,
    position: null,
    position_points: 0,
    total_points: 0,
    published_at: null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await admin
    .from("competition_results")
    .upsert(rows, { onConflict: "participant_registration_id" });

  if (error) return { error: error.message };
  return {};
}

// ── Publish results (7-step workflow) ─────────────────────────────────────

export async function publishResults(
  feastCompetitionId: string
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();

  // Load competition metadata
  const { data: fc, error: fcErr } = await admin
    .from("feast_competitions")
    .select(`
      id, feast_id, max_score,
      competition:competitions(
        competition_category_id,
        competition_category:competition_categories(slug)
      )
    `)
    .eq("id", feastCompetitionId)
    .single();

  if (fcErr || !fc) return { error: "Competition not found" };
  if (!fc.max_score) return { error: "Set max score before publishing" };

  const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as Record<string, unknown> | null;
  const cat = comp
    ? (Array.isArray(comp.competition_category) ? (comp.competition_category as unknown[])[0] : comp.competition_category) as Record<string, unknown> | null
    : null;
  const categorySlug = (cat?.slug as string) ?? "unknown";

  // Load draft scores with participant info
  const { data: draft, error: draftErr } = await admin
    .from("competition_results")
    .select(`
      id, participant_registration_id, score,
      registration:participant_registrations(
        participant_id,
        participant:participants(shakha_id)
      )
    `)
    .eq("feast_competition_id", feastCompetitionId);

  if (draftErr) return { error: draftErr.message };
  if (!draft?.length) return { error: "No scores entered yet" };

  // Step 1–3: Calculate grades, positions, points
  const entries = draft.map((r) => ({
    id: r.participant_registration_id as string,
    score: Number(r.score),
  }));

  const posMap = calcPositions(entries);
  const now = new Date().toISOString();

  const calculated = draft.map((r) => {
    const regId = r.participant_registration_id as string;
    const score = Number(r.score);
    const { grade, gradePoints } = calcGrade(score, fc.max_score as number);
    const { position, positionPoints } = posMap.get(regId) ?? { position: null, positionPoints: 0 };
    const totalPoints = gradePoints + positionPoints;

    const reg = (Array.isArray(r.registration) ? r.registration[0] : r.registration) as Record<string, unknown> | null;
    const participant = reg
      ? (Array.isArray(reg.participant) ? (reg.participant as unknown[])[0] : reg.participant) as Record<string, unknown> | null
      : null;

    return {
      resultId: r.id as string,
      registrationId: regId,
      participantId: reg?.participant_id as string | null,
      shakhaId: participant?.shakha_id as string | null,
      score,
      grade,
      gradePoints,
      position,
      positionPoints,
      totalPoints,
      publishedAt: now,
    };
  });

  // Step 4: Save results
  const resultRows = calculated.map((r) => ({
    id: r.resultId,
    feast_competition_id: feastCompetitionId,
    participant_registration_id: r.registrationId,
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
    .from("competition_results")
    .upsert(resultRows, { onConflict: "participant_registration_id" });
  if (saveErr) return { error: saveErr.message };

  // Step 5: Delete old ledger entries for this competition
  const { error: delErr } = await admin
    .from("shakha_point_ledger")
    .delete()
    .eq("feast_competition_id", feastCompetitionId);
  if (delErr) return { error: delErr.message };

  // Step 6: Write new ledger entries
  const ledgerRows = calculated
    .filter((r) => r.participantId && r.shakhaId)
    .map((r) => ({
      feast_id: fc.feast_id as string,
      feast_competition_id: feastCompetitionId,
      participant_registration_id: r.registrationId,
      participant_id: r.participantId!,
      shakha_id: r.shakhaId!,
      category_slug: categorySlug,
      score: r.score,
      grade: r.grade,
      position: r.position,
      grade_points: r.gradePoints,
      position_points: r.positionPoints,
      total_points: r.totalPoints,
    }));

  if (ledgerRows.length > 0) {
    const { error: ledgerErr } = await admin
      .from("shakha_point_ledger")
      .insert(ledgerRows);
    if (ledgerErr) return { error: ledgerErr.message };
  }

  // Step 7: Rebuild standings + mark published
  const rebuildErr = await rebuildStandings(fc.feast_id as string, admin);
  if (rebuildErr) return { error: rebuildErr };

  const { error: statusErr } = await admin
    .from("feast_competitions")
    .update({ result_status: "published" })
    .eq("id", feastCompetitionId);
  if (statusErr) return { error: statusErr.message };

  return {};
}

// ── Unpublish (revert to draft) ────────────────────────────────────────────

export async function unpublishResults(
  feastCompetitionId: string,
  feastId: string
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();

  // Clear published fields on results
  await admin
    .from("competition_results")
    .update({
      grade: null, grade_points: 0,
      position: null, position_points: 0,
      total_points: 0, published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("feast_competition_id", feastCompetitionId);

  // Remove ledger entries
  await admin.from("shakha_point_ledger").delete().eq("feast_competition_id", feastCompetitionId);

  // Rebuild standings (without this competition now)
  await rebuildStandings(feastId, admin);

  // Revert status
  await admin
    .from("feast_competitions")
    .update({ result_status: "draft" })
    .eq("id", feastCompetitionId);

  return {};
}

// ── Rebuild standings from ledger (internal) ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rebuildStandings(feastId: string, admin: any): Promise<string | null> {
  const [{ data: shakhas }, { data: ledger }] = await Promise.all([
    admin.from("shakhas").select("id, name"),
    admin.from("shakha_point_ledger").select("*").eq("feast_id", feastId),
  ]);

  if (!shakhas) return "Could not load shakhas";

  const BUCKETS: Record<string, string> = {
    sub_junior: "sub_junior_points",
    junior: "junior_points",
    senior: "senior_points",
    super_senior: "super_senior_points",
    elder: "elder_points",
  };

  const shakhaNameMap: Record<string, string> = Object.fromEntries(
    shakhas.map((s: { id: string; name: string }) => [s.id, s.name])
  );

  const standings = shakhas.map((shakha: { id: string; name: string }) => {
    const entries = (ledger ?? []).filter((l: Record<string, unknown>) => l.shakha_id === shakha.id);

    const pts: Record<string, number> = {
      sub_junior_points: 0, junior_points: 0,
      senior_points: 0, super_senior_points: 0, elder_points: 0,
    };
    let first = 0, second = 0, third = 0;
    let aGrade = 0, bGrade = 0, cGrade = 0;

    for (const e of entries) {
      const bucket = BUCKETS[e.category_slug as string];
      if (bucket) pts[bucket] += (e.total_points as number) ?? 0;
      if (e.position === 1) first++;
      if (e.position === 2) second++;
      if (e.position === 3) third++;
      if (e.grade === "A") aGrade++;
      if (e.grade === "B") bGrade++;
      if (e.grade === "C") cGrade++;
    }

    const grandTotal = Object.values(pts).reduce((a, b) => a + b, 0);

    return {
      feast_id: feastId,
      shakha_id: shakha.id,
      ...pts,
      grand_total: grandTotal,
      first_place_count: first,
      second_place_count: second,
      third_place_count: third,
      a_grade_count: aGrade,
      b_grade_count: bGrade,
      c_grade_count: cGrade,
      _name: shakha.name, // temp for tie-break sort
    };
  });

  // Tie-break: grandTotal → 1st count → A grade → junior pts → name asc
  standings.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    if ((b.grand_total as number) !== (a.grand_total as number)) return (b.grand_total as number) - (a.grand_total as number);
    if ((b.first_place_count as number) !== (a.first_place_count as number)) return (b.first_place_count as number) - (a.first_place_count as number);
    if ((b.a_grade_count as number) !== (a.a_grade_count as number)) return (b.a_grade_count as number) - (a.a_grade_count as number);
    if ((b.junior_points as number) !== (a.junior_points as number)) return (b.junior_points as number) - (a.junior_points as number);
    return (shakhaNameMap[a.shakha_id as string] ?? "").localeCompare(shakhaNameMap[b.shakha_id as string] ?? "");
  });

  const withRanks = standings.map((s: Record<string, unknown>, i: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _name, ...rest } = s;
    return { ...rest, rank: i + 1, updated_at: new Date().toISOString() };
  });

  const { error } = await admin
    .from("shakha_feast_standings")
    .upsert(withRanks, { onConflict: "feast_id,shakha_id" });

  return error ? error.message : null;
}
