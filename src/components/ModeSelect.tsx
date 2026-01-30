import type { ReactNode } from 'react';

type Mode = 'local' | 'online-host' | 'online-guest';

interface ModeSelectProps {
  onSelect: (mode: Mode) => void;
  children?: ReactNode;
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  return (
    <div className="mode-select">
      <h1>Chess Vibe</h1>
      <p>Choose mode</p>
      <div className="mode-select-buttons">
        <button type="button" onClick={() => onSelect('local')}>
          Local 1vs1
        </button>
        <button type="button" onClick={() => onSelect('online-host')}>
          Online 1vs1 – Create Room
        </button>
        <button type="button" onClick={() => onSelect('online-guest')}>
          Online 1vs1 – Join Room
        </button>
      </div>
    </div>
  );
}
