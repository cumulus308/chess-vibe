import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, type RoomState, type RoomPlayer } from '../../lib/supabase';
import { roomStateToWire } from '../../lib/game';
import { generatePlayerId } from '../../lib/ids';
import { json, err } from '../../lib/res';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return err(res, 'Method not allowed', 405);
  }

  const roomId = req.query.roomId as string;
  const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
  if (!roomId || !nickname) {
    return err(res, 'Room ID and nickname required', 400);
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
    if (state.players.length >= 2) {
      return err(res, 'Room is full', 400);
    }

    const playerId = generatePlayerId();
    const newPlayer: RoomPlayer = { id: playerId, color: 'black', nickname };
    const updatedPlayers = [...state.players, newPlayer];
    const host = state.players[0]!;

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ state: { ...state, players: updatedPlayers } })
      .eq('id', roomId.toUpperCase());

    if (updateError) {
      console.error('Supabase update join:', updateError);
      return err(res, 'Failed to join room', 500);
    }

    return json(res, {
      roomId: roomId.toUpperCase(),
      playerId,
      color: 'black' as const,
      opponentNickname: host.nickname,
      gameState: roomStateToWire(state.gameState),
    });
  } catch (e) {
    console.error('join room', e);
    return err(res, e instanceof Error ? e.message : 'Server error', 500);
  }
}
