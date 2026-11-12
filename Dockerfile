# ---------------------------------------------------------------------------
# Multi-stage Dockerfile for Spell (React + Vite + TypeScript + Tailwind)
# ---------------------------------------------------------------------------

# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# ---------- Stage 2: Production (nginx) ----------
FROM nginx:1.27-alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback config (client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]