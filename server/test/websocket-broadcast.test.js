const http = require('http');
const WebSocket = require('ws');
const request = require('supertest');
const app = require('../src/app');
const { attachWebSocket } = require('../src/websocket');

let server;
let wsUrl;

function openClient() {
  return new Promise((resolve) => {
    const client = new WebSocket(wsUrl);
    client.once('open', () => resolve(client));
  });
}

function nextMessage(client) {
  return new Promise((resolve) => {
    client.once('message', (data) => resolve(JSON.parse(data)));
  });
}

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

beforeAll((done) => {
  server = http.createServer(app);
  attachWebSocket(server);
  server.listen(0, () => {
    wsUrl = `ws://localhost:${server.address().port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

test('broadcasts item_added with the correct action on successful POST', async () => {
  const client = await openClient();
  const messagePromise = nextMessage(client);
  await request(app).post('/item').send({ name: 'Sprocket' });
  const message = await messagePromise;
  expect(message.action).toBe('item_added');
  client.close();
});

test('broadcast payload contains item_id, name, createdAt, updatedAt', async () => {
  const client = await openClient();
  const messagePromise = nextMessage(client);
  await request(app).post('/item').send({ name: 'Cog' });
  const message = await messagePromise;
  expect(typeof message.item_id).toBe('number');
  expect(message.name).toBe('Cog');
  expect(typeof message.createdAt).toBe('string');
  expect(typeof message.updatedAt).toBe('string');
  client.close();
});

test('new item is visible via GET /items immediately after broadcast (R12a)', async () => {
  const client = await openClient();
  const messagePromise = nextMessage(client);
  await request(app).post('/item').send({ name: 'Flywheel' });
  const message = await messagePromise;
  const response = await request(app).get('/items');
  const itemIds = response.body.map((item) => item.id);
  expect(itemIds).toContain(message.item_id);
  client.close();
});

test('does not broadcast when POST validation fails', async () => {
  const client = await openClient();
  let messageReceived = false;
  client.once('message', () => { messageReceived = true; });
  await request(app).post('/item').send({ name: '' });
  await delay(100);
  expect(messageReceived).toBe(false);
  client.close();
});

test('broadcasts item_updated with the correct action on successful PATCH', async () => {
  const created = await request(app).post('/item').send({ name: 'Piston' });
  const client = await openClient();
  const messagePromise = nextMessage(client);
  await request(app).patch('/item').send({ id: created.body.id, name: 'Piston v2' });
  const message = await messagePromise;
  expect(message.action).toBe('item_updated');
  client.close();
});

test('item_updated payload contains item_id, changed.name, previous.name, createdAt, updatedAt (R12)', async () => {
  const created = await request(app).post('/item').send({ name: 'Valve' });
  const client = await openClient();
  const messagePromise = nextMessage(client);
  await request(app).patch('/item').send({ id: created.body.id, name: 'Valve v2' });
  const message = await messagePromise;
  expect(typeof message.item_id).toBe('number');
  expect(message.changed).toEqual({ name: 'Valve v2' });
  expect(message.previous).toEqual({ name: 'Valve' });
  expect(typeof message.createdAt).toBe('string');
  expect(typeof message.updatedAt).toBe('string');
  client.close();
});

test('does not broadcast when PATCH validation fails', async () => {
  const client = await openClient();
  let messageReceived = false;
  client.once('message', () => { messageReceived = true; });
  await request(app).patch('/item').send({ id: 1, name: '' });
  await delay(100);
  expect(messageReceived).toBe(false);
  client.close();
});
