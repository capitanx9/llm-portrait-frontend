# Overview

The frontend is a single-page React app that lets a logged-in user join a chat room, talk in real time with other users, and hand specific messages or whole conversations to an LLM for translation or summarization. The backend (Django + Channels + Celery + Ollama) does the persistence, broadcasting and the AI work; the frontend is the UI plus a small amount of state management.

## What a user can do

| Surface                             | What happens                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/register`                         | Create an account with username, email, password. On 201 we send them to `/login`.                                                                                                                   |
| `/login`                            | Exchange username + password for an access and a refresh JWT, redirect to `/chat`.                                                                                                                   |
| `/profile`                          | Show `id`, `username`, `email` from `GET /api/auth/me/`. Logout button blacklists the refresh token and clears local state.                                                                          |
| `/chat` (protected)                 | A two-column layout: room list on the left, the active room on the right. Pick a room, see history, type and send messages. New messages from anyone in the room arrive in real time over WebSocket. |
| Translate icon next to a message    | Open a six-language menu (`ru / en / uk / fr / es / de`); the translation renders inline under the original. Right-click on the bubble does the same thing.                                          |
| Summarize button in the chat header | Sends the last 200 visible messages to `POST /api/ai/process/` with `action: 'summarize'`; the result lands in a dialog.                                                                             |

## How it talks to the backend

JSON over HTTPS with `Authorization: Bearer <access>` on protected routes. Real-time updates come over a WebSocket on `/ws/chat/<name>/?token=<access>`. Messages are not rendered optimistically — we send, the server saves and broadcasts back, the bubble appears via the same path as everyone else's.

### Dev

- Frontend at `http://localhost:5173` (Vite dev server).
- Django REST at `http://localhost:8000`. Vite proxies `/api/*` to it.
- daphne (WebSocket) at `ws://localhost:8001`. Vite proxies `/ws/*` to it.

Browser thinks everything is same-origin — no CORS configuration involved.

### Production

- Frontend at <https://d16lbq7rem1z12.cloudfront.net> (S3 + CloudFront, AWS-managed cert on the raw `*.cloudfront.net` URL — no custom subdomain; see [`deployment/s3-cloudfront.md`](deployment/s3-cloudfront.md) for why).
- Backend at <https://llm-portrait.gotdns.ch>. REST at `/api/*`, WebSocket at `wss://.../ws/*`.
- TLS via ACM (frontend) and Let's Encrypt (backend); `wss://` for WebSocket.

**Split origin**: the browser talks to two hostnames. CORS preflight on REST is allow-listed via `CORS_ALLOWED_ORIGINS` on the backend, the WS handshake via `WS_ALLOWED_ORIGINS`. Detailed in the backend repo's [`docs/deployment/frontend.md`](https://github.com/capitanx9/llm-portrait/blob/main/docs/deployment/frontend.md).

## State and persistence

- Auth state (`accessToken`, `refreshToken`, `user`) lives in Redux and is mirrored into `sessionStorage` so a tab refresh keeps the user logged in. Closing the tab logs them out.
- Room selection (`activeRoomName`) lives in Redux but is not persisted — picking a room is a per-session choice.
- Message history is held by RTK Query's cache, keyed by room name. WebSocket-delivered messages are kept in a small in-memory buffer on the page and merged with the REST history before render.

For how the pieces fit together in the code, read [`architecture.md`](architecture.md).
