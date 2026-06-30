const express = require('express');
const cors = require('cors');
const itemsRouter = require('./routes/items');

const app = express();

app.use(cors());
app.use(express.json());
app.use(itemsRouter);

module.exports = app;
