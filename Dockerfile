# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.1
ARG PNPM_VERSION=10.25.0

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}
RUN apk add --no-cache openssl

################################################################################
FROM base as build
WORKDIR /usr/src/app

COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY notifier/package.json ./notifier/

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .

# 4. Збираємо
RUN pnpm --filter ./frontend run build
RUN pnpm --filter ./backend run build

################################################################################
FROM base as final
ENV NODE_ENV=production
WORKDIR /usr/src/app/backend
USER root

COPY --chown=node:node --from=build /usr/src/app/backend/package.json .
COPY --chown=node:node --from=build /usr/src/app/backend/prisma.config.ts .

COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=build /usr/src/app/backend/node_modules /usr/src/app/backend/node_modules
COPY --chown=node:node --from=build /usr/src/app/backend/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/frontend/dist ./frontend/dist
COPY --chown=node:node --from=build /usr/src/app/backend/templates ./templates
COPY --chown=node:node --from=build /usr/src/app/backend/database ./database

RUN chown -R node:node /usr/src/app

USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm start"]