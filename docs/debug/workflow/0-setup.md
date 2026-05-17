# 0 · Setup

What you need installed before any of the other debug docs make sense.

## Browser

**Google Chrome.** Everything below uses Chrome's DevTools UI; Safari/Firefox have the same features but in different places.

## Extensions

Both are free on the Chrome Web Store; install once, then restart the browser.

- **Redux DevTools** — adds a "Redux" tab to DevTools. Used in [`4-redux-devtools.md`](4-redux-devtools.md).
- **React Developer Tools** — adds two tabs to DevTools, ⚛ Components and ⚛ Profiler. Used in [`5-react-devtools.md`](5-react-devtools.md).

## Opening DevTools

- `Cmd+Option+I` on macOS.
- Right-click anywhere on the page → "Inspect".
- `F12` on most keyboards.

DevTools opens docked to the right or bottom of the window. The toggle for docking position is the three-dot menu in the top-right corner of DevTools.

## The tabs you'll actually use

| Tab              | What for                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Network**      | Every HTTP request and WebSocket frame. See [`1-trace-http.md`](1-trace-http.md) and [`2-trace-ws.md`](2-trace-ws.md). |
| **Application**  | Storage (session, local, cookies) and cache. See [`3-storage.md`](3-storage.md).                                       |
| **Redux**        | Redux state tree + every action ever dispatched. See [`4-redux-devtools.md`](4-redux-devtools.md).                     |
| **⚛ Components** | React component tree, props, hooks state. See [`5-react-devtools.md`](5-react-devtools.md).                            |
| **⚛ Profiler**   | Record and analyse renders. Same doc.                                                                                  |

You can drag tab order around. Put the ones you use most on the left.

## First sanity check

```bash
make install
make dev
```

Open `http://localhost:5173`. DevTools → Network should show the initial document plus a handful of `.js`/`.css` requests, all 200.

## Backend prerequisite

The frontend expects:

- Django REST on `http://localhost:8000`
- daphne (WebSocket) on `ws://localhost:8001`

Health check before debugging:

```bash
curl http://localhost:8000/api/health/
```

If the backend isn't running, every authenticated request will fail and it will look like a frontend bug.
