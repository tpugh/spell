# Spell

Spelling practice app for young learners (~6 years old).

**Live app:** https://tpugh.github.io/spell/

## Tech stack (MVP)

- **Framework:** React 19 + Vite
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Storage:** Dexie.js (IndexedDB) behind a storage adapter
- **Audio:** Web Speech API (text-to-speech)
- **Testing:** Vitest (unit/component) + Playwright (E2E)
- **Hosting:** GitHub Pages (static SPA)
- **Container:** Multi-stage Docker (Node 22 Alpine build → `serve` runtime)

## Features (MVP)

- **Word List Management** — Create, edit, and delete spelling word lists
- **Practice Mode** — Listen to a word (TTS), type it, get instant feedback, retry missed words
- **Test Mode** — Take a spelling test with audio prompts, type answers, submit for scoring
- **Results Screen** — Score, stars, missed words list, retry options
- **Local-first** — All data stored in browser (IndexedDB), no account required
- **Kid-friendly UI** — Large tap targets, minimal text, encouraging feedback, audio-first

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
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Biome lint |
| `npm run lint:fix` | Auto-fix lint/format issues |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright UI mode |

## Deployment

### GitHub Pages (primary)

The app is a static SPA, so GitHub Pages serves it directly.

- Workflow: `.github/workflows/pages.yml` — builds with `GITHUB_PAGES=true` and deploys `dist/`
- Base path: project sites live under `/spell/`, so `vite.config.ts` sets `base: '/spell/'` when `GITHUB_PAGES=true` (root `/` otherwise)
- Deep links: the `postbuild` script copies `index.html` to `404.html`, which GitHub Pages serves for client-side routes
- Enable once in **Settings → Pages → Source: GitHub Actions**

Live URL: https://tpugh.github.io/spell/

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
5. **Docker Build** — multi-stage build + container smoke test

`.github/workflows/deploy.yml` builds and pushes the container image to GitHub Container Registry (GHCR).

## Project structure

```
spell/
├── .github/workflows/   # CI, Pages, Deploy pipelines
├── public/              # Static assets (PWA icons)
├── scripts/
│   └── spa-fallback.mjs # dist/index.html -> dist/404.html
├── src/
│   ├── App.tsx          # Root component (view routing)
│   ├── main.tsx         # Entry point
│   ├── index.css        # Tailwind imports
│   ├── types.ts         # Domain types
│   ├── db.ts            # Dexie (IndexedDB) + storage adapter
│   ├── useWordLists.ts  # Word list CRUD hook
│   ├── HomeView.tsx     # Home screen
│   ├── WordListManager.tsx  # Create/edit/delete word lists
│   ├── PracticeView.tsx # Practice mode (TTS + feedback)
│   ├── TestView.tsx     # Test mode (scored)
│   ├── ResultsView.tsx  # Results + missed words
│   ├── hooks/
│   │   └── useTTS.ts    # Web Speech API hook
│   ├── test/setup.ts    # Test setup
│   └── App.test.tsx     # Unit tests
├── e2e/                 # Playwright E2E tests
├── Dockerfile           # Multi-stage container build (serve runtime)
├── vite.config.ts       # Vite + PWA + Tailwind (+ Pages base path)
├── vitest.config.ts     # Unit test config
├── playwright.config.ts # E2E config
├── tsconfig.json        # TypeScript config
└── biome.json           # Lint/format config
```

## License

MIT
