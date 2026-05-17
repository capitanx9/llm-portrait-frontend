# 4 · Redux DevTools

The Redux tab shows the entire app state and every action dispatched. It's the fastest way to understand "why does the UI look like this right now".

## Where to open

DevTools → **Redux** tab. Comes from the Redux DevTools extension; if you don't see the tab, install the extension (see [`0-setup.md`](0-setup.md)).

## Layout

The tab has two panes side by side.

### Left pane — actions

A scrollable list of every dispatched action, newest at the bottom. Each row is one dispatch:

```
auth/setCredentials
api/executeQuery/pending
api/executeQuery/fulfilled
chat/setActiveRoom
…
```

At the top of this pane: a filter box (type a substring to narrow, e.g. `auth/`), a pause button (stops collecting new actions), and a clear button.

Click any row in this list to select it. The right pane then shows that action's details.

### Right pane — inspector

Toolbar at the top of the right pane has three buttons that switch its content:

- **Action** — the dispatched action object: `{type: 'auth/setCredentials', payload: {access, refresh}}`. Useful to confirm what was actually sent in.
- **State** — the full state tree at the moment **after** this action ran. The tree is expandable: click `▶ auth` to drill in.
- **Diff** — what changed in state because of this action. Highlighted in green (added) and red (removed). This is what you'll look at most often: it tells you whether the action did anything at all, and if so what.

## State tree

```
{
  api:  { ... }              // RTK Query: queries, mutations, cache
  auth: { accessToken, refreshToken, user }
  chat: { activeRoomName }
}
```

- **`auth`** — JWT tokens and the current user. Mirrored to Session Storage on every change (see [`3-storage.md`](3-storage.md)).
- **`chat`** — which room is selected.
- **`api.queries`** — one entry per active query, keyed by serialized args like `getMessages({"name":"general","limit":50})`. Each has its own `status`, `data`, `error`.
- **`api.mutations`** — in-flight mutations.

## What to look for when something's wrong

**"My UI doesn't update after the call."**
Find the query in `api.queries`. If `data` is what you expect, the bug is in the rendering component, not the data layer.

**"This refetch fired on its own — why?"**
Filter actions for `api/invalidate`. The `payload.tags` says who invalidated whom.

**"I clicked the button, did anything happen?"**
Click the button, watch the left pane grow. If nothing dispatched, the click handler is broken or the button is disabled. If something dispatched but the result is wrong, click that row → switch the right pane to **Diff**.

## Useful tricks

- **Time travel** — click on any past action; the right pane shows state as of that point. Some versions of the extension also expose a "Jump" button on each row that rewinds the running app to that state.
- **Pause** — top of the left pane; stops collecting new actions (useful for snapshotting a state).
- **Skip** — right-click an action → Skip; the action is treated as if it never happened, state is recomputed.

## Cross-reference with Storage

The `auth` slice writes to Session Storage on every change. State in the Redux tab and value in Application → Session Storage → `llm-portrait.auth` should always match. If they disagree, see [`3-storage.md`](3-storage.md).
