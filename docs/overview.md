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

- **REST** for everything synchronous: auth, room CRUD, message history, AI calls. The Django app runs on `:8000` locally and behind the same hostname in production. We talk JSON over HTTPS with `Authorization: Bearer <access>` on protected routes.
- **WebSocket** for real-time message broadcast on `/ws/chat/<name>/?token=<access>`. Locally daphne serves this on `:8001`. In production it's behind the same hostname (`wss://`).
- **No optimistic UI**: messages we send go out, the server saves them and broadcasts back; the bubble appears via the same path as everyone else's. This keeps client and server in sync without manual reconciliation.

## State and persistence

- Auth state (`accessToken`, `refreshToken`, `user`) lives in Redux and is mirrored into `sessionStorage` so a tab refresh keeps the user logged in. Closing the tab logs them out.
- Room selection (`activeRoomName`) lives in Redux but is not persisted — picking a room is a per-session choice.
- Message history is held by RTK Query's cache, keyed by room name. WebSocket-delivered messages are kept in a small in-memory buffer on the page and merged with the REST history before render.

## What this app is **not**

- It does not generate API types by hand. The OpenAPI schema is committed in the backend repo; we regenerate `src/api/schema.ts` from it via `make gen-api`. See [`api/client.md`](api/client.md).
- It does not manage AI rate limits, models or providers — that's the backend's job. We surface 429 and 503 as a snackbar; everything else is a regular request.
- It does not have its own server. The production bundle is static files served from S3 behind CloudFront.

For how the pieces fit together in the code, read [`architecture.md`](architecture.md).
