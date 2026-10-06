import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || '0.0.0.0';

const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;
const messageQueryAwareness = 3;

export function createCollabServer({
  port = PORT,
  host = HOST,
  idleTimeoutMs = 180000, // 3 minutes grace period before evicting empty room
  pingIntervalMs = 30000, // 30 seconds ping/pong heartbeat
} = {}) {
  // Map of roomName -> { doc, awareness, conns: Set<WebSocket> }
  const rooms = new Map();
  // Map of roomName -> NodeJS.Timeout
  const roomEvictionTimers = new Map();

  function getOrCreateRoom(roomName) {
    // If room was pending eviction, cancel timer upon peer reconnection
    if (roomEvictionTimers.has(roomName)) {
      clearTimeout(roomEvictionTimers.get(roomName));
      roomEvictionTimers.delete(roomName);
    }

    let room = rooms.get(roomName);
    if (!room) {
      const doc = new Y.Doc();
      const awareness = new awarenessProtocol.Awareness(doc);
      const conns = new Set();

      doc.on('update', (update, origin) => {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeUpdate(encoder, update);
        const message = encoding.toUint8Array(encoder);

        for (const client of conns) {
          if (client !== origin && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        }
      });

      awareness.on('update', ({ added, updated, removed }, origin) => {
        const changedClients = added.concat(updated, removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
        );
        const message = encoding.toUint8Array(encoder);

        for (const client of conns) {
          if (client !== origin && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        }
      });

      room = { doc, awareness, conns };
      rooms.set(roomName, room);
    }
    return room;
  }

  const wss = new WebSocketServer({ host, port: Number(port) });

  // Socket Heartbeat to eliminate zombie/dead TCP sockets
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[CollabServer] Pruning unresponsive zombie socket');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, pingIntervalMs);

  wss.on('connection', (conn, req) => {
    conn.isAlive = true;
    conn.binaryType = 'arraybuffer';

    conn.on('pong', () => {
      conn.isAlive = true;
    });

    // Parse room from URL: /roomName or /?room=roomName
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let roomName = url.pathname.slice(1);
    if (!roomName || roomName === '/') {
      roomName = url.searchParams.get('room') || 'default-room';
    }
    // Sanitize room name to alphanumeric, dashes, and underscores
    roomName = roomName.replace(/[^a-zA-Z0-9_-]/g, '') || 'default-room';

    const room = getOrCreateRoom(roomName);
    room.conns.add(conn);

    console.log(`[CollabServer] Client joined room '${roomName}'. Total peers: ${room.conns.size}`);

    // 1. Send sync step 1
    {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, room.doc);
      conn.send(encoding.toUint8Array(encoder));
    }

    // 2. Send current awareness states
    {
      const awarenessStates = room.awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            room.awareness,
            Array.from(awarenessStates.keys())
          )
        );
        conn.send(encoding.toUint8Array(encoder));
      }
    }

    conn.on('message', (data) => {
      try {
        const buffer = new Uint8Array(data);
        const decoder = decoding.createDecoder(buffer);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
          case messageSync: {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);
            if (encoding.length(encoder) > 1) {
              conn.send(encoding.toUint8Array(encoder));
            }
            break;
          }
          case messageAwareness: {
            const update = decoding.readVarUint8Array(decoder);
            awarenessProtocol.applyAwarenessUpdate(room.awareness, update, conn);
            break;
          }
          case messageQueryAwareness: {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageAwareness);
            encoding.writeVarUint8Array(
              encoder,
              awarenessProtocol.encodeAwarenessUpdate(
                room.awareness,
                Array.from(room.awareness.getStates().keys())
              )
            );
            conn.send(encoding.toUint8Array(encoder));
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error('[CollabServer] Error handling message:', err);
      }
    });

    conn.on('close', () => {
      room.conns.delete(conn);
      console.log(`[CollabServer] Client disconnected from room '${roomName}'. Remaining peers: ${room.conns.size}`);

      // If room is empty, schedule memory eviction after idleTimeoutMs
      if (room.conns.size === 0) {
        const evictionTimer = setTimeout(() => {
          const currentRoom = rooms.get(roomName);
          if (currentRoom && currentRoom.conns.size === 0) {
            console.log(`[CollabServer] Evicting idle room '${roomName}' from memory`);
            currentRoom.doc.destroy();
            rooms.delete(roomName);
            roomEvictionTimers.delete(roomName);
          }
        }, idleTimeoutMs);

        roomEvictionTimers.set(roomName, evictionTimer);
      }
    });

    conn.on('error', (err) => {
      console.error('[CollabServer] Socket error:', err);
    });
  });

  return {
    wss,
    rooms,
    roomEvictionTimers,
    close: () => {
      clearInterval(heartbeatInterval);
      for (const timer of roomEvictionTimers.values()) {
        clearTimeout(timer);
      }
      roomEvictionTimers.clear();
      for (const room of rooms.values()) {
        room.doc.destroy();
      }
      rooms.clear();
      wss.close();
    },
  };
}

// Auto-start if executed directly via CLI
const isDirectExecution = process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith('collabServer.mjs')
);

if (isDirectExecution) {
  createCollabServer({ port: PORT, host: HOST });
  console.log(`[CollabServer] System Design Playground Real-Time Relay running on ws://${HOST}:${PORT}`);
}
