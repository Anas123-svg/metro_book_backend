const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
// No live DB is required for these endpoint tests.
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_SSL = 'false';
const app = require('../server');
const { sequelize } = require('../config/db');
let server, base;
before(async () => {
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  await sequelize.close();
});
test('health is public, independent of DB, CORS wildcard', async () => {
  const res = await fetch(base + '/api/health', { headers: { Origin: 'https://arbitrary.example' } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.equal((await res.json()).status, 'ok');
});
test('preflight works for authorization and custom headers', async () => {
  const res = await fetch(base + '/api/users/me', { method: 'OPTIONS', headers: {
    Origin: 'https://another.example', 'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization,content-type,x-client-id',
  } });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.match(res.headers.get('access-control-allow-headers'), /authorization/);
});
test('database health reports success and failure without exposing secrets', async (t) => {
  const auth = t.mock.method(sequelize, 'authenticate', async () => {});
  for (const path of ['/api/test', '/api/health/db', '/api/hello', '/test']) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).database, 'connected');
  }
  auth.mock.mockImplementation(async () => { throw new Error('private error'); });
  const res = await fetch(base + '/api/health/db');
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.database, 'disconnected');
  assert.ok(!JSON.stringify(body).includes('private error'));
});
