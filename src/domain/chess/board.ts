import type {
  Board,
  CastlingRights,
  Color,
  Move,
  Piece,
  Square,
} from './types.js';
import { FILES, RANKS } from './types.js';

export function getInitialBoard(): Board {
  const board: Board = RANKS.map(() => FILES.map(() => null));

  const setupRank = (rank: 0 | 7, color: Color) => {
    board[rank][0] = { type: 'rook', color };
    board[rank][1] = { type: 'knight', color };
    board[rank][2] = { type: 'bishop', color };
    board[rank][3] = { type: 'queen', color };
    board[rank][4] = { type: 'king', color };
    board[rank][5] = { type: 'bishop', color };
    board[rank][6] = { type: 'knight', color };
    board[rank][7] = { type: 'rook', color };
  };

  setupRank(0, 'white');
  for (let f = 0; f < 8; f++) board[1][f] = { type: 'pawn', color: 'white' };
  setupRank(7, 'black');
  for (let f = 0; f < 8; f++) board[6][f] = { type: 'pawn', color: 'black' };

  return board;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function setPiece(board: Board, [file, rank]: Square, piece: Piece | null): void {
  board[rank][file] = piece;
}

export function getPiece(board: Board, [file, rank]: Square): Piece | null {
  return board[rank][file];
}

export function getKingSquare(board: Board, color: Color): Square | null {
  for (const rank of RANKS) {
    for (const file of FILES) {
      const p = getPiece(board, [file as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, rank]);
      if (p?.type === 'king' && p.color === color)
        return [file as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, rank];
    }
  }
  return null;
}

export function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board);
  const [fromFile, fromRank] = move.from;
  const [toFile, toRank] = move.to;
  const piece = getPiece(next, move.from);
  if (!piece) return next;

  setPiece(next, move.from, null);

  const isEnPassant =
    piece.type === 'pawn' &&
    fromFile !== toFile &&
    getPiece(next, move.to) === null;
  if (isEnPassant) {
    const captureRank = piece.color === 'white' ? toRank + 1 : toRank - 1;
    setPiece(next, [toFile, captureRank as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7], null);
  }

  const isKingsideCastle = piece.type === 'king' && toFile - fromFile === 2;
  const isQueensideCastle = piece.type === 'king' && fromFile - toFile === 2;
  if (isKingsideCastle) {
    const rookRank = fromRank;
    setPiece(next, [7, rookRank], null);
    setPiece(next, [5, rookRank], { type: 'rook', color: piece.color });
  } else if (isQueensideCastle) {
    const rookRank = fromRank;
    setPiece(next, [0, rookRank], null);
    setPiece(next, [3, rookRank], { type: 'rook', color: piece.color });
  }

  const promotionType = move.promotion ?? 'queen';
  const finalPiece: Piece =
    piece.type === 'pawn' && (toRank === 0 || toRank === 7)
      ? { type: promotionType, color: piece.color }
      : piece;

  setPiece(next, move.to, finalPiece);
  return next;
}

export function updateCastlingRights(
  rights: CastlingRights,
  move: Move,
  piece: Piece
): CastlingRights {
  const next = { ...rights };
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      next.whiteKingside = false;
      next.whiteQueenside = false;
    } else {
      next.blackKingside = false;
      next.blackQueenside = false;
    }
  } else if (piece.type === 'rook') {
    const [file] = move.from;
    if (piece.color === 'white') {
      if (file === 7) next.whiteKingside = false;
      if (file === 0) next.whiteQueenside = false;
    } else {
      if (file === 7) next.blackKingside = false;
      if (file === 0) next.blackQueenside = false;
    }
  }
  return next;
}
