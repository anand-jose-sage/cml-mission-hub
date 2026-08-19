// Converts scripts/lent-content-data.mjs into an idempotent SQL seed file,
// matching supabase/migration-plan-content.sql's INSERT...ON CONFLICT style.
// Run: node scripts/generate-lent-seed-sql.mjs
// Writes: supabase/migration-st-michaels-lent-content.sql (paste/run that
// file manually in the Supabase SQL editor, per this repo's convention).

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LENT_META, LENT_DAYS } from "./lent-content-data.mjs";

const KEY_PREFIX = "st-michaels-lent-2026";
const OUTPUT_FILE = fileURLToPath(new URL("../supabase/migration-st-michaels-lent-content.sql", import.meta.url));

function fail(msg) {
  console.error(`[generate-lent-seed-sql] ${msg}`);
  process.exit(1);
}

function validateDayContent(day, lang, content) {
  for (const field of ["themeTitle", "reflection", "prayer", "activity", "reflectionQuestion"]) {
    if (!content?.[field]?.trim()) fail(`Day ${day} [${lang}]: missing "${field}"`);
  }
  for (const f of ["text", "reference"]) {
    if (!content?.reading?.[f]?.trim()) fail(`Day ${day} [${lang}]: missing "reading.${f}"`);
  }
  for (const f of ["label", "text", "reference"]) {
    if (!content?.posterQuote?.[f]?.trim()) fail(`Day ${day} [${lang}]: missing "posterQuote.${f}"`);
  }
}

function validate() {
  if (LENT_DAYS.length !== 40) fail(`Expected 40 days, got ${LENT_DAYS.length}`);
  const seen = new Set();
  for (const d of LENT_DAYS) {
    if (!Number.isInteger(d.day) || d.day < 1 || d.day > 40) fail(`Invalid day number: ${d.day}`);
    if (seen.has(d.day)) fail(`Duplicate day number: ${d.day}`);
    seen.add(d.day);
    if (!d.emoji?.trim()) fail(`Day ${d.day}: missing "emoji"`);
    validateDayContent(d.day, "en", d.en);
    validateDayContent(d.day, "ml", d.ml);
  }
  for (let i = 1; i <= 40; i++) if (!seen.has(i)) fail(`Missing day ${i}`);
  if (!LENT_META.phases || LENT_META.phases.length !== 5) fail(`Expected 5 phases, got ${LENT_META.phases?.length}`);
  if (!LENT_META.prayerToMichaelEn?.trim()) fail(`meta: missing "prayerToMichaelEn"`);
  if (!LENT_META.prayerToMichaelMl?.trim()) fail(`meta: missing "prayerToMichaelMl"`);
}

const esc = (s) => s.replace(/'/g, "''");
const row = (key, value, sortOrder) =>
  `INSERT INTO lent_content (key, value, sort_order) VALUES ('${key}', '${esc(JSON.stringify(value))}'::jsonb, ${sortOrder})\n  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, sort_order=EXCLUDED.sort_order, updated_at=now();\n\n`;

function main() {
  validate();
  let sql = `-- GENERATED FILE — do not hand-edit.\n-- Edit scripts/lent-content-data.mjs and re-run scripts/generate-lent-seed-sql.mjs\n-- Run in the Supabase SQL editor. Idempotent (safe to re-run).\n\n`;
  sql += row(`${KEY_PREFIX}:meta`, LENT_META, 0);
  for (const d of LENT_DAYS) {
    sql += row(`${KEY_PREFIX}:day-${String(d.day).padStart(2, "0")}`, d, d.day);
  }
  writeFileSync(OUTPUT_FILE, sql, "utf8");
  console.log(`Wrote ${LENT_DAYS.length} days + meta to ${OUTPUT_FILE}`);
}

main();
