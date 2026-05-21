CREATE TABLE IF NOT EXISTS scrape_session (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMPTZ NULL,
  total_accounts INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  deleted_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  CONSTRAINT chk_session_status CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE TABLE IF NOT EXISTS scrape_log (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  account_username VARCHAR(255) NULL,
  posts_count INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_log_level CHECK (level IN ('info', 'warn', 'error', 'success'))
);

CREATE INDEX IF NOT EXISTS idx_session_id ON scrape_log (session_id);
