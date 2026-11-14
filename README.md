# PetCare

A personal Pet Care & Medication Tracker. It keeps track of daily doses, medication courses and supplies, vet visits, and symptoms noticed between visits. One responsive codebase serves both desktop and phone.

| Screen | Route | Desktop (≥ 768px) | Phone |
| --- | --- | --- | --- |
| Today | `/` | Summary tiles, schedule, upcoming visit, recent symptoms | Dose card, schedule, pet chips |
| Pet profile | `/pets/:petId` | All cards in a grid; sidebar switches pets | Overview / Health / Files tabs |
| Medications | `/medications` | Table + Add medication form | One card per medicine |
| Vet visits | `/visits` | Visit list + details panel | Vertical timeline |
| Log a symptom | `/log` | Form + History side by side | Form, then History |

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript 7 (strict, `noUncheckedIndexedAccess`) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4; design tokens in `@theme` |
| Routing | React Router 8 (`react-router`) |
| Icons | lucide-react |
| State | React context + `useState` (in memory; no backend yet) |
| Unit tests | Vitest |
| E2E + a11y tests | Playwright (desktop and mobile projects) + axe-core |
| CI / hosting | GitHub Actions; Vercel |

## Getting started

Requires Node.js 20.19+ (developed on Node 22).

```bash
npm install
npx playwright install chromium   # first time only, for the E2E tests
npm run dev                        # http://localhost:5173
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |
| `npm test` | Run the Vitest unit tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Run every Playwright test (E2E + accessibility) at both screen sizes |
| `npm run test:e2e:ui` | Open Playwright UI mode for debugging |
| `npm run check` | Type-check + unit tests + E2E: run before pushing |

## Project structure

```
src/
  components/   Shared UI: AppLayout, Sidebar, BottomTabBar, Card, Button, PetAvatar,
                StatusPill, SegmentedControl, FilterPills, ProgressBar, SectionHeader, ...
  pages/        One component per route (screen-only subcomponents live in the same file)
  state/        AppStateProvider + useAppState(): the only place data changes
  data/         sample.ts: seed data and SAMPLE_TODAY
  lib/          Pure helpers: date/time formatting, dose/refill logic, class helpers
  types/        Domain models: Pet, Medication, Dose, Visit, SymptomEntry
  index.css     Tailwind entry + design tokens (the only CSS file)
tests/          Playwright specs, one per screen + navigation
```

## Architecture notes

- **One data layer.** Every mutation goes through `useAppState()`: `toggleDose`, `addMedication`, `markRefilled`, `addSymptom`, `updatePet`, `addAttachment`. Adding a backend means changing `src/state/AppStateProvider.tsx`; pages and components stay the same.
- **Fixed "today".** The app treats **Friday, Nov 13, 2026** (`SAMPLE_TODAY`) as today, so the UI and tests always see the same state. A dose's `overdue` flag comes from the sample data; it isn't calculated from the clock yet.
- **Derived values aren't stored.** Dose status, refill alerts (7 days of supply or less), course progress and the next-dose label are all calculated in `src/lib/meds.ts`.
- **Layout by screen size.** `md` (768px) is the only layout breakpoint. Small differences use Tailwind responsive classes. Screens whose structure changes (table vs cards, list + details vs timeline, grid vs tabs) render only one version, chosen with `useIsDesktop()`.

## Design system

Tokens are defined in `src/index.css`, and Tailwind's default palette is turned off, so only these colors exist:

| Token | Use |
| --- | --- |
| `bg`, `surface`, `line`, `divider` | Page background, cards, borders |
| `ink`, `ink-soft`, `ink-muted` | Text |
| `primary`, `primary-dark`, `primary-tint` | Actions, "Given", active nav |
| `warn`, `warn-dark`, `warn-tint`, `warn-line`, `warn-dot` | Overdue, refill, moderate severity |
| `severe`, `severe-tint` | Severe symptoms, errors |
| `feature`, `feature-label` | Dark "upcoming visit" cards |
| `pet-peach(-ink)`, `pet-mint(-ink)` | Mochi and Bantay |

Font: Plus Jakarta Sans. Styling rules: Tailwind classes only (no inline style objects), no gradients, no emoji, light shadows only.

## Accessibility

- Real `<button>`, `<a>`, `<label>` and `<input>` elements, plus a "Skip to content" link
- Touch targets of at least 44px (`h-11`); `aria-label` on icon-only buttons
- `aria-pressed` on toggles and filters, `role="tab"` + `aria-selected` on profile tabs, `aria-current="page"` on the active nav link
- Card sections are `<section aria-labelledby>` landmarks; saved messages use `role="status"` and errors use `role="alert"`
- Text colors chosen for at least 4.5:1 contrast

## Testing strategy

Three layers, from fastest to slowest:

| Layer | Tool | Where | Covers |
| --- | --- | --- | --- |
| Unit | Vitest | `src/**/*.test.ts` | Pure logic in `src/lib/`: date and time formatting, reminder-time parsing, dose status, refill threshold, progress, next-dose labels, schedule building |
| End-to-end | Playwright | `tests/*.spec.ts` | User flows on every screen, at desktop and phone sizes |
| Accessibility | axe-core in Playwright | `tests/accessibility.spec.ts` | WCAG 2.1 A/AA checks on all five screens at both sizes |

Playwright runs every spec in two projects:

| Project | Device |
| --- | --- |
| `desktop` | Desktop Chrome, 1440×900 |
| `mobile` | Pixel 7 |

| Spec | Covers |
| --- | --- |
| `navigation.spec.ts` | Sidebar vs tab bar per size; every link opens its screen with `aria-current="page"` |
| `today.spec.ts` | 2/4 → 3/4 when the overdue antibiotic is given; Overdue pill and strike-through; Undo; progress bar |
| `medications.spec.ts` | Active/Completed toggle; refill alert and "Mark as refilled"; a new medication appears in the list and on Today |
| `visits.spec.ts` | Upcoming card; pet filter; details panel updates (desktop) |
| `log.spec.ts` | Save → confirmation → new entry first in History; validation when no symptom is picked |
| `pet-profile.spec.ts` | Switching pets changes name, banner and medications; edit profile; phone tabs |
| `accessibility.spec.ts` | No axe violations (WCAG 2.1 A/AA) on any screen |

Conventions:

- Locate elements the way a user would: `getByRole`, `getByLabel`, `getByText`. Don't use `data-testid`.
- Branch on `isMobile` for size-specific flows, or use `test.skip` for UI that exists at only one size.
- State lives in memory, so move between screens by clicking links (`page.goto` reloads and resets the data).
- `webServer` starts Vite automatically and reuses a dev server that's already running locally. On CI (`CI=true`) tests retry twice, `test.only` fails the run, and an HTML report is written to `playwright-report/`.
- Unit tests cover edge cases (noon and midnight, invalid times, the refill boundary at exactly 7 days, year rollover) that would take many slow browser tests to reach.

## CI and deployment

- **CI** (`.github/workflows/ci.yml`) runs on every push to `main` and on every pull request: type-check → unit tests → build → Playwright (E2E + accessibility, both screen sizes). The Playwright report is uploaded as a build artifact.
- **Vercel** (`vercel.json`): Vite preset, output in `dist/`. Every path except `/api/*` is rewritten to `index.html`, so reloading or sharing a link like `/pets/mochi` doesn't return a 404. `/api/*` is kept free for future serverless functions.
- Recommended setup: connect the GitHub repo to Vercel and require the CI check to pass before merging to `main`.

## Known limitations

- No persistence: reloading the page restores the sample data.
- These buttons do nothing yet: Add a pet, Add visit, Reschedule, Add questions for the vet, notifications.
- Age, weight, clinic, vaccine date and food are placeholders until you fill them in with **Edit profile**.
- Weight trend shows placeholder bars until weights are recorded.

## Roadmap

1. Authentication: the app holds health data and will have a public URL
2. Backend: Vercel Functions under `/api`, Neon Postgres (Drizzle ORM + migrations), Vercel Blob for photos and receipts
3. Real dates: clock-based overdue status, time zones, doses generated from reminder times each day
4. Add pet / add visit / reschedule flows
5. Reminders: installable PWA + web push, or email, triggered by Vercel Cron
6. Integration tests for the API against a Neon branch database

Done: Vitest unit tests, axe accessibility checks, CI pipeline, Vercel SPA config.
