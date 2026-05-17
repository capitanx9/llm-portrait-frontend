# Debugging

Frontend debugging is mostly the browser DevTools plus the Redux DevTools extension. Each scenario below assumes you've already gone through [`workflow/0-setup.md`](workflow/0-setup.md).

## Scenarios

| When you want to…                                                    | Read                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| set up your environment so the rest is useful                        | [`workflow/0-setup.md`](workflow/0-setup.md)           |
| see what actions Redux is dispatching, inspect RTK Query cache       | [`workflow/1-redux.md`](workflow/1-redux.md)           |
| follow a REST request, especially the 401 → refresh → retry sequence | [`workflow/2-trace-http.md`](workflow/2-trace-http.md) |
| watch WebSocket frames and reconnect behaviour                       | [`workflow/3-trace-ws.md`](workflow/3-trace-ws.md)     |

## When in doubt

1. Open DevTools **before** reproducing the bug (browsers don't capture network/WS traffic that happened with DevTools closed).
2. Disable cache in the Network tab while you debug — Vite caches aggressively in dev.
3. `sessionStorage` is your auth state's source of truth. Clearing it logs you out cleanly without touching the backend.
4. A backend that's down looks identical to a frontend networking bug. Hit `curl http://localhost:8000/api/health/` first; if that's broken, fix the backend first.
