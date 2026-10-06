import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { authRateLimiter, resetAuthRateLimits } from '../apiServer.mjs';

describe('Auth Rate Limiting & Validation Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.post('/test/auth-limit', authRateLimiter, (req, res) => {
      res.json({ ok: true });
    });

    await new Promise((resolve) => {
      server = testApp.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    resetAuthRateLimits();
  });

  after(() => {
    if (server) server.close();
  });

  test('authRateLimiter sets HSTS security header', async () => {
    const res = await fetch(`${baseUrl}/test/auth-limit`, { method: 'POST' });
    assert.ok(res.headers.get('strict-transport-security'));
  });

  test('authRateLimiter throttles requests after 15 rapid calls', async () => {
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${baseUrl}/test/auth-limit`, { method: 'POST' });
      assert.equal(res.status, 200);
    }
    const throttled = await fetch(`${baseUrl}/test/auth-limit`, { method: 'POST' });
    assert.equal(throttled.status, 429);
    const body = await throttled.json();
    assert.ok(body.error);
  });
});
