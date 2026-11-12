# ---------------------------------------------------------------------------
# Multi-stage Dockerfile for Spell (React + Vite + TypeScript + Tailwind)
# No nginx — uses `serve` for static file serving with SPA fallback
# ---------------------------------------------------------------------------

# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --ignore-scripts

COPY . .
RUN npm run build

# ---------- Stage 2: Production (serve) ----------
FROM node:22-alpine AS production
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]