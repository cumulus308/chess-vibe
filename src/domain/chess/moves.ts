import { applyMove, getKingSquare, getPiece } from './board.js';
import type {
  Board,
  CastlingRights,
  Color,
  Move,
  Piece,
  Square,
} from './types.js';
import { FILES, isFile, isRank, RANKS, squareEquals } from './types.js';

export interface MoveContext {
  lastMove?: Move;
  castlingRights: CastlingRights;
}

const KNIGHT_OFFSETS: [number, number][] = [
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
];

const KING_OFFSETS: [number, number][] = [
  [1, 0],
  [1, 1],
  [1, -1],
  [0, 1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [-1, -1],
];

function addSquaresInDirection(
  board: Board,
  from: Square,
  _color: Color,
  df: number,
  dr: number
): Square[] {
  const out: Square[] = [];
  let [f, r] = from;
  for (let i = 0; i < 8; i++) {
    f += df;
    r += dr;
    if (!isFile(f) || !isRank(r)) break;
    const p = getPiece(board, [f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r]);
    out.push([f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r]);
    if (p !== null) break;
  }
  return out;
}

function getRookMoves(board: Board, from: Square, color: Color): Square[] {
  const out: Square[] = [];
  for (const [df, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const squares = addSquaresInDirection(board, from, color, df, dr);
    for (const sq of squares) {
    const p = getPiece(board, sq);
    if (p === null || p.color !== color) out.push(sq);
    }
  }
  return out;
}

function getBishopMoves(board: Board, from: Square, color: Color): Square[] {
  const out: Square[] = [];
  for (const [df, dr] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    const squares = addSquaresInDirection(board, from, color, df, dr);
    for (const sq of squares) {
    const p = getPiece(board, sq);
    if (p === null || p.color !== color) out.push(sq);
    }
  }
  return out;
}

function getQueenMoves(board: Board, from: Square, color: Color): Square[] {
  return [...getRookMoves(board, from, color), ...getBishopMoves(board, from, color)];
}

function getKnightMoves(board: Board, from: Square, color: Color): Square[] {
  const [file, rank] = from;
  const out: Square[] = [];
  for (const [df, dr] of KNIGHT_OFFSETS) {
    const f = file + df;
    const r = rank + dr;
    if (!isFile(f) || !isRank(r)) continue;
    const p = getPiece(board, [f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r]);
    if (p === null || p.color !== color) out.push([f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r]);
  }
  return out;
}

function getKingMoves(board: Board, from: Square, color: Color): Square[] {
  const [file, rank] = from;
  const out: Square[] = [];
  for (const [df, dr] of KING_OFFSETS) {
    const f = file + df;
    const r = rank + dr;
    if (!isFile(f) || !isRank(r)) continue;
    const p = getPiece(board, [f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r]);
    if (p === null || p.color !== color) out.push([f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r]);
  }
  return out;
}

function getPawnMoves(board: Board, from: Square, color: Color): Square[] {
  const [file, rank] = from;
  const out: Square[] = [];
  const dir = color === 'white' ? 1 : -1;
  const startRank = color === 'white' ? 1 : 6;
  const oneForward: Square = [file, (rank + dir) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
  if (isRank(rank + dir)) {
    if (getPiece(board, oneForward) === null) {
      out.push(oneForward);
      const twoForward: Square = [file, (rank + 2 * dir) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
      if (rank === startRank && getPiece(board, twoForward) === null) out.push(twoForward);
    }
  }
  for (const df of [-1, 1]) {
    const f = file + df;
    const r = rank + dir;
    if (!isFile(f) || !isRank(r)) continue;
    const target: Square = [f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r];
    const p = getPiece(board, target);
    if (p !== null && p.color !== color) out.push(target);
  }
  return out;
}

function getPawnAttackSquares(from: Square, color: Color): Square[] {
  const [file, rank] = from;
  const dir = color === 'white' ? 1 : -1;
  const r = rank + dir;
  const out: Square[] = [];
  for (const df of [-1, 1]) {
    const f = file + df;
    if (isFile(f) && isRank(r)) out.push([f as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, r]);
  }
  return out;
}

export function isSquareAttacked(board: Board, square: Square, byColor: Color): boolean {
  for (const rank of RANKS) {
    for (const file of FILES) {
      const sq: Square = [file, rank];
      const p = getPiece(board, sq);
      if (p === null || p.color !== byColor) continue;
      let attacks: Square[] = [];
      switch (p.type) {
        case 'pawn':
          attacks = getPawnAttackSquares(sq, byColor);
          break;
        case 'knight':
          attacks = getKnightMoves(board, sq, byColor);
          break;
        case 'bishop':
          attacks = getBishopMoves(board, sq, byColor);
          break;
        case 'rook':
          attacks = getRookMoves(board, sq, byColor);
          break;
        case 'queen':
          attacks = getQueenMoves(board, sq, byColor);
          break;
        case 'king':
          attacks = getKingMoves(board, sq, byColor);
          break;
      }
      if (attacks.some((s) => squareEquals(s, square))) return true;
    }
  }
  return false;
}

function getPseudoLegalMoves(board: Board, from: Square, piece: Piece): Move[] {
  let toSquares: Square[] = [];
  switch (piece.type) {
    case 'pawn':
      toSquares = getPawnMoves(board, from, piece.color);
      break;
    case 'rook':
      toSquares = getRookMoves(board, from, piece.color);
      break;
    case 'knight':
      toSquares = getKnightMoves(board, from, piece.color);
      break;
    case 'bishop':
      toSquares = getBishopMoves(board, from, piece.color);
      break;
    case 'queen':
      toSquares = getQueenMoves(board, from, piece.color);
      break;
    case 'king':
      toSquares = getKingMoves(board, from, piece.color);
      break;
  }
  const moves: Move[] = [];
  const lastRank = piece.color === 'white' ? 7 : 0;
  for (const to of toSquares) {
    if (piece.type === 'pawn' && to[1] === lastRank) {
      moves.push({ from, to, promotion: 'queen' });
    } else {
      moves.push({ from, to });
    }
  }
  return moves;
}

function getCastlingMoves(
  board: Board,
  color: Color,
  rights: CastlingRights
): Move[] {
  const moves: Move[] = [];
  const rank = color === 'white' ? 0 : 7;
  const kingSquare: Square = [4, rank];
  const king = getPiece(board, kingSquare);
  if (!king || king.type !== 'king' || king.color !== color) return moves;
  const opposite = color === 'white' ? 'black' : 'white';

  if (rights.whiteKingside && color === 'white') {
    const rook = getPiece(board, [7, 0]);
    if (
      rook?.type === 'rook' &&
      rook.color === 'white' &&
      getPiece(board, [5, 0]) === null &&
      getPiece(board, [6, 0]) === null &&
      !isSquareAttacked(board, kingSquare, opposite) &&
      !isSquareAttacked(board, [5, 0], opposite) &&
      !isSquareAttacked(board, [6, 0], opposite)
    ) {
      moves.push({ from: kingSquare, to: [6, 0] });
    }
  }
  if (rights.whiteQueenside && color === 'white') {
    const rook = getPiece(board, [0, 0]);
    if (
      rook?.type === 'rook' &&
      rook.color === 'white' &&
      getPiece(board, [1, 0]) === null &&
      getPiece(board, [2, 0]) === null &&
      getPiece(board, [3, 0]) === null &&
      !isSquareAttacked(board, kingSquare, opposite) &&
      !isSquareAttacked(board, [3, 0], opposite) &&
      !isSquareAttacked(board, [2, 0], opposite)
    ) {
      moves.push({ from: kingSquare, to: [2, 0] });
    }
  }
  if (rights.blackKingside && color === 'black') {
    const rook = getPiece(board, [7, 7]);
    if (
      rook?.type === 'rook' &&
      rook.color === 'black' &&
      getPiece(board, [5, 7]) === null &&
      getPiece(board, [6, 7]) === null &&
      !isSquareAttacked(board, kingSquare, opposite) &&
      !isSquareAttacked(board, [5, 7], opposite) &&
      !isSquareAttacked(board, [6, 7], opposite)
    ) {
      moves.push({ from: kingSquare, to: [6, 7] });
    }
  }
  if (rights.blackQueenside && color === 'black') {
    const rook = getPiece(board, [0, 7]);
    if (
      rook?.type === 'rook' &&
      rook.color === 'black' &&
      getPiece(board, [1, 7]) === null &&
      getPiece(board, [2, 7]) === null &&
      getPiece(board, [3, 7]) === null &&
      !isSquareAttacked(board, kingSquare, opposite) &&
      !isSquareAttacked(board, [3, 7], opposite) &&
      !isSquareAttacked(board, [2, 7], opposite)
    ) {
      moves.push({ from: kingSquare, to: [2, 7] });
    }
  }
  return moves;
}

function getEnPassantMoves(
  board: Board,
  from: Square,
  piece: Piece,
  lastMove?: Move
): Move[] {
  if (piece.type !== 'pawn' || !lastMove) return [];
  const [file, rank] = from;
  const epRank = piece.color === 'white' ? 4 : 3;
  if (rank !== epRank) return [];
  const [toFile, toRank] = lastMove.to;
  const lastPiece = getPiece(board, lastMove.to);
  if (!lastPiece || lastPiece.type !== 'pawn' || lastPiece.color === piece.color)
    return [];
  if (Math.abs(toRank - lastMove.from[1]) !== 2) return [];
  if (Math.abs(file - toFile) !== 1) return [];
  const toSquare: Square = [toFile, rank];
  return [{ from, to: toSquare }];
}

export function getLegalMoves(
  board: Board,
  square: Square,
  context: MoveContext
): Move[] {
  const piece = getPiece(board, square);
  if (!piece) return [];
  const kingSquare = getKingSquare(board, piece.color);
  if (!kingSquare) return [];
  const opposite = piece.color === 'white' ? 'black' : 'white';

  const pseudo = getPseudoLegalMoves(board, square, piece);
  const castling =
    piece.type === 'king'
      ? getCastlingMoves(board, piece.color, context.castlingRights)
      : [];
  const enPassant = getEnPassantMoves(
    board,
    square,
    piece,
    context.lastMove
  );

  const allCandidates = [...pseudo, ...castling, ...enPassant];
  const legal: Move[] = [];
  for (const move of allCandidates) {
    const nextBoard = applyMove(board, move);
    const newKingSquare =
      piece.type === 'king'
        ? (move.to as Square)
        : getKingSquare(nextBoard, piece.color);
    if (newKingSquare && !isSquareAttacked(nextBoard, newKingSquare, opposite)) {
      legal.push(move);
    }
  }
  return legal;
}

export function getAllLegalMoves(
  board: Board,
  color: Color,
  context: MoveContext
): Move[] {
  const moves: Move[] = [];
  for (const rank of RANKS) {
    for (const file of FILES) {
      const sq: Square = [file, rank];
      const piece = getPiece(board, sq);
      if (piece?.color === color) {
        moves.push(...getLegalMoves(board, sq, context));
      }
    }
  }
  return moves;
}
