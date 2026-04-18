# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.1
ARG PNPM_VERSION=10.25.0

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

################################################################################
FROM base as deps

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

################################################################################
FROM deps as build

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Build frontend
WORKDIR /usr/src/app/frontend
RUN pnpm install --frozen-lockfile
RUN pnpm run build

WORKDIR /usr/src/app

################################################################################
FROM base as final

ENV NODE_ENV=production

# Встановлюємо OpenSSL для Prisma (потрібно під root)
USER root
RUN apk add --no-cache openssl

# Копіюємо все з правильними правами для користувача node
# ДОДАНО: --chown=node:node передає права на файли користувачу node
COPY --chown=node:node package.json .

# >>> ДОДАЙ ОСЬ ЦЕЙ РЯДОК: <<<
COPY --chown=node:node prisma.config.ts .

COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/frontend/dist ./frontend/dist
COPY --chown=node:node --from=build /usr/src/app/templates ./templates
COPY --chown=node:node --from=build /usr/src/app/database ./database

# Перемикаємось на безпечного користувача ТІЛЬКИ ПІСЛЯ копіювання файлів
USER node

EXPOSE 3000

# Оскільки в prisma.config.ts вже вказано шлях до схеми, ми можемо повернути чисту команду:
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]