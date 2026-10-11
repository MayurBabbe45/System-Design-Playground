import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { app, authRateLimiter, resetAuthRateLimits, MAX_GRAPH_NODES, MAX_GRAPH_EDGES } from '../apiServer.mjs';

describe('Auth Rate Limiting & Validation Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Mount custom test routes alongside the main app
    app.post('/test/auth-limit', authRateLimiter, (req, res) => {
      res.json({ ok: true });
    });

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
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

  test('POST /api/architectures rejects payload with nodes exceeding MAX_GRAPH_NODES', async () => {
    const oversizedNodes = Array.from({ length: MAX_GRAPH_NODES + 1 }, (_, i) => ({
      id: `node-${i}`,
      type: 'serviceNode',
      data: { label: `Node ${i}` },
    }));

    const res = await fetch(`${baseUrl}/api/architectures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Oversized Graph Architecture',
        nodes: oversizedNodes,
        edges: [],
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Graph payload exceeds maximum permitted size/i);
  });

  test('POST /api/architectures rejects payload with edges exceeding MAX_GRAPH_EDGES', async () => {
    const oversizedEdges = Array.from({ length: MAX_GRAPH_EDGES + 1 }, (_, i) => ({
      id: `edge-${i}`,
      source: 'node-1',
      target: 'node-2',
    }));

    const res = await fetch(`${baseUrl}/api/architectures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Oversized Edges Architecture',
        nodes: [{ id: 'node-1' }, { id: 'node-2' }],
        edges: oversizedEdges,
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Graph payload exceeds maximum permitted size/i);
  });
});
