# 0 · Setup

What you need installed and running before any of the other debug docs make sense.

## Toolchain

- **Node 20+** (CI runs on 20). Local Node 25 works for development, but TypeScript ≥ 5.7 is required there — we already pin `~5.8.0` for that reason.
- **npm** (ships with Node).
- A browser. Anything Chromium-based or Safari/Firefox; the docs use Safari / Chrome wording interchangeably.

## Browser extensions

- **Redux DevTools** — Chrome / Firefox / Safari. Strongly recommended; the rest of [`1-redux.md`](1-redux.md) assumes it.
- **React Developer Tools** — useful but not essential.

## First run

From the repo root:

```bash
make install      # npm ci
make dev          # vite dev server on http://localhost:5173
```

Open `http://localhost:5173`. You should see the AppBar with "llm-portrait" and Sign in / Register links.

If the dev server itself fails to start, that's almost always a dependency issue — try `make clean && make install`.

## Backend you'll talk to

Locally the frontend expects:

- Django REST on `http://localhost:8000`
- daphne WS on `ws://localhost:8001`

vite proxies `/api/*` to `:8000` and `/ws/*` to `:8001` (see `vite.config.ts`). If the backend isn't running, every authenticated request will fail. Health check before debugging anything else:

```bash
curl http://localhost:8000/api/health/
```

Backend-side runbook is in <https://github.com/capitanx9/llm-portrait/blob/main/docs/deployment/local.md>.

## DevTools panes you want open

- **Network** with the **Fetch/XHR** filter for REST traffic.
- **Network** with the **WS** filter for the chat socket.
- **Console** for `console.error` from React.
- **Application → Storage → Session Storage** to inspect `llm-portrait.auth`.
- **Redux** tab once you install the extension.

## Demo credentials

If the backend has been seeded (`make seed-users` on the backend), `oleksa / pass1234` works out of the box. Otherwise register a new user via the UI.
