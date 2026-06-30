const http = require('http');
const app = require('./app');

const port = parseInt(process.env.PORT || '8000', 10);
const server = http.createServer(app);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
