# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDeps for prisma generate)
RUN npm ci

# Stage 2: Generate Prisma client
FROM node:20-slim AS build
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY package.json package-lock.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/

WORKDIR /app/packages/api
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
WORKDIR /app

# Stage 3: Production image
FROM node:20-slim AS production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl curl wget && rm -rf /var/lib/apt/lists/*

# Copy everything from deps stage (full node_modules with all workspace deps)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY package.json package-lock.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/

# Overwrite with generated Prisma client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Install tsx globally for runtime TypeScript execution
RUN npm install -g tsx

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["sh", "-c", "cd packages/api && npx prisma db push --accept-data-loss && cd /app && tsx packages/api/src/main.ts"]
