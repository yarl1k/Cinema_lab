# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.14.1
ARG PNPM_VERSION=10.25.0

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}
RUN apk add --no-cache openssl

################################################################################
FROM base as deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

################################################################################
FROM deps as build
COPY . .
# Генеруємо клієнт Prisma перед білдом
RUN pnpm exec prisma generate
RUN pnpm run build

################################################################################
FROM base as final
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Копіюємо з правильними правами
COPY --chown=node:node package.json .
COPY --chown=node:node prisma.config.ts .
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/database ./database

USER node
EXPOSE 3000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]