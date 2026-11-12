# Spell

Spelling practice app for young learners (target: ~6 years old).

## Tech stack (MVP)

- **Framework:** React 19 + Vite
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **Storage:** Dexie.js (IndexedDB) behind a thin adapter
- **Audio:** Web Speech API
- **Testing:** Vitest (unit/component) + Playwright (E2E)
- **Deploy:** Vercel or Cloudflare Pages
- **Container:** Multi-stage Docker (Node build → nginx)

## Getting started

```bash
npm ci
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Biome lint + format check |
| `npm run lint:fix` | Auto-fix lint/format issues |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright UI mode |

## CI/CD (containerized)

The pipeline lives in `.github/workflows/` and leverages containers:

### CI (`ci.yml`) — runs on PRs and pushes to `main`
1. **Lint & Typecheck** — `node:22-alpine` container
2. **Unit Tests** — `node:22-alpine` container (Vitest + coverage)
3. **Build** — `node:22-alpine` container (Vite production build)
4. **E2E Tests** — `mcr.microsoft.com/playwright` container (Chromium)
5. **Docker Build** — multi-stage build + smoke test (nginx container)

### Deploy (`deploy.yml`) — runs on push to `main`
1. **Build & Push** — Docker image → GitHub Container Registry (GHCR)
2. **Deploy Web** — Cloudflare Pages

### Docker (local)

```bash
docker build -t spell .
docker run -p 8080:80 spell
# open http://localhost:8080
```

## Project structure

```
spell/
├── .github/workflows/   # CI/CD pipelines (containerized)
├── src/
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   ├── index.css        # Tailwind imports
│   ├── test/setup.ts    # Test setup
│   └── App.test.tsx     # Unit tests
├── e2e/                 # Playwright E2E tests
├── Dockerfile           # Multi-stage container build
├── nginx.conf           # SPA nginx config
├── vite.config.ts       # Vite + PWA + Tailwind
├── playwright.config.ts # E2E config
├── tsconfig.json        # TypeScript config
└── biome.json           # Lint/format config
```

## License

MIT
