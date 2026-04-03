# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# Stage 2: Build static assets
FROM node:20-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
COPY package.json package-lock.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/web/ ./packages/web/

ENV NODE_ENV=production
# Skip tsc type checking, run vite build directly
RUN npx --workspace=web vite build

# Stage 3: Serve with nginx
FROM nginx:alpine AS production

COPY --from=build /app/packages/web/dist /usr/share/nginx/html

# SPA routing: serve index.html for all non-file routes
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location /api/ {\n\
        proxy_pass http://api:3000;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
