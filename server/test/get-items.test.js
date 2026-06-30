const request = require('supertest');
const app = require('../src/app');

describe('GET /items', () => {
  test('returns all items with status 200 when no query param is given', async () => {
    const response = await request(app).get('/items');
    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('object');
    expect(Array.isArray(response.body)).toBe(false);
  });

  test('seed data contains exactly 5 items with distinct names', async () => {
    const response = await request(app).get('/items');
    const itemList = Object.values(response.body);
    expect(itemList).toHaveLength(5);
    const names = itemList.map(item => item.name);
    expect(new Set(names).size).toBe(5);
  });

  test('each seed item has id, name, createdAt, updatedAt fields of correct types', async () => {
    const response = await request(app).get('/items');
    for (const item of Object.values(response.body)) {
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
      expect(typeof item.createdAt).toBe('string');
      expect(typeof item.updatedAt).toBe('string');
      expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
      expect(new Date(item.updatedAt).toISOString()).toBe(item.updatedAt);
    }
  });

  test('returns all items when last_update is a past timestamp (R7, R7b)', async () => {
    const response = await request(app).get('/items?last_update=2020-01-01T00:00:00.000Z');
    expect(response.status).toBe(200);
    expect(Object.keys(response.body)).toHaveLength(5);
  });

  test('returns empty object when last_update is after all item timestamps (R7)', async () => {
    const response = await request(app).get('/items?last_update=2099-01-01T00:00:00.000Z');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({});
  });

  test('returns 400 with error body for a non-ISO last_update string (R7a)', async () => {
    const response = await request(app).get('/items?last_update=banana');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid last_update' });
  });

  test('returns 400 for an empty-string last_update (R7a)', async () => {
    const response = await request(app).get('/items?last_update=');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid last_update' });
  });

  test('returns 400 for a date-like but invalid string 2026-99-99 (R7a)', async () => {
    const response = await request(app).get('/items?last_update=2026-99-99');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid last_update' });
  });
});
