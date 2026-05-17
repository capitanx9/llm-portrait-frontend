# 4 · Browser storage

Where the app keeps state that survives a page reload — and how to look at it.

## Where to open

DevTools → **Application** tab → left sidebar → **Storage** section.

The Application tab is huge; only a few entries matter here:

- **Local Storage** — long-lived key/value strings per origin. Survives tab close.
- **Session Storage** — same shape as Local Storage, but cleared when the tab closes.
- **Cookies** — key/value pairs sent automatically with every same-origin request.
- **Cache Storage** — what a Service Worker caches (we don't use one).

## What this app stores

### Session Storage → `llm-portrait.auth`

The auth slice writes the current `{accessToken, refreshToken, user}` here on every change. Click the row, the right pane shows the JSON value.

A live entry looks like:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "oleksa", "email": "oleksa@example.com" }
}
```

Empty after logout:

```json
{ "accessToken": null, "refreshToken": null, "user": null }
```

### Local Storage and Cookies

We don't use Local Storage. The only cookie is `csrftoken` set by Django on some responses; we don't read it (we use JWT in headers, not cookie auth).

## Things you'll do here

### See if the user is logged in

Look at Session Storage → `llm-portrait.auth`. If `accessToken` is a string, they're logged in. If `null`, they're a guest.

### Force a logout without hitting the backend

Right-click the `llm-portrait.auth` entry → **Delete**. Refresh the page. The app boots without an access token and `ProtectedRoute` will bounce protected routes to `/login`.

### Verify a write happened

Make any change in the app (login, logout, refresh). The Application tab does **not** auto-refresh — click the **↻** (refresh) button at the top of the Storage list, or just click another section and back. The new value should appear.

### Edit a value by hand

Double-click the value cell in Session Storage. Paste your edit. Press Enter. The next page load reads the new value.

This is how you simulate edge cases without changing code: corrupt the access token, drop the refresh token, etc.

## Cross-reference with Redux

The auth slice mirrors Redux state into Session Storage on every write. They should always match:

| Redux state (Redux tab) | Session Storage (`llm-portrait.auth`) |
| ----------------------- | ------------------------------------- |
| `auth.accessToken`      | `accessToken`                         |
| `auth.refreshToken`     | `refreshToken`                        |
| `auth.user`             | `user`                                |

If they disagree, a write path in the slice isn't calling `persist()`. See `src/features/auth/slice.ts`.

## Clearing everything

Application → **Storage** (the top-level entry, with the bin icon) → **Clear site data**. Wipes Local Storage, Session Storage, cookies and Cache. Like opening the app for the first time. Useful when you suspect leftover state is causing weird behaviour.
