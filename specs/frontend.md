# Frontend Specification

Source of truth for the frontend. Every requirement has an ID (R1, R2, ...).
Reference these IDs in plans, commit messages, and code review.

This file currently covers only the WebSocket reconnect / gap-fill behavior.
Other existing frontend behavior (initial item fetch, live query rendering,
error states, etc.) predates this spec and is not yet documented here.

## WebSocket connection & reconnection

- **R1.** On mount, the client opens a WebSocket connection to `WEBSOCKETS_URL`.
- **R2.** If the connection closes unexpectedly (not via an intentional
  close), the client attempts to reconnect using capped exponential backoff.
  - **R2a.** Backoff delay starts at `RECONNECT_BASE_DELAY_MS`, doubles each
    attempt, capped at `RECONNECT_MAX_DELAY_MS`.
  - **R2b.** After `MAX_RECONNECT_ATTEMPTS` failed attempts, the client stops
    retrying and connection status becomes `disconnected`.
- **R3.** An intentional close (component unmount) must NOT trigger a
  reconnect attempt.
- **R4.** On successful open, the reconnect attempt counter resets to 0 and
  connection status becomes `connected`.

## Gap-fill sync on reconnect

- **R5.** On a successful *reconnect* (not the initial connection), the
  client fetches items updated since the last known state via
  `GET /items?last_update=<lastUpdatedRecordDate>` (backend R7).
  - **R5a.** If no `lastUpdatedRecordDate` is recorded yet, the client falls
    back to an unfiltered `GET /items` (backend R7b).
  - **R5b.** Each item returned is merged into the local collection via the
    existing insert-or-update-if-newer logic (`updateItemInCollection`),
    consistent with how live WebSocket messages are merged.
  - **R5c.** If the gap-fill fetch fails, the client retries it with capped
    exponential backoff, independent of the socket-level reconnect backoff.
- **R6.** The initial connection (first mount) does NOT trigger a gap-fill
  fetch — that data comes from `itemsCollection`'s own initial query.

## Connection status UI

- **R7.** The client tracks connection status: `connected`, `reconnecting`,
  or `disconnected`.
- **R8.** The current connection status is visibly displayed to the user.

## Concurrency & cleanup

- **R9.** Only one reconnect timer may be pending at a time.
- **R10.** On component unmount, any pending reconnect or gap-fill retry
  timers are cleared.
- **R11.** A live WebSocket message and an in-flight gap-fill fetch response
  may arrive in either order; merge logic must be safe regardless of order
  (idempotent, last-write-wins by `updatedAt`).
