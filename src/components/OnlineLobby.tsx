import { useState, useCallback, useRef, useEffect } from 'react';
import { createRoom, joinRoom, getRoomState } from '../api/room';
import type { WireGameState } from '../shared/protocol';

export interface OnlineConnectionInfo {
  roomId: string;
  playerId: string;
  color: 'white' | 'black';
  nickname: string;
  opponentNickname?: string;
  initialGameState: WireGameState;
}

interface OnlineLobbyProps {
  mode: 'create' | 'join';
  onBack: () => void;
  onGameStart: (info: OnlineConnectionInfo) => void;
}

const POLL_INTERVAL_MS = 1500;

export function OnlineLobby({ mode, onBack, onGameStart }: OnlineLobbyProps) {
  const [nickname, setNickname] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) {
      setError('Enter nickname');
      return;
    }
    setStatus('Creating room…');
    try {
      const res = await createRoom(nickname.trim());
      setRoomId(res.roomId);
      setStatus(`Room ${res.roomId} – Waiting for opponent…`);

      pollRef.current = setInterval(async () => {
        try {
          const state = await getRoomState(res.roomId);
          if (state.players.length >= 2) {
            stopPolling();
            const opponent = state.players.find((p) => p.color === 'black');
            onGameStart({
              roomId: res.roomId,
              playerId: res.playerId,
              color: res.color,
              nickname: nickname.trim(),
              opponentNickname: opponent?.nickname,
              initialGameState: state.gameState,
            });
          }
        } catch {
          // ignore poll errors
        }
      }, POLL_INTERVAL_MS);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim() || !roomIdInput.trim()) {
      setError('Enter nickname and room ID');
      return;
    }
    setStatus('Joining room…');
    try {
      const res = await joinRoom(roomIdInput.trim().toUpperCase(), nickname.trim());
      onGameStart({
        roomId: res.roomId,
        playerId: res.playerId,
        color: res.color,
        nickname: nickname.trim(),
        opponentNickname: res.opponentNickname,
        initialGameState: res.gameState,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room');
    }
  };

  const handleBack = () => {
    stopPolling();
    onBack();
  };

  if (mode === 'create') {
    return (
      <div className="online-lobby">
        <h1>Chess Vibe – Create Room</h1>
        {!roomId ? (
          <form onSubmit={handleCreate}>
            <label>
              Nickname
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={32}
                placeholder="Your name"
              />
            </label>
            <button type="submit">Create Room</button>
          </form>
        ) : (
          <div className="lobby-waiting">
            <p>Room ID: <strong>{roomId}</strong></p>
            <p>Share this code with your friend.</p>
            <p className="lobby-status">{status}</p>
          </div>
        )}
        {error && <p className="lobby-error">{error}</p>}
        <button type="button" className="lobby-back" onClick={handleBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="online-lobby">
      <h1>Chess Vibe – Join Room</h1>
      <form onSubmit={handleJoin}>
        <label>
          Room ID
          <input
            type="text"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="e.g. ABC123"
          />
        </label>
        <label>
          Nickname
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={32}
            placeholder="Your name"
          />
        </label>
        <button type="submit">Join Room</button>
      </form>
      {error && <p className="lobby-error">{error}</p>}
      <button type="button" className="lobby-back" onClick={handleBack}>
        Back
      </button>
    </div>
  );
}
