# 3 · Inspect WebSocket frames

The chat socket lives in the Network tab too, just under a different filter.

## Where to open

DevTools → **Network** → click the **WS** filter chip. The list collapses to WebSocket connections only; for our app that's normally a single entry per open chat room:

```
ws://localhost:5173/ws/chat/<room>/?token=<jwt>
```

Status `101 Switching Protocols` means the upgrade succeeded. Anything else and the connection never opened.

## Inspecting a connection

Click the row. Four tabs in the side panel:

- **Headers** — confirm status 101 and the requested URL (room name and token visible in the query string).
- **Messages** — every frame in either direction. **This is where you actually debug.**
- **Cookies** — rarely useful.
- **Timing** — when the connection opened and closed.

## The Messages tab

A live list of frames, newest at the bottom:

- **Green arrow ▲** — outgoing (the browser sent it).
- **Red arrow ▼** — incoming (the server sent it).
- Click a row to see the full payload in the bottom pane.

For our app:

```
▲  {"text":"hello room"}              # what we send
▼  {"id":42,"sender":"alice","text":"hello room","created_at":"..."}   # broadcast back
```

Every message you send echoes back as a broadcast — including your own — because there's no optimistic UI.

## When the bug is "I sent a message and nothing happened"

1. Did the frame leave?
   - Look for the green arrow with your `{"text":"..."}`. No green arrow → the send call never fired (composer disabled because the socket is closed, or click handler broken).
2. Did the server respond?
   - Look for the red arrow with the matching id. No red arrow within a second → the server rejected the message silently (whitespace-only text), or the connection actually died.
3. Did we render it?
   - Frame arrived but no bubble in chat → bug in `<ChatPage />`. Switch to [`4-redux-devtools.md`](4-redux-devtools.md) and look at the chat messages buffer.

## When the bug is "the chat just stops working"

Common patterns:

- The WS row in Network is gone or **status is red** — the connection was closed. Click the row, look at the status line ("CLOSED" + close code). Common: backend rejected the JWT (token expired), daphne crashed, network dropped.
- Frames are flowing one way but not the other — bug on the side that's not talking. The browser can't show backend logs; ask backend.

## Useful options

- **Filter box** at the top of the Messages tab — narrow by substring. Type the message text to find it fast.
- **Clear** button (🚫 icon) — wipes the message list without closing the connection.
- The connection itself **does not get cleared** on hard reload of the page — Chrome closes the old one and opens a new one; you'll see two rows.

## Reconnect

`react-use-websocket` is configured to auto-reconnect 10× with a 3-second interval. While it's trying, the page shows a "Reconnecting…" banner and the composer is disabled. In Network you'll see a new WS row appear every 3 seconds with status 101 (if it succeeds) or "failed" (if the backend is still down).
