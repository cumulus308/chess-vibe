/**
 * Wire protocol types shared between frontend and backend.
 * Must stay in sync with server/src/types.ts (ClientMessage, ServerMessage).
 */

import type { Board, CastlingRights, Color, GamePhase } from '../domain/chess';

export interface WireGameState {
  board: Board;
  turn: Color;
  gamePhase: GamePhase;
  castlingRights: CastlingRights;
  lastMove: { from: string; to: string; promotion?: string } | null;
  resigned?: Color;
}
