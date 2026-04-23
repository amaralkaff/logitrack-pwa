# ─── Build stage ──────────────────────────────────────────────────────────
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
# Use npm for deterministic installs in build. Bun lockfile not needed.
RUN --mount=type=cache,target=/root/.npm npm install

# Copy source
COPY . .

# Client: tesseract prep, tsc (app), vite build
RUN npm run build

# Server: compile api/ + server/ to build/
RUN npm run build:server

# ─── Runtime stage ────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/build ./build

EXPOSE 8080
CMD ["node", "build/server/index.js"]
