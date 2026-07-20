# Builds either Next.js app from the workspace monorepo.
# Select with:  --build-arg APP=pos-web   or   --build-arg APP=storefront-web

# ── Dependencies ─────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
# Only manifests, so this layer caches until dependencies change.
COPY package.json package-lock.json ./
COPY apps/pos-web/package.json apps/pos-web/
COPY apps/storefront-web/package.json apps/storefront-web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/types/package.json packages/types/
RUN npm ci

# ── Build ────────────────────────────────────────────────────────
FROM node:22-alpine AS build
ARG APP
# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# so they must be supplied here, not at container start.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MEDIA_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=apps/$APP

# ── Runtime ──────────────────────────────────────────────────────
FROM node:22-alpine AS run
ARG APP
ENV APP=$APP \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Standalone output mirrors the monorepo layout (tracing root is the
# workspace root), so server.js lives at apps/$APP/server.js.
COPY --from=build --chown=node:node /app/apps/$APP/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/$APP/.next/static ./apps/$APP/.next/static
COPY --from=build --chown=node:node /app/apps/$APP/public ./apps/$APP/public

USER node
EXPOSE 3000
CMD ["sh", "-c", "node apps/$APP/server.js"]
