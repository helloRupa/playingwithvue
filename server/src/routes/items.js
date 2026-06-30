const express = require('express');
const { getItems, addItem } = require('../state');
const { broadcast } = require('../websocket');

const router = express.Router();

router.get('/items', (req, res) => {
  const lastUpdate = req.query.last_update;

  if (lastUpdate !== undefined) {
    const parsedDate = new Date(lastUpdate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'invalid last_update' });
    }
    return res.status(200).json(getItems(parsedDate.getTime()));
  }

  return res.status(200).json(getItems());
});

router.post('/item', (req, res) => {
  const { name } = req.body || {};
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'invalid name' });
  }
  const item = addItem(name);
  broadcast({
    action: 'item_added',
    item_id: item.id,
    name: item.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
  return res.status(201).json(item);
});

module.exports = router;
