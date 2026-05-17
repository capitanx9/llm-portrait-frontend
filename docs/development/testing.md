# Testing

We use **Vitest 4** + **Testing Library** under **jsdom**. Tests live next to the code they test in `*.test.ts(x)` files.

```bash
make test         # one-shot
make test-watch   # vitest in watch mode (great for TDD)
make test-cov     # with coverage
```

## What's mocked

We avoid mocking when a real implementation is cheap. The two things we **do** mock:

- **`globalThis.fetch`** — for tests that exercise `baseApi` or any RTK Query endpoint. We replace it with `vi.fn()` and return crafted `Response` objects per call. This is necessary because `undici` (Node's fetch) doesn't accept relative URLs, so we either provide absolute URLs or mock fetch entirely.
- **`react-use-websocket`** — for tests that render `<ChatPage />`. We `vi.mock` the module to return a stub hook with controllable `lastJsonMessage`, `sendJsonMessage`, `readyState`. This is the only way to drive WS frame behaviour deterministically.

We do **not** mock the Redux store. Tests use a real store via `renderWithProviders`.

We do **not** mock the router. Tests use `MemoryRouter` from `react-router-dom`.

## `renderWithProviders` helper

Lives in `src/test/renderWithProviders.tsx`. Wraps a `render()` call with:

- A fresh Redux store (`baseApi.reducer`, `authReducer`, `chatReducer`).
- A `<MemoryRouter>` with an optional starting route.

It accepts preloaded auth and chat state, returns the rendered tree **plus the store** so you can inspect it after dispatch.

```tsx
const { store } = renderWithProviders(<App />, {
  preloadedAuth: { accessToken: 'tok', refreshToken: 'r' },
  preloadedChat: { activeRoomName: 'general' },
})
// later:
expect(store.getState().auth.accessToken).toBe('new-access')
```

## Patterns by test type

### Pure reducer tests

Cheapest tests in the codebase. Just call the reducer with a state and an action and assert on the result. Example: `src/features/auth/slice.test.ts`, `src/features/chat/slice.test.ts`.

```ts
const next = authReducer(empty, setCredentials({ access: 'a', refresh: 'r' }))
expect(next.accessToken).toBe('a')
```

### RTK Query endpoint tests

Use `makeTestStore` directly (no React tree needed). Mock `fetch` per test. Dispatch `endpoints.xxx.initiate(args)` and `.unwrap()`. Example: `src/features/ai/api.test.ts`, `src/api/baseApi.test.ts`.

```ts
fetchMock.mockResolvedValueOnce(jsonResponse({ access: 'new-access' }))
const store = makeTestStore({ auth: { accessToken: 'old', refreshToken: 'r' } })
const result = await store
  .dispatch(aiApi.endpoints.processAi.initiate({ action: 'translate', ... }))
  .unwrap()
```

Key trick: when the endpoint sends a body, RTK Query wraps the request in a `Request` object. The body is **not** on `init.body` — it's on `await req.clone().text()`. Helper:

```ts
async function readRequestBody(call: Parameters<typeof fetch>) {
  const [input, init] = call
  if (input instanceof Request) return JSON.parse(await input.clone().text())
  if (init?.body) return JSON.parse(init.body as string)
  return {}
}
```

### Component tests

`renderWithProviders` + `screen` queries. Prefer roles and accessible names over text content (more stable as copy changes). Example: `src/App.test.tsx`, `src/features/chat/MessageList.test.tsx`.

```tsx
renderWithProviders(<App />)
expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
```

### Pages that use WebSocket

Mock `react-use-websocket` at the top of the file:

```tsx
const wsHookMock = vi.fn<(...args: [string | null, unknown?]) => unknown>(() => ({
  sendJsonMessage: vi.fn(),
  lastJsonMessage: null,
  readyState: 1,
}))

vi.mock('react-use-websocket', () => ({
  default: (...args: [string | null, unknown?]) => wsHookMock(...args),
  ReadyState: { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 },
}))
```

The mock's signature needs to match what the hook is called with so TypeScript types check. Don't use `_url` or `_args` parameter names — the repo's ESLint config flags unused params even with the underscore.

Example: `src/features/chat/ChatPage.test.tsx`.

## Things that bit us

### Relative URLs vs undici

`fetchBaseQuery({ baseUrl: '/' })` works in the browser because the browser resolves relative URLs from `location.origin`. Node's `undici` does not — it throws `ERR_INVALID_URL` on `/api/protected/`. We fix this by setting `baseUrl` at runtime:

```ts
const API_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/`
    : 'http://localhost/'
```

And we point jsdom at `http://localhost/` in `vite.config.ts` so the test environment matches.

### `setState` in `useEffect`

The repo's ESLint config treats `react-hooks/set-state-in-effect` as an **error**. Use the "adjust state during render" pattern:

```tsx
const [snapshot, setSnapshot] = useState(externalValue)
if (snapshot !== externalValue) setSnapshot(externalValue)
```

Test components that previously relied on `setState`-in-effect; they'll need updating.

### `Element.prototype.scrollIntoView` is not in jsdom

If a component calls `el.scrollIntoView()`, jsdom blows up. Stub it once in `beforeEach`:

```ts
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})
```

### Names starting with `use`

ESLint's `react-hooks/rules-of-hooks` treats anything `use*` as a hook. A test mock variable called `useWebSocketMock` triggers a false positive. Rename to `wsHookMock` or similar.

## Coverage

`make test-cov` produces a `coverage/` directory with HTML report. Open `coverage/index.html`. We don't enforce a coverage gate in CI — the goal is "every branch the user can hit has at least a happy-path test", not a percentage.
