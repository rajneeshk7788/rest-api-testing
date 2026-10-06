const assert = require('node:assert/strict');
const test = require('node:test');
const app = require('../app');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('root route remains available', async () => {
  const response = await fetch(baseUrl);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'Hello, World!');
});

test('creating a user requires first name, last name, and email', async () => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ firstName: 'Taylor' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'lastName is required' });
});

test('user routes reject malformed ids', async () => {
  const response = await fetch(`${baseUrl}/api/users/not-an-id`);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid user id' });
});
