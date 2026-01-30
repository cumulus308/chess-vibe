/**
 * Square notation for wire protocol: "e2" = file 4, rank 1.
 * Must match server server/src/types.ts.
 */

import type { Square } from '../domain/chess';

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
