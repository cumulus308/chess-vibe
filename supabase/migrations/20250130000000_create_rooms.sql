-- Chess Vibe: rooms table for online 1vs1 (Vercel API + polling)
-- Run this in Supabase SQL Editor after creating a project.

create table if not exists public.rooms (
  id text primary key,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

comment on table public.rooms is 'One row per game room. state: { gameState, players }';
comment on column public.rooms.state is 'JSON: { gameState: { board, turn, gamePhase, castlingRights, lastMove, resigned? }, players: [ { id, color, nickname } ] }';

-- Optional: auto-update updated_at (Supabase can do this via trigger if you prefer)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists rooms_updated_at on public.rooms;
create trigger rooms_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();
