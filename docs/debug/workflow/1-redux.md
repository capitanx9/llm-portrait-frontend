# 1 · Redux DevTools and RTK Query cache

Redux DevTools is the single most useful debug tool on this frontend. It shows every action, the state diff and the full RTK Query cache.

## Install

Chrome / Firefox: search for "Redux DevTools" in the extension store. Safari: the extension exists but is finicky; Chrome is the smoother path.

Once installed, refresh the app and a "Redux" tab appears in DevTools.

## What you'll see

The state tree has three branches:

```
{
  api: { ... },         // RTK Query — queries, mutations, subscriptions, cache
  auth: { accessToken, refreshToken, user },
  chat: { activeRoomName }
}
```

### Auth

Watch `auth.accessToken` go from `null` → `"eyJ..."` after login, and back to `null` on logout. Every change is also mirrored into `sessionStorage` (see Application tab → Session Storage → `llm-portrait.auth`).

Useful actions to filter on:

- `auth/setCredentials` — login or token refresh.
- `auth/setUser` — `/api/auth/me/` returned a user.
- `auth/clearCredentials` — logout or refresh-token gave up.

### Chat

Just `chat/setActiveRoom`. Click rooms in the sidebar, watch the action fire.

### RTK Query (`api`)

Open `api` and you'll see:

- `queries` — one entry per active query, keyed by a serialized arg string like `getMessages({"name":"general","limit":50})`. Each entry has its own `status`, `data`, `error`, `requestId`.
- `mutations` — in-flight mutations (login, createRoom, processAi, …).
- `subscriptions` — which components are still mounted and care about each query.
- `provided` / `invalidationsByType` — tag bookkeeping; lets you trace why a cache entry got refetched.

### Common moves

- **Why didn't my UI update?** Find the query in `api.queries`, look at `status` and `data`. If `data` is what you want but the component renders something else, the bug is in the component.
- **Why did this query re-fire on its own?** Search the actions list for `api/invalidate` — the `tag` payload tells you who invalidated whom.
- **Time-travel.** The extension lets you jump to any previous action; the UI re-renders accordingly. Use it for "what state was the app in when X happened".

## Action filtering

Type a substring in the filter box to limit which actions show up. Useful presets:

- `auth/` — auth lifecycle
- `api/executeQuery` — REST traffic
- `api/internal_updateSubscriptionOptions` — noise; hide it

## Storage tab cross-reference

The `auth` slice persists to `sessionStorage` on every change. If something looks stale, check both:

- Application → Session Storage → `llm-portrait.auth` (what's persisted)
- Redux DevTools → state → `auth` (what the store currently holds)

They should always match. If they don't, the slice has a write-path that doesn't go through `persist()`.
