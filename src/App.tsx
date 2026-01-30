import { useState } from 'react';
import {
  createNewGame,
  applyMove,
  getLegalMoves,
  getGameState,
  updateCastlingRights,
  getPiece,
  getInitialCastlingRights,
  squareEquals,
} from './domain/chess';
import type { Board, CastlingRights, Color, GamePhase, Move, Square } from './domain/chess';
import { Board as BoardUI } from './components/Board';
import { GameStatus } from './components/GameStatus';
import { ModeSelect } from './components/ModeSelect';
import { OnlineLobby, type OnlineConnectionInfo } from './components/OnlineLobby';
import { OnlineGame } from './components/OnlineGame';
import './App.css';

type Orientation = 'white' | 'black';
type View = 'menu' | 'local' | 'online-lobby' | 'online-game';

function getLegalMoveTargets(
  board: Board,
  square: Square,
  castlingRights: CastlingRights,
  lastMove: Move | undefined
): Square[] {
  const moves = getLegalMoves(board, square, { castlingRights, lastMove });
  return moves.map((m) => m.to);
}

type LobbyMode = 'create' | 'join';

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [lobbyMode, setLobbyMode] = useState<LobbyMode>('create');
  const [onlineConnection, setOnlineConnection] = useState<OnlineConnectionInfo | null>(null);

  const [board, setBoard] = useState<Board>(() => createNewGame().board);
  const [turn, setTurn] = useState<Color>('white');
  const [gamePhase, setGamePhase] = useState<GamePhase>(() =>
    getGameState(board, 'white', { castlingRights: getInitialCastlingRights() })
  );
  const [castlingRights, setCastlingRights] = useState<CastlingRights>(() =>
    getInitialCastlingRights()
  );
  const [lastMove, setLastMove] = useState<Move | undefined>(undefined);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const context = { castlingRights, lastMove };
  const legalMoveTargets =
    selectedSquare !== null
      ? getLegalMoveTargets(board, selectedSquare, castlingRights, lastMove)
      : [];

  const gameOver = gamePhase.checkmate || gamePhase.stalemate;
  const orientation: Orientation = turn;

  function handleNewGame() {
    const fresh = createNewGame();
    setBoard(fresh.board);
    setTurn(fresh.turn);
    setGamePhase(fresh.gamePhase);
    setCastlingRights(fresh.castlingRights);
    setLastMove(fresh.lastMove);
    setSelectedSquare(null);
  }

  function handleSquareClick(square: Square) {
    if (gameOver) return;

    const piece = getPiece(board, square);

    if (selectedSquare !== null) {
      const moves = getLegalMoves(board, selectedSquare, context);
      const move = moves.find((m) => squareEquals(m.to, square));
      if (move) {
        const nextBoard = applyMove(board, move);
        const nextTurn: Color = turn === 'white' ? 'black' : 'white';
        const nextRights = updateCastlingRights(
          castlingRights,
          move,
          getPiece(board, selectedSquare)!
        );
        const nextPhase = getGameState(nextBoard, nextTurn, {
          castlingRights: nextRights,
          lastMove: move,
        });
        setBoard(nextBoard);
        setTurn(nextTurn);
        setGamePhase(nextPhase);
        setCastlingRights(nextRights);
        setLastMove(move);
        setSelectedSquare(null);
      } else if (piece?.color === turn) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    } else {
      if (piece?.color === turn) {
        setSelectedSquare(square);
      }
    }
  }

  if (view === 'menu') {
    return (
      <div className="app">
        <ModeSelect
          onSelect={(mode) => {
            if (mode === 'local') setView('local');
            else {
              setLobbyMode(mode === 'online-host' ? 'create' : 'join');
              setView('online-lobby');
            }
          }}
        />
      </div>
    );
  }

  if (view === 'online-lobby') {
    return (
      <div className="app">
        <OnlineLobby
          mode={lobbyMode}
          onBack={() => setView('menu')}
          onGameStart={(info) => {
            setOnlineConnection(info);
            setView('online-game');
          }}
        />
      </div>
    );
  }

  if (view === 'online-game' && onlineConnection) {
    return (
      <OnlineGame
        connection={onlineConnection}
        onLeave={() => {
          setOnlineConnection(null);
          setView('menu');
        }}
      />
    );
  }

  return (
    <div className="app">
      <h1>Chess Vibe</h1>
      <button type="button" className="back-to-menu" onClick={() => setView('menu')}>
        Back to menu
      </button>
      <GameStatus gamePhase={gamePhase} />
      <button type="button" className="new-game" onClick={handleNewGame}>
        New Game
      </button>
      <BoardUI
        board={board}
        selectedSquare={selectedSquare}
        legalMoveTargets={legalMoveTargets}
        onSquareClick={handleSquareClick}
        orientation={orientation}
      />
    </div>
  );
}
