/**
 * Square notation for API (a1–h8). Matches frontend src/lib/notation.ts.
 */

import type { Square } from '../../src/domain/chess';
import type { PieceType } from '../../src/domain/chess';

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
