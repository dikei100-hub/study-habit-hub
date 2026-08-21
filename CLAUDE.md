# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun install          # bun.lock is the committed lockfile (see bunfig.toml)
bun run dev          # vite dev
bun run build        # vite build (nitro, cloudflare target)
bun run preview
bun run lint         # eslint . — Prettier runs as an ESLint rule, so lint fails on formatting
bun run format       # prettier --write .
```

There is no test tooling in this project — no vitest/jest, no test script, no test files. Don't invent test commands; verify changes by running the dev server.

Type checking has no dedicated script. `tsc --noEmit` works (tsconfig sets `noEmit`), but note the strict flags below.

## Lovable leftovers (the sync is disconnected)

This project started on Lovable. The connection is gone — `.lovable/` and `AGENTS.md` were removed, and `main` no longer syncs anywhere. Work on `main` normally.

What still genuinely depends on Lovable packages — **do not rip these out casually**:

- `vite.config.ts` is built entirely on `@lovable.dev/vite-tanstack-config`, which supplies tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, the `@` alias, and dedupe config. Removing it means rewriting the whole Vite config by hand.
- `src/lib/lovable-error-reporting.ts` (used by `__root.tsx`) posts client errors to a `window.__lovableEvents` hook. It's a no-op outside the Lovable editor, so it's harmless but dead.
- `__root.tsx` still sets `twitter:site` to `@Lovable`.

`bunfig.toml` sets a 24-hour `minimumReleaseAge` supply-chain guard on installs. Confirm with the user before adding anything to `minimumReleaseAgeExcludes`.

## Architecture

TanStack Start (SSR) + React 19 + TanStack Router file-based routing + Tailwind v4 + shadcn/ui. **No backend, no database, no auth** — all state lives in `localStorage`.

### Entry points and the SSR error path

`src/server.ts` is the SSR entry (wired via `vite.config.ts` → `tanstackStart.server.entry`). It exists because **h3 swallows in-handler throws into a generic `{"unhandled":true,"message":"HTTPError"}` 500 with no stack** — `try/catch` alone never fires. So:

- `src/lib/error-capture.ts` records the original error out-of-band (with cause chain).
- `src/server.ts` detects the swallowed-500 shape and recovers the real error for logging, then serves `src/lib/error-page.ts`.
- `src/start.ts` registers the server error middleware **and** re-adds `createCsrfMiddleware` — Start installs CSRF automatically only when `src/start.ts` is absent, so defining the file opts out and it must be restored explicitly.
- `src/lib/lovable-error-reporting.ts` forwards client errors to the Lovable editor.

Treat this whole cluster as infrastructure; app features rarely need to touch it.

### The one source of truth: `src/state/StudyStore.tsx`

Context + `useReducer`, mounted in `__root.tsx` inside `QueryClientProvider`. All app state and every derived number flows through it. TanStack Query is installed and wired but currently unused (there's no server to query).

Two persisted collections:

- `templates` — the reusable "매일 하기" list (`id, title, enabled, sortOrder`)
- `todosByDate` — `"YYYY-MM-DD"` → that day's `Task[]`

Key invariants:

- **Todo IDs are derived, not random**: a todo generated from a template has id `` `${date}-${templateId}` `` (`todoIdFor` in `seed.ts`). Toggling a template on/off finds that day's todo by reconstructing this id. Don't change the format without updating both sides.
- **Time-based write permissions**: `canToggle(date)` = today only; `canManage(date)` = today or later. Past days are read-only. Every mutator re-checks these before dispatching — UI hiding a button is not the enforcement point.
- `fillFromTemplate` (via the `ensureDate` action) lazily materializes a day's todos from enabled templates, but only if that day is currently empty. Routes call `ensureDate` in an effect on mount / on date change.
- `streak.current` counts back from today over 100%-complete days; `best` scans all recorded dates for the longest consecutive run.

### The 4am day boundary — `src/lib/studyDay.ts`

A "study day" starts at **4:00 AM**, not midnight. `DAY_START_HOUR` and every date-key operation (`getStudyDate`, `addDays`, `weekKeys`, `monthKeys`) are deliberately confined to this file. Never compute date keys inline with `new Date()` elsewhere — go through these helpers or the 4am rule silently breaks.

### Persistence — `src/lib/storage.ts`

localStorage key `studymate.state.v1`. Reads validate the parsed shape and fall back to seed data on anything unexpected; writes swallow quota errors. Both paths guard `typeof window === "undefined"` because this app is server-rendered. If you change `PersistedState`, bump the key or extend `isValid`/`normalizeTemplates` — old payloads are otherwise silently discarded.

### mockData is half-live

`src/mockData.ts` is no longer pure mock. `seed.ts` derives real initial state from `monthRecords`, `calendarMonth`, and `todayTasks`, so **editing those changes what a fresh user sees**. `badges`/`trophies` are read directly by the rewards route. The remaining exports (`streak`, `last7Days`, the numeric fields of `weekSummary`/`monthSummary`) are dead — superseded by store-computed values — except `weekSummary.diff` and `monthSummary.label`, which the stats route still renders.

### Routes and components

`src/routes/` is file-based routing (see `src/routes/README.md` for the conventions table). `routeTree.gen.ts` is generated — never hand-edit. Four routes match the four bottom tabs: `/` (today), `/stats`, `/calendar`, `/rewards`.

`src/components/app/` holds the four components this app actually uses — `Screen` (mobile frame + `Card` + `MascotSlot`), `TabBar`, `Ring`, `ListSheet`.

`src/components/ui/` is the stock shadcn/ui install (~49 files). **None of it is used by any screen.** The UI is hand-built from `components/app/` primitives plus raw Tailwind. Prefer extending `components/app/` over reaching into `components/ui/` — introducing shadcn components into a screen would break the visual system described below.

## Design constraints (from README.md — the original product spec)

These are product requirements, not preferences:

- **Mobile-only.** 420px max content width, centered. Bottom fixed tab bar (오늘 / 통계 / 캘린더 / 보상). Settings is a gear icon at each screen's top-right, never a tab.
- **iOS home-screen webapp.** `viewport-fit=cover`, `env(safe-area-inset-top)` on content, `env(safe-area-inset-bottom)` on the tab bar. Body scrolls; tab bar stays fixed.
- **All colors live in `src/styles.css`** as oklch CSS variables registered in `@theme inline`. Never write a color literal in a component. App-specific tokens: `lilac / sky / lemon / blush / purple / purple-soft / task-green / task-sky / task-peach / check / up / shadow-soft`.
- **No chart library.** Bars and rings are hand-built with divs or inline SVG (`Ring.tsx`, `DayRing` in `calendar.tsx`) even though recharts is in `package.json`.
- **Icons: lucide-react only.**
- Cards ~20px radius, very soft shadow, no border. Large type, generous spacing, low density. Numbers big and bold, captions small and faint.
- Copy tone is **encouraging, not managerial** — e.g. "오늘 목표 달성! 🎉 / 정말 최고예요, 오늘 하루 수고했어요 💜". Emoji used sparingly. UI text is Korean.
- **Mascot and badges stay as gray circular placeholders** (`MascotSlot`). Do not draw them, and do not substitute emoji or generated images.
- Do not add: login, signup, onboarding, push notifications, screen transition animations, Supabase.

## TypeScript notes

`tsconfig.json` is unusually strict beyond `strict: true` — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. Array indexing yields `T | undefined`, so existing code uses `!` or `??` at index sites; expect the same friction in new code. Import alias `@/*` → `./src/*`.

ESLint bans importing `server-only` (a Next.js package); use `*.server.ts` naming or `@tanstack/react-start/server-only` instead.

## Known incomplete work

Don't mistake these for bugs to fix incidentally — flag them, and fix only if asked:

- Calendar month arrows (`◀ ▶`) render but have no handlers; only the current month is ever shown.
- The rewards route is fully static — badges/trophies aren't connected to real achievement data.
- The stats route's "▲ 이전 7일보다 73%" is hardcoded `weekSummary.diff`, not computed.
- The settings gear and "내 컬렉션 모두 보기" buttons have no destinations.
