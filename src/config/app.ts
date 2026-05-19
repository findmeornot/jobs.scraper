export const appConfig = {
  port: Number(process.env.PORT ?? 3001),
  url: process.env.APP_URL ?? "http://localhost:3001",
};
