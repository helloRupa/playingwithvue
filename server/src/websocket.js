const WebSocket = require('ws');

let webSocketServer = null;

function attachWebSocket(httpServer) {
  webSocketServer = new WebSocket.WebSocketServer({ server: httpServer });
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
