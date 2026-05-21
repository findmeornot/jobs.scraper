export function ok<T>(data: T, extra?: Record<string, unknown>): Response {
  return Response.json({ success: true, ...extra, data });
}

export function okResults<T>(results: T[], extra?: Record<string, unknown>): Response {
  return Response.json({ success: true, count: results.length, results, ...extra });
}

export function err(message: string, status = 400, error?: string): Response {
  return Response.json({ success: false, error: error ?? message, message }, { status });
}

export function serverErr(message: string): Response {
  return err(message, 500);
}
