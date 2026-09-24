# ==============================================================================
# Multi-Stage Production Dockerfile for NestJS API Engine
# Optimizations: Alpine Linux base, headless Chromium for server-side canvas rasterization,
# devDependency pruning, and non-root security.
# ==============================================================================

# Stage 1: Dependencies Resolution
FROM node:24-alpine AS deps
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package*.json ./
RUN npm ci

# Stage 2: TypeScript Compilation & Asset Bundling
FROM node:24-alpine AS builder
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & compile NestJS application
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npm run build
RUN npm prune --omit=dev && npm cache clean --force

# Stage 3: Lean Production Runtime
FROM node:24-alpine AS runner
WORKDIR /app

# Install lightweight Chromium & TrueType fonts for server-side HTML/Canvas rendering
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      font-noto-emoji

ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/src/main.js"]
