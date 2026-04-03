# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Copy workspace root package files
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDependencies for tsx/prisma)
RUN npm ci

# Stage 2: Generate Prisma client
FROM node:20-slim AS prepare
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY package.json package-lock.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/

# Generate Prisma client (run from packages/api where prisma.config.ts lives)
WORKDIR /app/packages/api
RUN npx prisma generate
WORKDIR /app

# Stage 3: Production image (uses tsx to run TypeScript directly)
FROM node:20-slim AS production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl curl wget && rm -rf /var/lib/apt/lists/*

# Copy full workspace (tsx runs TS source directly, no build step needed)
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies
RUN npm ci --omit=dev && npm install -g tsx

ENV NODE_ENV=production

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/

# Copy generated Prisma client
COPY --from=prepare /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prepare /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

# Run migrations then start the server using tsx
# Run from packages/api dir so prisma.config.ts is found
CMD ["sh", "-c", "cd packages/api && npx prisma db push --accept-data-loss && cd /app && tsx packages/api/src/main.ts"]
