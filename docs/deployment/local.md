# Local deployment

Running the frontend on your machine, talking to a local backend.

## Prerequisites

- Node 20 or newer (see [`debug/workflow/0-setup.md`](../debug/workflow/0-setup.md) for the full toolchain).
- A backend running locally:
  - Django on `http://localhost:8000`
  - daphne on `ws://localhost:8001`

The backend's `docs/deployment/local.md` covers how to bring those up: <https://github.com/capitanx9/llm-portrait/blob/main/docs/deployment/local.md>. Short version is `make up` on the backend repo (docker-compose).

## Start the frontend

```bash
make install     # npm ci — first time, or after package.json changes
make dev         # vite dev server on http://localhost:5173
```

`make dev` runs in the foreground; Ctrl+C stops it. Hot Module Replacement is on by default — edits to most files reload the affected modules without a full page refresh.

If you only want to serve the production bundle locally (to mimic what S3 + CloudFront will serve):

```bash
make build       # produce dist/
make preview     # serve dist/ on http://localhost:4173
```

`preview` is closer to production than `dev`: bundled, minified, no HMR. Useful for catching "works in dev, broken in prod" bugs.

## Vite proxy

`vite.config.ts` forwards two paths to the backend so the browser thinks everything is same-origin:

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8000', changeOrigin: true },
    '/ws':  { target: 'ws://localhost:8001', ws: true },
  },
}
```

That's why the frontend uses relative URLs (`/api/chat/rooms/`, `/ws/chat/<room>/`) and still works in production where everything is on one origin.

If the backend is on different ports, edit those lines. Don't bother changing the frontend's `baseUrl`.

## Demo accounts

If the backend was seeded with `make seed-users` (on the backend side):

- `oleksa / pass1234`
- `bohdan / pass1234`
- `mariia / pass1234`
- and more

Otherwise just register via the UI.

## Common issues

- **Anything 401 or "Network error" on first load.** The backend isn't running or isn't on `:8000`. Hit `curl http://localhost:8000/api/health/` to check.
- **`/chat` works but the socket never opens.** daphne isn't on `:8001`. The vite proxy will return a 502 on the upgrade.
- **`useWebSocket is not a function` in the browser.** Already fixed in code with an explicit CJS unwrap; if you see it after a `node_modules` rebuild, see [`api/client.md`](../api/client.md#cjs-interop-note).
- **`tsc -b` crashes locally.** You're probably on Node 23+ with an old TypeScript. The repo pins `~5.8.0` for that reason — make sure your `node_modules` is up to date (`make install`).

## What's next

Production deploy is S3 + CloudFront, see [`s3-cloudfront.md`](s3-cloudfront.md).
