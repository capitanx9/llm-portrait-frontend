# 3 · Trace a WebSocket

The chat socket is opened by `<ChatPage />` via `react-use-websocket`. The contract (channels and frame shapes) lives in the backend's `schemas/asyncapi.yaml`.

## Where to look in DevTools

Network tab, filter **WS** (not "WebSocket" or "All"). The single entry you want is:

```
ws://localhost:5173/ws/chat/<room>/?token=<access>
```

Click it to see four sub-tabs:

- **Headers** — confirm status `101 Switching Protocols` and the upgrade succeeded. Look at `Sec-WebSocket-Key` if you need to prove the handshake completed.
- **Messages** (Chrome) / **Frames** (Safari) — every frame in either direction. Outgoing in one colour, incoming in another.
- **Cookies** / **Timing** — rarely useful.

## Successful run

1. Pick a room in the sidebar.
2. WS upgrades to 101.
3. The reconnect banner disappears (`<ConnectionBanner state="open" />` returns `null`).
4. Type a message and hit Enter. In the frames pane you'll see your `{"text":"..."}` go out, then a `{"id":N, "sender":"you", "text":"...", "created_at":"..."}` come back. The bubble appears in the UI.

Tip: open a second incognito window logged in as a different user, join the same room. You'll see the broadcast frame arrive in both windows simultaneously.

## Frame shapes

Outgoing (client → server):

```json
{ "text": "hello room" }
```

Incoming (server → client):

```json
// normal broadcast — rendered in chat
{ "id": 42, "sender": "alice", "text": "hello room", "created_at": "2026-05-17T12:34:56.789Z" }

// error frames — ignored by the receive path today
{ "error": "invalid_json", "detail": "..." }
{ "error": "internal", "detail": "..." }
```

We dedupe broadcasts by `id` because the user's own messages come back through the same channel as everyone else's — no optimistic update.

## Reconnect behaviour

Configured in `ChatPage.tsx`:

```ts
useWebSocket(url, {
  shouldReconnect: () => true,
  reconnectAttempts: 10,
  reconnectInterval: 3000,
  share: false,
})
```

To reproduce:

1. With the chat open, stop daphne on the backend side.
2. The banner switches to "Reconnecting…" within a couple of seconds (`readyState` is no longer `OPEN`).
3. The composer is disabled.
4. Restart daphne. The hook reconnects on its next interval; the banner disappears.

After 10 failed attempts the hook gives up. The user can switch rooms or refresh the page to force a fresh connection.

## URL composition

`wsUrlFor` in `ChatPage.tsx`:

```ts
;`${proto}//${window.location.host}/ws/chat/${encodeURIComponent(name)}/?token=${encodeURIComponent(token)}`
```

- In dev: `ws://localhost:5173/...` → vite proxies `/ws/*` to `ws://localhost:8001` (daphne).
- In prod: `wss://<same hostname>/...` → CloudFront forwards to the backend.

If your WS fails to upgrade locally with a 502 or just hangs, the most likely cause is daphne not running on `:8001`. Check `make` targets on the backend side.

## When you only have a token error

A common confusing failure: WS opens (101) and immediately closes. That's usually the backend rejecting the JWT — Channels does not get to send a meaningful frame because the connection is closed during the auth phase. Check the daphne logs on the backend side; the frontend can't see the rejection reason.

## CJS interop note

If the chat page crashes with `useWebSocket is not a function`, the unwrap in `ChatPage.tsx` is the place to look. `react-use-websocket@4` ships CJS and Vite's interop sometimes hands back the module namespace instead of the hook. See [`api/client.md`](../../api/client.md#cjs-interop-note).
