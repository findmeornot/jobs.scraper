export const instagramConfig = {
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
  baseUrl: "https://www.instagram.com",
  timeout: 10000,
  graphqlDocId: "7950326061742207",
  // All auth fields are optional — features that need them degrade gracefully
  sessionId: process.env.INSTAGRAM_SESSION_ID ?? "",
  cookie: process.env.INSTAGRAM_COOKIE ?? "",
  appId: process.env.INSTAGRAM_APP_ID ?? "",
  csrfToken: process.env.INSTAGRAM_CSRF_TOKEN ?? "",
  proxyUrl: process.env.PROXY_URL ?? "",
  proxyApiKey: process.env.PROXY_API_KEY ?? "",
};
