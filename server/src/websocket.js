const WebSocket = require('ws');

let webSocketServer = null;

function handleClientMessage(client, data) {
  let parsedMessage;
  try {
    parsedMessage = JSON.parse(data);
  } catch {
    return;
  }
  if (parsedMessage && parsedMessage.action === 'ping' && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ action: 'pong' }));
  }
}

function attachWebSocket(httpServer) {
  webSocketServer = new WebSocket.WebSocketServer({ server: httpServer });
  webSocketServer.on('connection', (client) => {
    client.on('message', (data) => handleClientMessage(client, data));
  });
}

function broadcast(message) {
  if (!webSocketServer) {
    return;
  }
  const data = JSON.stringify(message);
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

module.exports = { attachWebSocket, broadcast };
