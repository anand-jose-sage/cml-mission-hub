<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CML Mission Hub

A Next.js app for the **Cherupushpa Mission League (CML), Kalpetta** — a Catholic youth
mission. It is one codebase with three faces:

1. **Mission Hub (public app)** — a mobile-first PWA at `/`: daily mission content,
   notices, activities calendar, and a media center.
2. **Feast Portal** — a competition/festival sub-app reached from inside the public app:
   participants browse feasts, register, and view results/leaderboards/standings.
3. **Admin back office** — auth-gated dashboard at `/admin` to manage all of the above,
   including the full feast-management workflow (feasts, competitions, participants,
   participation, scoring, results, standings).

There is also a **results "screen"** at `/screen` — a public big-screen display of
published competition results.

## Stack

- **Next.js 16** (App Router) + **React 19** — ⚠️ see the breaking-changes note above; consult `node_modules/next/dist/docs/` before writing framework code.
- **Supabase** (Postgres + Auth + Storage) via `@supabase/supabase-js`.
- **Tailwind CSS v4** (+ `tw-animate-css`), **shadcn**-style primitives in `src/components/ui`.
- **lucide-react** icons (v1 — verify a name exists before importing: `node -e "console.log('X' in require('lucide-react'))"`).
- **framer-motion** for animation. TypeScript throughout.
- Deploys on **Vercel**.

## Commands

```bash
npm run dev      # next dev (localhost:3000)
npm run build    # next build — the real correctness gate; run before declaring done
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

Lint note: client pages that load data in `useEffect` trip a `react-hooks/set-state-in-effect`
advisory. The whole app does this and `next build` does not fail on it — match the existing
pattern rather than diverging.

## Environment (`.env.local`, not committed)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public client (`src/lib/supabase.ts`).
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only** admin client (`src/lib/supabase-admin.ts`); never import into client components.
- `NEXT_PUBLIC_SITE_URL` — canonical URL for SEO/metadata (`src/lib/site-config.ts`).

If the public env vars are missing, `supabase` is `null` and `isSupabaseConfigured` is
`false`; some flows fall back to offline/mock behaviour (e.g. fake registration numbers).

## Project layout

```
src/
  app/
    page.tsx            # Public Mission Hub — single mobile screen, tab-switched
    layout.tsx          # Root layout, fonts, metadata
    content/[slug]/     # Public content detail pages
    screen/             # Public big-screen results display
    admin/
      layout.tsx        # Auth gate + sidebar/bottom-nav shell (AuthProvider)
      page.tsx          # Dashboard
      <feature>/page.tsx
      login/page.tsx
    api/admin/          # Route handlers that need the service role (e.g. create-user)
    sitemap.ts robots.ts manifest.ts   # SEO/PWA
  actions/              # "use server" server actions: content.ts, feast.ts, results.ts
  components/
    home/  notices/  media/  activities/   # public Mission Hub UI
    feast/                                  # public Feast Portal screens
    ui/                                     # shadcn-style primitives
    shared/
  hooks/                # use-* data hooks for the public side
  lib/                  # supabase clients, auth-context, theme, calculators, config
  types/                # shared TS types (incl. a hand-written Database type)
supabase/               # schema.sql + migration-*.sql (run manually in the SQL editor)
public/
```

## The public Mission Hub (`src/app/page.tsx`)

A single full-height mobile screen (`max-w-md` centered) with client-side **tabs**
(`home`, `notices`, `media`, `activities`, `about`) rendered as absolute-positioned layers,
plus a `BottomNav`. The home tab composes `TopHeader`, `HeroEvent`, the `FeastPortalCard`
(entry point to the Feast Portal), `TodayMission`, `HomeNotices`, `WeekCalendar`, and
`HomeActivities`. Theming comes from `buildTheme(...)` in `src/lib/theme.ts`. Data is read
through `src/hooks/use-*.ts` (e.g. `use-notices`, `use-activities`, `use-day-content`).

Content tables: `content_items` (typed by `ContentType`), `notices` (with `priority`),
`activities` (calendar events), `media_files`, `categories`. All are public-read.

## The Feast Portal (public) (`src/components/feast/feast-module.tsx`)

A self-contained client **screen state machine** entered from the home `FeastPortalCard`.
`FeastModule` swaps between screens — `landing → details → register → success`, plus
`results`, `leaderboard`, `participants`, `registrations`, `edit-registration` — each lazy
-loaded via `next/dynamic`, with its own `FeastNav`. Registration calls the
`registerParticipant` server action; results/leaderboard read from the published results
tables. The default feast slug is `literature-feast-2026`.

## Feast management (admin) & the scoring pipeline

Admin feast screens live under `src/app/admin/` and share one data flow:

`feasts` → `feast_competitions` (joins `competitions`, which carry `gender` +
`competition_category_id` → `competition_categories`). People register as `participants`
(`shakha_id`, `house_name`, `registration_number`, `competition_category_id`); each
competition entry is a `participant_registrations` row (with a `participated` boolean for
attendance). Categories: `sub_junior | junior | senior | super_senior | elder`
(`src/lib/competition-categories.ts`, derived from date of birth).

Admin pages by area (see `NAV_SECTIONS` in `src/app/admin/layout.tsx`):

- **M Hub**: `content`, `notices`, `activities` — manage public content.
- **Feast**: `participants` (CRUD), `entries` (browse registrations), `participation`
  (mark attendance, export judging sheet), `results` (enter scores → grade/position/points
  → publish), `standings` (shakha leaderboard).
- **Fest Util**: `users` (admin profiles/roles), `feasts` (CRUD + status), `competitions`
  (master list + gender/category variants).

**Scoring → standings (`src/actions/results.ts`)**: enter scores into `competition_results`;
publishing computes grade/position/points (`src/lib/result-calculator.ts`), writes the
`shakha_point_ledger`, and rebuilds `shakha_feast_standings`. Unpublish reverses it.
Result status lives on `feast_competitions.result_status` (`draft | published`).

## Auth & roles

`src/lib/auth-context.tsx` exposes `useAuth()` (session, profile, `signIn`/`signOut`/`hasRole`).
The admin `layout.tsx` redirects unauthenticated users to `/admin/login`. Users are
`profiles` rows joined to `shakhas`, with `UserRole = admin | me_admin | sa_admin`.

## Conventions

- **Reads** that are public-RLS-safe go through the client `supabase` directly in
  `"use client"` pages/hooks (content, feasts, competitions, registrations, published
  results all have public read).
- **Writes** depend on the table's RLS:
  - Tables with an `auth.role() = 'authenticated'` policy (`feasts`, `competitions`,
    `feast_competitions`, `content_items`, `notices`, `activities`, `media_files`, `scores`,
    `results`, `group_teams`) are written **client-side** by signed-in admins (see
    `src/app/admin/feasts/page.tsx`).
  - Tables **without** an UPDATE policy — notably `participants` and
    `participant_registrations` — must be written through a **server action** using
    `getSupabaseAdmin()` (service role bypasses RLS). See `src/actions/feast.ts`. Return
    `{ error?: string }` and log failures with a `[functionName]` prefix.
- **Supabase nested-relation unwrap**: a joined relation comes back as an object *or* a
  one-element array. Unwrap defensively everywhere: `Array.isArray(x) ? x[0] : x`.
- **Migrations** are plain SQL files in `supabase/`, applied **manually** in the Supabase
  SQL editor. Make them idempotent (`ADD COLUMN IF NOT EXISTS`, `CREATE ... IF NOT EXISTS`);
  after adding one, remind the user to run it.
- **Styling**: utility-first Tailwind plus inline `style={{}}` for the brand palette
  (purple `#6B46FF`/`#A855F7`, deep `#1e1b4b`/`#4C1D95`; pink `#BE185D`/`#EC4899` for the
  Participation area). The public app is themed via `buildTheme`.
- **Responsive rendering**: the public app is phone-only (`max-w-md`). Admin **list** pages
  render twice from the same data — a `hidden sm:block` desktop table and an `sm:hidden`
  mobile card stack. Admin is used primarily on phones, so never ship a desktop-only table.
- See the `admin-page` skill (`.claude/skills/admin-page/`) for scaffolding a new admin screen.

## Git / workflow

Work directly on `main` in this checkout — the user does not want feature branches or git
worktrees unless they explicitly ask. Commit/push only when asked.
