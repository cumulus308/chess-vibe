/**
 * Supabase client for Vercel API routes (server-side only).
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        'Missing Supabase env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
      );
    }
    _client = createClient(url, serviceRoleKey);
  }
  return _client;
}

export type RoomsRow = {
  id: string;
  state: RoomState;
  updated_at: string;
};

export type RoomRow = RoomsRow;

export interface RoomPlayer {
  id: string;
  color: 'white' | 'black';
  nickname: string;
}

export interface RoomState {
  gameState: import('./game').RoomGameState;
  players: RoomPlayer[];
}
