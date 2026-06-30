# Server API Reference

All examples assume the server is running on `localhost:8000` (the default).

## Starting the server

```bash
cd server
npm start

# Custom port
PORT=3001 npm start
```

---

## HTTP endpoints

All responses are JSON. All error bodies follow the shape `{ "error": "<message>" }`.

---

### GET /items

Returns the full item store as an object keyed by id.

```javascript
const response = await fetch('http://localhost:8000/items');
const items = await response.json();
console.log(items);
```

**200 response**
```json
{
  "1": { "id": 1, "name": "Anchor",  "createdAt": "2026-06-30T10:00:00.000Z", "updatedAt": "2026-06-30T10:00:00.000Z" },
  "2": { "id": 2, "name": "Beacon",  "createdAt": "2026-06-30T10:00:00.000Z", "updatedAt": "2026-06-30T10:00:00.000Z" },
  "3": { "id": 3, "name": "Canvas",  "createdAt": "2026-06-30T10:00:00.000Z", "updatedAt": "2026-06-30T10:00:00.000Z" },
  "4": { "id": 4, "name": "Dagger",  "createdAt": "2026-06-30T10:00:00.000Z", "updatedAt": "2026-06-30T10:00:00.000Z" },
  "5": { "id": 5, "name": "Ember",   "createdAt": "2026-06-30T10:00:00.000Z", "updatedAt": "2026-06-30T10:00:00.000Z" }
}
```

---

### GET /items?last_update=\<ISO datetime\>

Returns only items whose `createdAt` **or** `updatedAt` is strictly after the given timestamp.
Omitting `last_update` behaves identically to `GET /items`.

```javascript
const since = '2026-06-30T10:05:00.000Z';
const response = await fetch(`http://localhost:8000/items?last_update=${since}`);
const items = await response.json();
```

**200 — items after the timestamp** (same shape as above, filtered)

**200 — nothing newer** (empty object)
```json
{}
```

**400 — invalid timestamp**
```javascript
await fetch('http://localhost:8000/items?last_update=not-a-date');
```
```json
{ "error": "invalid last_update" }
```

---

### POST /item

Creates a new item. The server assigns `id`, `createdAt`, and `updatedAt`.

```javascript
const response = await fetch('http://localhost:8000/item', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Widget' }),
});
const item = await response.json();
console.log(item);
```

**201 — created**
```json
{ "id": 6, "name": "Widget", "createdAt": "2026-06-30T10:01:00.000Z", "updatedAt": "2026-06-30T10:01:00.000Z" }
```

**400 — missing, non-string, or empty name**
```javascript
await fetch('http://localhost:8000/item', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '' }),
});
```
```json
{ "error": "invalid name" }
```

---

### PATCH /item

Updates an existing item's name and refreshes its `updatedAt`. `createdAt` is never modified.

```javascript
const response = await fetch('http://localhost:8000/item', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 1, name: 'Anchor (updated)' }),
});
const item = await response.json();
console.log(item);
```

**200 — updated**
```json
{ "id": 1, "name": "Anchor (updated)", "createdAt": "2026-06-30T10:00:00.000Z", "updatedAt": "2026-06-30T10:02:00.000Z" }
```

**400 — missing or invalid name**
```json
{ "error": "invalid name" }
```

**404 — id not found**
```javascript
await fetch('http://localhost:8000/item', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 999, name: 'Ghost' }),
});
```
```json
{ "error": "item not found" }
```

---

## WebSocket stream

The server broadcasts a message to all connected clients whenever an item is added or updated.

### Subscribing

Paste this into a browser console while the server is running:

```javascript
const ws = new WebSocket('ws://localhost:8000');

ws.onopen = () => console.log('Connected');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => console.error('Error:', error);
ws.onclose = () => console.log('Disconnected');
```

### Unsubscribing

```javascript
ws.close();
```

### Broadcast shapes

**item_added** — emitted after a successful `POST /item`
```json
{
  "action":    "item_added",
  "item_id":   6,
  "name":      "Widget",
  "createdAt": "2026-06-30T10:01:00.000Z",
  "updatedAt": "2026-06-30T10:01:00.000Z"
}
```

**item_updated** — emitted after a successful `PATCH /item`
```json
{
  "action":   "item_updated",
  "item_id":  1,
  "changed":  { "name": "Anchor (updated)" },
  "previous": { "name": "Anchor" },
  "createdAt": "2026-06-30T10:00:00.000Z",
  "updatedAt": "2026-06-30T10:02:00.000Z"
}
```

Broadcasts are guaranteed to arrive **after** the state change, so calling `GET /items` immediately on receipt will reflect the new data.

---

## Test mode

When test mode is on, the server mutates state automatically every 3 seconds — randomly either adding a new item or renaming an existing one. All mutations broadcast to connected WebSocket clients exactly as if they came from the HTTP endpoints.

### Turning on test mode

```bash
TEST_MODE=true npm start

# Combined with a custom port
TEST_MODE=true PORT=3001 npm start
```

Test mode is **off** by default. Any value other than `true` leaves it off.

### Turning off test mode

Stop the server (`Ctrl+C` or `SIGTERM`) — the interval is cleared cleanly before shutdown.
Test mode cannot be toggled at runtime without restarting the server.
