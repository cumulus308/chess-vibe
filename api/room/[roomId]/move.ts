import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabase,
  type RoomState,
  roomStateToWire,
  findLegalMove,
  applyRoomMove,
  parseMovePayload,
  gameOver,
  json,
  err,
} from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return err(res, 'Method not allowed', 405);
  }

  const roomId = req.query.roomId as string;
  const { playerId, from, to, promotion } = req.body ?? {};
  if (!roomId || !playerId || typeof from !== 'string' || typeof to !== 'string') {
    return err(res, 'roomId, playerId, from, to required', 400);
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
    if (state.players.length < 2) {
      return err(res, 'Opponent not connected', 400);
    }

    if (gameOver(state.gameState)) {
      return err(res, 'Game has ended', 400);
    }

    const player = state.players.find((p) => p.id === playerId);
    if (!player || player.color !== state.gameState.turn) {
      return err(res, 'Not your turn', 400);
    }

    const payload = parseMovePayload(from, to, promotion);
    if (!payload) {
      return err(res, 'Invalid square notation', 400);
    }

    const move = findLegalMove(
      state.gameState,
      payload.from,
      payload.to,
      promotion
    );
    if (!move) {
      return err(res, 'Illegal move', 400);
    }

    const nextGameState = applyRoomMove(state.gameState, move);
    const newState: RoomState = { ...state, gameState: nextGameState };

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ state: newState })
      .eq('id', roomId.toUpperCase());

    if (updateError) {
      console.error('Supabase update move:', updateError);
      return err(res, 'Failed to apply move', 500);
    }

    return json(res, { gameState: roomStateToWire(nextGameState) });
  } catch (e) {
    console.error('move', e);
    return err(res, e instanceof Error ? e.message : 'Server error', 500);
  }
}
