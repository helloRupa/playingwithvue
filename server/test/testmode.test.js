jest.useFakeTimers();
jest.mock('../src/websocket', () => ({ broadcast: jest.fn() }));

const { broadcast } = require('../src/websocket');
const { getItems } = require('../src/state');
const { startTestMode, stopTestMode } = require('../src/testmode');

afterEach(() => {
  stopTestMode();
  jest.clearAllTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test('does not mutate state before startTestMode is called', () => {
  const countBefore = getItems().length;
  jest.advanceTimersByTime(3000);
  expect(getItems().length).toBe(countBefore);
});

test('adds a new item after one 3-second tick when Math.random() < 0.5', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.3);
  const countBefore = getItems().length;
  startTestMode();
  jest.advanceTimersByTime(3000);
  expect(getItems().length).toBe(countBefore + 1);
});

test('new item from test mode has valid id, name, createdAt, updatedAt (R15)', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.3);
  startTestMode();
  jest.advanceTimersByTime(3000);
  const allItems = getItems();
  const newestItem = allItems[allItems.length - 1];
  expect(typeof newestItem.id).toBe('number');
  expect(typeof newestItem.name).toBe('string');
  expect(newestItem.name.length).toBeGreaterThan(0);
  expect(typeof newestItem.createdAt).toBe('string');
  expect(typeof newestItem.updatedAt).toBe('string');
  expect(newestItem.createdAt).toBe(newestItem.updatedAt);
});

test('modifies an existing item after one tick when Math.random() >= 0.5', () => {
  jest.spyOn(Math, 'random')
    .mockReturnValueOnce(0.7)
    .mockReturnValueOnce(0);
  const firstItem = getItems()[0];
  const originalName = firstItem.name;
  startTestMode();
  jest.advanceTimersByTime(3000);
  const patchedItem = getItems().find((item) => item.id === firstItem.id);
  expect(patchedItem.name).not.toBe(originalName);
});

test('modified item has refreshed updatedAt and unchanged createdAt (R15)', () => {
  jest.spyOn(Math, 'random')
    .mockReturnValueOnce(0.7)
    .mockReturnValueOnce(0);
  const firstItem = getItems()[0];
  const originalCreatedAt = firstItem.createdAt;
  jest.setSystemTime(new Date('2099-01-01T12:00:00.000Z'));
  startTestMode();
  jest.advanceTimersByTime(3000);
  const patchedItem = getItems().find((item) => item.id === firstItem.id);
  expect(patchedItem.createdAt).toBe(originalCreatedAt);
  expect(patchedItem.updatedAt).toBe('2099-01-01T12:00:03.000Z');
});

test('broadcasts item_added when the add branch fires (R11 via R15)', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.3);
  startTestMode();
  jest.advanceTimersByTime(3000);
  expect(broadcast).toHaveBeenCalledTimes(1);
  expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({
    action: 'item_added',
    item_id: expect.any(Number),
    name: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  }));
});

test('broadcasts item_updated when the modify branch fires (R12 via R15)', () => {
  jest.spyOn(Math, 'random')
    .mockReturnValueOnce(0.7)
    .mockReturnValueOnce(0);
  startTestMode();
  jest.advanceTimersByTime(3000);
  expect(broadcast).toHaveBeenCalledTimes(1);
  expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({
    action: 'item_updated',
    item_id: expect.any(Number),
    changed: expect.objectContaining({ name: expect.any(String) }),
    previous: expect.objectContaining({ name: expect.any(String) }),
  }));
});

test('does not mutate state after stopTestMode is called (R15a)', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.3);
  startTestMode();
  stopTestMode();
  const countAfterStop = getItems().length;
  jest.advanceTimersByTime(3000);
  expect(getItems().length).toBe(countAfterStop);
});

test('fires on every 3-second tick (two ticks in 6 seconds)', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.3);
  const countBefore = getItems().length;
  startTestMode();
  jest.advanceTimersByTime(6000);
  expect(getItems().length).toBe(countBefore + 2);
});
