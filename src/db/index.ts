import { SQL } from "bun";

let _db: SQL | null = null;

/**
 * Returns the lazily-created database connection.
 * Deferring construction to first use ensures process.env is fully populated
 * by the time the SQL instance is created (avoids module-evaluation timing issues).
 */
function getDb(): SQL {
  if (!_db) {
    _db = new SQL({
      hostname: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME ?? "",
      username: process.env.DB_USERNAME ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      adapter: "mysql",
      tls: false,
    });
  }
  return _db;
}

// Proxy so all call-sites continue using `db` unchanged (e.g. db`SELECT 1`)
export const db = new Proxy({} as SQL, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
  apply(_target, _thisArg, args) {
    return (getDb() as unknown as (...a: unknown[]) => unknown)(...args);
  },
});
