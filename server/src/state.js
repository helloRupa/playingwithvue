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

function addItem(name) {
  const now = new Date().toISOString();
  const id = nextId;
  nextId += 1;
  items[id] = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
  };
  return items[id];
}

function getItem(id) {
  return items[id];
}

function patchItem(id, name) {
  const previousName = items[id].name;
  items[id].name = name;
  items[id].updatedAt = new Date().toISOString();
  return { item: items[id], previousName };
}

module.exports = {
  getItems, addItem, getItem, patchItem,
};
