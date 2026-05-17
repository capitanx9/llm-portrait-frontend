# Documentation

The frontend for [`llm-portrait`](https://github.com/capitanx9/llm-portrait): a React + Vite SPA that talks to the backend over REST and WebSocket.

## Pick by audience

**New developer, never seen the code:**

1. [`overview.md`](overview.md) — what this app does, in two screens.
2. [`architecture.md`](architecture.md) — what each `src/` folder is for and how data flows through it.
3. [`development/tooling.md`](development/tooling.md) — Make targets, husky, ESLint, Prettier, codegen.
4. [`development/workflow.md`](development/workflow.md) — branching, PRs, commit style.

**Running the app locally:**

- [`deployment/local.md`](deployment/local.md) — `make dev`, vite proxy, what to start on the backend side.

**Talking to the backend:**

- [`api/client.md`](api/client.md) — every endpoint we hit, the WebSocket contract, the JWT refresh flow, when to re-run `make gen-api`.

**Debugging:**

- [`debug/README.md`](debug/README.md) — by-symptom index and the general "where to start" flow.
- [`debug/workflow/0-setup.md`](debug/workflow/0-setup.md) — Chrome + extensions setup.
- [`debug/workflow/1-trace-http.md`](debug/workflow/1-trace-http.md) — see exactly which HTTP request was sent and what came back.
- [`debug/workflow/2-trace-ws.md`](debug/workflow/2-trace-ws.md) — WebSocket frames in and out.
- [`debug/workflow/3-storage.md`](debug/workflow/3-storage.md) — Session Storage, where auth tokens live.
- [`debug/workflow/4-redux-devtools.md`](debug/workflow/4-redux-devtools.md) — Redux DevTools, actions, RTK Query cache.
- [`debug/workflow/5-react-devtools.md`](debug/workflow/5-react-devtools.md) — Components + Profiler tabs.

**Testing and CI:**

- [`development/testing.md`](development/testing.md) — vitest, what we mock, how `renderWithProviders` works.
- [`development/ci.md`](development/ci.md) — GitHub Actions CI, branch protection, what gates a merge.

**Deployment:**

- [`deployment/s3-cloudfront.md`](deployment/s3-cloudfront.md) — production deploy via S3 + CloudFront (the CD pipeline lands in a follow-up PR).

## Related backend docs

The backend lives at <https://github.com/capitanx9/llm-portrait>. Useful entry points:

- Backend [`docs/overview.md`](https://github.com/capitanx9/llm-portrait/blob/main/docs/overview.md) — what the server actually does.
- Backend [`docs/api/rest.md`](https://github.com/capitanx9/llm-portrait/blob/main/docs/api/rest.md) and [`docs/api/ws.md`](https://github.com/capitanx9/llm-portrait/blob/main/docs/api/ws.md) — REST and WebSocket contracts, the source of truth for `api/client.md` on this side.
- Swagger UI at `/api/docs/` and AsyncAPI viewer at `/ws/docs/` on the running backend (`https://llm-portrait.gotdns.ch` in production, `http://localhost:8000` locally).
