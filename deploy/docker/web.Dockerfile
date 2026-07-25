FROM node:22-alpine AS build

ARG WEB_APP
ARG WEB_WORKSPACE
ARG VITE_INVITATION_SLUG=our-wedding
ARG VITE_PUBLIC_PREVIEW_URL=http://localhost:8080

ENV VITE_INVITATION_SLUG=${VITE_INVITATION_SLUG}
ENV VITE_PUBLIC_PREVIEW_URL=${VITE_PUBLIC_PREVIEW_URL}

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/public-web/package.json apps/public-web/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
RUN npm ci

COPY apps/${WEB_APP} apps/${WEB_APP}
RUN npm run build --workspace ${WEB_WORKSPACE}

FROM nginx:1.27-alpine AS runtime

ARG WEB_APP
COPY deploy/nginx/${WEB_APP}.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/${WEB_APP}/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
