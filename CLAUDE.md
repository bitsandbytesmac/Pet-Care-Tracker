# PetCare — Pet Care & Medication Tracker

Personal, responsive web app (desktop + phone, one codebase) for tracking two pets' medications, vet visits and symptoms. The UI follows the design in "Pet Care Tracker UI.pdf" (5 phone screens + 5 desktop screens).

## Commands

- `npm run dev`: Vite dev server on http://localhost:5173 (strictPort)
- `npm run build`: `tsc -b` + Vite build. Run this to type-check.
- `npm test`: Vitest unit tests (`src/**/*.test.ts` only; Vitest must never pick up `tests/`)
- `npm run check`: typecheck + unit + E2E. Run this before calling work done.
- `npm run test:e2e`: Playwright (E2E + axe accessibility), both projects (`desktop` 1440×900, `mobile` Pixel 7). Starts the dev server itself, or reuses one that is already running.
- `npm run test:e2e:ui`: Playwright UI mode
- `npx playwright test tests/today.spec.ts --project=mobile`: run one file or one project

## Stack

React 19 + Vite 8 + TypeScript 7 (strict, `noUncheckedIndexedAccess`), Tailwind CSS v4 (via `@tailwindcss/vite`), React Router 8 (`react-router` package), lucide-react icons, Playwright.

## Layout

- `src/index.css`: the only CSS file. Tailwind import, `@theme` design tokens, a few base styles.
- `src/types/`: data models (Pet, Medication, Dose, Visit, SymptomEntry).
- `src/data/sample.ts`: seed data plus `SAMPLE_TODAY` (2026-11-13). The app's "today" is fixed to that date so screens and tests are deterministic.
- `src/state/`: `AppStateProvider` (useState, in memory) and `useAppState()`. All mutations go through it, so a backend can replace it later. A full page reload resets the state.
- `src/lib/`: pure helpers: `format.ts` (dates/times, always UTC), `meds.ts` (dose status, refill, progress, next dose), `petTheme.ts`, `cx.ts`, `useMediaQuery.ts`.
- `src/components/`: shared UI (AppLayout, Sidebar, BottomTabBar, Card/SectionCard, Button/ButtonLink/TextLink, PetAvatar/PetPill, StatusPill/SeverityPill, SegmentedControl, FilterPills, ProgressBar, SectionHeader, Field, AddMedicationForm, UpcomingVisitCard).
- `src/pages/`: one file per route: `/` Today, `/pets/:petId`, `/medications`, `/visits`, `/log`. Subcomponents used by only one screen stay in that page file.
- `tests/`: one Playwright spec per screen plus `navigation.spec.ts`.

## Styling rules

- Tailwind classes only. No inline `style` objects and no extra CSS files. Dynamic widths and heights use native `<progress>` or SVG attributes instead.
- Tailwind's default palette is cleared (`--color-*: initial`). Only the tokens in `@theme` exist (`bg-surface`, `text-ink`, `bg-primary`, `text-warn`, `bg-pet-peach`, ...) plus `white`.
- Build class names from full literal strings, never concatenated fragments. Per-pet colors live in `lib/petTheme.ts` for that reason.
- **Display conflicts:** two display utilities on one element (e.g. a base `inline-flex` plus a caller's `hidden md:inline-flex`) conflict, and CSS order picks the winner, not class order. Components that set a default display use `display('inline-flex', className)` from `lib/cx.ts`, which drops the default when the caller passes a display class. Keep doing this for new components.
- Breakpoint is `md` (768px): sidebar at md and up, bottom tab bar + floating "+" below md. When a screen's markup differs structurally between sizes (Medications table vs cards, Visits list+details vs timeline, Pet profile grid vs tabs), render only one variant using `useIsDesktop()`. Don't render both and hide one with CSS: duplicate text breaks Playwright strict locators.
- No gradients, no emoji, light shadows only. Icons use `strokeWidth={2}` and `aria-hidden`.

## Accessibility conventions

- Toggles and filters are `<button aria-pressed>`. Phone profile tabs use `role="tab"` with `aria-selected`. Active nav links get `aria-current="page"`.
- Touch targets are at least `h-11`. Icon-only buttons have an `aria-label`.
- Cards with headings are `<section aria-labelledby>`, so tests can find them with `getByRole('region', { name })`.
- Form confirmations use `role="status"` and errors use `role="alert"`.

## Testing conventions

- New pure logic goes in `src/lib/` with a co-located `*.test.ts`. New UI flows get a Playwright spec. New screens get an entry in `tests/accessibility.spec.ts`.
- `tests/accessibility.spec.ts` must stay at zero axe violations. Fix the markup; don't disable rules.
- Deployment: Vercel (`vercel.json` rewrites everything except `/api/*` to `index.html`). CI: `.github/workflows/ci.yml`.

- Use `getByRole`, `getByLabel` and `getByText`. Avoid `data-testid`.
- Every test runs in both projects. Use `isMobile` to branch, or `test.skip` for desktop-only or phone-only UI.
- To keep in-memory state across screens, navigate by clicking links, not `page.goto`.
- Responsive text that exists twice (e.g. the schedule status as a phone label and as a desktop pill): filter with `.filter({ visible: true })`.

## Not implemented yet (placeholder buttons)

Add a pet, Add visit, Reschedule, Add questions for the vet, the notification bell. There is no persistence or backend yet. Age, weight, clinic, vaccine date and food are placeholders (`[AGE]` etc.) that the user fills in through Edit profile.
