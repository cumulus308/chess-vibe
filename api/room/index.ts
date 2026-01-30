import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabase,
  type RoomState,
  type RoomPlayer,
  createRoomGameState,
  roomStateToWire,
  generateRoomId,
  generatePlayerId,
  json,
  err,
} from '../shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return err(res, 'Method not allowed', 405);
  }

  const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
  if (!nickname) {
    return err(res, 'Nickname required', 400);
  }

  try {
    const supabase = getSupabase();
    const roomId = generateRoomId();
    const playerId = generatePlayerId();
    const gameState = createRoomGameState();
    const players: RoomPlayer[] = [
      { id: playerId, color: 'white', nickname },
    ];
    const state: RoomState = { gameState, players };

    const { error } = await supabase.from('rooms').insert({
      id: roomId,
      state,
    });

    if (error) {
      if (error.code === '23505') {
        return handler(req, res);
      }
      console.error('[api/room] Supabase insert:', error.message, error.code, error.details);
      return err(res, 'Failed to create room', 500);
    }

    return json(res, {
      roomId,
      playerId,
      color: 'white' as const,
      gameState: roomStateToWire(gameState),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    console.error('[api/room] create room:', message, e);
    return err(res, message, 500);
  }
}
