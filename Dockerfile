FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ---- dependencies -----------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- build --------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN npx prisma generate
# Prisma Client validates DATABASE_URL at import time, which Next.js's build
# step triggers while collecting page data. The real value is supplied at
# container start (docker-compose env_file); this placeholder only lets the
# build complete without a live database.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

# ---- runtime ------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Full node_modules (kept, not the trimmed standalone copy) so the Prisma
# CLI is available at startup to run migrations, not just @prisma/client.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["./docker/entrypoint.sh"]
