# ============================================================
# AgriSense AI — Next.js Client Multi-Stage Production Dockerfile
# ============================================================
# Stage 1: Install dependencies
# Stage 2: Build the Next.js production bundle
# Stage 3: Minimal production runner
# ============================================================

# ── Stage 1: Dependencies ────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy lockfiles first for layer caching
COPY package.json package-lock.json* ./

# Install production + dev dependencies (dev needed for build)
RUN npm ci

# ── Stage 2: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Pull in node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js standalone output mode for Docker
ENV NEXT_TELEMETRY_DISABLED=1

# Build the production bundle
RUN npm run build

# ── Stage 3: Production Runner ───────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only the standalone output and static assets
COPY --from=builder /app/public                        ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

USER nextjs

# ── CMD: Start the Next.js production server ─────────────────
CMD ["node", "server.js"]
