# Architecture

## Overview

Chess Vibe separates chess rules (domain) from the React UI. The domain has no dependency on React, the DOM, or browser APIs. The UI holds game state and calls only exported functions from the domain.

## Domain: `src/domain/chess`

All chess logic lives here.

- **types.ts** — Types and constants: `Color`, `PieceType`, `Piece`, `Square`, `Board`, `Move`, `GamePhase`, `CastlingRights`, `getInitialCastlingRights`, `squareEquals`, etc.
- **board.ts** — Board state: `getInitialBoard`, `applyMove`, `getKingSquare`, `getPiece`, `updateCastlingRights`.
- **moves.ts** — Legal move generation: `getLegalMoves`, `getAllLegalMoves`, `isSquareAttacked`, `MoveContext`.
- **gameState.ts** — Game phase: `getGameState` (check, checkmate, stalemate).
- **index.ts** — Public entry: re-exports types and the above functions, and provides `createNewGame()` which returns everything the UI needs to start a fresh game (board, turn, gamePhase, castlingRights, lastMove).

The domain does not import React, DOM, or browser APIs.

## UI: `src` and `src/components`

- **App.tsx** — Holds game state (board, turn, gamePhase, castlingRights, lastMove, selectedSquare). Handles square clicks (select piece, apply move via domain), and "New Game" (resets state using `createNewGame()`). Calls only exported domain functions.
- **Board.tsx** — Renders the 8×8 board, highlights selected square and legal move targets, and forwards clicks to the parent.
- **Piece.tsx** — Renders a single piece (domain `Piece` type).
- **GameStatus.tsx** — Displays turn, check, checkmate, or stalemate from domain `GamePhase`.

The UI does not implement chess rules; it only calls the chess domain and renders the result.

## Directory structure

```
src/
  domain/
    chess/           # Chess domain (no React/DOM)
      types.ts
      board.ts
      moves.ts
      gameState.ts
      index.ts
  components/        # Presentational UI
    Board.tsx
    GameStatus.tsx
    Piece.tsx
  App.tsx           # State and domain calls
  App.css
  index.css
  main.tsx
```

## Data flow

1. App initializes state (e.g. via `createNewGame()` or equivalent on first load).
2. User clicks a square → App uses `getPiece`, `getLegalMoves`, `applyMove`, `getGameState`, `updateCastlingRights` from the domain and updates its state.
3. After checkmate or stalemate, board interaction is disabled; user can only click "New Game", which calls `createNewGame()` and resets all state.
