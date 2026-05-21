import { SQL } from "bun";

export const db = new SQL({
  adapter: "mysql",
  hostname: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME ?? "",
  username: process.env.DB_USERNAME ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  ssl: "disable",
  connectionTimeout: 30,
});
