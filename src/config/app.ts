export const appConfig = {
  port: Number(process.env.PORT ?? 3000),
  url: process.env.APP_URL ?? "http://localhost:3000",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
