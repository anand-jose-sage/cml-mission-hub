// One-off tool: creates one Supabase Auth login (role: sa_admin) per shakha.
// Email:    <shakha-slug>@kalpetta.in
// Password: <ShakhaName>@<5 random digits>
//
// Run: node scripts/create-shakha-users.mjs
// Prints results to the terminal AND writes them to
// scripts/shakha-credentials.local.txt (gitignored — contains plaintext
// passwords, delete it once you've copied what you need into a password manager).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const OUTPUT_FILE = fileURLToPath(new URL("./shakha-credentials.local.txt", import.meta.url));

// ---- load .env.local (this script runs outside Next.js, so it doesn't auto-load env) ----
function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// The 14 shakhas (from SHAKHA_COLOR_MAP in src/lib/feast-data.ts)
const SHAKHAS = [
  "Charity", "Chooralmala", "Edapetti", "Kalathuvayal", "Kalpetta", "Kolavayal",
  "Lakkidi", "Nedumbala", "Olivumala", "Puzhamudi", "Rippon", "Theneri",
  "Vazhavatta", "Vythiri",
];

function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function credentialsFor(name) {
  const slug = name.toLowerCase();
  const email = `${slug}@cmlkalpetta.in`;
  const password = `${name}@${randomDigits(5)}`;
  return { email, password };
}

async function main() {
  const results = [];

  for (const name of SHAKHAS) {
    const { email, password } = credentialsFor(name);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (error) {
      results.push({ name, email, password: null, status: `FAILED: ${error.message}` });
      continue;
    }

    // The on_auth_user_created trigger inserts a bare profile row (role defaults to "admin").
    // Bump it to sa_admin per request; shakha_id is left null for manual scoping.
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ full_name: name, role: "sa_admin" })
      .eq("id", data.user.id);

    if (updateErr) {
      results.push({ name, email, password, status: `USER CREATED, PROFILE UPDATE FAILED: ${updateErr.message}` });
      continue;
    }

    results.push({ name, email, password, status: "OK" });
  }

  const header = "Shakha  Email                     Password           Status";
  const divider = "------  ------------------------  -----------------  ------";
  const rows = results.map(
    (r) => `${r.name.padEnd(14)}${r.email.padEnd(26)}${(r.password ?? "—").padEnd(19)}${r.status}`
  );

  console.log(`\n${header}`);
  console.log(divider);
  for (const row of rows) console.log(row);

  const failed = results.filter((r) => r.status !== "OK");
  console.log(`\n${results.length - failed.length}/${results.length} created successfully.`);
  if (failed.length) {
    console.log(`${failed.length} failed — see Status column above (e.g. already exists).`);
  }

  const fileContents = [
    `Generated ${new Date().toISOString()}`,
    header,
    divider,
    ...rows,
    "",
  ].join("\n");
  writeFileSync(OUTPUT_FILE, fileContents, "utf8");
  console.log(`\nSaved to ${OUTPUT_FILE} — copy these into a password manager, then delete the file.`);
}

main();
