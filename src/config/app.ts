export const appConfig = {
  port: Number(process.env.PORT ?? 3000),
  url: process.env.APP_URL ?? "http://localhost:3000",
};
