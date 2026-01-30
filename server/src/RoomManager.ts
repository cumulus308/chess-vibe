/**
 * In-memory room and player management. One room = one game, two players.
 */

import type { WebSocket } from 'ws';
import {
  createRoomGameState,
  applyRoomMove,
  findLegalMove,
  roomStateToWire,
  parseMovePayload,
  type RoomGameState,
} from './game.js';
import type { ClientMessage, ServerMessage } from './types.js';

const ROOM_ID_LENGTH = 6;
const ROOM_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomId(): string {
  let id = '';
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    id += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)]!;
  }
  return id;
}

function generatePlayerId(): string {
  return crypto.randomUUID();
}

export interface RoomPlayer {
  id: string;
  color: 'white' | 'black';
  nickname: string;
  socket: WebSocket;
}

export interface Room {
  id: string;
  players: RoomPlayer[];
  gameState: RoomGameState;
  createdAt: number;
  updatedAt: number;
}

const rooms = new Map<string, Room>();
const socketToPlayer = new WeakMap<WebSocket, { roomId: string; playerId: string }>();

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState !== 1 /* OPEN */) return;
  ws.send(JSON.stringify(msg));
}

function broadcastToRoom(room: Room, msg: ServerMessage, excludeSocket?: WebSocket): void {
  for (const p of room.players) {
    if (excludeSocket && p.socket === excludeSocket) continue;
    send(p.socket, msg);
  }
}

function gameOver(state: RoomGameState): boolean {
  return (
    state.gamePhase.checkmate === true ||
    state.gamePhase.stalemate === true ||
    state.resigned !== undefined
  );
}

export const RoomManager = {
  createRoom(nickname: string, socket: WebSocket): Room | null {
    const roomId = generateRoomId();
    const playerId = generatePlayerId();
    const room: Room = {
      id: roomId,
      players: [
        { id: playerId, color: 'white', nickname, socket },
      ],
      gameState: createRoomGameState(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (rooms.has(roomId)) return null; // extremely unlikely
    rooms.set(roomId, room);
    socketToPlayer.set(socket, { roomId, playerId });
    send(socket, { type: 'roomCreated', roomId, playerId, color: 'white' });
    return room;
  },

  joinRoom(roomId: string, nickname: string, socket: WebSocket): boolean {
    const room = rooms.get(roomId);
    if (!room || room.players.length >= 2) return false;
    const playerId = generatePlayerId();
    room.players.push({ id: playerId, color: 'black', nickname, socket });
    room.updatedAt = Date.now();
    socketToPlayer.set(socket, { roomId, playerId });

    const host = room.players[0]!;
    send(socket, {
      type: 'roomJoined',
      roomId,
      playerId,
      color: 'black',
      opponentNickname: host.nickname,
    });
    send(host.socket, { type: 'opponentJoined', opponentNickname: nickname });

    // Send current game state to both
    const gameMsg: ServerMessage = {
      type: 'gameState',
      roomId,
      game: roomStateToWire(room.gameState),
    };
    send(host.socket, gameMsg);
    send(socket, gameMsg);
    return true;
  },

  handleMessage(ws: WebSocket, raw: string): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      send(ws, { type: 'error', code: 'INVALID_JSON', message: 'Invalid JSON' });
      return;
    }
    if (!msg || typeof msg.type !== 'string') {
      send(ws, { type: 'error', code: 'INVALID_MESSAGE', message: 'Missing type' });
      return;
    }

    switch (msg.type) {
      case 'createRoom': {
        const nickname = typeof msg.nickname === 'string' ? msg.nickname.trim() : '';
        if (!nickname) {
          send(ws, { type: 'error', code: 'INVALID_INPUT', message: 'Nickname required' });
          return;
        }
        RoomManager.createRoom(nickname, ws);
        break;
      }
      case 'joinRoom': {
        const roomId = String(msg.roomId ?? '').trim().toUpperCase();
        const nickname = typeof msg.nickname === 'string' ? msg.nickname.trim() : '';
        if (!roomId || !nickname) {
          send(ws, { type: 'error', code: 'INVALID_INPUT', message: 'Room ID and nickname required' });
          return;
        }
        const ok = RoomManager.joinRoom(roomId, nickname, ws);
        if (!ok) {
          send(ws, { type: 'error', code: 'JOIN_FAILED', message: 'Room not found or full' });
        }
        break;
      }
      case 'move': {
        const info = socketToPlayer.get(ws);
        if (!info) {
          send(ws, { type: 'error', code: 'NOT_IN_ROOM', message: 'Not in a room' });
          return;
        }
        const room = rooms.get(info.roomId);
        if (!room || room.players.length < 2) {
          send(ws, { type: 'error', code: 'NOT_READY', message: 'Opponent not connected' });
          return;
        }
        if (gameOver(room.gameState)) {
          send(ws, { type: 'error', code: 'GAME_OVER', message: 'Game has ended' });
          return;
        }
        const player = room.players.find((p) => p.id === info.playerId);
        if (!player || player.color !== room.gameState.turn) {
          send(ws, { type: 'error', code: 'NOT_YOUR_TURN', message: "Not your turn" });
          return;
        }
        const payload = parseMovePayload(
          msg.move.from,
          msg.move.to,
          msg.move.promotion
        );
        if (!payload) {
          send(ws, { type: 'error', code: 'INVALID_MOVE', message: 'Invalid square notation' });
          return;
        }
        const move = findLegalMove(
          room.gameState,
          payload.from,
          payload.to,
          msg.move.promotion
        );
        if (!move) {
          send(ws, { type: 'error', code: 'ILLEGAL_MOVE', message: 'Illegal move' });
          return;
        }
        room.gameState = applyRoomMove(room.gameState, move);
        room.updatedAt = Date.now();
        const gameMsg: ServerMessage = {
          type: 'gameState',
          roomId: room.id,
          game: roomStateToWire(room.gameState),
        };
        broadcastToRoom(room, gameMsg);
        break;
      }
      case 'resign': {
        const info = socketToPlayer.get(ws);
        if (!info) {
          send(ws, { type: 'error', code: 'NOT_IN_ROOM', message: 'Not in a room' });
          return;
        }
        const room = rooms.get(info.roomId);
        if (!room || room.players.length < 2) return;
        if (room.gameState.resigned) return;
        const player = room.players.find((p) => p.id === info.playerId);
        if (!player) return;
        room.gameState = { ...room.gameState, resigned: player.color };
        room.updatedAt = Date.now();
        const gameMsg: ServerMessage = {
          type: 'gameState',
          roomId: room.id,
          game: roomStateToWire(room.gameState),
        };
        broadcastToRoom(room, gameMsg);
        break;
      }
      case 'newGame': {
        const info = socketToPlayer.get(ws);
        if (!info) {
          send(ws, { type: 'error', code: 'NOT_IN_ROOM', message: 'Not in a room' });
          return;
        }
        const room = rooms.get(info.roomId);
        if (!room || room.players.length < 2) return;
        room.gameState = createRoomGameState();
        room.updatedAt = Date.now();
        const gameMsg: ServerMessage = {
          type: 'gameState',
          roomId: room.id,
          game: roomStateToWire(room.gameState),
        };
        broadcastToRoom(room, gameMsg);
        break;
      }
      case 'rejoinRoom':
        send(ws, { type: 'error', code: 'NOT_IMPLEMENTED', message: 'Rejoin not implemented' });
        break;
      default:
        send(ws, { type: 'error', code: 'UNKNOWN_TYPE', message: `Unknown message type: ${(msg as { type: string }).type}` });
    }
  },

  onDisconnect(ws: WebSocket): void {
    const info = socketToPlayer.get(ws);
    if (!info) return;
    const room = rooms.get(info.roomId);
    if (!room) return;
    const other = room.players.filter((p) => p.socket !== ws);
    if (other.length > 0) {
      send(other[0]!.socket, { type: 'opponentDisconnected' });
    }
    rooms.delete(info.roomId);
  },
};
