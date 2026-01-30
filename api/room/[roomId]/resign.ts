import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, type RoomState, roomStateToWire, json, err } from '../../_lib';

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
    if (state.gameState.resigned) {
      return json(res, { gameState: roomStateToWire(state.gameState) });
    }

    const player = state.players.find((p) => p.id === playerId);
    if (!player) {
      return err(res, 'Player not in room', 400);
    }

    const nextGameState = { ...state.gameState, resigned: player.color };
    const newState: RoomState = { ...state, gameState: nextGameState };

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ state: newState })
      .eq('id', roomId.toUpperCase());

    if (updateError) {
      console.error('Supabase update resign:', updateError);
      return err(res, 'Failed to resign', 500);
    }

    return json(res, { gameState: roomStateToWire(nextGameState) });
  } catch (e) {
    console.error('resign', e);
    return err(res, e instanceof Error ? e.message : 'Server error', 500);
  }
}
