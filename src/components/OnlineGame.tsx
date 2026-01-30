import { Board } from './Board';
import { GameStatus } from './GameStatus';
import { useOnlineGame } from '../hooks/useOnlineGame';
import type { OnlineConnectionInfo } from './OnlineLobby';

interface OnlineGameProps {
  connection: OnlineConnectionInfo;
  onLeave: () => void;
}

export function OnlineGame({ connection, onLeave }: OnlineGameProps) {
  const {
    gameState,
    selectedSquare,
    legalMoveTargets,
    orientation,
    connectionError,
    myColor,
    gameOver,
    onSquareClick,
    onNewGame,
    onResign,
  } = useOnlineGame(connection);

  if (!gameState) {
    return (
      <div className="app">
        <p>Loading game…</p>
        <button type="button" onClick={onLeave}>
          Leave
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Chess Vibe – Online</h1>
      <p className="online-meta">
        Room: <strong>{connection.roomId}</strong>
        {connection.opponentNickname && (
          <> · Opponent: {connection.opponentNickname}</>
        )}
        {myColor != null && (
          <> · You play <strong>{myColor}</strong></>
        )}
      </p>
      {connectionError && (
        <p className="online-error">{connectionError}</p>
      )}
      {gameState.resigned != null ? (
        <p className="game-status">
          {gameState.resigned === 'white' ? 'White' : 'Black'} resigned –{' '}
          {gameState.resigned === 'white' ? 'Black' : 'White'} wins
        </p>
      ) : (
        <GameStatus gamePhase={gameState.gamePhase} />
      )}
      <div className="online-actions">
        <button type="button" className="new-game" onClick={onNewGame}>
          New Game
        </button>
        <button type="button" className="resign" onClick={onResign} disabled={gameOver}>
          Resign
        </button>
        <button type="button" className="back-to-menu" onClick={onLeave}>
          Leave
        </button>
      </div>
      <Board
        board={gameState.board}
        selectedSquare={selectedSquare}
        legalMoveTargets={legalMoveTargets}
        onSquareClick={onSquareClick}
        orientation={orientation}
      />
    </div>
  );
}
