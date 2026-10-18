# ==========================================
# WatsStore SaaS - Frontend Production Dockerfile
# Runtime: Node.js 20 Alpine (Next.js 14 App Router)
# ==========================================

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies required by node-gyp or Alpine if needed
RUN apk add --no-cache libc6-compat

# ------------------------------------------
# Stage 1: Install Dependencies
# ------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------
# Stage 2: Build Application
# ------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept Build-Time Argument for Next.js public environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ------------------------------------------
# Stage 3: Production Runner
# ------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system user for secure container execution
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy runtime assets and dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
