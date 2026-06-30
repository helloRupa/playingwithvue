const express = require('express');
const { getItems } = require('../state');

const router = express.Router();

router.get('/items', (req, res) => {
  const lastUpdate = req.query.last_update;

  if (lastUpdate !== undefined) {
    const parsedDate = new Date(lastUpdate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'invalid last_update' });
    }
    return res.status(200).json(getItems(parsedDate.getTime()));
  }

  return res.status(200).json(getItems());
});

module.exports = router;
