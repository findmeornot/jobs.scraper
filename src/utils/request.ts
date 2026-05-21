/** Extract dynamic path params injected by Bun's route handler at runtime. */
export function getParams(req: Request): Record<string, string> {
  return (req as unknown as { params?: Record<string, string> }).params ?? {};
}

/** Parse JSON body, return null on malformed input instead of throwing. */
export async function parseBody<T>(req: Request): Promise<T | null> {
  return req.json().catch(() => null);
}
