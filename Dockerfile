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

# Install Chromium and its dependencies for Puppeteer (Alpine apk)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    font-noto-emoji \
    ttf-freefont

# Tell Puppeteer to use the system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Non-root user for security (Alpine uses addgroup/adduser)
RUN addgroup -S appgroup && adduser -S -G appgroup -u 999 appuser \
  && chown -R appuser:appgroup /app

# Copy installed node_modules from deps stage
COPY --chown=appuser:appgroup --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

# Create the states directory (used at runtime, mount as volume in production)
RUN mkdir -p /app/states && chown appuser:appgroup /app/states

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["bun", "run", "start"]
