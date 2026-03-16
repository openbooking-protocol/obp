# ── Base: install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

# ── Development: hot-reload with Next.js dev server ────────────────────────
FROM base AS development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ── Builder: compile Next.js (standalone output) ───────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# ── Production: minimal standalone image ──────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Copy Next.js standalone server
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Non-root user
RUN addgroup -g 1001 -S obp && adduser -u 1001 -S obp -G obp
USER obp

EXPOSE 3001
CMD ["node", "server.js"]
