FROM node:current-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl mysql-client mariadb-connector-c

RUN npm install -g npm@latest

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/docker-start.sh ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.js ./prisma/

RUN mkdir /backups && chown nextjs:nodejs /backups

USER nextjs

ENV AUTH_TRUST_HOST true
ENV AUTH_URL http://0.0.0.0:3000/api/auth
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENV BACKUP true
ENV BACKUP_DELAY 86400

ENV DATABASE_HOST localhost
ENV DATABASE_USER root
ENV DATABASE_PASSWORD root
ENV DATABASE_PORT 3306
ENV DATABASE_DB timetrack

EXPOSE 3000
VOLUME ["/backups"]
CMD ["/bin/sh", "./docker-start.sh"]