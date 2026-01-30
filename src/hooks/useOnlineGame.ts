import { useState, useEffect, useRef, useCallback } from 'react';
import { getLegalMoves, getPiece, squareEquals } from '../domain/chess';
import type {
  Board,
  CastlingRights,
  Color,
  GamePhase,
  Move,
  Square,
} from '../domain/chess';
import { formatSquare, parseSquare } from '../lib/notation';
import { getRoomState, sendMove as apiMove, resign as apiResign, newGame as apiNewGame } from '../api/room';
import type { OnlineConnectionInfo } from '../components/OnlineLobby';
import type { WireGameState } from '../shared/protocol';

function wireToLastMove(
  lastMove: WireGameState['lastMove']
): Move | undefined {
  if (!lastMove) return undefined;
  const from = parseSquare(lastMove.from);
  const to = parseSquare(lastMove.to);
  if (!from || !to) return undefined;
  const promotion = lastMove.promotion as Move['promotion'] | undefined;
  return { from, to, promotion };
}

function applyWireGame(game: WireGameState) {
  return {
    board: game.board,
    turn: game.turn,
    gamePhase: game.gamePhase,
    castlingRights: game.castlingRights,
    lastMove: wireToLastMove(game.lastMove),
    resigned: game.resigned,
  };
}

export interface OnlineGameState {
  board: Board;
  turn: Color;
  gamePhase: GamePhase;
  castlingRights: CastlingRights;
  lastMove: Move | undefined;
  resigned?: Color;
}

const POLL_INTERVAL_MS = 1500;

export function useOnlineGame(connection: OnlineConnectionInfo | null) {
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roomId = connection?.roomId ?? null;
  const playerId = connection?.playerId ?? null;
  const myColor = connection?.color ?? null;

  useEffect(() => {
    if (!connection) {
      setGameState(null);
      setSelectedSquare(null);
      setConnectionError(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    setGameState(applyWireGame(connection.initialGameState));

    pollRef.current = setInterval(async () => {
      try {
        const res = await getRoomState(connection.roomId);
        setGameState(applyWireGame(res.gameState));
        setConnectionError(null);
      } catch (e) {
        setConnectionError(e instanceof Error ? e.message : 'Failed to fetch state');
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connection]);

  const context = gameState
    ? { castlingRights: gameState.castlingRights, lastMove: gameState.lastMove }
    : null;
  const legalMoveTargets =
    gameState && selectedSquare && context
      ? getLegalMoves(gameState.board, selectedSquare, context).map((m) => m.to)
      : [];

  const gameOver =
    gameState &&
    (gameState.gamePhase.checkmate ||
      gameState.gamePhase.stalemate ||
      gameState.resigned != null);

  const isMyTurn = gameState && myColor != null && gameState.turn === myColor;

  const sendMove = useCallback(
    async (move: Move) => {
      if (!roomId || !playerId) return;
      try {
        const res = await apiMove(roomId, playerId, {
          from: formatSquare(move.from),
          to: formatSquare(move.to),
          promotion: move.promotion,
        });
        setGameState(applyWireGame(res.gameState));
        setSelectedSquare(null);
        setConnectionError(null);
      } catch (e) {
        setConnectionError(e instanceof Error ? e.message : 'Move failed');
      }
    },
    [roomId, playerId]
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      if (!gameState || gameOver || !myColor) return;

      const piece = getPiece(gameState.board, square);

      if (selectedSquare !== null) {
        const moves = getLegalMoves(gameState.board, selectedSquare, {
          castlingRights: gameState.castlingRights,
          lastMove: gameState.lastMove,
        });
        const move = moves.find((m) => squareEquals(m.to, square));
        if (move && isMyTurn) {
          sendMove(move);
        } else if (piece?.color === myColor && isMyTurn) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      } else {
        if (piece?.color === myColor && isMyTurn) {
          setSelectedSquare(square);
        }
      }
    },
    [gameState, gameOver, myColor, selectedSquare, isMyTurn, sendMove]
  );

  const onNewGame = useCallback(async () => {
    if (!roomId || !playerId) return;
    try {
      const res = await apiNewGame(roomId, playerId);
      setGameState(applyWireGame(res.gameState));
      setSelectedSquare(null);
      setConnectionError(null);
    } catch (e) {
      setConnectionError(e instanceof Error ? e.message : 'New game failed');
    }
  }, [roomId, playerId]);

  const onResign = useCallback(async () => {
    if (!roomId || !playerId) return;
    try {
      const res = await apiResign(roomId, playerId);
      setGameState(applyWireGame(res.gameState));
      setSelectedSquare(null);
      setConnectionError(null);
    } catch (e) {
      setConnectionError(e instanceof Error ? e.message : 'Resign failed');
    }
  }, [roomId, playerId]);

  return {
    gameState,
    selectedSquare,
    legalMoveTargets,
    orientation: (myColor ?? 'white') as 'white' | 'black',
    connectionError,
    myColor,
    gameOver: !!gameOver,
    isMyTurn: !!isMyTurn,
    onSquareClick,
    onNewGame,
    onResign,
  };
}
