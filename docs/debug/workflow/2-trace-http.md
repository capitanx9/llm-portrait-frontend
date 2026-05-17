# 2 · Trace an HTTP request

Anything REST goes through `fetchBaseQuery` inside `baseQueryWithReauth`. This doc covers the easy case (a normal authenticated GET) and the interesting case (401 → refresh → retry).

## Easy case

1. Open DevTools → Network → filter "Fetch/XHR".
2. Reproduce the action in the UI.
3. Click the request. Useful tabs:
   - **Headers** — confirm `Authorization: Bearer eyJ...` is set.
   - **Preview** — backend-returned JSON in a tree view.
   - **Response** — raw bytes.

Status 200 + matching payload = the network is fine. If the UI still doesn't update, switch to [`1-redux.md`](1-redux.md) and look at the RTK Query cache for that endpoint.

## The reauth interceptor in action

`src/api/baseApi.ts` wraps every call. On a 401 it transparently calls `/api/auth/refresh/`, stores the new access token and replays the original request. The user sees nothing.

### Reproducing it manually

1. Log in normally (e.g. `oleksa / pass1234`).
2. Open `/profile`. Confirm it loads.
3. Open Application → Session Storage → `llm-portrait.auth` and edit the `accessToken` value by changing one character in the middle of the string (don't touch the signature segments boundaries, just flip a char). Press Enter.
4. Hard-reload `/profile` (Cmd+Shift+R).

You should see three Network requests in order:

```
GET  /api/auth/me/         → 401   detail: "Given token not valid for any token type"
POST /api/auth/refresh/    → 200   { access: <new> }
GET  /api/auth/me/         → 200   { id, username, email }
```

Watch in parallel:

- Redux tab — actions `api/executeQuery/rejected` then `auth/setCredentials` then `api/executeQuery/fulfilled`.
- Session Storage — `accessToken` updates to the new value (refresh token stays the same).
- The page — never flickers.

### When refresh also fails

If you corrupt **both** access and refresh tokens, the second request fails:

```
GET  /api/auth/me/         → 401
POST /api/auth/refresh/    → 401  (or 400)
```

The interceptor then dispatches `auth/clearCredentials`. The `ProtectedRoute` wrapper sees `accessToken === null` on the next render and bounces to `/login` via `<Navigate replace />`. The new URL appears in the address bar; session storage is empty.

### When `/api/auth/me/` is called automatically

The `me` endpoint is fired by `/profile` mount. Use that as your reliable trigger for testing the reauth flow — it's the simplest authenticated GET in the app.

## What to grep when something looks wrong

- Missing Bearer header → `prepareHeaders` in `src/api/baseApi.ts`.
- Wrong base URL → `fetchBaseQuery({ baseUrl: ... })` in the same file.
- vite proxy not matching → `vite.config.ts → server.proxy`.
- 401 not triggering a refresh → the `if (result.error?.status !== 401)` guard in `baseQueryWithReauth`.

## CORS in dev

You shouldn't see any. vite proxies `/api/*` to `:8000` server-side, so the browser thinks it's same-origin. If you ever do see a CORS error in the console, you're talking to the backend directly (wrong baseUrl) or hitting an endpoint outside `/api/*` that isn't proxied.
