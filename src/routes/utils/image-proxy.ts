import { err } from "@/utils/response";

const ALLOWED_HOSTNAMES = [
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
  "scontent.cdninstagram.com",
];

function isAllowed(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

export async function imageProxy(req: Request): Promise<Response> {
  const imageUrl = new URL(req.url).searchParams.get("url");
  if (!imageUrl) return err("url is required");

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return err("Invalid URL", 400);
  }

  if (!isAllowed(parsed.hostname)) return err("Domain not allowed", 403);

  try {
    const upstream = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) return err(`Upstream ${upstream.status}`, 502);

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return err("Failed to fetch image", 502);
  }
}
