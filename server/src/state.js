const items = {};
let nextId = 1;

const seedNames = ['Anchor', 'Beacon', 'Canvas', 'Dagger', 'Ember'];
for (const name of seedNames) {
  const now = new Date().toISOString();
  const id = nextId;
  nextId += 1;
  items[id] = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
  };
}

function getItems(sinceMs) {
  if (sinceMs === undefined) {
    return items;
  }
  const filtered = Object.values(items).filter((item) => (
    new Date(item.createdAt).getTime() > sinceMs
    || new Date(item.updatedAt).getTime() > sinceMs
  ));
  return Object.fromEntries(filtered.map((item) => [item.id, item]));
}

module.exports = { getItems };
