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

RUN apk add --no-cache openssl

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

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENV NEXTAUTH_URL http://localhost:3000/api/auth

ENV DATABASE_URL mysql://root:root@localhost:3306/timetrack

CMD ["/bin/sh", "./docker-start.sh"]