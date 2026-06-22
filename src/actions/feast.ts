"use server";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRegPrefix } from "@/lib/feast-data";
import { getCategorySlug } from "@/lib/competition-categories";

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

    const prefix = getRegPrefix(input.feastSlug);
    const suffix = Date.now().toString().slice(-5);
    const regNo = `${prefix}-${suffix}`;

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

    const suffix = Date.now().toString().slice(-5);
    const regNo = `ADM-${suffix}`;

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
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin
      .from("participant_registrations")
      .update({ participated })
      .eq("id", registrationId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[setParticipation] unexpected:", e);
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
