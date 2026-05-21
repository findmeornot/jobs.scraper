import { db } from "@/db/index";

export interface ScrapeSession {
  id: string;
  started_at: Date;
  finished_at: Date | null;
  total_accounts: number;
  success_count: number;
  error_count: number;
  deleted_count: number;
  status: "running" | "completed" | "failed";
}

export interface ScrapeLogEntry {
  id: number;
  session_id: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  account_username: string | null;
  posts_count: number | null;
  created_at: Date;
}

export async function createSession(id: string): Promise<void> {
  await db`INSERT INTO scrape_session (id) VALUES (${id})`;
}

export async function finishSession(
  id: string,
  stats: {
    totalAccounts: number;
    successCount: number;
    errorCount: number;
    deletedCount: number;
    status: "completed" | "failed";
  },
): Promise<void> {
  await db`
    UPDATE scrape_session
    SET finished_at    = CURRENT_TIMESTAMP(3),
        total_accounts = ${stats.totalAccounts},
        success_count  = ${stats.successCount},
        error_count    = ${stats.errorCount},
        deleted_count  = ${stats.deletedCount},
        status         = ${stats.status}
    WHERE id = ${id}
  `;
}

export async function insertLog(entry: {
  sessionId: string;
  level: ScrapeLogEntry["level"];
  message: string;
  accountUsername: string | null;
  postsCount: number | null;
}): Promise<ScrapeLogEntry> {
  const result = await db`
    INSERT INTO scrape_log (session_id, level, message, account_username, posts_count)
    VALUES (${entry.sessionId}, ${entry.level}, ${entry.message}, ${entry.accountUsername}, ${entry.postsCount})
  `;
  return {
    id: Number(result.lastInsertRowid ?? result.insertId ?? 0),
    session_id: entry.sessionId,
    level: entry.level,
    message: entry.message,
    account_username: entry.accountUsername,
    posts_count: entry.postsCount,
    created_at: new Date(),
  };
}

export async function markStuckSessionsFailed(): Promise<number> {
  const result = await db`
    UPDATE scrape_session
    SET status = 'failed', finished_at = CURRENT_TIMESTAMP(3)
    WHERE status IN ('running', 'paused') AND finished_at IS NULL
  `;
  return Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0);
}

export async function findRecentSessions(limit = 50): Promise<ScrapeSession[]> {
  return db<ScrapeSession[]>`
    SELECT * FROM scrape_session
    ORDER BY started_at DESC
    LIMIT ${limit}
  `;
}

export async function findSessionById(id: string): Promise<ScrapeSession | null> {
  const rows = await db<ScrapeSession[]>`
    SELECT * FROM scrape_session WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findLogsBySession(sessionId: string): Promise<ScrapeLogEntry[]> {
  return db<ScrapeLogEntry[]>`
    SELECT * FROM scrape_log
    WHERE session_id = ${sessionId}
    ORDER BY id ASC
  `;
}
