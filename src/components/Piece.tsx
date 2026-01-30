import type { Piece as PieceType } from '../domain/chess';

const SYMBOLS: Record<PieceType['type'], { white: string; black: string }> = {
  king: { white: '♔', black: '♚' },
  queen: { white: '♕', black: '♛' },
  rook: { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn: { white: '♙', black: '♟' },
};

interface PieceProps {
  piece: PieceType;
}

export function Piece({ piece }: PieceProps) {
  const sym = SYMBOLS[piece.type][piece.color];
  return <span className="piece" data-color={piece.color}>{sym}</span>;
}
