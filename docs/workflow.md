# Detailed Workflow

This document expands on the rules in `CLAUDE.md` with examples and
checklists. Read this once at the start of a session; refer back when
unsure what a step should look like.

## The loop, in order

```
Read spec  →  Plan  →  WAIT for approval  →  Tests  →  Code  →
Fill test bodies  →  Run tests  →  Lint  →  Clean up  →  Report
```

Never skip a step. Never reorder. If you find yourself "just quickly
fixing something" outside this loop, stop and start a new plan.

## What a good plan looks like

Here is the shape of a plan that earns approval on the first try:

> **Slice:** Implement R8 (POST /item) and R11 (websocket broadcast on add).
>
> **Files:**
> - `server/src/state.js` (new) — holds the `items` object and a
>   `nextItemId` counter; exports `addItem`, `getItems`.
> - `server/src/broadcast.js` (new) — wraps the WebSocket server, exports
>   `broadcast(message)`.
> - `server/src/routes/items.js` (new) — Express router for `/item` and
>   `/items`.
> - `server/src/server.js` (new) — wires Express + HTTP server + WS.
> - `server/test/post-item.test.js` (new).
>
> **Edge cases considered:**
> - Empty request body → 400 (R8a).
> - `name` is not a string (number, null, object, array) → 400.
> - `name` is empty string or whitespace-only → 400.
> - Two POSTs in quick succession get distinct `item_id`s.
> - `createdAt === updatedAt` on creation (R5 implied).
> - Broadcast happens AFTER state update, never before (R12a).
> - If broadcast throws, the HTTP response still succeeds (state is
>   already committed) — log the error.
>
> **Tests to write first (descriptions):**
> - "creates an item and returns it with 201"
> - "assigns a unique incrementing item_id across multiple posts"
> - "sets createdAt equal to updatedAt on creation"
> - "rejects missing name with 400"
> - "rejects non-string name with 400"
> - "rejects empty/whitespace name with 400"
> - "broadcasts item_added to connected websocket clients on success"
> - "does not broadcast on validation failure"
>
> **Requirements addressed:** R5, R8, R8a, R11, R12a (partial).
> **Requirements deferred:** R7 filtering, R9 PATCH, R13–R15 test mode.
>
> Awaiting approval before writing code.

Notice what is NOT in the plan: implementation details ("I'll use a Map
versus a plain object"), library choices beyond what the spec dictates,
or speculative future features.

## Writing tests first

Two acceptable styles:

**Style A — full tests up front:**
```js
test('assigns a unique incrementing item_id across multiple posts', async () => {
  const first = await request(app).post('/item').send({ name: 'a' });
  const second = await request(app).post('/item').send({ name: 'b' });
  expect(second.body.item_id).toBe(first.body.item_id + 1);
});
```

**Style B — descriptions first, bodies after:**
```js
test.todo('assigns a unique incrementing item_id across multiple posts');
```

Pick one style per slice. If you use Style B, you MUST fill in the bodies
before reporting done. `test.todo` left behind counts as incomplete work.

## Linting

- Use ESLint. If no config exists yet, create one with at least:
  - `no-unused-vars: error`
  - `no-unused-imports` (via plugin) or equivalent
  - `id-length: ["error", { min: 2 }]` to enforce R17
- Run `npm run lint` (add the script if missing).
- Fix all warnings, not just errors. If a warning seems wrong, raise it
  for discussion rather than disabling the rule.

## Cleanup checklist (run before reporting done)

- [ ] All tests pass (`npm test`)
- [ ] Linter is clean (`npm run lint`)
- [ ] No `test.todo` or empty test bodies left
- [ ] No unused imports
- [ ] No unused variables
- [ ] No dead functions or commented-out code
- [ ] No `console.log` from debugging
- [ ] No single-character identifiers (grep is your friend)
- [ ] No TODO comments without an associated tracked task

## What "done" looks like in your report

A done report should include:
- Which requirement IDs are now satisfied.
- Which test files were added and how many tests pass.
- Confirmation that the linter is clean.
- Anything you noticed but did NOT change (for me to decide on).

Example:
> Implemented R8, R8a, R11. Added `server/test/post-item.test.js` with 8
> passing tests. Lint clean. Noted but not changed: the spec doesn't say
> what should happen if `name` is extremely long (>1MB) — currently
> accepted. Flag for discussion?
