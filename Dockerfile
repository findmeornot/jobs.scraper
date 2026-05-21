# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy lockfile and manifests first for better layer caching
COPY package.json bun.lock bunfig.toml ./

# Install production + dev deps (needed for bun-plugin-tailwind at runtime)
RUN bun install --frozen-lockfile


# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Install Chromium and its dependencies for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-sandbox \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Non-root user for security (bun image ships with 'bun' user uid 1000)
RUN groupadd -r appgroup && useradd -r -g appgroup -u 999 appuser \
  && chown -R appuser:appgroup /app

# Copy installed node_modules from deps stage
COPY --chown=appuser:appgroup --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

# Create the states directory (used at runtime, excluded from image via .dockerignore)
RUN mkdir -p /app/states && chown appuser:appgroup /app/states

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["bun", "src/index.ts"]
