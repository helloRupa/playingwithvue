const request = require('supertest');
const app = require('../src/app');

async function createItem(name) {
  const response = await request(app).post('/item').send({ name });
  return response.body;
}

describe('PATCH /item', () => {
  test('returns 200 with the updated item on a valid request', async () => {
    const created = await createItem('Original');
    const response = await request(app).patch('/item').send({ id: created.id, name: 'Updated' });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.id);
    expect(response.body.name).toBe('Updated');
  });

  test('updates the name field', async () => {
    const created = await createItem('Before');
    await request(app).patch('/item').send({ id: created.id, name: 'After' });
    const items = await request(app).get('/items');
    expect(items.body[created.id].name).toBe('After');
  });

  test('refreshes updatedAt to a new timestamp', async () => {
    const created = await createItem('Stale');
    await new Promise((resolve) => { setTimeout(resolve, 10); });
    const response = await request(app).patch('/item').send({ id: created.id, name: 'Fresh' });
    expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
      new Date(created.updatedAt).getTime(),
    );
  });

  test('does not modify createdAt', async () => {
    const created = await createItem('Constant');
    const response = await request(app).patch('/item').send({ id: created.id, name: 'Changed' });
    expect(response.body.createdAt).toBe(created.createdAt);
  });

  test('returns 404 with { error: "item not found" } for an unknown id (R9a)', async () => {
    const response = await request(app).patch('/item').send({ id: 999999, name: 'Ghost' });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'item not found' });
  });

  test('returns 404 when id is absent from the body (R9a)', async () => {
    const response = await request(app).patch('/item').send({ name: 'NoId' });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'item not found' });
  });

  test('rejects missing name with 400 and { error: "invalid name" } (R9b)', async () => {
    const created = await createItem('HasName');
    const response = await request(app).patch('/item').send({ id: created.id });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('rejects a non-string name with 400 (R9b)', async () => {
    const created = await createItem('HasName');
    const response = await request(app).patch('/item').send({ id: created.id, name: 99 });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('rejects an empty string name with 400 (R9b)', async () => {
    const created = await createItem('HasName');
    const response = await request(app).patch('/item').send({ id: created.id, name: '' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('rejects a whitespace-only name with 400 (R9b)', async () => {
    const created = await createItem('HasName');
    const response = await request(app).patch('/item').send({ id: created.id, name: '   ' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('does not modify state when name validation fails (R9b)', async () => {
    const created = await createItem('Unchanged');
    await request(app).patch('/item').send({ id: created.id, name: '' });
    const items = await request(app).get('/items');
    expect(items.body[created.id].name).toBe('Unchanged');
  });
});
