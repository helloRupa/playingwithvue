const http = require('http');
const app = require('./app');
const { attachWebSocket } = require('./websocket');
const { startTestMode, stopTestMode } = require('./testmode');

const port = parseInt(process.env.PORT || '8000', 10);
const server = http.createServer(app);

attachWebSocket(server);

if (process.env.TEST_MODE === 'true') {
  startTestMode();
}

function shutdown() {
  stopTestMode();
  server.close();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
