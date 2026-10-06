import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createCollabServer } from '../collabServer.mjs';

describe('Collaboration Relay Socket & Memory Management', () => {
  let serverInstance;
  let wsUrl;

  before(async () => {
    serverInstance = createCollabServer({
      port: 0, // dynamic test port
      host: '127.0.0.1',
      idleTimeoutMs: 100, // fast timeout for test
      pingIntervalMs: 200,
    });

    await new Promise((resolve) => {
      serverInstance.wss.on('listening', resolve);
    });

    const port = serverInstance.wss.address().port;
    wsUrl = `ws://127.0.0.1:${port}`;
  });

  after(() => {
    if (serverInstance) {
      serverInstance.close();
    }
  });

  test('Relay responds to ping with pong', async () => {
    const ws = new WebSocket(`${wsUrl}/test-heartbeat-room`);
    await new Promise((resolve) => ws.on('open', resolve));

    let receivedPong = false;
    ws.on('pong', () => {
      receivedPong = true;
    });

    ws.ping();
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(receivedPong, true, 'WebSocket should respond with pong');
    ws.close();
  });

  test('Relay evicts empty room from memory after idleTimeout', async () => {
    const roomName = `temp-room-${Date.now()}`;
    const ws = new WebSocket(`${wsUrl}/${roomName}`);
    await new Promise((resolve) => ws.on('open', resolve));

    assert.ok(serverInstance.rooms.has(roomName), 'Room should exist while client is connected');

    ws.close();
    await new Promise((resolve) => ws.on('close', resolve));

    // Wait for idleTimeoutMs (100ms) + buffer
    await new Promise((resolve) => setTimeout(resolve, 250));

    assert.equal(serverInstance.rooms.has(roomName), false, 'Empty room should be evicted from memory');
  });
});
