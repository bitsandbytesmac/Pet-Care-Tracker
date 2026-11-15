# PetCare — Pet Care & Medication Tracker

Personal, responsive web app (desktop + phone, one codebase) for tracking pets' medications, vet visits and symptoms, with sign-in and a Postgres-backed API. The UI follows "Pet Care Tracker UI.pdf". The README covers setup, architecture and the API; this file holds the rules for working in the code.

## Commands

- `npm run setup`: start Postgres (Docker, host port **5434**), migrate, seed `demo@petcare.local` / `petcare-demo-2026`
- `npm run dev`: app + API on http://localhost:5173 (a Vite plugin serves `server/app.ts` at `/api`)
- `npm run check`: typecheck + unit + API + E2E. Run this before calling work done. Needs the database up (`npm run db:up`).
- `npm test`: unit tests only (`src/**/*.test.ts`, no database)
- `npm run test:api`: API integration tests (`server/**/*.test.ts`, real Postgres)
- `npm run test:e2e`: Playwright (E2E + axe), `desktop` and `mobile` projects
- `npm run db:generate` after any change to `server/db/schema.ts`, then `npm run db:migrate`. Commit the generated SQL in `drizzle/`. CI fails if the schema and migrations disagree.

## Stack

React 19, Vite 8, TypeScript 7 (strict, `noUncheckedIndexedAccess`), Tailwind v4, React Router 8 (`react-router`), lucide-react · Hono 4, Zod 4, Better Auth 1.7, Drizzle ORM + `pg`, Postgres 17 · Vitest 5, Playwright + `@axe-core/playwright`.

## Layout

- `src/types/index.ts`: the contract shared by app and API. Change it first, then both sides.
- `src/lib/`: pure, shared logic (`format.ts` dates/times, `meds.ts` dose status/course day/refill). The server imports from here too, so keep it free of browser-only code. `api.ts` and `authClient.ts` are browser-only.
- `src/state/AppStateProvider.tsx`: the only place the app talks to the data API. Pages call `useAppState()`.
- `server/app.ts` → `routes/data.ts`, `routes/files.ts`, `routes/dev.ts` (test-only). `server/http.ts` has `parse()`, `pathId()`, `requireUser`.
- `server/db/schema.ts`: Better Auth tables (field names must match Better Auth's core schema) + app tables.
- `api/index.ts`: Vercel entry. Not yet tested on a real deployment.

## Server rules

- **Every query on app tables filters by `userId`.** Another user's id is a 404, not a 403. Add an isolation assertion to `server/api.test.ts` for each new write endpoint.
- Validate every input with Zod through `parse()`. Path ids go through `pathId()`, which turns non-UUIDs into a 404.
- Dates are `YYYY-MM-DD` strings in the user's local calendar, sent by the client. Never use the server clock for "today".
- Daily doses are created by `ensureDosesForDate()`, once per medicine per day. Don't write doses elsewhere except when seeding.
- Never commit `.env`. Test routes must stay behind `testRoutesEnabled()`.
- File storage only through `getStorage()`. The Vercel Blob driver is a TODO in `server/storage.ts`.
- `files` rows have no foreign key (they point at a visit or a symptom). Any route that deletes a visit, symptom or pet must delete their `files` rows and stored objects too (see `removeStoredFiles` in `routes/data.ts`).
- Visits: `status` is `scheduled` or `completed`; "overdue" and "upcoming" are derived from the client's today in `src/lib/visits.ts`. The `visits.diagnosis` field lives in the original `summary` column.

## Styling rules

- Tailwind classes only: no inline `style` objects, no extra CSS files. Dynamic sizes use `<progress>` or SVG attributes.
- Only the `@theme` tokens in `src/index.css` exist (default palette cleared) plus `white`. Build class names from full literal strings (see `lib/petTheme.ts`).
- **Display conflicts:** components with a default display use `display('inline-flex', className)` from `lib/cx.ts`, so a caller's `hidden md:inline-flex` wins.
- Breakpoint is `md`. If markup differs structurally between sizes, render one variant with `useIsDesktop()`. Don't render both and hide one with CSS (it breaks strict Playwright locators).
- No gradients, no emoji, light shadows only. Icons: `strokeWidth={2}`, `aria-hidden`.
- Reuse the shared patterns instead of restyling: `PageHeader` for every page title, `FormError`/`FormStatus` (in `Field.tsx`) for form feedback, `chipClasses`/`optionClasses` (`components/choice.ts`) for toggle chips and option cards. Radii: cards and standalone tiles `rounded-2xl`, controls and items inside cards `rounded-xl`, pills `rounded-full`.
- Don't ship controls that do nothing. Leave unbuilt features out of the UI until they work.
- Destructive actions live inside the item's edit form (`danger-outline` button) and always go through `ConfirmDialog`, which says exactly what will be removed.

## Accessibility conventions

`aria-pressed` toggles; `role="tab"` + `aria-selected` tabs; `aria-current="page"` nav; touch targets at least `h-11`; `aria-label` on icon-only buttons; card sections are `<section aria-labelledby>`; `role="status"` for confirmations, `role="alert"` for errors. `tests/accessibility.spec.ts` must stay at zero violations. Add new screens to it.

## Testing conventions

- E2E: import `test`/`expect` from `tests/fixtures.ts`. `page` is signed in as a fresh seeded user, with the clock frozen at 2026-11-13 19:30. Use plain `@playwright/test` only for signed-out flows (`auth.spec.ts`).
- API: `createTestUser()` from `server/test/client.ts`. Each test makes its own user; there's no shared state and no cleanup.
- Locate elements with `getByRole`/`getByLabel`/`getByText`; no test IDs. Branch on `isMobile` or `test.skip` for size-only UI.
- Pet ids are UUIDs. Navigate with `/pets` (redirects to the first pet) or by clicking.
- Prove data persists: after a change, `page.reload()` and assert again.

## Not implemented yet

Notifications (visit reminders are in-app only, on Today), editing or deleting medicines, recording weights, linking visits to medicines from the visit form, automatically completing finished courses, password reset, the Vercel Blob driver.
