import { getKingSquare } from './board.js';
import { getAllLegalMoves, isSquareAttacked } from './moves.js';
import type { MoveContext } from './moves.js';
import type { Board, Color, GamePhase } from './types.js';

export function getGameState(
  board: Board,
  turn: Color,
  context: MoveContext
): GamePhase {
  const kingSquare = getKingSquare(board, turn);
  const check =
    kingSquare !== null && isSquareAttacked(board, kingSquare, turn === 'white' ? 'black' : 'white');
  const legalMoves = getAllLegalMoves(board, turn, context);
  const hasLegalMoves = legalMoves.length > 0;

  return {
    turn,
    check,
    checkmate: check && !hasLegalMoves,
    stalemate: !check && !hasLegalMoves,
  };
}
