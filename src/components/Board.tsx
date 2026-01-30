import type { Board as BoardType, Square } from '../domain/chess';
import { getPiece } from '../domain/chess';
import { Piece } from './Piece';

type Orientation = 'white' | 'black';

interface BoardProps {
  board: BoardType;
  selectedSquare: Square | null;
  legalMoveTargets: Square[];
  onSquareClick: (square: Square) => void;
  orientation: Orientation;
}

const RANK_ORDER_WHITE = [7, 6, 5, 4, 3, 2, 1, 0] as const;
const RANK_ORDER_BLACK = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const FILE_ORDER_WHITE = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const FILE_ORDER_BLACK = [7, 6, 5, 4, 3, 2, 1, 0] as const;

function squareEquals(a: Square, b: Square): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function Board({
  board,
  selectedSquare,
  legalMoveTargets,
  onSquareClick,
  orientation,
}: BoardProps) {
  const rankOrder = orientation === 'white' ? RANK_ORDER_WHITE : RANK_ORDER_BLACK;
  const fileOrder = orientation === 'white' ? FILE_ORDER_WHITE : FILE_ORDER_BLACK;

  return (
    <div className={`board board--${orientation}`}>
      {rankOrder.map((rank) => (
        <div key={rank} className="board-row">
          {fileOrder.map((file) => {
            const square: Square = [file, rank];
            const piece = getPiece(board, square);
            const isSelected =
              selectedSquare !== null && squareEquals(selectedSquare, square);
            const isLegalTarget = legalMoveTargets.some((s) =>
              squareEquals(s, square)
            );
            const isLight = (file + rank) % 2 === 0;
            const className = [
              'square',
              isLight ? 'square-light' : 'square-dark',
              isSelected ? 'square-selected' : '',
              isLegalTarget ? 'square-legal' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={`${file}-${rank}`}
                type="button"
                className={className}
                onClick={() => onSquareClick(square)}
              >
                {piece ? <Piece piece={piece} /> : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
