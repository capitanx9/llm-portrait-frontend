# 5 · React DevTools

Two tabs added by the React Developer Tools extension. They let you look at the component tree the way React sees it, not the DOM the browser sees.

## ⚛ Components

DevTools → **⚛ Components** tab.

### What you see

Left pane: the component tree, rooted at `<App />`. Each node is a React component. Expand to drill in.

Right pane (when a node is selected):

- **props** — what was passed into the component.
- **hooks** — every `useState`, `useReducer`, `useContext`, `useMemo`, etc, with its current value. Anonymous hooks show up as `State`, `Memo`, etc, in the order they were called.
- **rendered by** — the parent chain. Useful for "where did this even come from".
- The line at the very bottom right has icons that jump to the source file or log the component instance to the console.

### Things you'll do here

**Find which component owns a piece of UI.**
Click the target icon (top-left of the Components tab), then hover the page. The component under your cursor highlights in the tree.

**See what props/hook state a component currently has.**
Select the component in the tree. Right pane shows everything. You can edit values inline — useful to test "what if this prop were different".

**Search the tree.**
Top-right has a filter box. Type a component name (`<ChatPage>`, `MessageList`).

**Hide host elements (`<div>`, `<button>`).**
Settings cog → "Components" → check "Hide components where..." with `**` to focus on real components.

## ⚛ Profiler

DevTools → **⚛ Profiler** tab.

Tells you which components rerendered, how long each took, and why.

### How to use it

1. Click the **● Record** button.
2. Interact with the page (click a button, switch rooms, etc).
3. Click ● again to stop.

A flame chart appears. Each horizontal bar is one commit (one render pass). Yellow/red = slow. Click a bar:

- The chart shows the components that rendered in that commit.
- Each box's width = how long that component took.
- Click a box → right pane shows the **reason** ("Props changed: roomName", "Hooks changed: 1", "Parent component rendered").

### Things you'll do here

**"Why is this slow?"**
Record an interaction, look for wide boxes in red. That component took too long. Usually it's an expensive `useMemo` missing or a list that doesn't memoize its items.

**"This component keeps rerendering."**
Record the interaction. Look at the commits — if your component appears in every one, click into each and read the "Why did this render" reason. If it's always "Parent rendered", the parent is the problem (and you might want `React.memo`).

### Settings worth flipping once

Settings cog → Profiler → **"Record why each component rendered while profiling"**. Off by default; once on, the "Why" panel has real data. There's a small perf cost, but for debugging it's worth it.

## When this tab matters less

For "I clicked a button and nothing happened" it's much faster to look at Network and Redux first. React DevTools shines for visual/render bugs: a stale prop, an unexpected re-render, or "where in the tree does this thing live".
