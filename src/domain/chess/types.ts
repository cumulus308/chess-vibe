export type Color = 'white' | 'black';

export type PieceType =
  | 'pawn'
  | 'rook'
  | 'knight'
  | 'bishop'
  | 'queen'
  | 'king';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type File = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Square = [File, Rank];

export type Board = (Piece | null)[][];

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
}

export interface GamePhase {
  turn: Color;
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
}

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export function getInitialCastlingRights(): CastlingRights {
  return {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  };
}

export const FILES: File[] = [0, 1, 2, 3, 4, 5, 6, 7];
export const RANKS: Rank[] = [0, 1, 2, 3, 4, 5, 6, 7];

export function isFile(n: number): n is File {
  return n >= 0 && n <= 7;
}

export function isRank(n: number): n is Rank {
  return n >= 0 && n <= 7;
}

export function squareEquals(a: Square, b: Square): boolean {
  return a[0] === b[0] && a[1] === b[1];
}
