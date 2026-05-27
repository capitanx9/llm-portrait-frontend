# llm-portrait-frontend

Single-page React app for [`llm-portrait`](https://github.com/capitanx9/llm-portrait): a chat with translation and conversation-summary AI actions.

- **Stack**: React 19 + TypeScript + Vite 8, MUI v9, Redux Toolkit 2 + RTK Query, react-router-dom v7, react-use-websocket, Vitest 4. ESLint + Prettier + husky/lint-staged for formatting. Make as the task runner.
- **Backend it talks to**: [`capitanx9/llm-portrait`](https://github.com/capitanx9/llm-portrait) — Django + Channels + Celery + Ollama. REST on `:8000` (Django), WebSocket on `:8001` (daphne).

## Quick start

```bash
make install     # npm ci
make dev         # vite dev server on http://localhost:5173
```

`/api/*` and `/ws/*` are proxied to the local backend by `vite.config.ts`. Bring the backend up via its own `make up` first; details in <https://github.com/capitanx9/llm-portrait/blob/main/docs/deployment/local.md>.

Production bundle locally:

```bash
make build       # produces dist/
make preview     # serves dist/ on :4173
```

## Common commands

```bash
make              # show every target with its description
make check        # lint + typecheck + tests — the pre-push gate
make test         # one-shot vitest run
make test-watch   # vitest in watch mode
make format       # prettier-write everything, then eslint --fix
make gen-api      # regenerate src/api/schema.ts from the backend's openapi.yaml
```

## Documentation

- [`docs/`](docs/) — full documentation, organised by audience.
- [`docs/overview.md`](docs/overview.md) — what this app does, in two screens.
- [`docs/architecture.md`](docs/architecture.md) — code layout and data flow.
- [`docs/api/client.md`](docs/api/client.md) — every endpoint we hit, JWT refresh flow, WebSocket contract.
- [`docs/development/`](docs/development) — tooling, testing, CI, workflow.
- [`docs/debug/`](docs/debug) — debug scenarios for Redux, HTTP and WebSocket.
- [`docs/deployment/`](docs/deployment) — local and production deploy.

## Code review

Pull requests are reviewed by [@mashincode](https://github.com/mashincode) (auto-requested via [`.github/CODEOWNERS`](.github/CODEOWNERS)).

## License

MIT (or whatever the backend repo uses — pick one before going public).
