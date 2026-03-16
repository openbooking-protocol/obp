# ── Base: install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

# ── Development: hot-reload with tsx watch ─────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Builder: compile TypeScript ────────────────────────────────────────────
FROM base AS builder
COPY . .
RUN npm run build

# ── Production: minimal image ──────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S obp && adduser -u 1001 -S obp -G obp
USER obp

EXPOSE 3000
CMD ["node", "dist/index.js"]
