let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const baseUrl = process.env.AUTH_BASE_URL ?? "";
  const username = process.env.AUTH_USERNAME ?? "";
  const password = process.env.AUTH_PASSWORD ?? "";

  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  const token = data?.data?.token as string | undefined;
  if (!token) throw new Error("No token in auth response");

  cachedToken = token;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
  return token;
}

export function clearAuthToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}
