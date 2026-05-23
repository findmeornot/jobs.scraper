# Instagram Scraper

A full-stack Instagram content scraping platform built with **Bun**, **React 19**, and **PostgreSQL**. Monitors Instagram accounts by region, scrapes posts, processes content with Gemini AI, and provides a real-time management dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running](#running)
- [Deployment & Network](#deployment--network)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Cron Jobs](#cron-jobs)
- [Database Schema](#database-schema)

---

## Features

| Feature | Description |
|---------|-------------|
| **Account Management** | Add, edit, delete Instagram accounts with external/internal classification |
| **Bulk Import** | Import accounts from CSV or Excel (`.xlsx`/`.xls`) with duplicate detection |
| **Instagram ID Sync** | Resolve numeric Instagram IDs for all accounts or missing ones — with stop/resume |
| **Content Scraping** | Scrape posts from tracked accounts, triggered manually or via daily cron |
| **Content Processing** | Gemini AI classifies scraped images; results are confirmed/rejected in the UI |
| **Region Management** | Organize accounts by province → region → group hierarchy |
| **Real-time Updates** | WebSocket pushes scrape progress, sync progress, and live logs to the UI |
| **Scrape Sessions** | Full session history with per-account success/error/deleted counts |
| **Dashboard** | Stats overview: total accounts, content counts, pending/confirmed items |
| **Image Proxy** | Server-side proxy for Instagram CDN images (avoids CORS) |

---

## Tech Stack

**Backend**
- [Bun](https://bun.sh) — runtime, HTTP server (`Bun.serve`), PostgreSQL client (`Bun.sql`), bundler
- [PostgreSQL](https://postgresql.org) — primary database
- [Puppeteer](https://pptr.dev) — fallback Instagram ID resolution
- [Pino](https://getpino.io) — structured logging
- [Bun.cron](https://bun.com/docs/runtime/cron) — built-in scheduled jobs (no extra dependency)
- [Zod](https://zod.dev) — request validation

**Frontend**
- [React 19](https://react.dev) — UI
- [TanStack Query v5](https://tanstack.com/query) — server state & caching
- [Zustand](https://zustand-demo.pmnd.rs) — client state (scrape/sync status)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) — form validation
- [Base UI](https://base-ui.com) — headless component primitives
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [TanStack Table v8](https://tanstack.com/table) — data tables
- [Lucide React](https://lucide.dev) — icons
- [xlsx (SheetJS)](https://sheetjs.com) — CSV/Excel parsing
- [Recharts](https://recharts.org) — charts
- [dayjs](https://day.js.org) — date formatting

---

## Prerequisites

- **Bun** ≥ 1.0 — [install](https://bun.sh/docs/installation)
- **PostgreSQL** ≥ 14
- **Node.js** is NOT required — Bun handles everything

---

## Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd scraper
bun install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Set up the database (reset → migrate → seed)
bun run db:setup

# 4. Start the dev server
bun run dev
```

The app is available at `http://localhost:3000` by default.

---

## Environment Variables

Create a `.env` file in the project root. Variables with defaults shown are optional.

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `APP_URL` | `http://localhost:3000` | Public URL of the app |
| `PASSWORD` | — | **Required.** Dashboard login password |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | — | **Required.** Database name |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | — | **Required.** Database password |

### Instagram (all optional — features degrade gracefully)

| Variable | Description |
|----------|-------------|
| `INSTAGRAM_SESSION_ID` | Session cookie value for authenticated API requests |
| `INSTAGRAM_COOKIE` | Full cookie string for scraping |
| `INSTAGRAM_APP_ID` | Instagram web app ID (`x-ig-app-id` header) |
| `INSTAGRAM_CSRF_TOKEN` | CSRF token for write requests |
| `PROXY_URL` | HTTP/HTTPS proxy URL for outbound Instagram requests |
| `PROXY_API_KEY` | API key for authenticated proxy provider |

### Gemini AI (optional — enables content classification)

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_GATEWAY_URL` | `https://gemini.gateway.andikads.my.id` | Gemini gateway base URL |
| `GEMINI_API_KEY` | — | API key for the Gemini gateway |
| `GEMINI_ORIGIN` | — | `Origin` header sent with Gemini requests |

### Example `.env`

```env
PORT=3000
PASSWORD=your_secure_password

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=scraper
DB_USERNAME=postgres
DB_PASSWORD=postgres

INSTAGRAM_SESSION_ID=
INSTAGRAM_COOKIE=
PROXY_URL=

GEMINI_GATEWAY_URL=https://gemini.gateway.andikads.my.id
GEMINI_API_KEY=
GEMINI_ORIGIN=
```

---

## Database

### Scripts

```bash
bun run db:migrate   # Run pending migrations (safe to re-run)
bun run db:reset     # Drop and recreate all tables
bun run db:seed      # Seed with initial data
bun run db:setup     # reset + migrate + seed  (full fresh start)
```

### Migrations

Migrations live in `src/db/migrations/` and run in filename order.

| File | Contents |
|------|----------|
| `0001_initial.sql` | Core tables: accounts, content, regions, provinces, groups |
| `0002_scrape_logs.sql` | Scrape session and log tables |

---

## Running

```bash
# Development — hot reload
bun run dev

# Production — auto-migrates then starts
bun run start

# Lint
bun run lint
bun run lint:fix

# Format
bun run format

# Type check
bun run typecheck
```

---

## Deployment & Network

The app runs on a **KVM server**. During scrape jobs it routes outbound Instagram requests through a proxy that lives on the **haiboss** local-network machine, exposed publicly via a **Cloudflare Tunnel**.

```
KVM Server (this app)
      │
      │  PROXY_URL  ──────────────────────────────────────┐
      ▼                                                    ▼
Instagram API / CDN          Cloudflare Tunnel (public URL)
                                        │
                                        ▼
                               haiboss (local network)
                               └── proxy server (e.g. Squid / custom)
```

All Instagram fetch calls made by the scraper (profile page, web API, image downloads) are forwarded through this proxy. The Cloudflare Tunnel means haiboss needs no open inbound ports — it initiates the outbound tunnel connection itself.

### Proxy configuration

Set `PROXY_URL` to the Cloudflare Tunnel public URL of the haiboss proxy, and `PROXY_API_KEY` if the proxy requires authentication:

```env
PROXY_URL=https://<tunnel-subdomain>.trycloudflare.com
PROXY_API_KEY=your_key_here
```

### Production start

```bash
# On the KVM server — migrations run automatically before the server starts
bun run start
```

---

## Project Structure

```
scraper/
├── src/                              # Backend
│   ├── index.ts                      # Entry point — bootstrap, DB check, server start
│   ├── server.ts                     # Bun.serve — all routes + WebSocket handlers
│   ├── config/
│   │   ├── app.ts                    # Port, URL
│   │   ├── instagram.ts              # Instagram credentials & proxy
│   │   └── gemini.ts                 # Gemini AI gateway
│   ├── db/
│   │   ├── index.ts                  # Bun.sql connection instance
│   │   ├── migrations/               # SQL migration files (run in order)
│   │   └── scripts/                  # migrate / reset / seed scripts
│   ├── repositories/                 # Raw SQL queries — data access layer only
│   ├── services/                     # Business logic
│   │   ├── instagram-account.service.ts
│   │   ├── instagram-id.service.ts   # ID resolution + sync with WS progress
│   │   ├── instagram-content.service.ts
│   │   ├── scrape-log.service.ts     # Session tracking + WS broadcast
│   │   ├── content-processing.service.ts
│   │   └── gemini.service.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── instagram/                # profile, content, group, hashtag
│   │   ├── master/                   # region, province, group
│   │   └── utils/                    # auth-guard, cors, scrape-control, logs
│   ├── scraper/                      # Instagram scraping (Puppeteer + fetch strategies)
│   ├── crons/                        # Bun.cron scheduled jobs
│   ├── ws/
│   │   └── manager.ts                # WebSocket client registry + broadcast helper
│   ├── types/index.ts                # Shared backend types
│   └── utils/                        # logger, response helpers, date, session
│
├── frontend/                         # React app (bundled by Bun)
│   ├── index.html                    # HTML entry point
│   ├── frontend.tsx                  # React root + router setup
│   ├── pages/                        # Route-level page components
│   ├── components/
│   │   ├── ui/                       # Design system (Button, Dialog, DataTable…)
│   │   ├── features/
│   │   │   ├── accounts/             # AccountsTable, ImportDialog, form dialogs
│   │   │   └── logs/                 # SessionsTable, LiveLogsPanel, ScrapeControls
│   │   └── templates/                # Layout — sidebar + WebSocket connection
│   ├── hooks/                        # TanStack Query + mutation hooks
│   ├── stores/                       # Zustand stores (scrape, auth, ui)
│   ├── schemas/                      # Zod form schemas (account, auth, region, import)
│   ├── types/index.ts                # Frontend types
│   └── lib/                          # apiFetch, cn(), queryClient
```

---

## API Reference

All endpoints except `/api/auth/login` and `/api/health` require authentication via session cookie.

### Auth

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | `{ password }` | Login — sets session cookie |
| `POST` | `/api/auth/logout` | — | Clear session |
| `GET` | `/api/auth/me` | — | `{ authenticated: boolean }` |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard/stats` | Aggregate counts — accounts, content, pending, confirmed |

### Instagram Accounts

| Method | Path | Body / Query | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/instagram/profile` | `?type=true\|false` | List accounts. Optionally filter by `is_external` |
| `POST` | `/api/instagram/profile` | `{ usernames: string[] }` | Resolve and add accounts by username |
| `POST` | `/api/instagram/profile/import` | `{ rows: ImportRow[] }` | Bulk import (max 10,000 rows) |
| `POST` | `/api/instagram/profile/sync-ids` | `{ mode, resume? }` | Start ID sync in background |
| `POST` | `/api/instagram/profile/sync-ids/stop` | — | Stop running sync |
| `PUT` | `/api/instagram/profile/:id` | `{ username?, is_active?, is_external? }` | Update account |
| `DELETE` | `/api/instagram/profile/:id` | — | Delete account + region assignments |
| `GET` | `/api/instagram/profile/:id/regions` | — | Regions assigned to account |

**Import row format:**
```json
{ "username": "loker_jakarta", "type": "external" }
```

**Import response:**
```json
{
  "data": { "imported": 42, "duplicates": 8, "invalid": 2, "errors": [] }
}
```

**Sync IDs — mode/resume matrix:**

| `mode` | `resume` | Behaviour |
|--------|---------|-----------|
| `"all"` | `false` | Re-sync every account |
| `"empty"` | `false` | Only accounts where `instagram_id IS NULL` |
| `"all"` | `true` | Resume stopped sync, process all remaining |
| `"empty"` | `true` | Resume stopped sync, skip those that now have an ID |

### Instagram Content

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/instagram/content` | List scraped content |
| `POST` | `/api/instagram/content` | Create content entry |
| `POST` | `/api/instagram/content/scrape` | Manually trigger a scrape session |
| `POST` | `/api/instagram/content/submit` | Submit content for processing |
| `POST` | `/api/instagram/content/actions` | Confirm / reject content items |
| `GET` | `/api/instagram/content/file/:filename` | Serve downloaded content file |

### Groups & Hashtags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/instagram/group` | List content groups |
| `GET` | `/api/instagram/group/missing` | Groups with no confirmed content |
| `GET` | `/api/instagram/group/:group_id/content` | Content for a specific group |
| `GET` | `/api/instagram/hashtag` | List extracted hashtags |

### Master Data

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/master/region` | List / create regions |
| `PUT/DELETE` | `/api/master/region/:id` | Update / delete region |
| `GET` | `/api/master/region/:id/accounts` | Accounts in a region |
| `POST` | `/api/master/region/:id/accounts` | Add account to region |
| `DELETE` | `/api/master/region/:id/accounts/:account_id` | Remove account from region |
| `GET/POST` | `/api/master/province` | List / create provinces |
| `PUT/DELETE` | `/api/master/province/:id` | Update / delete province |
| `GET/POST` | `/api/master/group` | List / create groups |
| `PUT/DELETE` | `/api/master/group/:id` | Update / delete group |

### Scrape Control & Logs

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/scrape/status` | — | Current scrape state |
| `POST` | `/api/scrape/control` | `{ action }` | `start` / `pause` / `resume` / `stop` |
| `GET` | `/api/scrape/sessions` | — | All scrape sessions |
| `GET` | `/api/scrape/sessions/:id/logs` | — | Logs for a session |

### Utilities

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | `{ ok: true, ts: number }` |
| `GET` | `/api/proxy/image?url=<encoded>` | Proxy Instagram CDN image |

---

## WebSocket Events

Connect to `ws://<host>/ws`. On connect the server immediately sends the current `state` and `sync_progress`.

All messages are JSON with a `type` discriminator field.

### Server → Client

#### `state`
```json
{
  "type": "state",
  "isScraping": true,
  "isPaused": false,
  "sessionId": "uuid",
  "stopRequested": false
}
```

#### `session_start` / `session_end`
```json
{ "type": "session_start", "sessionId": "uuid", "startedAt": "ISO8601" }
{ "type": "session_end",   "sessionId": "uuid", "status": "completed", "stats": { ... } }
```

#### `log`
```json
{
  "type": "log",
  "entry": {
    "id": 1, "session_id": "uuid", "level": "success",
    "message": "Scraped 5 posts", "account_username": "loker_jkt",
    "posts_count": 5, "created_at": "ISO8601"
  }
}
```

#### `content_processed`
```json
{ "type": "content_processed", "contentId": 42, "remoteUrl": "https://...", "error": null }
```

#### `sync_progress`
```json
{
  "type": "sync_progress",
  "running": true,
  "total": 1165,
  "processed": 42,
  "failed": 1,
  "current": "loker_jakarta",
  "stopRequested": false,
  "mode": "all",
  "canResume": false,
  "pendingCount": 0
}
```

---

## Cron Jobs

Both crons use **`Bun.cron`** — Bun's built-in scheduler (no `node-cron` dependency). In-process `Bun.cron` jobs run on **UTC** wall-clock time and never overlap: the next fire time is computed only after the handler fully resolves.

| Schedule (UTC) | Description |
|----------------|-------------|
| `0 0 * * *` — daily 00:00 | **Profile updater** — refreshes follower/following counts for active non-external accounts in batches of 30 with 30 s between batches |
| `0 20 * * *` — daily 20:00 | **Content scraper** — scrapes new posts from all external accounts, saves to `instagram_content`, runs Gemini classification |

---

## Database Schema

```
master_province ──┐
                  ├──> master_region <──> region_account <──> instagram_account
master_group ─────┘                                                │
                                                                   └──> instagram_content

scrape_session ──> scrape_log
```

### `instagram_account`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PK` | |
| `instagram_id` | `VARCHAR UNIQUE NULL` | Numeric IG user ID |
| `username` | `VARCHAR UNIQUE` | Instagram handle (no `@`) |
| `followers` | `INTEGER` | Populated on ID resolution; not updated on every scrape |
| `following` | `INTEGER` | |
| `is_external` | `SMALLINT` | `1` = external, `0` = internal |
| `is_active` | `SMALLINT` | `1` = active |
| `is_manual_input` | `SMALLINT` | `1` = added manually via UI |

### `instagram_content`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PK` | |
| `caption` | `TEXT NULL` | |
| `shortcode` | `VARCHAR` | IG post shortcode |
| `display_url` | `TEXT` | CDN image URL |
| `remote_url` | `TEXT NULL` | Processed/downloaded copy |
| `account_id` | `INTEGER FK` | → `instagram_account` |
| `posted_at` | `TIMESTAMPTZ` | Original post timestamp |
| `confirmed_at` | `TIMESTAMPTZ NULL` | |
| `rejected_at` | `TIMESTAMPTZ NULL` | |
| `action_by` | `VARCHAR NULL` | Operator who acted on it |

### `scrape_session`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `VARCHAR(36) PK` | UUID |
| `started_at` | `TIMESTAMPTZ` | |
| `finished_at` | `TIMESTAMPTZ NULL` | `NULL` while running |
| `status` | `TEXT` | `running` \| `completed` \| `failed` |
| `total_accounts` | `INTEGER` | |
| `success_count` | `INTEGER` | |
| `error_count` | `INTEGER` | |
| `deleted_count` | `INTEGER` | |

---

## Instagram ID Resolution Strategy

When syncing IDs the service tries five strategies in order, stopping at the first success:

| # | Strategy | Details |
|---|----------|---------|
| 1 | **web_profile_info (www)** | `GET https://www.instagram.com/api/v1/users/web_profile_info/?username=…` with desktop UA. Fast, no auth required when not rate-limited. |
| 2 | **web_profile_info (mobile)** | Same endpoint on `i.instagram.com` with iPhone UA. Separate rate-limit bucket from the www endpoint. |
| 3 | **curl (mobile UA)** | Shells out to `curl` against `i.instagram.com`. curl's TLS ClientHello fingerprint differs from Bun's built-in fetch, bypassing Instagram's TLS-based bot detection. |
| 4 | **HTML parse** | Fetches `https://www.instagram.com/{username}/` and extracts the ID from embedded JSON via five regex patterns (`profilePage_…`, `profile_id`, `user_id`, `target_id`, `owner.id`). |
| 5 | **Puppeteer** | Headless Chromium loads the profile page; the `web_profile_info` API response is intercepted from the network. Falls back to HTML regex if the intercept misses. Slowest — last resort. |

All five strategies route through the proxy when `PROXY_URL` + `PROXY_API_KEY` are set. When `INSTAGRAM_SESSION_ID` (or `INSTAGRAM_COOKIE`) is configured, requests are authenticated — this is required on production servers whose IPs are blocked or rate-limited by Instagram; without a session cookie all strategies will fail with 429 or a login wall.

Accounts that fail all strategies are **skipped** (left in the database unchanged). The sync can be stopped mid-run and resumed from exactly where it left off, with the option to change mode (`all` vs. `empty`) on resume.

> See **[SCRAPE.md](./SCRAPE.md)** for a full breakdown of how Instagram data is scraped — profile IDs, posts, post details, likes, views, and reels.
