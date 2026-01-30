/**
 * WebSocket server entry. Handles connections and delegates to RoomManager.
 */

import { WebSocketServer } from 'ws';
import { RoomManager } from './RoomManager.js';

const PORT = Number(process.env.PORT) || 3001;

const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
  console.log(`Chess Vibe WebSocket server listening on port ${PORT}`);
});

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const raw = typeof data === 'string' ? data : data.toString('utf8');
    RoomManager.handleMessage(ws, raw);
  });

  ws.on('close', () => {
    RoomManager.onDisconnect(ws);
  });
});
