# PetCare

A personal Pet Care & Medication Tracker. It tracks daily doses, medication courses and supplies, vet visits, and symptoms noticed between visits. One responsive codebase serves desktop and phone, with a sign-in and a Postgres-backed API.

| Screen | Route | Desktop (≥ 768px) | Phone |
| --- | --- | --- | --- |
| Sign in | `/login` | Email + password; optional sign-up | Same |
| Today | `/` | Summary tiles, schedule, upcoming visit, recent symptoms | Dose card, schedule, pet chips |
| Pet profile | `/pets/:petId` | All cards in a grid (incl. vaccines & deworming); edit or delete the pet; sidebar switches pets | Overview / Health / Files tabs |
| Add a pet | `/pets/new` | Form | Form |
| Medications | `/medications` | Table + Add medication form | One card per medicine |
| Vet visits | `/visits` | Log past visits, schedule appointments (with in-app reminders), mark done, edit, delete; filter by pet and type; history list + details panel, file uploads | Upcoming cards; history timeline with expandable details |
| Symptom log | `/log` | Form + History side by side, photo upload | Form, then History |

## Tech stack

| Area | Choice |
| --- | --- |
| Frontend | React 19, TypeScript 7 (strict), Vite 8, Tailwind CSS v4, React Router 8, lucide-react |
| API | Hono 4 (one app under `/api`), Zod 4 validation |
| Auth | Better Auth (email + password, database sessions, rate limiting) |
| Database | PostgreSQL 17 via Drizzle ORM + drizzle-kit migrations (`pg` driver) |
| Files | Storage interface; local disk now, Vercel Blob later |
| Tests | Vitest (unit + API integration), Playwright + axe-core (E2E + accessibility) |
| CI / hosting | GitHub Actions; Vercel (planned), Neon (planned) |

## Getting started

Requires Node.js 20.19+ (developed on 22) and Docker Desktop.

```bash
npm install
cp .env.example .env              # then set BETTER_AUTH_SECRET (command is in the file)
npm run setup                     # start Postgres, run migrations, create the demo account
npx playwright install chromium   # first time only, for E2E tests
npm run dev                       # http://localhost:5173 (app + API on one port)
```

Sign in with the demo account: **demo@petcare.local** / **petcare-demo-2026**. It's seeded with Mochi, Bantay and their sample medicines, visits and symptoms, with dates relative to today.

Postgres runs in Docker on host port **5434**, so it doesn't clash with a local Postgres on 5432 or another project's container on 5433. Data persists in the `petcare-db` volume. `npm run db:down` stops the container; `docker compose down -v` also deletes the data.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server; also serves the API at `/api` |
| `npm run build` | Type-check everything (`tsc -b`) and build the frontend to `dist/` |
| `npm run typecheck` | Type-check frontend, server and tests |
| `npm test` / `test:watch` | Unit tests (no database) |
| `npm run test:api` | API integration tests against the database in `DATABASE_URL` |
| `npm run test:e2e` / `test:e2e:ui` | Playwright E2E + accessibility at desktop and phone sizes |
| `npm run check` | Type-check + unit + API + E2E: run before pushing |
| `npm run setup` | `db:up` + `db:migrate` + `db:seed` |
| `npm run db:up` / `db:down` | Start / stop the Postgres container |
| `npm run db:generate` | Create a migration after changing `server/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Create the demo account (safe to re-run) |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Environment variables

See [.env.example](.env.example). The server validates these at startup and lists any that are missing.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Docker locally; Neon's **pooled** string later) |
| `BETTER_AUTH_SECRET` | At least 32 random characters; signs session cookies |
| `BETTER_AUTH_URL` | Public URL of the app, e.g. `http://localhost:5173` |
| `ALLOW_SIGNUP` | `true` lets new accounts sign up. Set to `false` in production once your account exists. |
| `ENABLE_TEST_ROUTES` | `true` enables `/api/dev/*` for tests. Never in production (also refused when `VERCEL_ENV=production`). |
| `STORAGE_DRIVER` / `UPLOAD_DIR` | `local` + a folder for uploads; `vercel-blob` later |

## Project structure

```
src/                 React app
  components/        Shared UI (AppLayout, Sidebar, BottomTabBar, Card, Button, RequireAuth, ...)
  pages/             One component per route
  state/             AppStateProvider: loads /api/state, saves every change through the API
  lib/               Pure helpers shared with the server (dates, dose logic) + API/auth clients
  data/sample.ts     Sample data builder (relative to a given "today") for seeding
  types/             Domain types: the contract between frontend and API
server/              API (Hono)
  app.ts             The app: middleware, public routes, auth, protected routes
  routes/            data.ts (state, pets, medications, doses, symptoms), files.ts, dev.ts (test-only)
  db/schema.ts       Drizzle schema (Better Auth tables + app tables)
  auth.ts            Better Auth config
  schedule.ts        Builds each day's doses from reminder times
  storage.ts         File storage interface + local driver
  seed.ts            Seeds an account with the sample data
  *.test.ts          API integration tests
api/index.ts         Vercel Function entry (wraps server/app.ts)
drizzle/             SQL migrations (generated; commit them)
tests/               Playwright specs + fixtures.ts
```

## Architecture

- **One API, three ways to run it.** `server/app.ts` is a plain Hono app. In development, a small Vite plugin (`vite.config.ts`) serves it at `/api` inside the dev server, so there's one process and one port. On Vercel, `api/index.ts` wraps it as a Function. In tests, Vitest calls it in-process with `app.request()`.
- **Every row belongs to a user.** All app tables have `user_id`, and every query filters on the signed-in user. Requests for another user's records return 404, so they can't even confirm the record exists. Integration tests check this for every write endpoint.
- **Real dates, in the user's time zone.** The browser sends its local date (`GET /api/state?date=YYYY-MM-DD`). The server creates that day's doses from each active medicine's reminder times, once per medicine per day. A unique index makes this safe when requests run concurrently. "Overdue" is worked out in the browser from the clock and refreshes every 30 seconds. A course's day number comes from its start date.
- **Fast UI, safe saves.** Marking a dose given updates the screen at once and saves in the background; if saving fails, the change is undone and a message explains why. Forms wait for the server and show its error.
- **Authentication.** Better Auth uses httpOnly session cookies stored in Postgres (30-day sessions). Passwords need at least 10 characters. In production, sign-in and sign-up are rate-limited, with the limits stored in the database so they work across serverless instances.
- **Defense in depth.** Secure headers on every response; CSRF origin checks on form and multipart posts; Zod validation of every input (plain-language 400 errors); non-UUID ids return 404 instead of database errors; uploads limited to images/PDF under 4 MB and served with `nosniff`.

### API

All routes are under `/api`. Everything except `health`, `config`, `auth/*` and `dev/*` requires a session.

| Method + path | Purpose |
| --- | --- |
| `GET /health` | Liveness + database check |
| `GET /config` | `{ allowSignup }` for the sign-in page |
| `GET, POST /auth/*` | Better Auth (sign-up, sign-in, sign-out, session) |
| `GET /state?date=` | Everything for the app: pets, medicines, that day's doses, visits, symptoms |
| `POST /pets`, `PATCH /pets/:id` | Add a pet; edit details |
| `DELETE /pets/:id` | Delete a pet with its medicines, doses, visits, symptoms, weights and uploaded files |
| `POST /visits`, `PATCH /visits/:id` | Log a past visit or schedule one (`status: completed \| scheduled`); edit or mark done |
| `DELETE /visits/:id` | Delete a visit and its uploaded files (prescribed medicines stay) |
| `POST /medications` | Add a medicine and create today's doses |
| `POST /medications/:id/refill` | Reset a supply to full |
| `PATCH /doses/:id` `{ given }` | Mark given / not given. Idempotent; adjusts supply once per change. |
| `POST /symptoms` | Log a symptom entry |
| `POST /files` (multipart) | Attach a photo/receipt to a visit or symptom |
| `GET /files/:id` | Download a file (owner only) |
| `POST /dev/demo-session` | Test-only: a fresh seeded user, signed in |

## Testing strategy

| Layer | Tool | Where | Covers |
| --- | --- | --- | --- |
| Unit | Vitest | `src/**/*.test.ts` | Date maths and validation, reminder-time parsing, dose status by clock, course day, refill threshold, schedule building |
| API integration | Vitest + real Postgres | `server/**/*.test.ts` | Auth required; users can't see or change each other's data; validation; daily dose generation (repeated + concurrent calls, course end); supply changes on give/undo; uploads (type, size, CSRF, ownership); visit create/edit/delete; deleting a pet removes all its records and files |
| End-to-end | Playwright | `tests/*.spec.ts` | Every screen at desktop + phone size, including sign-in/sign-up/sign-out, data surviving a reload, and rollback when saving fails |
| Accessibility | axe-core in Playwright | `tests/accessibility.spec.ts` | WCAG 2.1 A/AA on every screen at both sizes, including sign-in and Add a pet |

How the tests stay isolated and deterministic:

- **Each test gets its own user.** The `page` fixture in `tests/fixtures.ts` and `createTestUser()` in `server/test/client.ts` sign up a brand-new account seeded with the sample data. Tests never share state, so they run fully in parallel against one database with no cleanup step.
- **A fixed clock.** E2E tests freeze the browser at Friday Nov 13, 2026, 7:30 PM (`page.clock`), and API tests pass that date explicitly. The 6 PM antibiotic is always overdue and the 9 PM ear drops always due.
- **Elements are found the way a user finds them:** `getByRole`, `getByLabel`, `getByText`, with no test IDs.
- **CI** (`.github/workflows/ci.yml`) runs Postgres as a service, applies the migrations, and fails if `schema.ts` changed without a migration. It then runs every test layer and uploads the Playwright report.

## Moving to Neon, Vercel Blob and Vercel

The code is set up so this is mostly configuration:

1. **Neon:** create a database, set `DATABASE_URL` to the pooled connection string, and run `npm run db:migrate` against it. The Neon–Vercel integration can create a database branch per preview deployment.
2. **Vercel Blob:** implement the `vercel-blob` driver in `server/storage.ts` (`@vercel/blob`). Vercel Functions accept request bodies up to 4.5 MB, so upload from the browser straight to Blob ("client uploads") and have the API record the file. Then set `STORAGE_DRIVER=vercel-blob`.
3. **Vercel:** set the environment variables above with `ALLOW_SIGNUP=false` after creating your account, and **never** set `ENABLE_TEST_ROUTES`. `vercel.json` sends `/api/*` to `api/index.ts` and everything else to the app. That routing hasn't been tested on a real deployment yet, so check `/api/health` and a deep link like `/medications` on the first preview deploy.

## Known limitations

- Not built yet: notifications (appointment reminders show on the Today screen only), editing or deleting medicines, recording weights (the weight card shows an empty state until weights exist), linking a logged visit to medicines in the app (treatment is free text).
- Visits recorded before visit types existed show as type "Other"; edit them to set the right type.
- A course past its last day stops getting doses, but it isn't moved to "Completed" automatically yet.
- Sample placeholder attachments (Photo, Receipt) have no file behind them; uploaded files open in a new tab.
- There's no password reset yet (it needs an email provider).

## Roadmap

1. Deploy: Neon + Vercel Blob driver + first Vercel deploy (see above)
2. Reminders: installable PWA + web push or email, triggered by a scheduler (Vercel Cron runs at most once a day on the Hobby plan, so consider Upstash QStash)
3. Edit and delete medicines; record weights; link visits to prescribed medicines
4. Password reset and email verification (e.g. Resend)
5. Error tracking (Sentry) and scheduled database backups
