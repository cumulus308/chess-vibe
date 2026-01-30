export * from './types.js';
export {
  applyMove,
  getInitialBoard,
  getKingSquare,
  getPiece,
  updateCastlingRights,
} from './board.js';
export {
  getAllLegalMoves,
  getLegalMoves,
  isSquareAttacked,
  type MoveContext,
} from './moves.js';
export { getGameState } from './gameState.js';

import { getInitialBoard } from './board.js';
import { getGameState } from './gameState.js';
import type { Board, CastlingRights, Color, GamePhase, Move } from './types.js';
import { getInitialCastlingRights } from './types.js';

export function createNewGame(): {
  board: Board;
  turn: Color;
  gamePhase: GamePhase;
  castlingRights: CastlingRights;
  lastMove: Move | undefined;
} {
  const board = getInitialBoard();
  const turn: Color = 'white';
  const castlingRights = getInitialCastlingRights();
  const gamePhase = getGameState(board, turn, { castlingRights });
  return {
    board,
    turn,
    gamePhase,
    castlingRights,
    lastMove: undefined,
  };
}
