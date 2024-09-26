FROM node:lts-alpine AS base

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
COPY --from=deps /app/node_modules ./node_modules

RUN apk add --no-cache openssl mysql-client mariadb-connector-c curl

RUN npm install -g npm@latest

ENV NODE_ENV=production

ENV TZ=Europe/Berlin
RUN apk add --no-cache tzdata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/docker-start.sh ./
COPY --from=builder --chown=nextjs:nodejs /app/scheduler.sh ./
RUN chmod +x /app/scheduler.sh

COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.js ./prisma/

RUN mkdir /backups && chown nextjs:nodejs /backups

USER root

ENV AUTH_TRUST_HOST=true

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENV BACKUP=false
ENV BACKUP_DELAY=86400

ENV DATABASE_HOST=localhost
ENV DATABASE_USER=timetrack
ENV DATABASE_PASSWORD=timetrack
ENV DATABASE_PORT=3306
ENV DATABASE_DB=timetrack

EXPOSE 3000
VOLUME ["/backups"]
CMD ["/bin/sh", "./docker-start.sh"]