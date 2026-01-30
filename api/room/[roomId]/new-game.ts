import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabase,
  type RoomState,
  createRoomGameState,
  roomStateToWire,
  json,
  err,
} from '../../_lib.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return err(res, 'Method not allowed', 405);
  }

  const roomId = req.query.roomId as string;
  const playerId = req.body?.playerId;
  if (!roomId || !playerId) {
    return err(res, 'roomId and playerId required', 400);
  }

  try {
    const supabase = getSupabase();
    const { data: row, error: fetchError } = await supabase
      .from('rooms')
      .select('state')
      .eq('id', roomId.toUpperCase())
      .single();

    if (fetchError || !row) {
      return err(res, 'Room not found', 404);
    }

    const state = row.state as RoomState;
    const player = state.players.find((p) => p.id === playerId);
    if (!player) {
      return err(res, 'Player not in room', 400);
    }

    const nextGameState = createRoomGameState();
    const newState: RoomState = { ...state, gameState: nextGameState };

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ state: newState })
      .eq('id', roomId.toUpperCase());

    if (updateError) {
      console.error('Supabase update new-game:', updateError);
      return err(res, 'Failed to start new game', 500);
    }

    return json(res, { gameState: roomStateToWire(nextGameState) });
  } catch (e) {
    console.error('new-game', e);
    return err(res, e instanceof Error ? e.message : 'Server error', 500);
  }
}
