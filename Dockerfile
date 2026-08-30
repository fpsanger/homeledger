FROM node:22-alpine AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies

COPY package.json package-lock.json ./
COPY src/infrastructure/database/schema.prisma ./src/infrastructure/database/schema.prisma
RUN npm ci \
    && npx prisma generate --schema src/infrastructure/database/schema.prisma

FROM base AS development

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL=postgresql://homeledger:homeledger@postgres:5432/homeledger
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

FROM base AS migration

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
CMD ["npx", "prisma", "migrate", "deploy", "--schema", "src/infrastructure/database/schema.prisma"]

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
