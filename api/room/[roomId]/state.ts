import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, type RoomState, roomStateToWire, json, err } from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return err(res, 'Method not allowed', 405);
  }

  const roomId = req.query.roomId as string;
  if (!roomId) {
    return err(res, 'Room ID required', 400);
  }

  try {
    const supabase = getSupabase();
    const { data: row, error } = await supabase
      .from('rooms')
      .select('state')
      .eq('id', roomId.toUpperCase())
      .single();

    if (error || !row) {
      return err(res, 'Room not found', 404);
    }

    const state = row.state as RoomState;
    return json(res, {
      gameState: roomStateToWire(state.gameState),
      players: state.players,
    });
  } catch (e) {
    console.error('get state', e);
    return err(res, e instanceof Error ? e.message : 'Server error', 500);
  }
}
