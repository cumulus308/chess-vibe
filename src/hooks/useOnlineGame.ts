import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getLegalMoves,
  getPiece,
  squareEquals,
  applyMove,
  getGameState,
  updateCastlingRights,
} from '../domain/chess';
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

export interface OnlineGameState {
  board: Board;
  turn: Color;
  gamePhase: GamePhase;
  castlingRights: CastlingRights;
  lastMove: Move | undefined;
  resigned?: Color;
}

function applyWireGame(game: WireGameState): OnlineGameState {
  return {
    board: game.board,
    turn: game.turn,
    gamePhase: game.gamePhase,
    castlingRights: game.castlingRights,
    lastMove: wireToLastMove(game.lastMove),
    resigned: game.resigned,
  };
}

/** Apply a move locally (for optimistic update). */
function applyMoveToState(state: OnlineGameState, move: Move): OnlineGameState {
  const piece = getPiece(state.board, move.from);
  if (!piece) return state;
  const nextBoard = applyMove(state.board, move);
  const nextTurn: Color = state.turn === 'white' ? 'black' : 'white';
  const nextRights = updateCastlingRights(state.castlingRights, move, piece);
  const nextPhase = getGameState(nextBoard, nextTurn, {
    castlingRights: nextRights,
    lastMove: move,
  });
  return {
    board: nextBoard,
    turn: nextTurn,
    gamePhase: nextPhase,
    castlingRights: nextRights,
    lastMove: move,
    resigned: state.resigned,
  };
}

/** Only poll when waiting for opponent's move. On my turn, state only changes when I act (move/resign/new-game), and we get that from the API response. */
const POLL_WHEN_OPPONENT_TURN_MS = 350;

export function useOnlineGame(connection: OnlineConnectionInfo | null) {
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStateRef = useRef<OnlineGameState | null>(null);
  const moveInFlightRef = useRef(false);

  const roomId = connection?.roomId ?? null;
  const playerId = connection?.playerId ?? null;
  const myColor = connection?.color ?? null;

  const waitingForOpponent = gameState && myColor != null && gameState.turn !== myColor;

  useEffect(() => {
    if (!connection) {
      setGameState(null);
      setSelectedSquare(null);
      setConnectionError(null);
      previousStateRef.current = null;
      moveInFlightRef.current = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    previousStateRef.current = null;
    moveInFlightRef.current = false;
    setGameState(applyWireGame(connection.initialGameState));

    const runPoll = async () => {
      if (moveInFlightRef.current) return;
      try {
        const res = await getRoomState(connection.roomId);
        if (moveInFlightRef.current) return;
        setGameState(applyWireGame(res.gameState));
        setConnectionError(null);
      } catch (e) {
        if (moveInFlightRef.current) return;
        setConnectionError(e instanceof Error ? e.message : 'Failed to fetch state');
      }
    };

    runPoll();
    pollRef.current = setInterval(runPoll, POLL_WHEN_OPPONENT_TURN_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connection]);

  useEffect(() => {
    if (!connection || !gameState) return;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!waitingForOpponent) return;

    pollRef.current = setInterval(async () => {
      if (moveInFlightRef.current) return;
      try {
        const res = await getRoomState(connection.roomId);
        if (moveInFlightRef.current) return;
        setGameState(applyWireGame(res.gameState));
        setConnectionError(null);
      } catch (e) {
        if (moveInFlightRef.current) return;
        setConnectionError(e instanceof Error ? e.message : 'Failed to fetch state');
      }
    }, POLL_WHEN_OPPONENT_TURN_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connection, gameState?.turn, waitingForOpponent]);

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
      if (!roomId || !playerId || !gameState) return;
      const prev = gameState;
      previousStateRef.current = prev;
      moveInFlightRef.current = true;
      setGameState(applyMoveToState(prev, move));
      setSelectedSquare(null);
      setConnectionError(null);
      try {
        const res = await apiMove(roomId, playerId, {
          from: formatSquare(move.from),
          to: formatSquare(move.to),
          promotion: move.promotion,
        });
        setGameState(applyWireGame(res.gameState));
        previousStateRef.current = null;
      } catch (e) {
        setGameState(previousStateRef.current ?? prev);
        previousStateRef.current = null;
        setConnectionError(e instanceof Error ? e.message : 'Move failed');
      } finally {
        moveInFlightRef.current = false;
      }
    },
    [roomId, playerId, gameState]
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
