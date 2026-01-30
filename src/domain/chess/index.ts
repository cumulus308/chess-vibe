export * from './types';
export {
  applyMove,
  getInitialBoard,
  getKingSquare,
  getPiece,
  updateCastlingRights,
} from './board';
export {
  getAllLegalMoves,
  getLegalMoves,
  isSquareAttacked,
  type MoveContext,
} from './moves';
export { getGameState } from './gameState';

import { getInitialBoard } from './board';
import { getGameState } from './gameState';
import type { Board, CastlingRights, Color, GamePhase, Move } from './types';
import { getInitialCastlingRights } from './types';

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
