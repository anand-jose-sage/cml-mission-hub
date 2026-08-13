"use server";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRegPrefix } from "@/lib/feast-data";
import { getCategorySlug } from "@/lib/competition-categories";

// A Shakha may only field a limited number of participants in any single individual
// competition — the limit is per-competition (competitions.max_per_shakha, default 2),
// not a fixed constant. Team/group competitions are unrelated — those go through
// registerTeam() in team.ts and allow up to 7.
const DEFAULT_MAX_PER_SHAKHA = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findFullCompetitionsForShakha(
  client: any,
  feastCompetitionIds: string[],
  shakhaId: string | null,
  excludeParticipantId?: string
): Promise<string[]> {
  if (!shakhaId || feastCompetitionIds.length === 0) return [];

  const { data: regs } = await client
    .from("participant_registrations")
    .select("feast_competition_id, participant_id")
    .in("feast_competition_id", feastCompetitionIds);

  if (!regs?.length) return [];

  const participantIds = [...new Set(regs.map((r: { participant_id: string }) => r.participant_id))]
    .filter((id) => id !== excludeParticipantId);
  if (participantIds.length === 0) return [];

  const { data: parts } = await client
    .from("participants")
    .select("id")
    .in("id", participantIds)
    .eq("shakha_id", shakhaId);

  const shakhaParticipantIds = new Set((parts ?? []).map((p: { id: string }) => p.id));

  const { data: fcRows } = await client
    .from("feast_competitions")
    .select("id, competition:competitions(max_per_shakha)")
    .in("id", feastCompetitionIds);

  const capMap: Record<string, number> = {};
  for (const fc of fcRows ?? []) {
    const comp = Array.isArray(fc.competition) ? fc.competition[0] : fc.competition;
    capMap[fc.id] = (comp?.max_per_shakha as number) ?? DEFAULT_MAX_PER_SHAKHA;
  }

  const counts: Record<string, number> = {};
  for (const r of regs as { feast_competition_id: string; participant_id: string }[]) {
    if (r.participant_id === excludeParticipantId) continue;
    if (!shakhaParticipantIds.has(r.participant_id)) continue;
    counts[r.feast_competition_id] = (counts[r.feast_competition_id] ?? 0) + 1;
  }

  return feastCompetitionIds.filter((id) => (counts[id] ?? 0) >= (capMap[id] ?? DEFAULT_MAX_PER_SHAKHA));
}

export interface RegInput {
  feastSlug: string;
  shakhaId: string | null;
  shakhaName: string;
  name: string;
  houseName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  feastCompetitionIds: string[];
}

export interface RegOutput {
  regNo: string;
  error?: never;
}
export interface RegError {
  error: string;
  regNo?: never;
}

export async function registerParticipant(input: RegInput): Promise<RegOutput | RegError> {
  // Offline / development mode — generate a fake reg number
  if (!isSupabaseConfigured) {
    const n = 100 + Math.floor(Math.random() * 900);
    return { regNo: `${getRegPrefix(input.feastSlug)}-0${n}` };
  }

  try {
    // Resolve feast id
    const { data: feastRow, error: feastErr } = await supabase
      .from("feasts")
      .select("id, slug")
      .eq("slug", input.feastSlug)
      .single();

    if (feastErr || !feastRow) {
      return { error: "Feast not found." };
    }

    // A Shakha may only field 2 participants per individual competition
    const fullComps = await findFullCompetitionsForShakha(supabase, input.feastCompetitionIds, input.shakhaId);
    if (fullComps.length > 0) {
      return { error: "Your Shakha has reached the registration limit for one of the selected competitions. Please deselect it and choose another." };
    }

    // Resolve competition category from DOB
    const catSlug = getCategorySlug(input.dateOfBirth);
    let competitionCategoryId: string | null = null;
    if (catSlug) {
      const { data: catRow } = await supabase
        .from("competition_categories")
        .select("id")
        .eq("slug", catSlug)
        .maybeSingle();
      competitionCategoryId = catRow?.id ?? null;
    }

    // Atomic per-feast counter (starts at 1111). See migration-reg-numbers.sql.
    const prefix = getRegPrefix(input.feastSlug, feastRow.id as string);
    const { data: nextNum, error: numErr } = await supabase.rpc("next_reg_number", { p_feast_id: feastRow.id });
    if (numErr || nextNum == null) {
      console.error("[registerParticipant] next_reg_number:", numErr?.message);
      return { error: "Could not allocate a registration number." };
    }
    const regNo = `${prefix}-${nextNum}`;

    // Insert participant
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .insert({
        feast_id: feastRow.id,
        shakha_id: input.shakhaId || null,
        name: input.name.trim(),
        house_name: input.houseName.trim() || null,
        date_of_birth: input.dateOfBirth || null,
        gender: input.gender || null,
        competition_category_id: competitionCategoryId,
        phone: input.phone.trim() || null,
        registration_number: regNo,
      })
      .select("id")
      .single();

    if (pErr || !participant) {
      console.error("[registerParticipant] participant insert:", pErr?.message, pErr?.details, pErr?.hint);
      return { error: `Registration failed: ${pErr?.message ?? "unknown error"}` };
    }

    // Insert registrations for each selected competition
    if (input.feastCompetitionIds.length > 0) {
      const rows = input.feastCompetitionIds.map((fcId) => ({
        participant_id: participant.id,
        feast_competition_id: fcId,
      }));
      const { error: rErr } = await supabase
        .from("participant_registrations")
        .insert(rows);

      if (rErr) {
        console.error("[registerParticipant] registrations insert:", rErr.message);
      }
    }

    return { regNo };
  } catch (e) {
    console.error("[registerParticipant] unexpected:", e);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── ADMIN CREATE ──────────────────────────────────────────────────────────

export interface AdminRegInput {
  feastId: string;
  shakhaId: string;
  name: string;
  houseName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  feastCompetitionIds: string[];
}

export async function createParticipantAdmin(input: AdminRegInput): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const fullComps = await findFullCompetitionsForShakha(admin, input.feastCompetitionIds, input.shakhaId || null);
    if (fullComps.length > 0) {
      return { error: "This Shakha has reached the registration limit for one of the selected competitions." };
    }

    const catSlug = getCategorySlug(input.dateOfBirth);
    let competitionCategoryId: string | null = null;
    if (catSlug) {
      const { data: catRow } = await admin
        .from("competition_categories")
        .select("id")
        .eq("slug", catSlug)
        .maybeSingle();
      competitionCategoryId = catRow?.id ?? null;
    }

    // Use the same per-feast incremental counter as the public flow, plus the
    // feast's own prefix (LF26, AF26, …) — keeps registration numbers uniform
    // regardless of which flow created them.
    const { data: feastRow, error: feastErr } = await admin
      .from("feasts")
      .select("slug")
      .eq("id", input.feastId)
      .single();
    if (feastErr || !feastRow) {
      return { error: "Feast not found." };
    }
    const { data: nextNum, error: numErr } = await admin.rpc("next_reg_number", { p_feast_id: input.feastId });
    if (numErr || nextNum == null) {
      console.error("[createParticipantAdmin] next_reg_number:", numErr?.message);
      return { error: "Could not allocate a registration number." };
    }
    const regNo = `${getRegPrefix(feastRow.slug as string, input.feastId)}-${nextNum}`;

    const { data: participant, error: pErr } = await admin
      .from("participants")
      .insert({
        feast_id: input.feastId,
        shakha_id: input.shakhaId || null,
        name: input.name.trim(),
        house_name: input.houseName.trim() || null,
        date_of_birth: input.dateOfBirth || null,
        gender: input.gender || null,
        competition_category_id: competitionCategoryId,
        phone: input.phone.trim() || null,
        registration_number: regNo,
      })
      .select("id")
      .single();

    if (pErr || !participant) {
      return { error: pErr?.message ?? "Insert failed" };
    }

    if (input.feastCompetitionIds.length > 0) {
      const rows = input.feastCompetitionIds.map((fcId) => ({
        participant_id: participant.id,
        feast_competition_id: fcId,
      }));
      const { error: rErr } = await admin.from("participant_registrations").insert(rows);
      if (rErr) console.error("[createParticipantAdmin] registrations:", rErr.message);
    }

    return {};
  } catch (e) {
    console.error("[createParticipantAdmin] unexpected:", e);
    return { error: "Something went wrong." };
  }
}

// ─── UPDATE ────────────────────────────────────────────────────────────────

export interface UpdateInput {
  participantId: string;
  name: string;
  houseName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  feastCompetitionIds: string[];
}

export async function updateParticipant(input: UpdateInput): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { data: existing } = await admin
      .from("participants")
      .select("shakha_id")
      .eq("id", input.participantId)
      .maybeSingle();

    const fullComps = await findFullCompetitionsForShakha(
      admin, input.feastCompetitionIds, existing?.shakha_id ?? null, input.participantId
    );
    if (fullComps.length > 0) {
      return { error: "This Shakha has reached the registration limit for one of the selected competitions." };
    }

    // Resolve competition category from DOB
    const catSlug = getCategorySlug(input.dateOfBirth);
    let competitionCategoryId: string | null = null;
    if (catSlug) {
      const { data: catRow } = await admin
        .from("competition_categories")
        .select("id")
        .eq("slug", catSlug)
        .maybeSingle();
      competitionCategoryId = catRow?.id ?? null;
    }

    // Update participant row
    const { error: pErr } = await admin
      .from("participants")
      .update({
        name: input.name.trim(),
        house_name: input.houseName.trim() || null,
        date_of_birth: input.dateOfBirth || null,
        gender: input.gender || null,
        competition_category_id: competitionCategoryId,
        phone: input.phone.trim() || null,
      })
      .eq("id", input.participantId);

    if (pErr) {
      console.error("[updateParticipant] update:", pErr.message);
      return { error: `Update failed: ${pErr.message}` };
    }

    // Replace competition selections: delete old, insert new
    const { error: delErr } = await admin
      .from("participant_registrations")
      .delete()
      .eq("participant_id", input.participantId);

    if (delErr) {
      console.error("[updateParticipant] delete registrations:", delErr.message);
      return { error: `Could not update competitions: ${delErr.message}` };
    }

    if (input.feastCompetitionIds.length > 0) {
      const rows = input.feastCompetitionIds.map((fcId) => ({
        participant_id: input.participantId,
        feast_competition_id: fcId,
      }));
      const { error: insErr } = await admin
        .from("participant_registrations")
        .insert(rows);
      if (insErr) {
        console.error("[updateParticipant] insert registrations:", insErr.message);
      }
    }

    return {};
  } catch (e) {
    console.error("[updateParticipant] unexpected:", e);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── PARTICIPATION MARKING ─────────────────────────────────────────────────

// Toggle the `participated` flag for a single registration. Writes through the
// service-role client because participant_registrations has no auth UPDATE RLS
// policy (only public read/insert).
export async function setParticipation(
  registrationId: string,
  participated: boolean
): Promise<{ error?: string; progressPct?: number | null; compStatus?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { data: updated, error } = await admin
      .from("participant_registrations")
      .update({ participated })
      .eq("id", registrationId)
      .select("feast_competition_id")
      .single();
    if (error) return { error: error.message };

    const fcId = updated?.feast_competition_id as string | undefined;
    return fcId ? await recalcCompetitionProgress(fcId) : {};
  } catch (e) {
    console.error("[setParticipation] unexpected:", e);
    return { error: "Something went wrong." };
  }
}

// Recompute feast_competitions.progress_pct / comp_status live from attendance:
// progress_pct = (registrations marked participated) / (registrations with a chance_no
// assigned) * 100. 100% flips the competition to "completed", anything below (as long as
// chance numbers exist) keeps/moves it to "progressing" (shown publicly as "Live"). A
// competition whose results are already "published" is left untouched — that record is
// final and shouldn't shift under an unrelated attendance edit.
async function recalcCompetitionProgress(
  feastCompetitionId: string
): Promise<{ error?: string; progressPct?: number | null; compStatus?: string }> {
  const admin = getSupabaseAdmin();

  const { data: fc, error: fcError } = await admin
    .from("feast_competitions")
    .select("comp_status")
    .eq("id", feastCompetitionId)
    .single();
  if (fcError) return { error: fcError.message };
  if (fc?.comp_status === "published") return {};

  const { data: regs, error: regsError } = await admin
    .from("participant_registrations")
    .select("participated, chance_no")
    .eq("feast_competition_id", feastCompetitionId);
  if (regsError) return { error: regsError.message };

  const totalWithChance = (regs ?? []).filter((r) => r.chance_no != null).length;
  if (totalWithChance === 0) return {};

  const participatedCount = (regs ?? []).filter((r) => r.participated).length;
  const progressPct = Math.min(100, Math.round((participatedCount / totalWithChance) * 100));
  const compStatus = progressPct >= 100 ? "completed" : "progressing";

  const { error: updateError } = await admin
    .from("feast_competitions")
    .update({ progress_pct: progressPct, comp_status: compStatus })
    .eq("id", feastCompetitionId);
  if (updateError) return { error: updateError.message };

  return { progressPct, compStatus };
}

// Set the draw/lot `chance_no` (1-100, or null to clear) for a single registration.
export async function setChanceNo(
  registrationId: string,
  chanceNo: number | null
): Promise<{ error?: string }> {
  if (chanceNo !== null && (!Number.isInteger(chanceNo) || chanceNo < 1 || chanceNo > 100)) {
    return { error: "Chance number must be between 1 and 100." };
  }
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin
      .from("participant_registrations")
      .update({ chance_no: chanceNo })
      .eq("id", registrationId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[setChanceNo] unexpected:", e);
    return { error: "Something went wrong." };
  }
}

// ─── COMPETITION STATUS ────────────────────────────────────────────────────

export interface CompStatusInput {
  feastCompetitionId: string;
  compStatus: "upcoming" | "progressing" | "completed" | "published";
  stage: string;
  scheduledTime: string;
  progressPct: number | null;
  info: string;
}

export async function updateCompetitionStatus(input: CompStatusInput): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin
      .from("feast_competitions")
      .update({
        comp_status: input.compStatus,
        stage: input.stage || null,
        scheduled_time: input.scheduledTime || null,
        progress_pct: input.compStatus === "progressing" ? input.progressPct : null,
        info: input.info || null,
      })
      .eq("id", input.feastCompetitionId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[updateCompetitionStatus] unexpected:", e);
    return { error: "Something went wrong." };
  }
}

// ─── DELETE ────────────────────────────────────────────────────────────────

export async function deleteParticipant(participantId: string): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin
      .from("participants")
      .delete()
      .eq("id", participantId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[deleteParticipant] unexpected:", e);
    return { error: "Something went wrong." };
  }
}
