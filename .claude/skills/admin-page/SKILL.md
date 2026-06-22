---
name: admin-page
description: Scaffold a new CML admin screen under src/app/admin following this repo's conventions — feast/competition filters, desktop-table + mobile-card listing, instant-save via service-role server actions, and nav registration. Use when asked to add/build an admin page, listing, marking UI, or scoring screen for the Feast Portal.
---

# Building a CML admin page

Admin screens live at `src/app/admin/<feature>/page.tsx` and follow a consistent shape.
Use the **Participation** page (`src/app/admin/participation/page.tsx`) and **Entries** /
**Results** pages as the reference implementations — copy their structure rather than
inventing a new one.

## Checklist

1. **Create the page** `src/app/admin/<feature>/page.tsx` — `"use client"`.
2. **Register it in the nav** — add a `NavItem` to the relevant section in
   `NAV_SECTIONS` inside `src/app/admin/layout.tsx` (Feast items go in the "Feast"
   section). Import a verified `lucide-react` icon and give it a brand `color`.
3. **Add a server action** for any writes (see "Reads vs writes" below) in
   `src/actions/feast.ts` (or `results.ts`).
4. **Add a migration** in `supabase/` if you need new columns/tables, and tell the user
   to run it in the Supabase SQL editor.
5. **Verify**: `npx tsc --noEmit` and `npm run build` (the real gate).

## Standard page anatomy

- **Header**: rounded gradient icon chip + title + one-line subtitle.
- **Selectors**: `Feast` (`feasts` ordered by `start_date`, default first) → on change load
  `feast_competitions` for that feast (ordered by `display_order`); `Competition` select
  whose label is `[name, categoryName, gender].filter(Boolean).join(" · ")`.
- **Filters**: optional search box (name / reg no) + `All Shakhas` dropdown.
- **Listing**: render twice — a `hidden sm:block` desktop `<table>` and a `sm:hidden`
  card stack — from the same `entries` array. Empty / loading / "select a competition"
  states use the dashed-border placeholder blocks.

## Reads vs writes (RLS)

- **Reads** of `feasts`, `feast_competitions`, `competitions`, `competition_categories`,
  `participants`, `participant_registrations`, `scores` are public-read — query the client
  `supabase` directly from the page.
- **Writes** to `participants` and `participant_registrations` have **no auth UPDATE RLS
  policy**, so they must go through a **server action** using `getSupabaseAdmin()`. Pattern:

  ```ts
  "use server";
  import { getSupabaseAdmin } from "@/lib/supabase-admin";

  export async function setX(id: string, value: T): Promise<{ error?: string }> {
    const admin = getSupabaseAdmin();
    try {
      const { error } = await admin.from("table").update({ col: value }).eq("id", id);
      if (error) return { error: error.message };
      return {};
    } catch (e) {
      console.error("[setX] unexpected:", e);
      return { error: "Something went wrong." };
    }
  }
  ```

- **Instant save**: update local state optimistically, call the action, and revert + show
  an error banner if it returns `{ error }`. Show a per-row spinner while in flight.

## Gotchas

- **Unwrap nested relations** defensively: `Array.isArray(x) ? x[0] : x` for every joined
  relation (Supabase returns object-or-array).
- **lucide-react v1**: verify the icon name exists before importing.
- **Dual render**: don't forget the mobile card variant — desktop-only tables look broken
  on phones, which is the primary admin device here.
- **Migrations are manual** and must be idempotent (`IF NOT EXISTS`).
- Match the existing data-loading effect pattern even though it trips the
  `set-state-in-effect` lint advisory — the whole admin area does this and the build passes.

## PDF / print export

For printable sheets (e.g. judging score sheets) build an HTML string and
`window.open("", "_blank")` → `document.write` → `document.close` → `setTimeout(() =>
{ w.focus(); w.print(); }, 350)`. No PDF dependency is used; the browser's "Save as PDF"
handles output. Include an in-page "Print" button as a fallback and escape interpolated
text. See `exportPDF` in the Participation page.
