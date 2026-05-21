import { createHash, randomBytes, timingSafeEqual } from "crypto";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const COOKIE_NAME = "sid";

interface Session {
  expiresAt: number;
}

const store = new Map<string, Session>();

// Purge expired sessions every hour to keep memory bounded
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of store) {
    if (now > session.expiresAt) store.delete(token);
  }
}, 60 * 60 * 1000).unref();

export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  store.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function validateSession(token: string): boolean {
  const session = store.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    store.delete(token);
    return false;
  }
  return true;
}

export function deleteSession(token: string): void {
  store.delete(token);
}

/**
 * Constant-time password comparison using SHA-256 to normalise buffer length.
 * Prevents timing side-channel attacks regardless of input length differences.
 */
export function checkPassword(input: string): boolean {
  const expected = process.env.PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function parseCookieToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

export const COOKIE_MAX_AGE = SESSION_TTL_MS / 1000;
