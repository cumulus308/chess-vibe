/**
 * REST API client for online rooms (Vercel serverless + Supabase).
 */

import { API_BASE } from '../config';

async function request<T>(
  path: string,
  options: { method?: string; body?: object } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export interface CreateRoomRes {
  roomId: string;
  playerId: string;
  color: 'white' | 'black';
  gameState: import('../shared/protocol').WireGameState;
}

export function createRoom(nickname: string): Promise<CreateRoomRes> {
  return request<CreateRoomRes>('/api/room', { method: 'POST', body: { nickname } });
}

export interface JoinRoomRes {
  roomId: string;
  playerId: string;
  color: 'white' | 'black';
  opponentNickname?: string;
  gameState: import('../shared/protocol').WireGameState;
}

export function joinRoom(roomId: string, nickname: string): Promise<JoinRoomRes> {
  return request<JoinRoomRes>(`/api/room/${encodeURIComponent(roomId)}/join`, {
    method: 'POST',
    body: { nickname },
  });
}

export interface RoomStateRes {
  gameState: import('../shared/protocol').WireGameState;
  players: { id: string; color: 'white' | 'black'; nickname: string }[];
}

export function getRoomState(roomId: string): Promise<RoomStateRes> {
  return request<RoomStateRes>(`/api/room/${encodeURIComponent(roomId)}/state`, {
    method: 'GET',
  });
}

export interface MoveRes {
  gameState: import('../shared/protocol').WireGameState;
}

export function sendMove(
  roomId: string,
  playerId: string,
  move: { from: string; to: string; promotion?: string }
): Promise<MoveRes> {
  return request<MoveRes>(`/api/room/${encodeURIComponent(roomId)}/move`, {
    method: 'POST',
    body: { playerId, ...move },
  });
}

export function resign(roomId: string, playerId: string): Promise<MoveRes> {
  return request<MoveRes>(`/api/room/${encodeURIComponent(roomId)}/resign`, {
    method: 'POST',
    body: { playerId },
  });
}

export function newGame(roomId: string, playerId: string): Promise<MoveRes> {
  return request<MoveRes>(`/api/room/${encodeURIComponent(roomId)}/new-game`, {
    method: 'POST',
    body: { playerId },
  });
}
