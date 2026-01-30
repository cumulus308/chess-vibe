/**
 * Shared code for Vercel API routes (single file so it is deployed with each function).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelResponse } from '@vercel/node';
import {
  createNewGame,
  applyMove,
  getLegalMoves,
  getGameState,
  updateCastlingRights,
  getPiece,
} from '../src/domain/chess';
import type {
  Board,
  CastlingRights,
  Color,
  GamePhase,
  Move,
  Square,
} from '../src/domain/chess';

// --- Supabase ---
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _client = createClient(url, key);
  }
  return _client;
}

export interface RoomPlayer {
  id: string;
  color: 'white' | 'black';
  nickname: string;
}

export interface RoomGameState {
  board: Board;
  turn: Color;
  gamePhase: GamePhase;
  castlingRights: CastlingRights;
  lastMove: Move | undefined;
  resigned?: Color;
}

export interface RoomState {
  gameState: RoomGameState;
  players: RoomPlayer[];
}

// --- Response helpers ---
export function json(res: VercelResponse, data: unknown, status = 200): void {
  res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(data));
}

export function err(res: VercelResponse, message: string, status = 400): void {
  json(res, { error: message }, status);
}

// --- IDs ---
const ROOM_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateRoomId(): string {
  let id = '';
  for (let i = 0; i < 6; i++) id += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)]!;
  return id;
}
export function generatePlayerId(): string {
  return crypto.randomUUID();
}

// --- Notation ---
const FILES = 'abcdefgh';
const RANKS = '12345678';
type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export function formatSquare([file, rank]: Square): string {
  return FILES[file]! + RANKS[rank];
}
export function parseSquare(s: string): Square | null {
  if (s.length !== 2) return null;
  const fi = FILES.indexOf(s[0]!);
  const ri = RANKS.indexOf(s[1]!);
  if (fi === -1 || ri === -1) return null;
  return [fi as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, ri as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
}
const PIECE_TYPES: PieceType[] = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
export function parsePromotion(s: string | undefined): PieceType | undefined {
  if (s === undefined) return undefined;
  return PIECE_TYPES.includes(s as PieceType) ? (s as PieceType) : undefined;
}

// --- Game ---
export interface WireGameState {
  board: Board;
  turn: Color;
  gamePhase: GamePhase;
  castlingRights: CastlingRights;
  lastMove: { from: string; to: string; promotion?: string } | null;
  resigned?: Color;
}

export function createRoomGameState(): RoomGameState {
  const fresh = createNewGame();
  return {
    board: fresh.board,
    turn: fresh.turn,
    gamePhase: fresh.gamePhase,
    castlingRights: fresh.castlingRights,
    lastMove: fresh.lastMove,
  };
}

export function applyRoomMove(state: RoomGameState, move: Move): RoomGameState {
  const piece = getPiece(state.board, move.from);
  if (!piece) return state;
  const nextBoard = applyMove(state.board, move);
  const nextTurn: Color = state.turn === 'white' ? 'black' : 'white';
  const nextRights = updateCastlingRights(state.castlingRights, move, piece);
  const nextPhase = getGameState(nextBoard, nextTurn, { castlingRights: nextRights, lastMove: move });
  return {
    board: nextBoard,
    turn: nextTurn,
    gamePhase: nextPhase,
    castlingRights: nextRights,
    lastMove: move,
  };
}

export function findLegalMove(
  state: RoomGameState,
  from: Square,
  to: Square,
  promotion?: string
): Move | null {
  const ctx = { castlingRights: state.castlingRights, lastMove: state.lastMove };
  const moves = getLegalMoves(state.board, from, ctx);
  const p = parsePromotion(promotion);
  for (const m of moves) {
    if (m.to[0] !== to[0] || m.to[1] !== to[1]) continue;
    if (m.promotion !== undefined && p !== undefined) {
      if (m.promotion === p) return m;
      continue;
    }
    if (m.promotion === undefined && p === undefined) return m;
  }
  return null;
}

export function roomStateToWire(state: RoomGameState): WireGameState {
  return {
    board: state.board,
    turn: state.turn,
    gamePhase: state.gamePhase,
    castlingRights: state.castlingRights,
    lastMove: state.lastMove
      ? { from: formatSquare(state.lastMove.from), to: formatSquare(state.lastMove.to), promotion: state.lastMove.promotion }
      : null,
    resigned: state.resigned,
  };
}

export function parseMovePayload(
  from: string,
  to: string,
  promotion?: string
): { from: Square; to: Square; promotion?: PieceType } | null {
  const fromSq = parseSquare(from);
  const toSq = parseSquare(to);
  if (!fromSq || !toSq) return null;
  return { from: fromSq, to: toSq, promotion: parsePromotion(promotion) };
}

export function gameOver(state: RoomGameState): boolean {
  return !!state.gamePhase.checkmate || !!state.gamePhase.stalemate || state.resigned != null;
}
