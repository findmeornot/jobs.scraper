# Instagram Scraping Reference

A technical reference for scraping Instagram data without the official Graph API — profiles, timelines, post details, likes, comments, and reel views.

> **Maintenance note:** Instagram rotates internal `doc_id` values every 2–4 weeks as an anti-scraping measure. When a request starts returning `status: "fail"` or empty data, re-discover the current value using DevTools (see [Finding Current doc_ids](#finding-current-doc_ids)).

---

## Table of Contents

- [Credentials & TLS](#credentials--tls)
- [Profile ID Resolution](#profile-id-resolution)
- [User Timeline (Posts)](#user-timeline-posts)
- [Post Detail — Likes, Comments, Carousel](#post-detail--likes-comments-carousel)
- [Reel Views](#reel-views)
- [Comments Pagination](#comments-pagination)
- [Shortcode ↔ Media ID Conversion](#shortcode--media-id-conversion)
- [Finding Current doc_ids](#finding-current-doc_ids)
- [Rate Limiting & Best Practices](#rate-limiting--best-practices)
- [Error Reference](#error-reference)

---

## Credentials & TLS

### Two tiers of access

| Tier | What it gives you | Credential needed |
|------|-------------------|-------------------|
| **Public** | Profile data, public post list | None — but TLS fingerprint matters |
| **Authenticated** | Full timeline, likes, comments, reel counts, private accounts | `sessionid` cookie |

### Getting your session cookie

1. Open `https://www.instagram.com` in a browser and log in
2. DevTools → **Application** → **Cookies** → `https://www.instagram.com`
3. Copy:

| Cookie | Use |
|--------|-----|
| `sessionid` | Authenticate any API or scrape request |
| `csrftoken` | Required as `x-csrftoken` header on write requests |
| `ds_user_id` | Your numeric user ID — sometimes required alongside `sessionid` |

For the full cookie string, open DevTools → **Network** tab → filter by `Fetch/XHR` → click any Instagram request → copy the full `Cookie:` request header value.

> Session IDs expire when you log out or Instagram detects suspicious activity. When requests start returning 401, get a fresh session from the browser.

### TLS fingerprinting

Instagram inspects the **TLS ClientHello** to identify bots. Python's `requests`, Node's `fetch`, and Bun's `fetch` all have distinct TLS fingerprints that Instagram's edge network can flag — even if every HTTP header looks correct.

Workarounds (most reliable first):

| Method | How |
|--------|-----|
| **curl** | Shell out to `curl`. It uses OpenSSL/NSS with a different ClientHello than runtimes. |
| **Puppeteer/Playwright** | Real Chromium — identical TLS fingerprint to a real browser. |
| **`curl-impersonate`** | Drop-in curl build that mimics Chrome/Firefox TLS exactly. |
| **Rotating proxy** | Residential proxies have real browser-originated TLS from actual user devices. |
| **`tls-client` (Python)** | Library that spoofs Chrome/Firefox TLS fingerprint. |

---

## Profile ID Resolution

### Endpoint

```
GET https://i.instagram.com/api/v1/users/web_profile_info/?username={username}
```

### Headers

```
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15
x-ig-app-id: 936619743392459
Accept-Language: en-US,en;q=0.9
Cookie: sessionid={sessionid}        (optional — works without for most public accounts)
```

> The `x-ig-app-id` value `936619743392459` is Instagram's web app ID embedded in every browser session. A wrong value returns an instant **403**.

### Response

```json
{
  "data": {
    "user": {
      "id": "60690180625",
      "username": "loker_jakarta",
      "full_name": "Loker Jakarta",
      "biography": "...",
      "follower_count": 184000,
      "following_count": 412,
      "media_count": 3200,
      "profile_pic_url": "https://...",
      "is_private": false,
      "is_verified": false,
      "external_url": "https://..."
    }
  }
}
```

### Fallback: HTML regex

If the API returns 429, fetch the profile page directly and extract the ID from the embedded JSON:

```
GET https://www.instagram.com/{username}/
Headers:
  User-Agent: Mozilla/5.0 (Macintosh; ...) Chrome/124
  Cookie: sessionid={sessionid}
```

Regex patterns to try in order:

```
"profilePage_(\d+)"
"profile_id":"(\d+)"
"user_id":"(\d+)"
"target_id":"(\d+)"
"owner":{"id":"(\d+)"
```

Without a session cookie, Instagram often returns a login/consent wall that contains none of these patterns.

### Fallback: curl (different TLS fingerprint)

```bash
curl -sf --max-time 15 \
  -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" \
  -H "x-ig-app-id: 936619743392459" \
  -H "Accept-Language: en-US,en;q=0.9" \
  "https://i.instagram.com/api/v1/users/web_profile_info/?username=TARGET_USERNAME"
```

This is the most reliable unauthenticated method as of 2026 because curl's TLS fingerprint differs from Node/Python runtimes.

---

## User Timeline (Posts)

### Endpoint

```
POST https://www.instagram.com/graphql/query
Content-Type: application/x-www-form-urlencoded
```

### Headers

```
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124
x-ig-app-id: 936619743392459
X-FB-LSD: {lsd_token}
X-ASBD-ID: 129477
X-Requested-With: XMLHttpRequest
Origin: https://www.instagram.com
Referer: https://www.instagram.com/
Cookie: sessionid={sessionid}
```

> **`X-FB-LSD`** is a dynamic anti-CSRF token embedded in the Instagram page HTML. Extract it with:
> ```
> "LSD",\[\],"token","([^"]+)"
> ```
> or look for `"lsd":{"token":"…"}` in the page source. It changes per-session.

### Body (URL-encoded)

```
variables={"id":"{user_id}","first":12,"after":"{cursor}"}&doc_id=9310670392322965
```

| Parameter | Description |
|-----------|-------------|
| `id` | Numeric Instagram user ID (not username) |
| `first` | Posts per page — max 50, Instagram typically caps at 12 |
| `after` | Pagination cursor from `page_info.end_cursor`; omit for first page |
| `doc_id` | Internal query hash — **`9310670392322965`** as of 2025/2026 |

> **Older alternative (still works for some accounts):**
> ```
> GET https://www.instagram.com/graphql/query/?query_id=17888483320059182&id={user_id}&first=24&after={cursor}
> ```
> `query_id` is the predecessor to `doc_id` — same concept, older format.

### Response structure

```json
{
  "data": {
    "user": {
      "edge_owner_to_timeline_media": {
        "count": 3200,
        "page_info": {
          "has_next_page": true,
          "end_cursor": "QVFDd3h5..."
        },
        "edges": [
          {
            "node": {
              "id": "3456789012345678901",
              "shortcode": "C7xyz123abc",
              "taken_at_timestamp": 1716400000,
              "display_url": "https://scontent.cdninstagram.com/...",
              "is_video": false,
              "video_view_count": null,
              "play_count": null,
              "edge_media_preview_like": { "count": 1842 },
              "edge_media_to_comment": { "count": 67 },
              "edge_media_to_caption": {
                "edges": [{ "node": { "text": "Caption text #hashtag" } }]
              },
              "thumbnail_src": "https://...",
              "dimensions": { "width": 1080, "height": 1350 },
              "owner": { "id": "60690180625", "username": "loker_jakarta" }
            }
          }
        ]
      }
    }
  }
}
```

### Extractable fields per post

| Field path | Contains |
|------------|---------|
| `node.id` | Numeric media ID |
| `node.shortcode` | Post URL slug (`instagram.com/p/{shortcode}`) |
| `node.taken_at_timestamp` | Unix timestamp |
| `node.display_url` | Full-res image URL (CDN) |
| `node.is_video` | `true` for videos/reels, `false` for images |
| `node.video_view_count` | View count for videos (may be `null` — use `play_count` for reels) |
| `node.play_count` | Play count for reels |
| `node.edge_media_preview_like.count` | Like count |
| `node.edge_media_to_comment.count` | Comment count |
| `node.edge_media_to_caption.edges[0].node.text` | Caption text |
| `node.dimensions` | Width × height |
| `page_info.end_cursor` | Pass as `after` to get next page |
| `page_info.has_next_page` | Whether more pages exist |

### Paginating all posts

```
first request:  variables={"id":"USER_ID","first":12}
next request:   variables={"id":"USER_ID","first":12,"after":"END_CURSOR_FROM_PREV"}
stop when:      page_info.has_next_page === false
```

---

## Post Detail — Likes, Comments, Carousel

For full post metadata beyond what the timeline returns (carousel images, tagged users, location, comment previews).

### Method A — Magic parameters (no GraphQL)

Append `?__a=1&__d=dis` to any post/reel URL:

```
GET https://www.instagram.com/p/{shortcode}/?__a=1&__d=dis
Headers:
  User-Agent: Mozilla/5.0 (Macintosh...) Chrome/124
  x-ig-app-id: 936619743392459
  Cookie: sessionid={sessionid}; ds_user_id={ds_user_id}
```

Returns the full media object as JSON without needing a doc_id. Works for posts and reels.

### Method B — GraphQL (richer data, paginated comments)

```
POST https://www.instagram.com/graphql/query
Content-Type: application/x-www-form-urlencoded

variables={"shortcode":"{shortcode}","fetch_tagged_user_count":null,"hoisted_comment_id":null,"hoisted_reply_id":null}&doc_id=8845758582119845
```

> `doc_id` **`8845758582119845`** = post detail query as of 2025/2026.

### Method C — Mobile private API

```
GET https://i.instagram.com/api/v1/media/{media_id}/info/
Headers:
  User-Agent: Instagram 10.3.2 (iPhone7,2; iPhone OS 9_3_3; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/420+
  Cookie: sessionid={sessionid}
```

Response `items[0]` contains:

| Field | Contains |
|-------|---------|
| `like_count` | Total likes |
| `comment_count` | Total comments |
| `play_count` | Reel plays |
| `video_duration` | Duration in seconds |
| `location` | Tagged location object |
| `usertags.in` | Array of tagged users + coordinates |
| `image_versions2.candidates` | All image resolution variants |
| `video_versions` | Video URL + resolution variants |
| `carousel_media` | Array of items for multi-image posts |
| `coauthor_producers` | Collab post co-authors |
| `user.pk` | Post owner numeric ID |
| `user.username` | Post owner username |

---

## Reel Views

### From the timeline response

Reel nodes include both fields:

```json
{
  "is_video": true,
  "video_view_count": 125000,
  "play_count": 140000
}
```

- `video_view_count` — full plays (≥ some threshold, e.g., 3 seconds)
- `play_count` — any play, including very short ones; typically higher

### Dedicated reels endpoint

```
POST https://www.instagram.com/graphql/query
Content-Type: application/x-www-form-urlencoded

variables={"clip_shortcode":"{shortcode}","...other fields"}&doc_id=25981206651899035
```

> `doc_id` **`25981206651899035`** = reels-specific query as of 2025/2026.

Alternatively, the mobile API at `/api/v1/media/{media_id}/info/` returns `play_count` reliably for all video types.

---

## Comments Pagination

```
POST https://www.instagram.com/graphql/query
Content-Type: application/x-www-form-urlencoded

variables={"shortcode":"{shortcode}","first":50,"after":"{cursor}"}&doc_id={COMMENTS_DOC_ID}
```

The comments `doc_id` changes most frequently — re-discover it if comment requests stop working (see below).

Each comment object contains:

```json
{
  "id": "17987...",
  "text": "Great post!",
  "created_at": 1716400123,
  "owner": { "id": "12345", "username": "someone" },
  "edge_liked_by": { "count": 12 },
  "edge_threaded_comments": {
    "count": 3,
    "page_info": { "has_next_page": true, "end_cursor": "..." },
    "edges": [{ "node": { ... } }]
  }
}
```

---

## Shortcode ↔ Media ID Conversion

Instagram shortcodes and numeric media IDs are mathematically interconvertible using base-64 with Instagram's custom alphabet.

```ts
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** "C7xyz123abc" → "3456789012345678901" */
function shortcodeToId(shortcode: string): string {
  let id = 0n;
  for (const char of shortcode) {
    id = id * 64n + BigInt(ALPHABET.indexOf(char));
  }
  return id.toString();
}

/** "3456789012345678901" → "C7xyz123abc" */
function idToShortcode(id: string): string {
  let n = BigInt(id);
  let code = "";
  while (n > 0n) {
    code = ALPHABET[Number(n % 64n)] + code;
    n /= 64n;
  }
  return code;
}
```

---

## Finding Current doc_ids

Instagram rotates `doc_id` values every 2–4 weeks. When requests start returning `{"status":"fail"}` or empty `edges`, follow these steps:

### Step-by-step discovery

1. Open `https://www.instagram.com` in Chrome, log in
2. Open DevTools → **Network** tab → filter by `graphql`
3. Perform the action you want to scrape:
   - Scroll a user's profile → triggers timeline query
   - Open a post → triggers post detail query
   - Open a reel → triggers reels query
   - Scroll post comments → triggers comments query
4. Click the `graphql` request in the Network tab → **Payload** tab
5. In the request body you will see `doc_id=XXXXXXXXXXXXXXXXX`

### Quick reference — known values (2025/2026)

| Query | doc_id | Notes |
|-------|--------|-------|
| User timeline (posts) | `9310670392322965` | Replaces older `query_id` `17888483320059182` |
| Post detail | `8845758582119845` | Full media object + comments preview |
| Reels | `25981206651899035` | Reel-specific metadata + play counts |
| LSD token extract | — | Regex: `"LSD",\[\],"token","([^"]+)"` from page HTML |

> These values are correct as of early 2026. Treat them as starting points — verify with DevTools if requests fail.

---

## Rate Limiting & Best Practices

### Delays between requests

| Operation | Recommended delay |
|-----------|------------------|
| Profile ID resolution | 1–2 s between accounts |
| Post timeline fetch | 2–5 s random between accounts |
| Post detail / media info | 1–3 s per post |
| Bulk sync (1000+ accounts) | 3–5 s + batch in groups of 50–100 |

### TLS & IP strategy

- Use **curl** or a real browser (Puppeteer) for requests that get flagged — they have trusted TLS fingerprints
- A single server IP will hit rate limits at scale — use a **rotating residential proxy** for production workloads
- `429` = rate limited by IP. Back off 60–120 s before retrying from a different IP
- `401` = session expired or account challenged. Refresh `sessionid` from the browser
- `403` = wrong `x-ig-app-id` or TLS fingerprint flagged

### Session hygiene

- Use a **dedicated Instagram account** for scraping — not your personal one
- Don't exceed ~200 profile lookups/hour per session from the same IP
- Rotate sessions if scraping at high volume (have multiple accounts)
- Monitor for checkpoint/challenge responses (Instagram will require phone verification on the scraping account)

### Proxy setup

Post timeline scraping via GraphQL almost always requires a proxy from a clean residential IP. The minimum setup:

```
PROXY_URL=https://your-proxy-endpoint.com
PROXY_API_KEY=your_key
```

Route all outbound Instagram requests through the proxy — profile pages, API endpoints, and CDN image downloads.

---

## Error Reference

| HTTP Status | Meaning | Fix |
|-------------|---------|-----|
| `200` with `status: "fail"` | `doc_id` rotated or query blocked | Re-discover `doc_id` via DevTools |
| `200` with `data.user: null` | Account deleted or private | Skip / delete from DB |
| `400` | Malformed variables JSON or missing required field | Check variable structure |
| `401` | Session expired or not logged in | Refresh `sessionid` |
| `403` | Wrong `x-ig-app-id`, bad TLS fingerprint, or IP blocked | Switch to curl/Puppeteer, verify app ID |
| `429` | IP rate-limited | Wait 60–120 s, use proxy or different IP |
| `500` | Instagram internal error | Retry after 30 s |

### Detecting a login wall in HTML

When fetching profile pages without a valid session, Instagram sometimes returns a page that starts with:

```html
<html>...window._sharedData = {"config":{"viewer":null},...
```

or contains the string `"loginPage"` / `"You must be logged in"`. Check for these before attempting regex extraction and throw an explicit error rather than failing silently.
