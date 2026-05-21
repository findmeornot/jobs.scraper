import { SQL } from "bun";

export const db = new SQL({
  hostname: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "",
  username: process.env.DB_USERNAME ?? "postgres",
  password: process.env.DB_PASSWORD ?? "",
  tls: false,
  connectionTimeout: 30,
});
