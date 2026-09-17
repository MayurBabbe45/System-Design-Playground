import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || '0.0.0.0';

const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;
const messageQueryAwareness = 3;

// Map of roomName -> { doc, awareness, conns: Set<WebSocket> }
const rooms = new Map();

function getOrCreateRoom(roomName) {
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

const wss = new WebSocketServer({ host: HOST, port: Number(PORT) });

wss.on('connection', (conn, req) => {
  conn.binaryType = 'arraybuffer';
  // Parse room from URL: /roomName or /?room=roomName
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let roomName = url.pathname.slice(1);
  if (!roomName || roomName === '/') {
    roomName = url.searchParams.get('room') || 'default-room';
  }
  // Strip any trailing slashes
  roomName = roomName.replace(/^\/+|\/+$/g, '') || 'default-room';

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

    // If room is empty, remove after 1 hour or keep in memory
    if (room.conns.size === 0) {
      // Clean up awareness client IDs if any
    }
  });

  conn.on('error', (err) => {
    console.error('[CollabServer] Socket error:', err);
  });
});

console.log(`[CollabServer] System Design Playground Real-Time Relay running on ws://${HOST}:${PORT}`);
