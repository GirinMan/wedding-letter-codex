FROM node:22-alpine AS build

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/public-web/package.json apps/public-web/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
RUN npm ci

COPY apps/api apps/api
RUN npm run build --workspace @wedding/api

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/public-web/package.json apps/public-web/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
RUN npm ci --omit=dev --workspace @wedding/api --include-workspace-root=false \
  && npm cache clean --force

COPY --from=build /workspace/apps/api/dist apps/api/dist
COPY apps/api/migrations apps/api/migrations
COPY deploy/docker/api-entrypoint.sh /usr/local/bin/wedding-api-entrypoint
RUN chmod 755 /usr/local/bin/wedding-api-entrypoint

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/api/health/live >/dev/null || exit 1

ENTRYPOINT ["wedding-api-entrypoint"]
