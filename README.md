# Chess Vibe

A web-based chess game. No login required; play locally or online (friend vs friend).

## Features

- **Local 1vs1**: Same device, turn-based. Board rotates by turn.
- **Online 1vs1**: Create or join a room by code. Board fixed by your color. Resign, New Game in same room.
- **Legal moves only**: Castling, en passant, pawn promotion to queen. Check, checkmate, stalemate.

## How to run

### Local only (Local 1vs1)

```bash
npm install
npm run dev
```

Open http://localhost:5173. Use “Local 1vs1” in the menu.

### Local with Online 1vs1 (Vercel dev + Supabase)

1. Create a [Supabase](https://supabase.com) project.
2. In Supabase SQL Editor, run the migration:  
   `supabase/migrations/20250130000000_create_rooms.sql`
3. Copy `.env.example` to `.env.local` and set:
   - `SUPABASE_URL` (Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → service_role key)
4. Install Vercel CLI and run API + frontend together:

   ```bash
   npm i -g vercel
   vercel dev
   ```

   Open the URL shown (e.g. http://localhost:3000). Use “Online 1vs1 – Create Room” / “Join Room”.

### Build

```bash
npm run build
```

## Deploy (Vercel only)

Online mode runs entirely on **Vercel + Supabase** (no separate WebSocket server).

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In SQL Editor, run `supabase/migrations/20250130000000_create_rooms.sql`.
   - In Project Settings → API copy:
     - **Project URL** → `SUPABASE_URL`
     - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

2. **Vercel**
   - Import the repo from GitHub in [Vercel](https://vercel.com).
   - In Project → Settings → Environment Variables add:
     - `SUPABASE_URL` = your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service_role key
   - Deploy. Frontend and API (`/api/room/*`) are served from the same Vercel project.

3. **Optional**  
   If the app is not at the same origin as the API (e.g. custom domain), set:
   - `VITE_API_URL` = full URL of the app (e.g. `https://your-app.vercel.app`).

Online 1vs1 uses **REST API + polling** (no WebSockets). Updates appear within about 1–2 seconds.

## Tech stack

- React, TypeScript, Vite
- Vercel serverless API routes
- Supabase (Postgres) for room and game state
- No external chess libraries; rules in `src/domain/chess`

## Architecture

- **Domain**: `src/domain/chess` (board, moves, game state; no React/browser).
- **API**: `api/room/*` – create room, join, get state, move, resign, new game. State stored in Supabase `rooms` table.
- **Frontend**: Mode select → Local game or Online lobby → Online game with polling.

See `docs/architecture.md` for more detail.
