# ============================================================
# Template Dockerfile — 프로젝트에 맞는 섹션만 남기고 나머지 삭제
# ============================================================

# ─────────────────────────────────────────────────────────────
# Option A: Python (uv) — FastAPI, Flask 등
# ─────────────────────────────────────────────────────────────
ARG PYTHON_VERSION=3.12
ARG UV_VERSION=0.10.9

FROM ghcr.io/astral-sh/uv:${UV_VERSION} AS uv-src
FROM python:${PYTHON_VERSION}-slim AS builder

COPY --from=uv-src /uv /usr/local/bin/uv
ENV UV_LINK_MODE=copy UV_COMPILE_BYTECODE=1 UV_PROJECT_ENVIRONMENT=/app/.venv

# 시스템 빌드 의존성 (필요에 따라 조정)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

FROM python:${PYTHON_VERSION}-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1

COPY app/ ./app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


# ─────────────────────────────────────────────────────────────
# Option B: Node.js (static site) — Astro, Next.js, Vite 등
# ─────────────────────────────────────────────────────────────
# FROM node:22-alpine AS build
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci
# COPY . .
# RUN npm run build
#
# FROM nginx:alpine AS runtime
# COPY --from=build /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]


# ─────────────────────────────────────────────────────────────
# Option C: Go
# ─────────────────────────────────────────────────────────────
# FROM golang:1.22-alpine AS builder
# WORKDIR /app
# COPY go.mod go.sum ./
# RUN go mod download
# COPY . .
# RUN CGO_ENABLED=0 go build -o /app/server ./cmd/server
#
# FROM alpine:3.19 AS runtime
# RUN apk add --no-cache ca-certificates
# COPY --from=builder /app/server /usr/local/bin/server
# EXPOSE 8080
# CMD ["server"]
