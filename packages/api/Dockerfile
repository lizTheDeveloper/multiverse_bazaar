# Stage 1: Install dependencies (all, including devDeps for build)
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# Stage 2: Generate Prisma client and bundle with esbuild
FROM node:20-slim AS build
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY package.json package-lock.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/

# Generate Prisma client
WORKDIR /app/packages/api
RUN npx prisma generate

# Bundle the API with esbuild
WORKDIR /app
RUN npm install -g esbuild && esbuild packages/api/src/main.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile=dist/server.mjs \
  --external:@prisma/client \
  --external:@prisma/adapter-pg \
  --external:pg \
  --external:pino \
  --external:pino-pretty \
  --external:bcryptjs \
  --external:jsonwebtoken \
  --external:dotenv

# Stage 3: Production image
FROM node:20-slim AS production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl curl wget && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm ci --omit=dev

ENV NODE_ENV=production

# Copy bundled server
COPY --from=build /app/dist/server.mjs ./dist/server.mjs

# Copy Prisma schema and config (needed for prisma db push)
COPY packages/api/prisma/ ./packages/api/prisma/
COPY packages/api/prisma.config.ts ./packages/api/prisma.config.ts

# Copy generated Prisma client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["sh", "-c", "cd packages/api && npx prisma db push --accept-data-loss && cd /app && node dist/server.mjs"]
