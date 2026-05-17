# Debugging

Frontend debugging is mostly Chrome DevTools plus two extensions (Redux DevTools, React DevTools). Start with [`workflow/0-setup.md`](workflow/0-setup.md) once; after that, pick the page that matches the symptom.

## By symptom

| When you want to…                                             | Read                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| set up Chrome and the extensions                              | [`workflow/0-setup.md`](workflow/0-setup.md)                   |
| see exactly what HTTP request the app sent and what came back | [`workflow/1-trace-http.md`](workflow/1-trace-http.md)         |
| see WebSocket frames going in and out                         | [`workflow/2-trace-ws.md`](workflow/2-trace-ws.md)             |
| inspect or edit Session Storage (auth tokens etc)             | [`workflow/3-storage.md`](workflow/3-storage.md)               |
| see what Redux is doing — actions, state, RTK Query cache     | [`workflow/4-redux-devtools.md`](workflow/4-redux-devtools.md) |
| look at the React component tree, props, hook state           | [`workflow/5-react-devtools.md`](workflow/5-react-devtools.md) |

## A general "where do I start" flow

1. **Network first.** Did the API call go out? What was the status? Most "the button doesn't work" bugs are visible here.
2. **Redux second.** If the API call succeeded but the UI doesn't reflect it, the bug is between the response and the render. Look at the RTK Query cache for that endpoint.
3. **Storage if auth is involved.** Session Storage holds the JWT tokens; check there if "logged in but acting like a guest" or vice versa.
4. **React DevTools last.** If the data is correct in Redux but the wrong thing renders, look at the component tree and check what props the rendering component actually received.

## Backend is the cause sometimes

A backend that's down looks identical to a frontend networking bug. Before chasing the frontend, run:

```bash
curl http://localhost:8000/api/health/
```

If that fails, fix the backend first. Backend docs: <https://github.com/capitanx9/llm-portrait/blob/main/docs/README.md>.
