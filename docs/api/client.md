# API client

How the frontend talks to the backend over REST and WebSocket. The contract is owned by the backend; we generate types from its `schemas/openapi.yaml` and follow its `schemas/asyncapi.yaml` by hand for WS frames.

## Codegen

We do not hand-write request/response types. `make gen-api` does this:

```bash
make gen-api
# under the hood:
# openapi-typescript \
#   https://raw.githubusercontent.com/capitanx9/llm-portrait/main/schemas/openapi.yaml \
#   --output src/api/schema.ts
```

- Source is the **committed** `schemas/openapi.yaml` on the backend's `main`, served as a raw blob by GitHub. No live backend needed.
- Output is `src/api/schema.ts`, committed to this repo so CI/CD builds don't need network access to either GitHub or the backend.
- When to rerun: after any backend PR that touches the API. Open a frontend PR that has only the regenerated `schema.ts` plus whatever consumer code needs updating.

`make gen-api-check` exists for CI: it regenerates into a temp file and `diff`s against the committed copy. Fails if the committed schema is stale.

The generator hates being reformatted, so `.prettierignore` excludes `src/api/schema.ts`.

## Base URL and the dev proxy

`fetchBaseQuery` is configured with `baseUrl = "<window.location.origin>/"` (with a Node fallback for tests). Every endpoint passes a relative path like `/api/chat/rooms/`.

- **Dev**: the browser hits `http://localhost:5173/api/...`. `vite.config.ts` proxies `/api/*` to `http://localhost:8000` (Django) and `/ws/*` to `ws://localhost:8001` (daphne). No CORS gymnastics — the browser thinks everything is same-origin.
- **Prod**: served from CloudFront. `/api/*` and `/ws/*` must reach the backend; the routing config is set up on the backend deployment side.

Why an absolute origin instead of just `'/'`? Because `undici` (Node's fetch in tests) refuses relative URLs. Resolving to `window.location.origin` is correct in the browser, and `'http://localhost'` works for vitest under jsdom.

## REST endpoints we use

All routes are typed off `paths` in `src/api/schema.ts`. The list:

### Auth (`src/features/auth/api.ts`)

| Method | Path                  | Body                          | Response                    | Notes                                                                                                   |
| ------ | --------------------- | ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| POST   | `/api/auth/register/` | `{username, email, password}` | 201 `{id, username, email}` | On success we redirect to `/login`.                                                                     |
| POST   | `/api/auth/login/`    | `{username, password}`        | 200 `{access, refresh}`     | On success we `dispatch(setCredentials({access, refresh}))`.                                            |
| POST   | `/api/auth/refresh/`  | `{refresh}`                   | 200 `{access}`              | Called automatically by the reauth interceptor on 401.                                                  |
| POST   | `/api/auth/logout/`   | `{refresh}`                   | 205                         | Backend blacklists the refresh token. We clear local state in `finally`, regardless of network outcome. |
| GET    | `/api/auth/me/`       | —                             | 200 `{id, username, email}` | Drives the `/profile` page.                                                                             |

### Chat (`src/features/chat/api.ts`)

| Method | Path                               | Body / params            | Response                                  | Notes                                                                                                                                         |
| ------ | ---------------------------------- | ------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/chat/rooms/`                 | `?limit=100`             | `PaginatedRoomList` or raw `Room[]`       | `transformResponse` accepts both; we flatten to `Room[]`.                                                                                     |
| POST   | `/api/chat/rooms/`                 | `{name}`                 | 201 `Room`                                | Invalidates the room list tag; we auto-select the new room.                                                                                   |
| GET    | `/api/chat/rooms/<name>/messages/` | `?limit=50&before=<id?>` | `PaginatedMessageList` or raw `Message[]` | Cursor pagination via `?before=<oldest-id>`. We sort ascending by id so chronological order is stable regardless of what the backend returns. |

### AI (`src/features/ai/api.ts`)

| Method | Path               | Body                                                      | Response                                     | Notes                                              |
| ------ | ------------------ | --------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| POST   | `/api/ai/process/` | `{action: 'translate', message, target_language}`         | 200 `{action, source_language, translation}` | Per-message translation; result rendered inline.   |
| POST   | `/api/ai/process/` | `{action: 'summarize', conversation: ConversationTurn[]}` | 200 `{action, source_language, summary}`     | Conversation summary; result rendered in a dialog. |

Errors mapped to UI:

- **401** → reauth interceptor handles it; the consumer never sees it directly unless refresh also fails.
- **429** → bottom snackbar "Rate limit, try again in a minute".
- **503** → bottom snackbar with the server's `detail` (e.g. Ollama down).
- **400 (auth/register)** → field-level errors rendered under the form input.
- Everything else → an inline `<Alert severity="error">` near where the call was made.

## The reauth interceptor (REST)

Lives in `src/api/baseApi.ts` as `baseQueryWithReauth`. For every request:

1. `prepareHeaders` attaches `Authorization: Bearer <accessToken>` if one is present in the Redux store.
2. If the response is anything other than 401, return it as-is.
3. On 401, read `refreshToken` from the store. If absent, dispatch `clearCredentials()` and return the 401 to the caller.
4. POST the refresh token to `/api/auth/refresh/`. If we get back `{access}`, dispatch `setCredentials({access})` (refresh token is **not** touched) and retry the original request once.
5. If refresh also fails, dispatch `clearCredentials()`. `ProtectedRoute` notices `accessToken === null` and bounces to `/login`.

There is no mutex; concurrent 401s can each trigger their own refresh. This is fine for the small surface we have and avoids dragging in `async-mutex`. If we ever need it we'll add it.

See [`debug/workflow/2-trace-http.md`](../debug/workflow/2-trace-http.md) for how to reproduce the 401 → refresh flow in DevTools.

## WebSocket

Channel address (from the backend's AsyncAPI):

```
/ws/chat/{name}/?token={accessToken}
```

We build the URL from `window.location.host` so the same code works locally (`ws://localhost:5173`, proxied to `:8001`) and in production (`wss://<same hostname>`).

### Incoming frames

```ts
// ChatMessageOut — the only frame we render into the chat history
{ id: number, sender: string, text: string, created_at: string }

// Error frames — currently ignored on the receive path
{ error: 'invalid_json', detail: string }
{ error: 'internal', detail: string }
```

A `ChatMessageOut` lands in a per-room in-memory live buffer on the page. The buffer is merged with REST history (deduped by id) before render. We dedupe by id because the user's own messages come back through the broadcast just like everyone else's — no optimistic update.

### Outgoing frames

```ts
{
  text: string
}
```

Sent on Enter or "Send". The server silently ignores empty/whitespace text and truncates anything beyond 4000 chars.

### Reconnect

We use `react-use-websocket` with:

```ts
{
  shouldReconnect: () => true,
  reconnectAttempts: 10,
  reconnectInterval: 3000,
  share: false,
}
```

The composer is disabled and a `<ConnectionBanner state="connecting" />` is shown whenever `readyState !== OPEN`.

### CJS interop note

`react-use-websocket@4` ships CJS. Vite's interop hands us a module namespace where `default` is the export bag rather than the hook itself, so `ChatPage.tsx` unwraps the nested default at import time. If you ever see `useWebSocket is not a function`, that's the unwrap to look at. `optimizeDeps.include` alone was not enough.

## Snapshotting the contract

When the backend says "we shipped an API change":

```bash
make gen-api          # regenerate src/api/schema.ts
make gen-api-check    # sanity-check it matches the live schema
make check            # lint + typecheck + tests
git diff src/api/schema.ts
```

Diff of `schema.ts` tells you exactly which paths and component shapes changed; let the type errors that follow drive the consumer edits.
