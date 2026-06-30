const request = require('supertest');
const app = require('../src/app');

describe('POST /item', () => {
  test('returns 201 with the created item on a valid request', async () => {
    const response = await request(app).post('/item').send({ name: 'Widget' });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Widget');
    expect(typeof response.body.id).toBe('number');
    expect(typeof response.body.createdAt).toBe('string');
    expect(typeof response.body.updatedAt).toBe('string');
  });

  test('assigns a numeric id', async () => {
    const response = await request(app).post('/item').send({ name: 'Gadget' });
    expect(typeof response.body.id).toBe('number');
  });

  test('sets createdAt equal to updatedAt on creation', async () => {
    const response = await request(app).post('/item').send({ name: 'Thingamajig' });
    expect(response.body.createdAt).toBe(response.body.updatedAt);
  });

  test('assigns unique monotonically increasing IDs across multiple POSTs', async () => {
    const first = await request(app).post('/item').send({ name: 'Alpha' });
    const second = await request(app).post('/item').send({ name: 'Beta' });
    expect(second.body.id).toBeGreaterThan(first.body.id);
  });

  test('rejects missing name with 400 and { error: "invalid name" }', async () => {
    const response = await request(app).post('/item').send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('rejects a numeric name with 400', async () => {
    const response = await request(app).post('/item').send({ name: 42 });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('rejects a null name with 400', async () => {
    const response = await request(app).post('/item').send({ name: null });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('rejects an empty string name with 400', async () => {
    const response = await request(app).post('/item').send({ name: '' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('rejects a whitespace-only name with 400', async () => {
    const response = await request(app).post('/item').send({ name: '   ' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid name' });
  });

  test('does not create an item when validation fails', async () => {
    const before = await request(app).get('/items');
    const beforeCount = Object.keys(before.body).length;
    await request(app).post('/item').send({ name: '' });
    const after = await request(app).get('/items');
    expect(Object.keys(after.body).length).toBe(beforeCount);
  });
});
