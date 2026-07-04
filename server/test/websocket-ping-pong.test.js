const http = require('http');
const WebSocket = require('ws');
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

function delay(milliseconds) {
  return new Promise((resolve) => { setTimeout(resolve, milliseconds); });
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

test('responds with pong when client sends {action: "ping"} (R12b)', async () => {
  const client = await openClient();
  const messagePromise = nextMessage(client);
  client.send(JSON.stringify({ action: 'ping' }));
  const message = await messagePromise;
  expect(message).toEqual({ action: 'pong' });
  client.close();
});

test('pong is sent only to the sender, not broadcast to other clients (R12b)', async () => {
  const sender = await openClient();
  const otherClient = await openClient();
  let otherClientReceived = false;
  otherClient.once('message', () => { otherClientReceived = true; });
  const messagePromise = nextMessage(sender);
  sender.send(JSON.stringify({ action: 'ping' }));
  const message = await messagePromise;
  expect(message).toEqual({ action: 'pong' });
  await delay(100);
  expect(otherClientReceived).toBe(false);
  sender.close();
  otherClient.close();
});

test('ignores non-JSON messages without throwing or responding (R12c)', async () => {
  const client = await openClient();
  let messageReceived = false;
  client.once('message', () => { messageReceived = true; });
  client.send('not json');
  await delay(100);
  expect(messageReceived).toBe(false);
  client.close();
});

test('ignores valid JSON messages with a different or missing action (R12c)', async () => {
  const client = await openClient();
  let messageReceived = false;
  client.once('message', () => { messageReceived = true; });
  client.send(JSON.stringify({ action: 'not_ping' }));
  client.send(JSON.stringify({ foo: 'bar' }));
  await delay(100);
  expect(messageReceived).toBe(false);
  client.close();
});
