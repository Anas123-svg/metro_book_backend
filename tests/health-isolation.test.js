const { test } = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../controllers/testController');
const dbPath = require.resolve('../config/db');
function response() {
  return { set() { return this; }, status(value) { this.statusCode = value; return this; }, json(body) { this.body = body; return this; } };
}
test('liveness is available without loading database modules', () => {
  assert.equal(require.cache[dbPath], undefined);
  const res = response();
  controller.health({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(require.cache[dbPath], undefined);
});
test('missing DB config is reported without initializing Sequelize', async () => {
  const previous = process.env.DB_HOST;
  delete process.env.DB_HOST;
  try {
    const res = response();
    await controller.helloWorld({}, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'DB_CONFIG_MISSING');
    assert.equal(require.cache[dbPath], undefined);
  } finally { if (previous !== undefined) process.env.DB_HOST = previous; }
});
test('readiness handles database success, authentication and TLS failures', async () => {
  const keys = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const previous = keys.map(key => process.env[key]);
  for (const key of keys) process.env[key] = 'test';
  const original = require.cache[dbPath];
  const sequelize = { authenticate: async () => {} };
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { sequelize } };
  try {
    let res = response();
    await controller.helloWorld({}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.database, 'connected');
    for (const [code, expected] of [['28P01','DB_AUTH_FAILED'],['SELF_SIGNED_CERT_IN_CHAIN','DB_TLS_ERROR'],['ENOTFOUND','DB_NETWORK_ERROR']]) {
      sequelize.authenticate = async () => { throw Object.assign(new Error('private diagnostic'), { original: { code } }); };
      res = response();
      await controller.helloWorld({}, res);
      assert.equal(res.statusCode, 503);
      assert.equal(res.body.code, expected);
      assert.ok(!JSON.stringify(res.body).includes('private diagnostic'));
    }
  } finally {
    if (original) require.cache[dbPath] = original; else delete require.cache[dbPath];
    keys.forEach((key, i) => { if (previous[i] === undefined) delete process.env[key]; else process.env[key] = previous[i]; });
  }
});
