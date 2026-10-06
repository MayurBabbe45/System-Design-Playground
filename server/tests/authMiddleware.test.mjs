import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { requireAuth, optionalAuth } from '../apiServer.mjs';

describe('Strict Auth Middleware Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    const testApp = express();
    testApp.use(express.json());

    // Protected route
    testApp.post('/test/protected', requireAuth, (req, res) => {
      res.json({ success: true, user: req.user });
    });

    // Optional route
    testApp.get('/test/optional', optionalAuth, (req, res) => {
      res.json({ user: req.user });
    });

    await new Promise((resolve) => {
      server = testApp.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
  });

  test('requireAuth rejects request without token with 401', async () => {
    const res = await fetch(`${baseUrl}/test/protected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'secret' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.ok(data.error);
  });

  test('requireAuth rejects request with invalid Bearer token with 401', async () => {
    const res = await fetch(`${baseUrl}/test/protected`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer bogus-invalid-token',
      },
      body: JSON.stringify({ data: 'secret' }),
    });
    assert.equal(res.status, 401);
  });

  test('optionalAuth leaves req.user null when no token provided', async () => {
    const res = await fetch(`${baseUrl}/test/optional`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user, null);
  });
});
