#syntax=docker/dockerfile:1.4
FROM node:18-alpine AS base

FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --link package.json package-lock.json* ./
RUN npm ci


FROM base AS builder
WORKDIR /app
COPY --from=deps --link /app/node_modules ./node_modules
COPY --link  . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV production

ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  addgroup --system --gid 1001 nodejs; \
  adduser --system --uid 1001 nextjs

RUN chown 1001:1001 .

COPY --from=builder --link /app/public ./public
COPY --from=builder --link --chown=1001:1001 /app/package.json ./package.json
COPY --from=builder --link --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --link --chown=1001:1001 /app/.next/static ./.next/static

COPY --chown=1001:1001 prisma/schema.prisma ./prisma/
COPY --chown=1001:1001 prisma/seed.js ./prisma/
COPY --chown=1001:1001 docker-start.sh ./

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME localhost

ENV NEXTAUTH_URL http://localhost:3000/api/auth

ENV DATABASE_URL mysql://root:root@localhost:3306/timetrack

CMD ["./docker-start.sh"]