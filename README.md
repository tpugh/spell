# Spell

Spelling practice app for young learners (~6 years old).

**Live app:** https://tpugh.github.io/spell/ · **Chrome extension:** `spell-chrome-extension.zip` on the [v0.0.1 release](https://github.com/tpugh/spell/releases/tag/v0.0.1)

## Tech stack (MVP)

- **Framework:** React 19 + Vite
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Storage:** Dexie.js (IndexedDB) on the web, `chrome.storage.local` in the extension — both behind the `StorageAdapter` interface
- **Audio:** Web Speech API (text-to-speech)
- **Testing:** Vitest (unit/component) + Playwright (E2E)
- **Hosting:** GitHub Pages (static SPA)
- **Container:** Multi-stage Docker (Node 22 Alpine build → `serve` runtime)

## Features (MVP)

- **Word List Management** — Create, edit, and delete spelling word lists
- **Practice Mode** — Listen to a word (TTS), type it, get instant feedback, retry missed words
- **Test Mode** — Take a spelling test with audio prompts, type answers, submit for scoring
- **Results Screen** — Score, stars, missed words list, retry options
- **Stars & streaks** — Every finished session earns stars; consecutive practice days build a streak, with no penalties for mistakes
- **Word of the day** — One word picked from the saved lists each day, with a play button
- **Backup & restore** — Grown-ups can export a JSON backup and restore it on another browser or in the extension
- **Local-first** — All data stored in browser, no account required
- **Kid-friendly UI** — Large tap targets, minimal text, encouraging feedback, audio-first

## Accessibility

Spell targets WCAG 2.2 AA and is usable with a keyboard, switch access, or a screen reader.

- **Keyboard only** — every flow works with Tab/Enter; a skip link jumps straight to `#main-content`; focus moves to the new screen after each navigation
- **Screen readers** — `main` landmarks, labelled controls, `role="progressbar"` for progress, and persistent `role="status"` live regions so correct/incorrect feedback is announced
- **Easy-read font** — the "Aa" toggle switches to self-hosted Atkinson Hyperlegible with wider letter and word spacing; the choice is remembered in `localStorage` (`spell:fontMode`)
- **Contrast** — text and controls use 700/800-level Tailwind shades (`green-700`, `blue-700`, `purple-700`, `orange-700`, …) to stay at or above 4.5:1
- **Tap targets** — interactive controls are at least 48×48px, with primary actions at 56–64px
- **Motion** — animations collapse under `prefers-reduced-motion: reduce`; focus rings thicken under `prefers-contrast: more`

Automated coverage lives in `e2e/a11y.spec.ts` (skip link, focus management, easy-read persistence, 48px targets) and `src/useFontMode.test.ts`.

## Backup & restore

**Grown-ups: back up & restore** on the home screen opens a parent-facing screen that works the same
in the web app and the extension (Phase 0 of #9).

- **Save a backup** downloads `spell-backup-YYYY-MM-DD.json` with every word list and test result
- **Restore a backup** validates the file first, shows a preview, then either **merges** (current
  lists are kept; for the same list id the newest `updatedAt` wins) or **replaces everything**
- Invalid, foreign, or oversized files are rejected before any data is written
- The format is versioned (`app: "spell"`, `version: 1`) and covered by unit tests in
  `src/storage/backup.test.ts` plus E2E tests in `e2e/backup.spec.ts`

## Motivation (stars, streaks and word of the day)

Gamification is local-only and deliberately low-pressure (issue #4). Rules live in
`src/progress.ts` as pure functions, so they are unit-tested without a browser.

- **Practice stars** — 1 star for finishing, 2 for a clean run where no word needed a retry. A
  mistake never costs a star.
- **Test stars** — 1 star for finishing, plus 1 at 70% and another at 90%. A completed test is never
  worth zero stars, so there is no "failed" state.
- **Streak** — one "practice day" is any day with a finished practice or test. Consecutive days grow
  the streak; a missed day quietly restarts it at 1. Stars are never removed and there is no "you
  lost your streak" message.
- **Home screen** — star total, day streak, and a screen-reader summary in a live region. The
  **word of the day** card picks a stable word from all saved lists and can speak it.
- **Perfect test** — confetti (hidden under `prefers-reduced-motion`) plus spoken praise through the
  Web Speech API. Both are decorative and never block the result.
- **Storage** — `StorageAdapter.getProgress()` / `saveProgress()` on IndexedDB (Dexie v2 `progress`
  table) and `chrome.storage.local` (`spell:progress`). Stars and streaks stay on the device and are
  intentionally not part of the Phase 0 backup file.
- **Coverage** — `src/progress.test.ts` (star rules, streak boundaries, word-of-the-day determinism),
  `src/storage/chromeStorage.test.ts` (adapter round-trip) and `e2e/gamification.spec.ts` (stars,
  streak, mistake handling, perfect-score celebration).

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Typecheck + production build |
| `npm run postbuild` | Copies `dist/index.html` → `dist/404.html` (SPA fallback), runs automatically after `build` |
| `npm run build:extension` | Builds the Manifest V3 extension → `dist-extension/` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Biome lint |
| `npm run lint:fix` | Auto-fix lint/format issues |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright UI mode |

## Chrome extension

The extension is **the same React app and the same `src/` modules** as the web build — no fork. The
only difference is storage: `src/storage/configure.ts` detects `chrome.storage.local` at startup and
swaps the IndexedDB adapter for the chrome adapter from `src/storage/chromeStorage.ts`.

```bash
npm run build:extension
# then: chrome://extensions → Developer mode → Load unpacked → dist-extension/
```

- **Manifest V3**, single `storage` permission, no host permissions, no remote code
- Toolbar button opens the app in a tab (reuses the open tab via `chrome.storage.session`) — a
  dedicated tab rather than a popup or side panel, because the app needs full-size tap targets and
  audio prompts
- `extension.html` at the repo root is the extension entry point; `vite.extension.config.ts` builds
  it with relative asset paths and without the PWA plugin
- `scripts/build-extension.mjs` copies the manifest (injecting the version from `package.json`),
  the background worker, and the icons into `dist-extension/`
- Keyboard, screen reader, and easy-read support are inherited from the web app

**Install from a release:** download `spell-chrome-extension.zip` from the
[v0.0.1 release](https://github.com/tpugh/spell/releases/tag/v0.0.1), unzip it, and load the folder
from `chrome://extensions`.

Store submission copy, permission justifications, and the screenshot checklist live in
[`docs/chrome-web-store/listing.md`](docs/chrome-web-store/listing.md). The privacy policy is
published at https://tpugh.github.io/spell/privacy.html.

## Deployment

### GitHub Pages (primary)

The app is a static SPA, so GitHub Pages serves it directly.

- Workflow: `.github/workflows/pages.yml` — builds with `GITHUB_PAGES=true` and deploys `dist/`
- Base path: project sites live under `/spell/`, so `vite.config.ts` sets `base: '/spell/'` when `GITHUB_PAGES=true` (root `/` otherwise)
- Deep links: the `postbuild` script copies `index.html` to `404.html`, which GitHub Pages serves for client-side routes
- Enable once in **Settings → Pages → Source: GitHub Actions**

Live URL: https://tpugh.github.io/spell/

### Chrome extension release

`.github/workflows/release-extension.yml` (manual dispatch) builds the extension, zips
`dist-extension/` and attaches `spell-chrome-extension.zip` to an existing release tag
(default `v0.0.1`). Run it from **Actions → Release Chrome extension → Run workflow**.

### Docker / self-host

```bash
docker build -t spell .
docker run -p 8080:3000 spell
# open http://localhost:8080
```

### Cloudflare (future release)

A dormant `deploy-web` job in `.github/workflows/deploy.yml` can publish to Cloudflare Pages once
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets exist. See the Cloudflare tracking issue
for the full plan (backend needs, Pages vs Workers, migration steps).

## CI

`.github/workflows/ci.yml` runs in containers on PRs and pushes to `main`:

1. **Lint & Typecheck** — `node:22-alpine`
2. **Unit Tests** — `node:22-alpine` (Vitest + coverage)
3. **Build** — `node:22-alpine` (Vite production build)
4. **E2E Tests** — `mcr.microsoft.com/playwright` (Chromium)
5. **Chrome Extension Build** — `node:22-alpine` (MV3 package + manifest checks)
6. **Docker Build** — multi-stage build + container smoke test

`.github/workflows/deploy.yml` builds and pushes the container image to GitHub Container Registry (GHCR).

## Project structure

```
spell/
├── .github/workflows/   # CI, Pages, Deploy, Release extension
├── public/              # Static assets (PWA icons, privacy.html)
├── scripts/
│   ├── spa-fallback.mjs # dist/index.html -> dist/404.html
│   └── build-extension.mjs  # manifest + background + icons -> dist-extension/
├── extension/
│   ├── manifest.json    # Manifest V3, storage permission only
│   ├── background.js    # toolbar button -> app tab
│   └── icons/           # 16 / 32 / 48 / 128 px
├── extension.html       # Extension entry point (same app as index.html)
├── src/
│   ├── App.tsx          # Root component (view routing, skip link, focus)
│   ├── main.tsx         # Entry point
│   ├── index.css        # Tailwind, focus/reduced-motion/easy-read styles
│   ├── types.ts         # Domain types
│   ├── db.ts            # Dexie + StorageAdapter interface + adapter swap
│   ├── progress.ts      # Star/streak rules + word of the day (pure functions)
│   ├── useProgress.ts   # Loads and saves stars/streak for this device
│   ├── BackupView.tsx   # Parent backup/restore screen
│   ├── storage/
│   │   ├── backup.ts         # JSON backup format, validation, restore
│   │   ├── chromeStorage.ts  # chrome.storage.local adapter
│   │   └── configure.ts      # picks the adapter at startup
│   ├── useWordLists.ts  # Word list CRUD hook
│   ├── useFontMode.ts   # Easy-read font toggle (persisted)
│   ├── HomeView.tsx     # Home screen
│   ├── WordListManager.tsx  # Create/edit/delete word lists
│   ├── PracticeView.tsx # Practice mode (TTS + feedback)
│   ├── TestView.tsx     # Test mode (scored)
│   ├── ResultsView.tsx  # Results + missed words
│   ├── assets/fonts/    # Self-hosted Atkinson Hyperlegible (woff2)
│   ├── hooks/
│   │   └── useTTS.ts    # Web Speech API hook
│   ├── test/setup.ts    # Test setup
│   └── App.test.tsx     # Unit tests
├── e2e/                 # Playwright E2E tests (a11y, backup, gamification)
├── docs/chrome-web-store/listing.md  # Store listing + submission checklist
├── Dockerfile           # Multi-stage container build (serve runtime)
├── vite.config.ts       # Vite + PWA + Tailwind (+ Pages base path)
├── vite.extension.config.ts  # Extension build (relative base, no PWA)
├── vitest.config.ts     # Unit test config
├── playwright.config.ts # E2E config
├── tsconfig.json        # TypeScript config
└── biome.json           # Lint/format config
```

## License

MIT
