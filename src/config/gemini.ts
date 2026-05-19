export const geminiConfig = {
  baseUrl: process.env.GEMINI_GATEWAY_URL ?? "https://gemini.gateway.andikads.my.id",
  endpoint: "/ask-media",
  headers: {
    "x-api-key": process.env.GEMINI_API_KEY ?? "",
    "x-origin": process.env.GEMINI_ORIGIN ?? "",
  },
};
