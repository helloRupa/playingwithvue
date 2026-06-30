const { getItems, addItem, patchItem } = require('./state');
const { broadcast } = require('./websocket');

let testModeInterval = null;
let generatedCount = 0;

function nextGeneratedName() {
  generatedCount += 1;
  return `generated-${generatedCount}`;
}

function runTick() {
  const existingItems = Object.values(getItems());
  const shouldAdd = existingItems.length === 0 || Math.random() < 0.5;

  if (shouldAdd) {
    const item = addItem(nextGeneratedName());
    broadcast({
      action: 'item_added',
      item_id: item.id,
      name: item.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } else {
    const randomIndex = Math.floor(Math.random() * existingItems.length);
    const target = existingItems[randomIndex];
    const { item, previousName } = patchItem(target.id, nextGeneratedName());
    broadcast({
      action: 'item_updated',
      item_id: item.id,
      changed: { name: item.name },
      previous: { name: previousName },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }
}

function startTestMode() {
  if (testModeInterval !== null) {
    return;
  }
  testModeInterval = setInterval(runTick, 3000);
}

function stopTestMode() {
  clearInterval(testModeInterval);
  testModeInterval = null;
}

module.exports = { startTestMode, stopTestMode };
