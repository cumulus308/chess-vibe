/**
 * Room game state using chess domain. Used by Vercel API routes.
 */

import {
  createNewGame,
  applyMove,
  getLegalMoves,
  getGameState,
  updateCastlingRights,
  getPiece,
} from '../../src/domain/chess';
import type {
  Board,
  CastlingRights,
  Color,
  GamePhase,
  Move,
  Square,
} from '../../src/domain/chess';
import { formatSquare, parseSquare, parsePromotion } from './notation';

export interface RoomGameState {
  board: Board;
  turn: Color;
  gamePhase: GamePhase;
  castlingRights: CastlingRights;
  lastMove: Move | undefined;
  resigned?: Color;
}

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
  const nextPhase = getGameState(nextBoard, nextTurn, {
    castlingRights: nextRights,
    lastMove: move,
  });

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
  fromSquare: Square,
  toSquare: Square,
  promotion?: string
): Move | null {
  const context = { castlingRights: state.castlingRights, lastMove: state.lastMove };
  const moves = getLegalMoves(state.board, fromSquare, context);
  const promotionType = parsePromotion(promotion);
  for (const m of moves) {
    if (m.to[0] !== toSquare[0] || m.to[1] !== toSquare[1]) continue;
    if (m.promotion !== undefined && promotionType !== undefined) {
      if (m.promotion === promotionType) return m;
    } else if (m.promotion === undefined && promotionType === undefined) {
      return m;
    }
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
      ? {
          from: formatSquare(state.lastMove.from),
          to: formatSquare(state.lastMove.to),
          promotion: state.lastMove.promotion,
        }
      : null,
    resigned: state.resigned,
  };
}

export function parseMovePayload(
  from: string,
  to: string,
  promotion?: string
): { from: Square; to: Square; promotion?: import('../../src/domain/chess').PieceType } | null {
  const fromSq = parseSquare(from);
  const toSq = parseSquare(to);
  if (fromSq === null || toSq === null) return null;
  const p = parsePromotion(promotion);
  return { from: fromSq, to: toSq, promotion: p };
}

export function gameOver(state: RoomGameState): boolean {
  return (
    state.gamePhase.checkmate === true ||
    state.gamePhase.stalemate === true ||
    state.resigned !== undefined
  );
}
