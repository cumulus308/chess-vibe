/**
 * WebSocket message types and shared protocol.
 * Square notation: file a-h (0-7), rank 1-8 (0-7). e.g. "e2" = [4, 1].
 */

import type { Square, PieceType } from '../../src/domain/chess';

const FILES = 'abcdefgh';
const RANKS = '12345678';

export function formatSquare([file, rank]: Square): string {
  return FILES[file]! + RANKS[rank];
}

export function parseSquare(s: string): Square | null {
  if (s.length !== 2) return null;
  const fileIdx = FILES.indexOf(s[0]!);
  const rankIdx = RANKS.indexOf(s[1]!);
  if (fileIdx === -1 || rankIdx === -1) return null;
  return [fileIdx as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, rankIdx as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
}

const PIECE_TYPES: PieceType[] = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
export function parsePromotion(s: string | undefined): PieceType | undefined {
  if (s === undefined) return undefined;
  return PIECE_TYPES.includes(s as PieceType) ? (s as PieceType) : undefined;
}

/** Serialized game state sent over the wire. Shape matches frontend src/shared/protocol.ts */
export interface WireGameState {
  board: unknown;
  turn: 'white' | 'black';
  gamePhase: {
    turn: 'white' | 'black';
    check: boolean;
    checkmate: boolean;
    stalemate: boolean;
  };
  castlingRights: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  lastMove: { from: string; to: string; promotion?: string } | null;
  resigned?: 'white' | 'black';
}

/** Client -> Server messages */
export type ClientMessage =
  | { type: 'createRoom'; nickname: string }
  | { type: 'joinRoom'; roomId: string; nickname: string }
  | { type: 'rejoinRoom'; roomId: string; playerId: string }
  | {
      type: 'move';
      roomId: string;
      playerId: string;
      move: { from: string; to: string; promotion?: string };
    }
  | { type: 'resign'; roomId: string; playerId: string }
  | { type: 'newGame'; roomId: string; playerId: string };

/** Server -> Client messages */
export type ServerMessage =
  | { type: 'roomCreated'; roomId: string; playerId: string; color: 'white' | 'black' }
  | {
      type: 'roomJoined';
      roomId: string;
      playerId: string;
      color: 'white' | 'black';
      opponentNickname?: string;
    }
  | { type: 'opponentJoined'; opponentNickname: string }
  | { type: 'gameState'; roomId: string; game: WireGameState }
  | { type: 'opponentDisconnected' }
  | { type: 'error'; code: string; message: string };
