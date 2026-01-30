import type { GamePhase } from '../domain/chess';

interface GameStatusProps {
  gamePhase: GamePhase;
}

export function GameStatus({ gamePhase }: GameStatusProps) {
  if (gamePhase.checkmate) {
    const winner = gamePhase.turn === 'white' ? 'Black' : 'White';
    return <p className="game-status">Checkmate – {winner} wins</p>;
  }
  if (gamePhase.stalemate) {
    return <p className="game-status">Stalemate – draw</p>;
  }
  const turnLabel = gamePhase.turn === 'white' ? "White's turn" : "Black's turn";
  const checkLabel = gamePhase.check ? ' – Check' : '';
  return (
    <p className="game-status">
      {turnLabel}
      {checkLabel}
    </p>
  );
}
