# 2 · Inspect HTTP requests

Every REST call the app makes shows up in the Network tab. This is your single most useful debug tool: it tells you in one glance whether the bug is on the frontend or the backend.

## Where to open

DevTools → **Network** tab. Above the request list there's a row of filter chips — click **Fetch/XHR** to hide the noise (JS/CSS/images) and only see API calls.

If the list is empty: Chrome by default only records traffic while DevTools is open. Open DevTools first, then reproduce the action.

## What you see

A row per request, in the order they happened:

| Column        | What it tells you                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Name**      | URL path. Click the row to inspect.                                                                                                                          |
| **Status**    | HTTP code. 200/201 = good. 4xx = the client did something wrong (auth, validation). 5xx = the server broke. (pending) means the request hasn't finished yet. |
| **Type**      | `fetch` / `xhr` for our API calls.                                                                                                                           |
| **Initiator** | The file:line that triggered the request. Useful when you don't know which component made the call.                                                          |
| **Time**      | How long it took.                                                                                                                                            |
| **Waterfall** | Visual timeline of the request.                                                                                                                              |

Status codes are colour-coded: green for 2xx, yellow for 3xx, red for 4xx and 5xx. A red row is where you start looking.

## Inspecting a single request

Click any row. A side panel opens with these tabs:

- **Headers** — request method, URL, query params, request and response headers. This is where you confirm `Authorization: Bearer eyJ...` was attached.
- **Payload** — the request body. For our `POST /api/auth/login/` you'd see `{"username":"oleksa","password":"..."}` here.
- **Preview** — pretty-printed response body (collapsible JSON tree). Best for JSON responses.
- **Response** — raw response bytes.
- **Initiator** — call stack that led to the request. Click any frame to jump into Sources at that line.
- **Timing** — breakdown of where the time went (DNS / connect / TTFB / download).

## When the bug is "something doesn't work"

The pattern that works 80% of the time:

1. Open Network → Fetch/XHR.
2. Reproduce the action in the UI.
3. Find the most recent row.
4. Look at the status:
   - **2xx** — backend says it's fine. The bug is in how the frontend handles the response. Check **Preview** to see what data came back, then jump to [`4-redux-devtools.md`](4-redux-devtools.md) and look at the RTK Query cache.
   - **4xx** — frontend sent something invalid. Open **Payload** and **Preview**: the server usually returns `{"detail": "..."}` with a useful message.
   - **5xx** — backend broke. The frontend can't fix this; pass the request ID (visible in the response `x-request-id` header) to whoever is debugging the backend.
   - **(failed) or no request at all** — the network call never reached the server. Common causes: backend not running, wrong proxy in `vite.config.ts`, or the click handler never fired.

## Useful options

- **Preserve log** (checkbox top-left) — keeps requests when you navigate. Off by default; turn it on when debugging multi-page flows like login → redirect.
- **Disable cache** (checkbox top-left) — only matters while DevTools is open. Useful when you suspect a stale response is cached.
- **Throttling** (dropdown at the top) — simulate slow connections. Useful for testing loading states.
- **Filter box** — type any substring of the URL to narrow the list, e.g. `auth` to see only auth endpoints.
- **Right-click a row** → "Copy as cURL" — exports the request as a `curl` command, paste into a terminal to reproduce against the backend directly.

## Local CORS

You shouldn't see CORS errors locally — Vite proxies `/api/*` and `/ws/*` so the browser thinks it's same-origin. If a CORS error appears in the Console, you're either talking to the backend directly (wrong baseUrl) or hitting an endpoint that isn't proxied.
