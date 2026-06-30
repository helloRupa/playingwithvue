# Backend Specification

Source of truth for the backend. Every requirement has an ID (R1, R2, ...).
Reference these IDs in plans, commit messages, and code review.

## Stack

- **R1.** Node.js with Express.
- **R2.** CORS middleware configured to accept all origins.
- **R3.** JSON response support and JSON request body parsing enabled
  (`express.json()`).
- **R4.** No database. State is held in a single in-memory object named
  `items`, keyed by `id`. Initially seeded with 5 items with different names.

## Item shape

- **R5.** Each item has the following fields:
  - `id` (number, server-assigned, unique, monotonically increasing)
  - `name` (string, non-empty)
  - `createdAt` (ISO 8601 string)
  - `updatedAt` (ISO 8601 string)

## HTTP endpoints

### R6. `GET /items`

- Returns the full `items` object as JSON.
- Status 200.

### R7. `GET /items?last_update=<ISO datetime>`

- Returns only items whose `createdAt` OR `updatedAt` is **strictly after**
  the provided timestamp.
- Returned shape matches R6 (same object shape, filtered).
- **R7a.** Invalid ISO datetime → respond 400 with JSON
  `{ error: "invalid last_update" }`.
- **R7b.** Missing `last_update` parameter → behave exactly like R6.

### R8. `POST /item`

- Request body: `{ name: string }`.
- Server assigns `id`, `createdAt`, and `updatedAt`
  (`createdAt === updatedAt` on creation).
- Returns the created item as JSON with status 201.
- **R8a.** Missing `name`, non-string `name`, or empty `name` → respond 400
  with JSON `{ error: "invalid name" }`. No item is created.

### R9. `PATCH /item`

- Request body: `{ id: number, name: string }`.
- Updates the named item's `name` and refreshes its `updatedAt` to now.
- `createdAt` is NOT modified.
- Returns the updated item as JSON with status 200.
- **R9a.** If `id` is not in `items` → respond 404 with JSON
  `{ error: "item not found" }`.
- **R9b.** Missing or invalid `name` → respond 400 with JSON
  `{ error: "invalid name" }`. State is not modified.

## WebSockets

- **R10.** Server runs a WebSocket endpoint alongside Express (same HTTP
  server instance, upgraded). All connected clients receive broadcasts.
- **R11.** On successful `POST /item`, broadcast to all connected clients:
  ```json
  { "action": "item_added", "item_id": <number>, "name": <string>,
    "createdAt": <ISO>, "updatedAt": <ISO> }
  ```
- **R12.** On successful `PATCH /item`, broadcast:
  ```json
  { "action": "item_updated", "item_id": <number>,
    "changed": { "name": <new name> },
    "previous": { "name": <old name> },
    "createdAt": <ISO>, "updatedAt": <ISO> }
  ```
- **R12a.** Broadcasts MUST occur after state is updated, not before.
  A client receiving a broadcast and immediately calling `GET /items` must
  see the change reflected.

## Test mode

- **R13.** A configurable flag enables test mode. Default OFF. Configure via
  environment variable `TEST_MODE=true` (or a constant in code, but env
  var must work).
- **R14.** When test mode is ON, every 3 seconds the server randomly either:
  - adds a new item (with a generated name), OR
  - modifies an existing item's name (only if at least one item exists; if
    no items exist, always add).
- **R15.** Test-mode mutations MUST go through the same code path as the
  HTTP handlers, so that R11/R12 broadcasts are emitted automatically. No
  silent mutations of `items`.
- **R15a.** Test mode must be cleanly stoppable (clear the interval on
  server shutdown) so tests don't leak timers.

## Non-functional

- **R16.** Backend serves on a configurable port, default 8000. Configure
  via `PORT` environment variable.
- **R17.** No single-character identifiers anywhere in the code. Loop
  variables, arrow function parameters, and destructured names included.
- **R18.** No unused imports, variables, or functions on completion.
- **R19.** All HTTP responses (success and error) are JSON.
