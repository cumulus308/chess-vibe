const ROOM_ID_LENGTH = 6;
const ROOM_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomId(): string {
  let id = '';
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    id += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)]!;
  }
  return id;
}

export function generatePlayerId(): string {
  return crypto.randomUUID();
}
